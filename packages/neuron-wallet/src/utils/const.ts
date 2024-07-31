export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50
export const BUNDLED_URL_PREFIX = 'http://127.0.0.1:'
export const BUNDLED_CKB_DEFAULT_PORT = 8114
export const BUNDLED_LIGHT_DEFAULT_PORT = 9000
export const BUNDLED_CKB_URL = 'http://127.0.0.1:8114'
export const BUNDLED_LIGHT_CKB_URL = 'http://127.0.0.1:9000'
export const FULL_NODE_MAINNET = 'ckb'
export const LIGHT_CLIENT_MAINNET = 'light_client_mainnet'
export const LIGHT_CLIENT_TESTNET = 'light_client_testnet'
export const MAINNET_CLIENT_LIST = [FULL_NODE_MAINNET, LIGHT_CLIENT_MAINNET]
export const SETTINGS_WINDOW_TITLE = process.platform === 'darwin' ? 'settings.title.mac' : 'settings.title.normal'
export const SETTINGS_WINDOW_WIDTH = 900
export const DEFAULT_UDT_SYMBOL = 'Unknown'
export const MIN_SUDT_CAPACITY = 142 * 10 ** 8
export const MIN_CELL_CAPACITY = 61 * 10 ** 8
export const START_WITHOUT_INDEXER = -4
export const DEFAULT_ARGS_LENGTH = 42
export const LOCKTIME_ARGS_LENGTH = 58
export const CHEQUE_ARGS_LENGTH = 82

export enum ResponseCode {
  Fail,
  Success,
}

export enum UDTType {
  SUDT = 'sUDT',
  XUDT = 'xUDT',
}

export default {
  ResponseCode,
}
