const MAX_VIDEO_BYTES = 50_000_000_000;

export type ManagedUploadReservation = {
  id: string;
  uploadUrl: string;
  status: "uploading";
};

export function managedVideoFileError(file: File) {
  if (!file.size) return "Choose a non-empty video file.";
  if (file.size > MAX_VIDEO_BYTES)
    return "Managed uploads must be 50 GB or smaller.";
  if (!file.type.startsWith("video/")) return "Choose a supported video file.";
  return null;
}

async function reserveManagedVideo(file: File, episodeId: string) {
  const validationError = managedVideoFileError(file);
  if (validationError) throw new Error(validationError);
  const reservationResponse = await fetch("/api/v1/creator/uploads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      episodeId,
      filename: file.name,
      bytes: file.size,
    }),
  });
  const reservation = (await reservationResponse
    .json()
    .catch(() => ({}))) as Partial<ManagedUploadReservation> & {
    error?: string;
  };
  if (!reservationResponse.ok || !reservation.id || !reservation.uploadUrl)
    throw new Error(
      reservation.error ?? "A managed upload could not be created.",
    );
  return reservation as ManagedUploadReservation;
}

export async function uploadManagedVideo(file: File, episodeId: string) {
  const reservation = await reserveManagedVideo(file, episodeId);
  const uploadResponse = await fetch(reservation.uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!uploadResponse.ok)
    throw new Error(`The video transfer failed (${uploadResponse.status}).`);
  return {
    id: reservation.id,
    filename: file.name,
    bytes: file.size,
    status: "processing" as const,
  };
}

export type ManagedUploadStatus =
  | "uploading"
  | "paused"
  | "offline"
  | "retrying"
  | "processing"
  | "failed"
  | "cancelled";

export type ManagedUploadSession = {
  id: string;
  filename: string;
  bytes: number;
  upload: UpChunk;
  completion: Promise<{
    id: string;
    filename: string;
    bytes: number;
    status: "processing";
  }>;
};

export async function createResumableManagedUpload(
  file: File,
  episodeId: string,
  handlers: {
    onProgress?: (progress: number) => void;
    onStatus?: (status: ManagedUploadStatus, detail?: string) => void;
  } = {},
): Promise<ManagedUploadSession> {
  const reservation = await reserveManagedVideo(file, episodeId);
  const upload = createUpload({
    endpoint: reservation.uploadUrl,
    file,
    chunkSize: 5120,
    attempts: 5,
    delayBeforeAttempt: 2,
    dynamicChunkSize: true,
    maxFileSize: MAX_VIDEO_BYTES / 1000,
  });
  const completion = new Promise<{
    id: string;
    filename: string;
    bytes: number;
    status: "processing";
  }>((resolve, reject) => {
    upload.on("progress", (event) => {
      handlers.onProgress?.(Math.round(Number(event.detail)));
    });
    upload.on("attemptFailure", (event) => {
      const detail = event.detail as {
        chunkNumber?: number;
        attemptsLeft?: number;
      };
      handlers.onStatus?.(
        "retrying",
        `Retrying chunk ${(detail.chunkNumber ?? 0) + 1}; ${detail.attemptsLeft ?? 0} attempts remain.`,
      );
    });
    upload.on("offline", () => handlers.onStatus?.("offline"));
    upload.on("online", () => handlers.onStatus?.("uploading"));
    upload.on("success", () => {
      handlers.onProgress?.(100);
      handlers.onStatus?.("processing");
      resolve({
        id: reservation.id,
        filename: file.name,
        bytes: file.size,
        status: "processing",
      });
    });
    upload.on("error", (event) => {
      const detail = event.detail as { message?: string };
      handlers.onStatus?.("failed", detail.message);
      reject(new Error(detail.message ?? "Managed upload failed."));
    });
  });
  handlers.onStatus?.("uploading");
  return {
    id: reservation.id,
    filename: file.name,
    bytes: file.size,
    upload,
    completion,
  };
}

export async function cancelManagedUpload(id: string) {
  const response = await fetch(
    `/api/v1/creator/uploads?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(data.error ?? "Managed upload could not be cancelled.");
  }
}
import { createUpload, type UpChunk } from "@mux/upchunk";
