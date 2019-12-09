import { clientArgs } from '../../lib/types';

export const config: clientArgs = {
  name: "geth",
  githubRepo: "ethereum/go-ethereum",
  oldestRelease: "v1.9.8",
  container: {
    dataDirSize: "500Gi",
    dockerRepo: "ethereum/client-go",
    args: [ "--datadir=/data", "--rpc", "--rpcaddr=0.0.0.0", "--rpcport=8332" ]
  }
}