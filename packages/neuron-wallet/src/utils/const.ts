export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50
export const BUNDLED_CKB_URL = 'http://127.0.0.1:8114'
export const SETTINGS_WINDOW_TITLE = process.platform === 'darwin' ? 'settings.title.mac' : 'settings.title.normal'
export const SETTINGS_WINDOW_WIDTH = 900
export const DEFAULT_UDT_SYMBOL = 'Unknown'
export const MIN_SUDT_CAPACITY = 142 * 10 ** 8
export const MIN_CELL_CAPACITY = 61 * 10 ** 8
export const START_WITHOUT_INDEXER = -4

export enum ResponseCode {
  Fail,
  Success,
}

export default {
  ResponseCode,
}
