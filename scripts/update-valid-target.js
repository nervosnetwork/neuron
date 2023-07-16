const https = require('node:https')
const fs = require('node:fs')
const path = require('node:path')

async function rpcRequest(method, params = []) {
  const dataString = JSON.stringify({
    id: 0,
    jsonrpc: '2.0',
    method,
    params,
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://mainnet.ckb.dev/rpc',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': dataString.length,
        },
        timeout: 10000,
      },
      (res) => {
        if (res.statusCode < 200 || res.statusCode > 299) {
          return reject(new Error(`HTTP status code ${res.statusCode}`))
        }
        const body = []
        res.on('data', (chunk) => body.push(chunk))
        res.on('end', () => {
          try {
            const resString = Buffer.concat(body).toString()
            resolve(JSON.parse(resString))
          } catch (error) {
            reject(error)
          }
        })
      }
    )

    req.on('error', (err) => {
      reject(err)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request time out'))
    })
    req.write(dataString)
    req.end()
  })
}

const ESTIMATE_BLOCK_COUNT_PER_DAY = 8_000
const envFilePath = path.resolve(__dirname, '../packages/neuron-wallet/.env')
const validTargetReg = /(CKB_NODE_ASSUME_VALID_TARGET=)[\S]*/

;(async function() {
  const tipBlockNumber = (await rpcRequest('get_tip_block_number')).result
  const validTargetBlockNumber = `0x${(BigInt(tipBlockNumber) - BigInt(ESTIMATE_BLOCK_COUNT_PER_DAY)).toString(16)}`
  const blockHash = (await rpcRequest('get_block_hash', [validTargetBlockNumber])).result
  const originEnvContent = fs.readFileSync(envFilePath).toString('utf-8')
  fs.writeFileSync(envFilePath, originEnvContent.replace(validTargetReg, `CKB_NODE_ASSUME_VALID_TARGET='${blockHash}'`))
}())
