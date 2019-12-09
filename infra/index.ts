import * as cluster from "./cluster"
import * as clients from "./clients"
import * as loadtest from "./loadtest"

main();

// async entrypoint wrapper
async function main(): Promise<void> {
  // build our blockchain client configs
  const configs = await clients.buildClientConfigs();

  // count the amount of clients we will deploy
  let clientCount = 1;
  configs.forEach(
    config => (clientCount = clientCount + config.versions.length)
  );

  // create a cluster with influx and grafana
  const providers = cluster.deployCluster(clientCount);

  // deploy client resources on top of cluster
  const clientDeploys = configs.map(client =>
    clients.deployClient(client.config, client.versions, providers)
  );

  // deploy loadtest jobs
  const loadtestImage = loadtest.buildTestContainer()
  const loadtestJobs = loadtest.runClientTests(configs, loadtestImage, providers.kube)
}