import ja from './locales/ja.json';
import en from './locales/en.json';

export const resources = { ja, en };
export const supportedLanguages = ['ja', 'en'];
const LANGUAGE_KEY = 'focus-language';

function detectInitialLanguage() {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (supportedLanguages.includes(saved)) return saved;
  return navigator.language?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

function readPath(source, key) {
  return key.split('.').reduce((current, part) => current?.[part], source);
}

class I18nStore extends EventTarget {
  constructor() {
    super();
    this.language = detectInitialLanguage();
  }

  t(key, values = {}) {
    const template = readPath(resources[this.language], key) ?? readPath(resources.en, key) ?? key;
    if (typeof template !== 'string') return key;
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => values[name] ?? '');
  }

  changeLanguage(language) {
    if (!supportedLanguages.includes(language)) return;
    this.language = language;
    localStorage.setItem(LANGUAGE_KEY, language);
    this.dispatchEvent(new Event('languagechange'));
  }
}

const i18n = new I18nStore();

export default i18n;
