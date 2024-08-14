import { BrowserWindow, nativeTheme, safeStorage } from 'electron'
import fs from 'node:fs'
import crypto from 'node:crypto'
import env from '../env'
import Store from '../models/store'
import { changeLanguage } from '../locales/i18n'
import { updateApplicationMenu } from '../controllers/app/menu'
import path from 'path'
import NetworksService from './networks'
import { LIGHT_CLIENT_MAINNET, LIGHT_CLIENT_TESTNET } from '../utils/const'

const { app } = env

export const locales = ['zh', 'zh-TW', 'en', 'en-US', 'fr', 'es'] as const
export type Locale = (typeof locales)[number]
const settingKeys = {
  ckbDataPath: 'ckbDataPath',
  nodeDataPath: 'nodeDataPath',
  lockWindow: 'lockWindow',
}

export default class SettingsService extends Store {
  private static instance: SettingsService | null = null

  public static getInstance() {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  get locale() {
    const res = this.readSync<string>('locale')
    if (locales.includes(res as Locale)) {
      return res as Locale
    }
    return res?.startsWith('zh') ? 'zh' : 'en'
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

  get indexerDataPath(): string {
    return this.readSync('indexerDataPath')
  }

  set indexerDataPath(dataPath: string) {
    this.writeSync('indexerDataPath', dataPath)
  }

  get isFirstSync(): boolean {
    return this.readSync('isFirstSync')
  }

  set isFirstSync(isFirstSync: boolean) {
    this.writeSync('isFirstSync', isFirstSync)
  }

  getNodeDataPath(chain?: string) {
    return this.readSync<string>(
      `${settingKeys.nodeDataPath}_${chain ?? NetworksService.getInstance().getCurrent().chain}`
    )
  }

  setNodeDataPath(dataPath: string, chain?: string) {
    this.writeSync(`${settingKeys.nodeDataPath}_${chain ?? NetworksService.getInstance().getCurrent().chain}`, dataPath)
  }

  get themeSource() {
    return this.readSync('themeSource') || 'system'
  }

  set themeSource(theme: 'system' | 'light' | 'dark') {
    nativeTheme.themeSource = theme
    this.writeSync('themeSource', theme)
  }

  get lockWindowInfo(): { locked: boolean; encryptedPassword?: string } {
    return this.readSync(settingKeys.lockWindow) ?? { locked: false }
  }

  private generateEncryptString(str: string) {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(str).toString('hex')
    }
    const hash = crypto.createHash('sha256')
    hash.update(str)
    return hash.digest('hex')
  }

  updateLockWindowInfo(params: { locked?: boolean; password?: string }) {
    const oldValue = SettingsService.getInstance().lockWindowInfo
    const updatedValue = {
      locked: params.locked ?? oldValue.locked,
      encryptedPassword: oldValue.encryptedPassword,
    }
    if (params.password) {
      updatedValue.encryptedPassword = this.generateEncryptString(params.password)
    }
    this.writeSync(settingKeys.lockWindow, updatedValue)
  }

  verifyLockWindowPassword(password: string) {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(this.lockWindowInfo.encryptedPassword!, 'hex')) === password
    }
    const encryptedPassword = this.generateEncryptString(password)
    return SettingsService.getInstance().lockWindowInfo.encryptedPassword === encryptedPassword
  }

  constructor() {
    super(
      '',
      'settings.json',
      JSON.stringify({
        locale: app.getLocale(),
        // locale: 'en',
        ckbDataPath: path.resolve(app.getPath('userData'), 'chains/mainnet'),
        isFirstSync: true,
        [settingKeys.lockWindow]: {
          locked: false,
        },
      })
    )
    if (!this.getNodeDataPath(LIGHT_CLIENT_MAINNET) || !this.getNodeDataPath('ckb')) {
      this.migrateDataPath()
    }
    if (this.isFirstSync === undefined) {
      this.isFirstSync = !fs.existsSync(path.join(this.getNodeDataPath(), 'ckb.toml'))
    }
  }

  private onLocaleChanged = (lng: Locale) => {
    BrowserWindow.getAllWindows().forEach(bw => bw.webContents.send('set-locale', lng))
    updateApplicationMenu(BrowserWindow.getFocusedWindow())
  }

  migrateDataPath() {
    const networkChain = NetworksService.getInstance().getCurrent()?.chain
    const currentCkbDataPath = this.readSync(settingKeys.ckbDataPath)
    const defaultMainNetworkDir = path.resolve(app.getPath('userData'), 'chains/mainnet')
    this.writeSync(`${settingKeys.nodeDataPath}_${networkChain}`, currentCkbDataPath || defaultMainNetworkDir)
    if (networkChain !== 'ckb') {
      // if user has changed the ckb data path and running with testnet
      this.writeSync(`${settingKeys.nodeDataPath}_ckb`, defaultMainNetworkDir)
    }
    this.writeSync(
      `${settingKeys.nodeDataPath}_${LIGHT_CLIENT_TESTNET}`,
      path.resolve(app.getPath('userData'), 'chains/light/testnet')
    )
    this.writeSync(
      `${settingKeys.nodeDataPath}_${LIGHT_CLIENT_MAINNET}`,
      path.resolve(app.getPath('userData'), 'chains/light/mainnet')
    )
  }
}
