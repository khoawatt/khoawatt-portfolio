import { headers } from "next/headers";

import { type Locale } from "@/features/i18n/config";
import { getMessages } from "@/features/i18n/messages";

import { AdminFormCard, AdminPage } from "../admin-page";
import { getFaviconAdminView } from "./data";
import { FaviconForm } from "./favicon-form";

export const metadata = {
  title: "Admin site settings",
};

/** Admin pages live outside the `[locale]` tree; honor the browser's language. */
async function getAdminLocale(): Promise<Locale> {
  const acceptLanguage =
    (await headers()).get("accept-language")?.toLowerCase() ?? "";
  return acceptLanguage.startsWith("vi") ? "vi" : "en";
}

export default async function AdminSettingsPage() {
  const locale = await getAdminLocale();
  const messages = (await getMessages(locale)).adminFavicon;
  const favicon = await getFaviconAdminView();

  return (
    <AdminPage title={messages.pageTitle}>
      <AdminFormCard>
        <h2>{messages.cardTitle}</h2>
        <p className="admin-hint">{messages.cardHint}</p>
        <FaviconForm initial={favicon} messages={messages} />
      </AdminFormCard>
    </AdminPage>
  );
}
