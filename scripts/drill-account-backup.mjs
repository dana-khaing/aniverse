import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const reportPath =
  process.argv.find((argument) => argument.startsWith("--report="))?.slice(9) ??
  ".artifacts/account-backup-drill.json";
const startedAt = new Date();
const started = performance.now();
const key = randomBytes(32);
const payload = {
  manifest: {
    format: "aniverse-backup",
    version: 1,
    createdAt: startedAt.toISOString(),
  },
  data: {
    preferences: [{ id: "drill-user", locale: "en", matureContent: false }],
    watchProgress: [
      { episodeId: "drill-episode", position: 731, duration: 1_440 },
    ],
    favorites: [{ titleId: "drill-title" }],
    customLists: [{ id: "drill-list", name: "Recovery drill" }],
  },
};

const plaintext = Buffer.from(JSON.stringify(payload));
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const envelope = Buffer.from(
  JSON.stringify({
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  }),
);
const checksum = createHash("sha256").update(envelope).digest("hex");

const restoredEnvelope = JSON.parse(envelope.toString());
const decipher = createDecipheriv(
  "aes-256-gcm",
  key,
  Buffer.from(restoredEnvelope.iv, "base64"),
);
decipher.setAuthTag(Buffer.from(restoredEnvelope.tag, "base64"));
const restored = JSON.parse(
  Buffer.concat([
    decipher.update(Buffer.from(restoredEnvelope.ciphertext, "base64")),
    decipher.final(),
  ]).toString(),
);
const restoredChecksum = createHash("sha256").update(envelope).digest("hex");
const tampered = Buffer.from(envelope);
tampered[Math.floor(tampered.length / 2)] ^= 1;
const tamperingDetected =
  createHash("sha256").update(tampered).digest("hex") !== checksum;
const exactMatch = JSON.stringify(restored) === JSON.stringify(payload);
const durationMs = performance.now() - started;

const report = {
  drill: "encrypted-account-backup",
  status:
    restoredChecksum === checksum && tamperingDetected && exactMatch
      ? "passed"
      : "failed",
  startedAt: startedAt.toISOString(),
  completedAt: new Date().toISOString(),
  recoveryTimeMs: Number(durationMs.toFixed(2)),
  recoveryPoint: payload.manifest.createdAt,
  encryptedBytes: envelope.length,
  checksum,
  checks: {
    checksumMatch: restoredChecksum === checksum,
    tamperingDetected,
    exactRecordMatch: exactMatch,
    storesRecovered: Object.keys(restored.data).length,
  },
};

const destination = resolve(reportPath);
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.status !== "passed") process.exit(1);
