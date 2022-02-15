import { createI18n } from "vue-i18n";
import en from "./en.json";
import de from "./de.json";

const translations = {
  en: en,
  de: de,
};

export const i18n = createI18n({
  legacy: false,
  locale: (navigator.language || "en").slice(0, 2),
  fallbackLocale: "en",
  messages: translations,
});
