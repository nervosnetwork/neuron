const fs = require('node:fs')
const path = require('node:path')

async function rpcRequest(method, params = []) {
  const result = await fetch(
    'https://mainnet.ckb.dev/rpc',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 0,
        jsonrpc: '2.0',
        method,
        params,
      }),
      timeout: 10000,
    }
  )
  return result.json()
}

const ESTIMATE_BLOCK_COUNT_PER_DAY = 8_000
const envFilePath = path.resolve(__dirname, '../packages/neuron-wallet/.env')
const validTargetReg = /(CKB_NODE_ASSUME_VALID_TARGET=)[\S]*/

;(async function () {
  const tipBlockNumber = (await rpcRequest('get_tip_block_number')).result
  const validTargetBlockNumber = `0x${(BigInt(tipBlockNumber) - BigInt(ESTIMATE_BLOCK_COUNT_PER_DAY)).toString(16)}`
  const blockHash = (await rpcRequest('get_block_hash', [validTargetBlockNumber])).result
  const originEnvContent = fs.readFileSync(envFilePath).toString('utf-8')
  fs.writeFileSync(envFilePath, originEnvContent.replace(validTargetReg, `CKB_NODE_ASSUME_VALID_TARGET='${blockHash}'`))
})()
