import path from "node:path";

const LOCAL_STORAGE_KEY = /^local\/([a-f0-9]{32})\.(jpg|png|webp)$/i;
const BLOB_STORAGE_KEY = /^verification-documents\/([a-f0-9]{32})\.(jpg|png|webp)$/i;

export const VERIFICATION_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function parseVerificationStorageKey(storageKey: string | null | undefined) {
  if (typeof storageKey !== "string") return null;
  const localMatch = LOCAL_STORAGE_KEY.exec(storageKey);
  if (localMatch) return { kind: "local" as const, filename: `${localMatch[1]}.${localMatch[2].toLowerCase()}`, extension: localMatch[2].toLowerCase() };
  const blobMatch = BLOB_STORAGE_KEY.exec(storageKey);
  if (blobMatch) return { kind: "blob" as const, pathname: `verification-documents/${blobMatch[1]}.${blobMatch[2].toLowerCase()}`, extension: blobMatch[2].toLowerCase() };
  return null;
}

export function resolvePrivateUploadPath(baseDirectory: string, storageKey: string | null | undefined) {
  const parsed = parseVerificationStorageKey(storageKey);
  if (!parsed || parsed.kind !== "local") return null;
  const base = path.resolve(baseDirectory);
  const resolved = path.resolve(base, parsed.filename);
  if (resolved === base || !resolved.startsWith(`${base}${path.sep}`)) return null;
  return resolved;
}
