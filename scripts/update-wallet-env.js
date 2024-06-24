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
const blockNumberReg = /(CKB_NODE_ASSUME_VALID_TARGET_BLOCK_NUMBER=)[\S]*/
const ckbNodeDataSizeReg = /(CKB_NODE_DATA_SIZE=)[\S]*/

async function getValidTarget() {
  const tipBlockNumber = (await rpcRequest('get_tip_block_number')).result
  const validTargetBlockNumber = `0x${(BigInt(tipBlockNumber) - BigInt(ESTIMATE_BLOCK_COUNT_PER_DAY)).toString(16)}`
  return [validTargetBlockNumber, (await rpcRequest('get_block_hash', [validTargetBlockNumber])).result]
}

async function getCKBNodeSize() {
  const res = await fetch('https://ckb-node-info.magickbase.com/api')
  const { data_size_g } = await res.json()
  return Math.ceil(data_size_g)
}

;(async function () {
  try {
    console.info('start updating env file')
    const [blockNumber, blockHash] = await getValidTarget()
    const ckbNodeDataSize = await getCKBNodeSize()
    const originEnvContent = fs.readFileSync(envFilePath).toString('utf-8')
    fs.writeFileSync(
      envFilePath,
      originEnvContent.replace(validTargetReg, `CKB_NODE_ASSUME_VALID_TARGET='${blockHash}'`)
        .replace(blockNumberReg, `CKB_NODE_ASSUME_VALID_TARGET_BLOCK_NUMBER=${+blockNumber}`)
        .replace(ckbNodeDataSizeReg, `CKB_NODE_DATA_SIZE=${ckbNodeDataSize}`)
    )
    console.info('write success')
  } catch (error) {
    console.error('write failed', error)
  }
})()
