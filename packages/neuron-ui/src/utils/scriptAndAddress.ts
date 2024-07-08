import { type Script } from '@ckb-lumos/lumos'
import { MAINNET, TESTNET } from '@ckb-lumos/lumos/config'
import { encodeToAddress, parseAddress } from '@ckb-lumos/lumos/helpers'
import { generateAddress } from '@ckb-lumos/helpers'

const CONFIGS = {
  [MAINNET.PREFIX]: MAINNET,
  [TESTNET.PREFIX]: TESTNET,
}

export const scriptToAddress = (
  script: Script,
  { isMainnet = true, deprecated = false }: { isMainnet?: boolean; deprecated?: boolean }
) => {
  const config = { config: isMainnet ? MAINNET : TESTNET }
  return deprecated ? generateAddress(script, config) : encodeToAddress(script, config)
}

export const addressToScript = (address: string, { isMainnet = true }: { isMainnet?: boolean } = {}) => {
  const prefix = address.slice(0, 3)
  const config = CONFIGS[prefix] ?? (isMainnet ? MAINNET : TESTNET)
  return parseAddress(address, { config })
}

export const addressToAddress = (address: string, { deprecated = false }: { deprecated?: boolean } = {}) => {
  try {
    return scriptToAddress(addressToScript(address), {
      isMainnet: address.startsWith(MAINNET.PREFIX),
      deprecated,
    })
  } catch {
    return ''
  }
}
