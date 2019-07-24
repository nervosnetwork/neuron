import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { language } from 'utils/localCache'
import zh from 'locales/zh.json'
import en from 'locales/en.json'

i18n.use(initReactI18next).init({
  resources: {
    en,
    'en-AU': en,
    'en-CA': en,
    'en-GB': en,
    'en-NZ': en,
    'en-US': en,
    'en-ZA': en,
    zh,
    'zh-CN': zh,
    'zh-TW': zh,
  },
  fallbackLng: language.load(),
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
