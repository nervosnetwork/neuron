import i18n from 'i18next'
import zh from './locale/zh'
import en from './locale/en'

i18n.init({
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
