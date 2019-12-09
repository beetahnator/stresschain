import * as influxdb from "@pulumi/influxdb";
import * as grafana from "@pulumi/grafana";
import { Config } from "@pulumi/pulumi";
import { Cluster } from "@pulumi/eks";
import { Record } from "@pulumi/cloudflare";
import { helm, Provider, core, apps } from "@pulumi/kubernetes";

export function deployCluster(clientNum: number) {
  const nodeCount = clientNum++; // add one node for Grafana + InfluxDB

  const cluster = new Cluster("stresschain", {
    minSize: nodeCount,
    maxSize: nodeCount,
    desiredCapacity: nodeCount,
    deployDashboard: false
  });
  const defaultClusterOpts = { parent: cluster, provider: cluster.provider };

  // deploy grafana
  const grafanaSecret = new core.v1.Secret(
    "grafana-creds",
    {
      data: {
        "admin-user": Buffer.from("user").toString("base64"),
        "admin-password": Buffer.from("password").toString("base64")
      }
    },
    { provider: cluster.provider }
  );
  const grafanaChart = new helm.v2.Chart(
    "grafana",
    {
      chart: "stable/grafana",
      values: {
        service: { type: "LoadBalancer" },
        testFramework: { enabled: false },
        admin: { existingSecret: grafanaSecret.metadata.name }
      }
    },
    defaultClusterOpts
  );
  const grafanaELB = grafanaChart
    .getResource("v1/Service", "default/grafana")
    .apply(svc => svc.status.loadBalancer.ingress[0].hostname);

  const grafanaProvider = new grafana.Provider("grafana", {
    url: grafanaELB.apply(v => `http://${v}`),
    auth: "user:password"
  });

  const grafanaDns = new Record("grafana", {
    name: "grafana",
    type: "CNAME",
    proxied: true,
    value: grafanaELB,
    zoneId: new Config("dns").require("zoneId")
  });

  // deploy influxdb helm chart
  const influxdbChart = new helm.v2.Chart(
    "influxdb",
    {
      chart: "stable/influxdb",
      values: {
        service: { type: "LoadBalancer" },
        persistence: {
          storageClass: "gp2",
          size: "50Gi"
        }
      }
    },
    defaultClusterOpts
  );

  const influxProvider = new influxdb.Provider("indfluxdb", {
    url: influxdbChart
      .getResource("v1/Service", "influxdb")
      .apply(svc =>
        svc.status.loadBalancer.ingress[0].hostname.apply(
          v => `http://${v}:8086`
        )
      )
  });

  return {
    kube: cluster.provider,
    influx: influxProvider,
    grafana: grafanaProvider
  };
}
