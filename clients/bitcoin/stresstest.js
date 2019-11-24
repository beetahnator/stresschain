import http from "k6/http";
import * as jsonRPC from "../../lib/jsonRPC.js"
import { check } from "k6";

const rpcUrl = __ENV.CLIENT_ENDPOINT
const blockHeights = JSON.parse(open('./blocks.json'))
const transactions = JSON.parse(open('./transactions.json'))

// define the actions of a typical user
export default function () {
  // check if default get path returns 405
  const defaultGet = http.get(rpcUrl);
  check(defaultGet, {
    "response code was 405": res => res.status == 405,
  })

  // check if we can get a block count
  const blockCountRequest = jsonRPC.request({
    host: rpcUrl,
    method: "getblockcount"
  })
  check(blockCountRequest, {
    "status code is 200": res => res.status == 200,
    "block height is valid number": res => typeof JSON.parse(res.body).result == "number",
    "block height is valid number": res => JSON.parse(res.body).result >= 0
  })

  // using data from transactions.json,
  // build a transaction and verify if the raw output matches
  transactions.map(tx => {
    const buildTransactionResponse = jsonRPC.request({
      host: rpcUrl,
      method: "createrawtransaction",
      params: [tx.inputs, tx.outputs]
    })
    check(buildTransactionResponse, {
      "response code was 200": res => res.status == 200,
      "tx built properly": res => JSON.parse(res.body).result == tx.result,
    })
  })

  // using data from `blocks.json`, compare data
  // from node against static hashes
  blockHeights.map(block => {
    const getblockResponse = jsonRPC.request({
      host: rpcUrl,
      method: "getblock",
      params: [block.hash]
    })
    check(getblockResponse, {
      "response code was 200": res => res.status == 200
    })

    const getBlockResult = JSON.parse(getblockResponse.body).result
    check(getBlockResult, {
      "block hash matches": result => result.hash == block.hash,
      "block height matches": result => result.height == block.id,
      "nextblock matches": result => result.nextblockheight == block.nextblockheight,
      "transactions match": result => JSON.stringify(result.tx) == JSON.stringify(block.tx),
    })
  })
};
