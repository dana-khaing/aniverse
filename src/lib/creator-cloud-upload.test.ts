import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelManagedUpload,
  createResumableManagedUpload,
  deleteManagedAsset,
  managedVideoFileError,
  uploadManagedVideo,
} from "./creator-cloud-upload";

const upchunk = vi.hoisted(() => ({ createUpload: vi.fn() }));
vi.mock("@mux/upchunk", () => ({ createUpload: upchunk.createUpload }));

describe("creator managed video upload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    upchunk.createUpload.mockReset();
  });

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

  it("reports chunk progress, retries, and completion", async () => {
    const listeners = new Map<string, (event: CustomEvent) => void>();
    const upload = {
      on: vi.fn((name: string, handler: (event: CustomEvent) => void) =>
        listeners.set(name, handler),
      ),
      pause: vi.fn(),
      resume: vi.fn(),
      abort: vi.fn(),
    };
    upchunk.createUpload.mockReturnValue(upload);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            id: "upload-2",
            uploadUrl: "https://storage.mux.test/resumable",
            status: "uploading",
          },
          { status: 201 },
        ),
      ),
    );
    const onProgress = vi.fn();
    const onStatus = vi.fn();
    const file = new File(["video"], "large.mp4", { type: "video/mp4" });

    const session = await createResumableManagedUpload(file, "episode-id", {
      onProgress,
      onStatus,
    });
    listeners.get("progress")?.(new CustomEvent("progress", { detail: 42.4 }));
    listeners.get("attemptFailure")?.(
      new CustomEvent("attemptFailure", {
        detail: { chunkNumber: 1, attemptsLeft: 4 },
      }),
    );
    listeners.get("success")?.(new CustomEvent("success"));

    await expect(session.completion).resolves.toMatchObject({
      id: "upload-2",
      status: "processing",
    });
    expect(onProgress).toHaveBeenCalledWith(42);
    expect(onStatus).toHaveBeenCalledWith(
      "retrying",
      expect.stringContaining("4 attempts"),
    );
    expect(upchunk.createUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        chunkSize: 5120,
        attempts: 5,
        dynamicChunkSize: true,
      }),
    );
  });

  it("requests server-side cancellation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await cancelManagedUpload("upload-3");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/creator/uploads?id=upload-3",
      { method: "DELETE" },
    );
  });

  it("requests permanent managed asset deletion", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await deleteManagedAsset("asset-row");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/creator/uploads?id=asset-row&action=delete",
      { method: "DELETE" },
    );
  });
});
