import i18n from 'i18next'
import zh from 'locales/zh'
import en from 'locales/en'

if (!i18n.isInitialized) {
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
}

export default i18n
