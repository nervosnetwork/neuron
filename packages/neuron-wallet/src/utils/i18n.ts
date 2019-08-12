import i18n from 'i18next'
import zh from 'locales/zh'
import en from 'locales/en'

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

export const changeLanguage = (lng = 'en') => {
  const language = ['zh', 'zh-CN'].includes(lng) ? 'zh' : 'en'
  i18n.changeLanguage(language)
}

export default i18n
