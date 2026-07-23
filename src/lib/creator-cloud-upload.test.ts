import { afterEach, describe, expect, it, vi } from "vitest";
import {
  managedVideoFileError,
  uploadManagedVideo,
} from "./creator-cloud-upload";

describe("creator managed video upload", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reserves an upload and transfers the source directly to Mux", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          {
            id: "upload-1",
            uploadUrl: "https://storage.mux.test/direct",
            status: "uploading",
          },
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["video"], "episode.mp4", { type: "video/mp4" });

    await expect(
      uploadManagedVideo(file, "987f6543-e21b-43d2-a456-426614174000"),
    ).resolves.toMatchObject({
      id: "upload-1",
      filename: "episode.mp4",
      status: "processing",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://storage.mux.test/direct",
      expect.objectContaining({ method: "PUT", body: file }),
    );
  });

  it("rejects empty and non-video sources before reserving capacity", () => {
    expect(
      managedVideoFileError(new File([], "empty.mp4", { type: "video/mp4" })),
    ).toContain("non-empty");
    expect(
      managedVideoFileError(
        new File(["notes"], "notes.txt", { type: "text/plain" }),
      ),
    ).toContain("video");
  });
});
