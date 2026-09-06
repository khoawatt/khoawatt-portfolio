"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { AdminFaviconMessages } from "@/features/i18n/messages/types";

import type { FaviconAdminView } from "./data";
import { uploadFavicon } from "./actions";

interface FaviconFormProps {
  initial: FaviconAdminView;
  messages: AdminFaviconMessages;
}

const PREVIEW_SIZE = 64;

export function FaviconForm({ initial, messages }: FaviconFormProps) {
  const router = useRouter();
  const [current, setCurrent] = useState<FaviconAdminView>(initial);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (newPreviewUrl) {
        URL.revokeObjectURL(newPreviewUrl);
      }
    };
  }, [newPreviewUrl]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);
    if (newPreviewUrl) {
      URL.revokeObjectURL(newPreviewUrl);
      setNewPreviewUrl(null);
    }
    const file = event.currentTarget.files?.[0];
    if (file) {
      setNewPreviewUrl(URL.createObjectURL(file));
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError(messages.chooseFileError);
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await uploadFavicon(fd);
      if (result.ok && result.url) {
        setCurrent((view) => ({
          ...view,
          url: result.url ?? view.url,
          updatedAt: new Date().toISOString(),
        }));
        if (newPreviewUrl) {
          URL.revokeObjectURL(newPreviewUrl);
          setNewPreviewUrl(null);
        }
        event.currentTarget.reset();
        setSuccess(messages.successMessage);
        router.refresh();
      } else {
        setError(result.error ?? messages.chooseFileError);
      }
    });
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-field">
        <span>{messages.currentLabel}</span>
        {current.url ? (
          /* eslint-disable-next-line @next/next/no-img-element -- 64px admin preview; next/image cannot handle blob: URLs */
          <img
            alt={messages.currentFaviconAlt}
            height={PREVIEW_SIZE}
            src={current.url}
            width={PREVIEW_SIZE}
          />
        ) : (
          <p className="admin-hint">{messages.noFaviconLabel}</p>
        )}
        <small className="admin-hint">
          {messages.updatedAtLabel}:{" "}
          {current.updatedAt
            ? new Date(current.updatedAt).toLocaleString()
            : messages.neverLabel}
        </small>
      </div>

      <label className="admin-field" htmlFor="favicon-file">
        <span>{messages.fileLabel}</span>
        <input
          accept="image/png"
          disabled={isPending}
          id="favicon-file"
          name="file"
          onChange={onFileChange}
          type="file"
        />
        <small className="admin-hint">{messages.fileHint}</small>
      </label>

      {newPreviewUrl ? (
        <div className="admin-field">
          <span>{messages.newPreviewLabel}</span>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview URL, not optimizable */}
          <img
            alt={messages.newFaviconAlt}
            height={PREVIEW_SIZE}
            src={newPreviewUrl}
            width={PREVIEW_SIZE}
          />
        </div>
      ) : null}

      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="admin-message" role="status">
          {success}
        </p>
      ) : null}

      <div className="admin-form-actions">
        <button disabled={isPending} type="submit">
          {isPending ? messages.uploadingLabel : messages.uploadAction}
        </button>
      </div>
    </form>
  );
}
