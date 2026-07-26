import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";
import { PublicHeader } from "@/components/catalog/public-header";
import { listCatalog } from "@/lib/catalog-repository";
import { messages, type Locale } from "@/lib/i18n";

export async function LocalizedSchedulePage({ locale }: { locale: Locale }) {
  const catalog = await listCatalog();
  const copy = messages[locale].schedule;
  return (
    <>
      <PublicHeader locale={locale} path="/schedule" />
      <main className="catalog-page">
        <div className="catalog-title">
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <span>{copy.copy}</span>
        </div>
        <section className="week-grid">
          {copy.days.map((day, dayIndex) => (
            <div className={dayIndex === 2 ? "today" : ""} key={day}>
              <header>
                <CalendarDays size={16} />
                <div>
                  <span>{day}</span>
                  <b>
                    {copy.month} {8 + dayIndex}
                  </b>
                </div>
              </header>
              {catalog
                .filter((_, index) => index % 7 === dayIndex)
                .map((title, index) => (
                  <Link href={`/anime/${title.slug}`} key={title.slug}>
                    <Clock3 size={14} />
                    <div>
                      <h3>{locale === "ja" ? title.nativeName : title.name}</h3>
                      <p>
                        {copy.episode} {title.episodes + index + 1}
                      </p>
                    </div>
                    <time>{18 + index}:30</time>
                  </Link>
                ))}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
