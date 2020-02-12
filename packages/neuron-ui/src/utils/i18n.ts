import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocale } from 'services/remote'

import zh from 'locales/zh.json'
import en from 'locales/en.json'
import zhTW from 'locales/zh-tw.json'

i18n.use(initReactI18next).init({
  resources: {
    en,
    zh,
    'zh-TW': zhTW,
  },
  lng: getLocale(),
  fallbackLng: {
    'zh-CN': ['zh'],
    default: ['en'],
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
