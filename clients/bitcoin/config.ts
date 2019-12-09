import { clientArgs } from '../../lib/types';

export const config: clientArgs = {
  name: "bitcoin",
  githubRepo: "bitcoin/bitcoin",
  oldestRelease: "v0.18.1",
  container: {
    dataDirSize: "500Gi",
    dockerRepo: "ruimarinho/bitcoin-core",
    stripChars: ["v"],
    env: [{name: "BITCOIN_DATA", value: "/data"}],
    command: ["bitcoind"],
    args: ["--rpcbind=0.0.0.0", "--rpcallowip=0.0.0.0/0", "--datadir=/data"]
  }
}