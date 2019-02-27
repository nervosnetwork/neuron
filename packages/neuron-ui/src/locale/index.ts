import { addLocaleData } from 'react-intl'
import zh from 'react-intl/locale-data/zh'
import en from 'react-intl/locale-data/en'
import enUS from './en_US'
import zhCN from './zh_CN'

const i18nObjects: any = {
  en: enUS,
  zh: zhCN,
}
addLocaleData([...en, ...zh])

export interface I18nWords {
  'Sidebar.Wallet': string
  'Sidebar.Send': string
  'Sidebar.Receive': string
  'Sidebar.History': string
  'Sidebar.Addresses': string
  'Sidebar.Settings': string
}
export default i18nObjects
