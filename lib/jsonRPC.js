import { post } from "k6/http";

export function request(args) {
  const payload = {
    jsonrpc: args.version || "1.0",
    id: "stresstest",
    method: args.method,
    params: args.params
  }
  return post(args.host, JSON.stringify(payload), {
    headers: {
      'content-type': 'application/json'
    }
  })
}