import React from 'react';
import i18n from './index';

export function useTranslation() {
  const [, forceUpdate] = React.useReducer((value) => value + 1, 0);

  React.useEffect(() => {
    const update = () => forceUpdate();
    i18n.addEventListener('languagechange', update);
    return () => i18n.removeEventListener('languagechange', update);
  }, []);

  return {
    t: i18n.t.bind(i18n),
    i18n,
  };
}
