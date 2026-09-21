import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './es.json';
import en from './en.json';

const resources = {
  es: { translation: es },
  en: { translation: en }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // Idioma por defecto
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // React ya protege contra XSS
    }
  });

export default i18n;
