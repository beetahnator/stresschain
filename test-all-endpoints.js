const fs = require('fs')
const { execSync } = require('child_process')

// for now, use a staticly defined list of endpoints to run tests against
// this can be replaced with a process or function which pulls endpoints
// from dynamic sources like Github Releases, Dockerhub, or Publisher repos
const endpoints = JSON.parse(fs.readFileSync('./endpoints.json'))

endpoints.forEach(endpoint => {
  console.log(`Running test against: ${endpoint.endpoint}, using client: ${endpoint.client}`)
  execSync(`make test client=${endpoint.client} endpoint=${endpoint.endpoint}`, {
    stdio: 'inherit'
  })
})