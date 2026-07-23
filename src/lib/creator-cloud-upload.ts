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
  if (!file.type.startsWith("video/"))
    return "Choose a supported video file.";
  return null;
}

export async function uploadManagedVideo(file: File, episodeId: string) {
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
  if (
    !reservationResponse.ok ||
    !reservation.id ||
    !reservation.uploadUrl
  )
    throw new Error(
      reservation.error ?? "A managed upload could not be created.",
    );
  const uploadResponse = await fetch(reservation.uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!uploadResponse.ok)
    throw new Error(
      `The video transfer failed (${uploadResponse.status}).`,
    );
  return {
    id: reservation.id,
    filename: file.name,
    bytes: file.size,
    status: "processing" as const,
  };
}
