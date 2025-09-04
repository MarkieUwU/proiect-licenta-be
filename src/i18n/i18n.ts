import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { join } from 'path';

const i18n = i18next.createInstance();

i18n
  .use(Backend)
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: false,
    
    backend: {
      loadPath: join(process.cwd(), 'src/i18n/locales/{{lng}}/{{ns}}.json'),
    },

    interpolation: {
      escapeValue: false, // not needed for server side
    },

    defaultNS: 'translation',
    ns: ['translation'],
  });

export default i18n;
