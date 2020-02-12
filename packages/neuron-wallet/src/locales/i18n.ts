import i18n from 'i18next'
import zh from './zh'
import en from './en'
import zhTW from './zh-tw'

i18n.init({
  resources: {
    en,
    zh,
    "zh-TW": zhTW
  },
  fallbackLng: {
    'zh-CN': ['zh'],
    default: ['en']
  },
  interpolation: {
    escapeValue: false,
  }
})

export const changeLanguage = (lng = 'en') => {
  i18n.changeLanguage(lng)
}

export default i18n
