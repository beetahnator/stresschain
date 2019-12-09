import { Provider, core, apps } from "@pulumi/kubernetes";
import * as kubex from "@pulumi/kubernetesx";
import * as fs from "fs";
import { getReleases } from "../lib/github";
import { clientArgs } from "../lib/types";
import * as influxdb from "@pulumi/influxdb";
import * as grafana from "@pulumi/grafana";

export async function buildClientConfigs(): Promise<
  { config: clientArgs; versions: string[] }[]
> {
  // create an array containing the `config.json` contents
  // for each client in the `../clients` directory
  return Promise.all(
    fs.readdirSync("../clients").map(async client => {
      // read client config
      const config: clientArgs = require(`../clients/${client}/config.ts`)
        .config;

      // get list of releases from github
      const releases = await getReleases(
        config.githubRepo,
        config.oldestRelease
      );

      return { config: config, versions: releases };
    })
  );
}

export async function deployClient(
  client: clientArgs,
  versions: string[],
  providers: {
    kube: Provider;
    influx: influxdb.Provider;
    grafana: grafana.Provider;
  }
) {
  versions.map((version: string) => {
    const cleanName = `${client.name}-${version.split(".").join("")}`;
    let imageTag = version;

    // strip user defined chars from version to build docker image tag
    if (client.container.stripChars) {
      client.container.stripChars.forEach(char => {
        imageTag = imageTag.split(char).join("");
      });
    }
    const imageName = `${client.container.dockerRepo}:${imageTag}${client
      .container.imageSuffix || ""}`;

    const volume = new kubex.PersistentVolumeClaim(
      cleanName,
      {
        metadata: { annotations: { "pulumi.com/skipAwait": "true" } },
        spec: {
          resources: { requests: { storage: client.container.dataDirSize } },
          storageClassName: "gp2",
          accessModes: ["ReadWriteOnce"]
        }
      },
      { provider: providers.kube }
    );

    let pod = new kubex.PodBuilder({
      containers: [
        {
          name: cleanName,
          image: imageName,
          command: client.container.command,
          args: client.container.args,
          volumeMounts: [volume.mount("/data")],
          env: client.container.env,
          ports: [{ protocol: "TCP", containerPort: 8332, name: "http" }]
        }
      ],
      securityContext: { fsGroup: 1000 },
      affinity: {}
    }).asStatefulSetSpec();

    const sts = new apps.v1.StatefulSet(
      cleanName,
      {
        metadata: {
          name: cleanName
        },
        spec: pod
      },
      { provider: providers.kube }
    );

    const svc = new core.v1.Service(
      cleanName,
      {
        metadata: { name: cleanName },
        spec: {
          type: "ClusterIP",
          selector: sts.spec.template.metadata.labels,
          ports: [{ name: "http", port: 8332, protocol: "TCP" }]
        }
      },
      { provider: providers.kube }
    );
    const database = new influxdb.Database(
      cleanName,
      {
        name: cleanName
      },
      { provider: providers.influx }
    );
    const datasource = new grafana.DataSource(
      cleanName,
      {
        name: cleanName,
        type: "influxdb",
        url: "http://influxdb:8086",
        databaseName: cleanName
      },
      { provider: providers.grafana }
    );

    const k6Dashboard = new grafana.Dashboard(
      cleanName,
      {
        configJson: fs
          .readFileSync("./k6-dashboard.json")
          .toString()
          .replace(/\${DS_K6}/g, cleanName)
          .replace(/\$TITLE/g, cleanName)
      },
      { provider: providers.grafana }
    );
  });
}
