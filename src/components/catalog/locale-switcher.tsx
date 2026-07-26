import Link from "next/link";
import { localePath, locales, messages, type Locale } from "@/lib/i18n";

export function LocaleSwitcher({
  locale,
  path = "/",
}: {
  locale: Locale;
  path?: string;
}) {
  return (
    <nav className="locale-switcher" aria-label={messages[locale].language}>
      {locales.map((option) => (
        <Link
          key={option}
          href={localePath(option, path)}
          hrefLang={option}
          lang={option}
          aria-current={option === locale ? "page" : undefined}
        >
          {option.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
