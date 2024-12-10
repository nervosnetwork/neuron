import i18n from 'i18next'
import zh from './zh'
import en from './en'
import zhTW from './zh-tw'
import fr from './fr'
import ar from './ar'
import es from './es'

i18n.init({
  resources: {
    en,
    ar,
    fr,
    es,
    zh,
    'zh-TW': zhTW,
    'fr-CA': fr,
    'fr-BE': fr,
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
