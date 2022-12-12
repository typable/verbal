import { useEffect, useState } from '../deps.ts';
import TRANSLATION_EN from '../translations/en.translation.ts';
import TRANSLATION_DE from '../translations/de.translation.ts';
import { Option, SetState } from '../types.ts';

export type UseTranslate = (initial?: string) => Translate;

export interface Translate {
  translate: (code: string) => string,
  setLanguage: SetState<string>
}

let current = 'en';

export default function useTranslate(initial?: string): Translate {
  const [language, setLanguage] = useState(initial ?? current);
  const translations: Record<string, Record<string, unknown>> = {
    en: TRANSLATION_EN,
    de: TRANSLATION_DE,
  };

  useEffect(() => {
    current = language ?? 'en';
  }, [language]);

  function resolve(root: { [keys: string]: unknown }, code: string): Option<string> {
    if (root == null) {
      return null;
    }
    const [key, ...next] = code.split('.');
    if (next.length === 0) {
      return root[key] as Option<string>;
    }
    else {
      return resolve(root[key] as { [keys: string]: unknown }, next.join('.'));
    }
  }

  function translate(code: string): string {
    return resolve(translations[language], code) ?? `[${code}]`;
  }
  
  return { translate, setLanguage };
}
