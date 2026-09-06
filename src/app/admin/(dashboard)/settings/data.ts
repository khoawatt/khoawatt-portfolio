import { getServiceClient } from "@/features/cms/server";
import type { ResumePublicity } from "@/features/cms/resume-publicity";
import {
  buildFaviconUrl,
  FAVICON_PATH_KEY,
  FAVICON_UPDATED_AT_KEY,
} from "@/features/site-settings/favicon";

export interface SettingsView {
  publicity: ResumePublicity;
  changedAt: string | null;
  changedBy: string | null;
}

export interface FaviconAdminView {
  path: string | null;
  updatedAt: string | null;
  /** Public Storage URL with cache-busting `?v=`; null when unset. */
  url: string | null;
}

export async function getSettingsView(): Promise<SettingsView> {
  const client = getServiceClient();

  if (!client) {
    return { publicity: "private", changedAt: null, changedBy: null };
  }

  const { data } = await client
    .from("app_settings")
    .select("value, changed_at, changed_by")
    .eq("key", "resume.publicity")
    .maybeSingle();

  if (!data) {
    return { publicity: "private", changedAt: null, changedBy: null };
  }

  const publicity: ResumePublicity =
    data.value === "visible" ? "visible" : "private";

  return {
    publicity,
    changedAt: data.changed_at ?? null,
    changedBy: data.changed_by ?? null,
  };
}

export async function getFaviconAdminView(): Promise<FaviconAdminView> {
  const empty: FaviconAdminView = { path: null, updatedAt: null, url: null };
  const client = getServiceClient();

  if (!client) {
    return empty;
  }

  const { data } = await client
    .from("app_settings")
    .select("key, value")
    .in("key", [FAVICON_PATH_KEY, FAVICON_UPDATED_AT_KEY]);

  if (!data) {
    return empty;
  }

  const rows = data as Array<{ key: string; value: unknown }>;
  const pathRow = rows.find((row) => row.key === FAVICON_PATH_KEY);
  const updatedAtRow = rows.find((row) => row.key === FAVICON_UPDATED_AT_KEY);

  if (typeof pathRow?.value !== "string" || pathRow.value.trim() === "") {
    return empty;
  }

  const updatedAt =
    typeof updatedAtRow?.value === "string" ? updatedAtRow.value : null;

  return {
    path: pathRow.value,
    updatedAt,
    url: buildFaviconUrl(pathRow.value, updatedAt),
  };
}
