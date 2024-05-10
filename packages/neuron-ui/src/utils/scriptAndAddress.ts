import { predefined } from '@ckb-lumos/config-manager'
import { encodeToAddress, parseAddress, generateAddress } from '@ckb-lumos/helpers'

const { LINA: MAINNET, AGGRON4: TESTNET } = predefined

const CONFIGS = {
  [MAINNET.PREFIX]: MAINNET,
  [TESTNET.PREFIX]: TESTNET,
}

export const scriptToAddress = (
  script: CKBComponents.Script,
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
