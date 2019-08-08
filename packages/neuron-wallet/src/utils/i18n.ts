import i18n from 'i18next'
import zh from 'locales/zh'
import en from 'locales/en'
import app from 'app'

if (!i18n.isInitialized) {
  const fallbackLng = ['zh', 'zh-CN'].includes(app.getLocale()) ? 'zh' : 'en'
  i18n.init({
    resources: {
      en,
      zh,
    },
    fallbackLng,
    interpolation: {
      escapeValue: false,
    },
  })
}

export default i18n
