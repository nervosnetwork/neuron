import { BrowserWindow } from 'electron'
import env from 'env'
import Store from 'models/store'
import { changeLanguage } from 'locales/i18n'
import { updateApplicationMenu } from 'controllers/app/menu'

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

  constructor () {
    super('', 'settings.json', JSON.stringify({ locale: env.app.getLocale() }))
  }

  private onLocaleChanged = (lng: Locale) => {
    BrowserWindow.getAllWindows().forEach(bw => bw.webContents.send('set-locale', lng))
    updateApplicationMenu(null)
  }
}
