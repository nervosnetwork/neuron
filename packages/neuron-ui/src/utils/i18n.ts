import i18n from 'i18next'
import languageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import zh from '../locale/zh'
import en from '../locale/en'

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
      zh,
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
