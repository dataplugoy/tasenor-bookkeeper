import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export async function initializeI18n(catalog, store) {

  const resources = {
  }

  // Collect translations from UI plugins.
  for (const language of catalog.languages()) {
    resources[language] = {
      translations: catalog.getTranslations(language)
    }
  }

  let language = localStorage.getItem('language')

  if (!language) {
    localStorage.setItem('language', 'en')
    language = 'en'
  }

  // Collect translations from backend plugins.
  const backendData = await store.request(`/languages/${language}`) || {}
  for (const lang of Object.keys(backendData)) {
    if (!resources[lang]) {
      continue
    }
    Object.assign(resources[lang].translations, backendData[lang])
  }

  i18n.use(initReactI18next).init({
    resources,

    fallbackLng: 'en',
    debug: false,

    ns: ['translations'],
    defaultNS: 'translations',

    keySeparator: false,

    interpolation: {
      escapeValue: false,
      formatSeparator: ','
    },

    react: {
      useSuspense: true
    }
  })

  i18n.changeLanguage(localStorage.getItem('language'))
}
export default i18n
