"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  discardPreparedPrivateProofUploadForSupabase,
  preparePrivateProofUploadForSupabase,
} from "@/app/proof-library/upload/actions";
import type { PrivateProofUploadServerResult } from "@/services/private-proof-upload-write";

type PrivateProofUploadControlProps = {
  evidenceItemId: string;
  canUpload: boolean;
  allowedMimeTypes: readonly string[];
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export function PrivateProofUploadControl({
  evidenceItemId,
  canUpload,
  allowedMimeTypes,
  supabaseUrl,
  supabasePublishableKey,
}: PrivateProofUploadControlProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submitUpload(formData: FormData) {
    if (pending || !canUpload) {
      return;
    }

    const file = formData.get("proofFile");
    const consentToMedlifeReview = formData.get("consentToMedlifeReview") === "true";
    const consentToFutureSharing = formData.get("consentToFutureSharing") === "granted";

    if (!(file instanceof File) || file.size === 0) {
      setStatus("Choose one private proof file before uploading.");
      return;
    }

    setPending(true);
    setStatus("Preparing a secure upload ticket...");
    let uploadedTicket: Awaited<
      ReturnType<typeof preparePrivateProofUploadForSupabase>
    > | null = null;

    try {
      const prepared = await preparePrivateProofUploadForSupabase({
        evidenceItemId,
        fileName: file.name,
        mimeType: file.type,
        byteSize: file.size,
        consentToMedlifeReview,
        consentToFutureSharing,
      });

      if (!prepared.success) {
        setStatus(prepared.plainEnglishMessage);
        return;
      }

      setStatus("Uploading directly to private Supabase Storage...");
      const supabase = createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
      const { error: uploadError } = await supabase.storage
        .from(prepared.bucket)
        .uploadToSignedUrl(prepared.storagePath, prepared.uploadToken, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setStatus(`The private file could not be uploaded: ${uploadError.message}`);
        return;
      }

      uploadedTicket = prepared;

      setStatus("Recording consent and the auditable upload history...");
      const recordTicket = {
        evidenceItemId: prepared.evidenceItemId,
        bucket: prepared.bucket,
        storagePath: prepared.storagePath,
        input: prepared.input,
      };
      const finalizeResponse = await fetch("/api/proof-library/upload/finalize", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(recordTicket),
      });
      const recorded = (await finalizeResponse.json()) as PrivateProofUploadServerResult;

      if (!finalizeResponse.ok || !recorded.success) {
        const cleanup = await discardPreparedPrivateProofUploadForSupabase(recordTicket);
        setStatus(
          cleanup.success
            ? `${recorded.plainEnglishMessage} The uncommitted private object was removed.`
            : `${recorded.plainEnglishMessage} ${cleanup.plainEnglishMessage}`,
        );
        return;
      }

      fileInputRef.current?.form?.reset();
      router.replace("/proof-library/upload?proofUploadResult=proof_uploaded");
      router.refresh();
    } catch {
      if (uploadedTicket?.success) {
        const cleanupTicket = {
          evidenceItemId: uploadedTicket.evidenceItemId,
          bucket: uploadedTicket.bucket,
          storagePath: uploadedTicket.storagePath,
          input: uploadedTicket.input,
        };
        const cleanup = await discardPreparedPrivateProofUploadForSupabase(cleanupTicket);
        setStatus(
          cleanup.success
            ? "The upload was interrupted and its private storage object was removed. Public sharing and external sends stayed off."
            : cleanup.plainEnglishMessage,
        );
      } else {
        setStatus(
          "The private upload could not be completed. Public sharing and external sends stayed off.",
        );
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={submitUpload}
      className="rounded-2xl border border-white/10 bg-black/20 p-4"
    >
      <p className="text-sm font-semibold text-white">Attach private file</p>
      <p className="mt-2 text-sm leading-6 text-white/62">
        The file uploads directly to private storage. Public proof stays disabled.
      </p>

      <label
        className="mt-4 block text-sm font-semibold text-white"
        htmlFor={`proofFile-${evidenceItemId}`}
      >
        Raw proof file
      </label>
      <input
        ref={fileInputRef}
        id={`proofFile-${evidenceItemId}`}
        name="proofFile"
        type="file"
        accept={allowedMimeTypes.join(",")}
        className="mt-2 block w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-sky-200 file:px-4 file:py-2 file:font-semibold file:text-[#06211d]"
        disabled={!canUpload || pending}
      />

      <label
        className="mt-4 block text-sm font-semibold text-white"
        htmlFor={`futureSharing-${evidenceItemId}`}
      >
        Future sharing consent
      </label>
      <select
        id={`futureSharing-${evidenceItemId}`}
        name="consentToFutureSharing"
        defaultValue="declined"
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
        disabled={!canUpload || pending}
      >
        <option value="declined">Declined</option>
        <option value="granted">Granted</option>
      </select>

      <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-white/72">
        <input
          type="checkbox"
          name="consentToMedlifeReview"
          value="true"
          className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
          disabled={!canUpload || pending}
        />
        <span>I confirm this file may be stored privately for MEDLIFE review only.</span>
      </label>

      <button
        type="submit"
        disabled={!canUpload || pending}
        className="mt-4 w-full rounded-full bg-sky-200 px-5 py-3 text-sm font-semibold text-[#06211d] transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38"
      >
        {pending ? "Uploading..." : canUpload ? "Upload private proof" : "Upload locked"}
      </button>

      {status ? (
        <p className="mt-3 text-sm leading-6 text-sky-100" role="status">
          {status}
        </p>
      ) : null}
    </form>
  );
}
