import { clientArgs } from '../../lib/types';

export const config: clientArgs = {
  name: "parity",
  githubRepo: "paritytech/parity-ethereum",
  oldestRelease: "v2.5.10",
  container: {
    dataDirSize: "500Gi",
    dockerRepo: "parity/parity",
    args: [ "--base-path=/data", "--jsonrpc-interface=0.0.0.0", "--jsonrpc-port=8332" ],
    imageSuffix: "-stable"
  }
}