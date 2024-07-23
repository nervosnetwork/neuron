export const MAX_NETWORK_NAME_LENGTH = 28
export const MAX_WALLET_NAME_LENGTH = 20
export const ADDRESS_LENGTH = 46
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50
export const MIN_AMOUNT = 61
export const SINCE_FIELD_SIZE = 8
export const PAGE_SIZE = 15
export const UNREMOVABLE_NETWORK = 'Testnet'
export const UNREMOVABLE_NETWORK_ID = '0'
export const CONFIRMATION_THRESHOLD = 24
export const MAX_TIP_BLOCK_DELAY = 180000
export const BUFFER_BLOCK_NUMBER = 10

export const MAX_DECIMAL_DIGITS = 8
export const FULL_NODE_MAINNET = 'ckb'
export const LIGHT_CLIENT_MAINNET = 'light_client_mainnet'
export const LIGHT_CLIENT_TESTNET = 'light_client_testnet'
export const MAINNET_CLIENT_LIST = [FULL_NODE_MAINNET, LIGHT_CLIENT_MAINNET]

export const MIN_DEPOSIT_AMOUNT = 102
export const TOKEN_ID_LENGTH = 66
export const XUDT_TOKEN_ID_LENGTH = 68

export const SHANNON_CKB_RATIO = 1e8

export const MEDIUM_FEE_RATE = 2000
export const WITHDRAW_EPOCHS = 180
export const MILLISECONDS_PER_DAY = 24 * 3600 * 1000
export const MILLISECONDS_IN_YEAR = 365 * MILLISECONDS_PER_DAY
export const HOURS_PER_EPOCH = 4
export const HOURS_PER_DAY = 24

export const INIT_SEND_PRICE = '1000'

export const MIN_CKB_REQUIRED_BY_CKB_SUDT = 61
export const MIN_CKB_REQUIRED_BY_NORMAL_SUDT = 142
export const MAX_SUDT_ACCOUNT_NAME_LENGTH = 16
export const MAX_SUDT_TOKEN_NAME_LENGTH = 200
export const MAX_SYMBOL_LENGTH = 100
export const MIN_DECIMAL = 0
export const MAX_DECIMAL = 32

export const DEFAULT_SUDT_FIELDS = {
  accountName: 'Undefined',
  tokenName: 'Unknown',
  symbol: 'Unknown',
  CKBTokenId: 'CKBytes',
  CKBTokenName: 'CKBytes',
  CKBSymbol: 'CKB',
  CKBDecimal: '8',
}
export const LOCALES = ['zh', 'zh-TW', 'en', 'en-US', 'fr', 'es'] as const

// address property
export const SHORT_ADDR_LENGTH = 46
export const SHORT_ADDR_DEFAULT_LOCK_PREFIX = '0x0100'
export const SHORT_ADDR_MULTISIGN_LOCK_PREFIX = '0x0101'
export const SHORT_ADDR_SUDT_LOCK_PREFIX = '0x0102'
export const NEW_LONG_ADDR_PREFIX = '0x00'
export const LONG_DATA_PREFIX = '0x02'
export const LONG_TYPE_PREFIX = '0x04'

// times
export const SYNC_REBUILD_SINCE_VERSION = '0.108'

export const DEPRECATED_CODE_HASH: Record<string, string> = {
  AcpOnLina: '0x0fb343953ee78c9986b091defb6252154e0bb51044fd2879fde5b27314506111',
  AcpOnAggron: '0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b',
}

export const HIDE_BALANCE = '******'
export enum NetworkType {
  Default, // internal full node
  Normal,
  Light, // internal Light node
}
export const METHOD_NOT_FOUND = -32601

export const MAX_M_N_NUMBER = 255
export const MILLISECONDS = HOURS_PER_EPOCH * 60 * 60 * 1000

export const ADDRESS_MIN_LENGTH = 86
export const ADDRESS_HEAD_TAIL_LENGTH = 34

export const PlaceHolderArgs = `0x${'00'.repeat(21)}`

export const DAO_DATA = '0x0000000000000000'

export const FEE_RATIO = 1000
