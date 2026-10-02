import { en } from "./en";
import { fr } from "./fr";

/**
 * The two supported interface languages. English is the default and the
 * server-rendered language; French is opt-in from the settings dialog.
 */
export type Lang = "en" | "fr";

export const LANGS = ["en", "fr"] as const;

/** Every key of the English catalogue. */
export type MessageKey = keyof typeof en;

/** A complete translation: one string per `MessageKey`, no gaps allowed. */
export type Messages = Record<MessageKey, string>;

/** The language the app renders in until the user picks another one. */
export const DEFAULT_LANG: Lang = "en";

const MESSAGES: Record<Lang, Messages> = { en, fr };

/** Runtime guard for values that crossed a network or storage boundary. */
export function isLang(value: unknown): value is Lang {
  return (
    typeof value === "string" && (LANGS as readonly string[]).includes(value)
  );
}

export function messagesFor(lang: Lang): Messages {
  return MESSAGES[lang] ?? MESSAGES[DEFAULT_LANG];
}

/**
 * Look up `key` in `lang`, falling back to English. The final `key` fallback
 * only fires if a catalogue is malformed at runtime, which the `Messages` type
 * otherwise makes impossible.
 */
export function translate(lang: Lang, key: MessageKey): string {
  return messagesFor(lang)[key] ?? MESSAGES[DEFAULT_LANG][key] ?? key;
}

/**
 * Fill `{placeholder}` slots in a plain string. Unknown slots are left
 * untouched so a missing value is visible instead of silently blank.
 */
export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name)
      ? String(values[name])
      : match,
  );
}
