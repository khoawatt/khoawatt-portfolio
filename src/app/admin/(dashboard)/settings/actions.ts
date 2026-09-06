"use server";

import { revalidatePath } from "next/cache";

import { getServiceClient } from "@/features/cms/server";
import { getServerClient, isAdminUser } from "@/features/cms/session";
import {
  FAVICON_MIME,
  FAVICON_PATH,
  FAVICON_PATH_KEY,
  FAVICON_UPDATED_AT_KEY,
  validateFaviconDimensions,
  validateFaviconMime,
  validateFaviconSize,
} from "@/features/site-settings/favicon";

export interface TogglePublicityResult {
  ok: boolean;
  error?: string;
  value?: "private" | "visible";
}

export async function setResumePublicity(
  next: "private" | "visible",
): Promise<TogglePublicityResult> {
  if (!(await isAdminUser())) {
    return { ok: false, error: "Unauthorized." };
  }

  const client = getServiceClient();
  if (!client) {
    return { ok: false, error: "CMS is not configured." };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await client
    .from("app_settings")
    .upsert(
      {
        key: "resume.publicity",
        value: next,
        changed_at: new Date().toISOString(),
        changed_by: user?.email ?? null,
      },
      { onConflict: "key" },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/vi");

  return { ok: true, value: next };
}

export interface UploadFaviconResult {
  ok: boolean;
  error?: string;
  /** Public Storage URL (with `?v=`) of the newly saved favicon. */
  url?: string;
}

/**
 * Owner-only favicon upload. Validates PNG/square/≥512px/≤1MB, stores the
 * bytes at the fixed `portfolio` object `site/favicon.png` (upsert, so no
 * orphans accumulate), and records the path + timestamp in `app_settings`
 * for the single dynamic metadata code path.
 */
export async function uploadFavicon(
  formData: FormData,
): Promise<UploadFaviconResult> {
  if (!(await isAdminUser())) {
    return { ok: false, error: "Unauthorized." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a PNG file to upload." };
  }

  const mimeError = validateFaviconMime(file.type);
  if (mimeError) return { ok: false, error: mimeError.message };

  const sizeError = validateFaviconSize(file.size);
  if (sizeError) return { ok: false, error: sizeError.message };

  const arrayBuffer = await file.arrayBuffer();
  const dimensionsError = validateFaviconDimensions(
    new Uint8Array(arrayBuffer),
  );
  if (dimensionsError) return { ok: false, error: dimensionsError.message };

  const client = await getServerClient();
  const { error: uploadError } = await client.storage
    .from("portfolio")
    .upload(FAVICON_PATH, arrayBuffer, {
      contentType: FAVICON_MIME,
      cacheControl: "3600",
      upsert: true,
    });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const service = getServiceClient();
  if (!service) {
    return { ok: false, error: "CMS is not configured." };
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  const updatedAt = new Date().toISOString();
  const { error: settingsError } = await service.from("app_settings").upsert(
    [
      {
        key: FAVICON_PATH_KEY,
        value: FAVICON_PATH,
        changed_at: updatedAt,
        changed_by: user?.email ?? null,
      },
      {
        key: FAVICON_UPDATED_AT_KEY,
        value: updatedAt,
        changed_at: updatedAt,
        changed_by: user?.email ?? null,
      },
    ],
    { onConflict: "key" },
  );
  if (settingsError) {
    return { ok: false, error: settingsError.message };
  }

  const { data: urlData } = client.storage
    .from("portfolio")
    .getPublicUrl(FAVICON_PATH);
  const url = `${urlData.publicUrl}?v=${Date.parse(updatedAt)}`;

  revalidatePath("/");
  revalidatePath("/vi");
  revalidatePath("/admin/settings");

  return { ok: true, url };
}
