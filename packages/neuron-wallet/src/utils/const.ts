export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50
export const BUNDLED_CKB_URL = 'http://localhost:8114'
export const SETTINGS_WINDOW_TITLE = process.platform === 'darwin' ? 'settings.title.mac' : 'settings.title.normal'
export const SETTINGS_WINDOW_WIDTH = 900
export const DEFAULT_UDT_SYMBOL = 'Unknown'

export enum ResponseCode {
  Fail,
  Success
}

export default {
  ResponseCode
}
