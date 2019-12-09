import * as docker from "@pulumi/docker";
import * as k8s from "@pulumi/kubernetes";
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import { clientArgs } from "../lib/types";

export function runClientTests(
  clients: {
    config: clientArgs;
    versions: string[];
  }[],
  testImageRepo: pulumi.Input<string>,
  provider: k8s.Provider
) {
  clients.map(client => {
    client.versions.map(version => {
      const cleanVersion = version.split(".").join("");
      const nameWithVersion = `${client.config.name}-${version
        .split(".")
        .join("")}`;

      return new k8s.batch.v1beta1.CronJob(`${nameWithVersion}-loadtest`, {
        metadata: { name: `${nameWithVersion}-loadtest`},
        spec: {
          schedule: "*/5 0 * * *",
          jobTemplate: {
            spec: {
              template: {
                spec: {
                  restartPolicy: "Never",
                  containers: [
                    {
                      name: nameWithVersion,
                      image: testImageRepo,
                      env: [
                        { name: "CLIENT_ENDPOINT", value: `http://${nameWithVersion}:8332` },
                        { name: "CLIENT_NAME", value: client.config.name },
                        { name: "CLIENT_VERSION", value: cleanVersion },
                        { name: "INFLUXDB_HOSTNAME", value: "http://influxdb:8086" }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      }, { provider: provider });
    });
  });
}

export function buildTestContainer(): pulumi.Output<string> {
  // create docker repository
  const repository = new awsx.ecr.Repository("k6");

  // build and push our loadtest image
  const image = new docker.Image("k6", {
    build: {
      context: "../"
    },
    imageName: repository.repository.repositoryUrl
  });

  return repository.repository.repositoryUrl;
}
