import i18n from 'i18next'
import zh from './zh'
import en from './en'
import zhTW from './zh-tw'
import fr from './fr'

i18n.init({
  resources: {
    en,
    fr,
    zh,
    'zh-TW': zhTW,
  },
  fallbackLng: {
    'zh-CN': ['zh'],
    default: ['en'],
  },
  interpolation: {
    escapeValue: false,
  },
})

export const changeLanguage = (lng = 'en') => {
  i18n.changeLanguage(lng)
}

export default { changeLanguage }
