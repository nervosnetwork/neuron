import { BrowserWindow } from 'electron'
import env from 'env'
import Store from 'models/store'
import { changeLanguage } from 'locales/i18n'
import { updateApplicationMenu } from 'controllers/app/menu'
import path from 'path'

const { app } = env

export const locales = ['zh', 'zh-TW', 'en', 'en-US'] as const
export type Locale = typeof locales[number]

export default class SettingsService extends Store {
  private static instance: SettingsService | null = null

  public static getInstance() {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  get locale() {
    return this.readSync('locale')
  }

  set locale(lng: Locale) {
    if (locales.includes(lng)) {
      this.writeSync('locale', lng)
      changeLanguage(lng)
      this.onLocaleChanged(lng)
    } else {
      throw new Error(`Locale ${lng} not supported`)
    }
  }

  get indexerDataPath() {
    return this.readSync('indexerDataPath')
  }

  set indexerDataPath(dataPath: string) {
    this.writeSync('indexerDataPath', dataPath)
  }

  get ckbDataPath() {
    return this.readSync('ckbDataPath')
  }

  set ckbDataPath(dataPath: string) {
    this.writeSync('ckbDataPath', dataPath)
  }

  get themeSource() {
    return this.readSync('themeSource') || 'system'
  }

  set themeSource(theme: 'system' | 'light' | 'dark') {
    this.writeSync('themeSource', theme)
  }

  constructor() {
    super(
      '',
      'settings.json',
      JSON.stringify({
        locale: app.getLocale(),
        ckbDataPath: path.resolve(app.getPath('userData'), 'chains/mainnet')
      })
    )
    if (!this.ckbDataPath) {
      this.ckbDataPath = path.resolve(app.getPath('userData'), 'chains/mainnet')
    }
  }

  private onLocaleChanged = (lng: Locale) => {
    BrowserWindow.getAllWindows().forEach(bw => bw.webContents.send('set-locale', lng))
    updateApplicationMenu(null)
  }
}
