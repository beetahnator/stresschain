import http from "k6/http";
import * as jsonRPC from "../../lib/jsonRPC.js"
import {
  check
} from "k6";

const rpcUrl = __ENV.CLIENT_ENDPOINT

// define the actions of a typical user
export default function () {
  // check if default get path returns 405
  const defaultGet = http.get(rpcUrl);
  check(defaultGet, {
    "default get response code was 405": res => res.status == 405,
  })

  // check if we can get a block count
  const blockHeightRequest = jsonRPC.request({
    host: rpcUrl,
    method: "eth_blockNumber",
    version: "2.0"
  })
  const blockHeight = parseInt(JSON.parse(blockHeightRequest.body).result)
  check(blockHeightRequest, {
    "status code: eth_blockNumber": res => res.status == 200,
    "block height is valid number": blockHeight >= 0
  })

  // grab a random block and pull all transactions
  let randomBlock = Math.floor(Math.random() * blockHeight)

  const getBlockRequest = jsonRPC.request({
    host: rpcUrl,
    method: "eth_getBlockByNumber",
    params: ['0x' + randomBlock.toString(16), true],
    version: "2.0"
  })
  const getBlockResult = JSON.parse(getBlockRequest.body)
  check(getBlockRequest, {
    "status code: eth_getBlockByByNumber": res => res.status == 200,
  })

  if ("transactions" in getBlockResult.result) {
    getBlockResult.result.transactions.map(tx => {
      const getTransactionRequest = jsonRPC.request({
        host: rpcUrl,
        method: "eth_getTransactionByHash",
        params: [tx.hash],
        version: "2.0"
      })
      check(getTransactionRequest, {
        "status code: eth_getTransactionByHash": res => res.status == 200,
      })
    })
  }
};