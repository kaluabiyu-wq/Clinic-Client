import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type LangCode = 'en' | 'am';

export interface Language {
  code: LangCode;
  label: string;
}

type Dictionary = Record<string, string>;

const STORAGE_KEY = 'clinic.lang';
const DEFAULT_LANG: LangCode = 'en';

/**
 * Small signal-based translation service. Strings live in /i18n/<code>.json (served from public/),
 * so adding or correcting a translation never needs a rebuild of the components.
 *
 *   {{ i18n.t('nav.reception') }}
 *   {{ i18n.t('greeting', { name: 'Abebe' }) }}   // "Hello {name}"
 *
 * Reading `t()` inside a template tracks the signals, so the view updates when the language changes.
 * Missing keys fall back to English, then to the key itself.
 */
@Injectable({ providedIn: 'root' })
export class TranslateService {
  private readonly http = inject(HttpClient);

  readonly languages: readonly Language[] = [
    { code: 'en', label: 'English' },
    { code: 'am', label: 'አማርኛ' },
  ];

  readonly lang = signal<LangCode>(this.readStoredLang());

  private readonly fallback = signal<Dictionary>({});
  private readonly dictionary = signal<Dictionary>({});

  /** Loads English (fallback) and the saved language. Call once at start-up. */
  async init(): Promise<void> {
    const lang = this.lang();
    const [english, current] = await Promise.all([
      this.load(DEFAULT_LANG),
      lang === DEFAULT_LANG ? Promise.resolve(null) : this.load(lang),
    ]);
    this.fallback.set(english);
    this.dictionary.set(current ?? english);
    this.applyToDocument(lang);
  }

  async use(lang: LangCode): Promise<void> {
    const dictionary = lang === DEFAULT_LANG ? this.fallback() : await this.load(lang);
    this.dictionary.set(dictionary);
    this.lang.set(lang);
    this.applyToDocument(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage unavailable: the choice lasts for this visit only
    }
  }

  t(key: string, params?: Record<string, string | number>): string {
    const text = this.dictionary()[key] ?? this.fallback()[key] ?? key;
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
  }

  private async load(lang: LangCode): Promise<Dictionary> {
    try {
      const json = await firstValueFrom(this.http.get<unknown>(`/i18n/${lang}.json`));
      return flatten(json);
    } catch {
      return {};
    }
  }

  private readStoredLang(): LangCode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'am') return stored;
    } catch {
      // ignore
    }
    return DEFAULT_LANG;
  }

  private applyToDocument(lang: LangCode): void {
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }
}

/** { nav: { book: 'x' } } -> { 'nav.book': 'x' } */
function flatten(value: unknown, prefix = '', out: Dictionary = {}): Dictionary {
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  } else if (typeof value === 'string') {
    out[prefix] = value;
  }
  return out;
}
