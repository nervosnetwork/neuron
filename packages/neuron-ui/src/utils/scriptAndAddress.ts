import { type Script } from '@ckb-lumos/base'
import { predefined } from '@ckb-lumos/config-manager'
import { encodeToAddress, parseAddress, generateAddress } from '@ckb-lumos/helpers'

const { LINA: MAINNET, AGGRON4: TESTNET } = predefined

export const CONFIGS = {
  MAINNET,
  TESTNET,
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

export const toLongAddress = (address: string) => {
  try {
    return scriptToAddress(addressToScript(address), { isMainnet: address.startsWith(MAINNET.PREFIX) })
  } catch {
    return ''
  }
}

export const toShortAddress = (address: string) => {
  try {
    return scriptToAddress(addressToScript(address), {
      isMainnet: address.startsWith(MAINNET.PREFIX),
      deprecated: true,
    })
  } catch {
    return ''
  }
}
