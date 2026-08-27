const { PrismaClient } = require("@prisma/client");
const { put } = require("@vercel/blob");
const crypto = require("crypto");
const dns = require("node:dns").promises;
const net = require("node:net");

const prisma = new PrismaClient();
const MAX_LEGACY_DOCUMENT_BYTES = 5 * 1024 * 1024;

function isPrivateIp(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("ff");
  }
  return true;
}

async function fetchLegacyDocument(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Legacy document URL is invalid");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("Legacy document URL must use HTTPS without credentials");
  const addresses = net.isIP(url.hostname) ? [url.hostname] : (await dns.lookup(url.hostname, { all: true, verbatim: true })).map(({ address }) => address);
  if (!addresses.length || addresses.some(isPrivateIp)) throw new Error("Legacy document URL resolves to a private address");
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Legacy document download failed (${response.status})`);
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_LEGACY_DOCUMENT_BYTES) throw new Error("Legacy document is too large");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_LEGACY_DOCUMENT_BYTES) throw new Error("Legacy document is too large");
  return { response, buffer };
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PUBLIC_DOCUMENT_MIGRATION !== "true") {
    throw new Error("Refusing to migrate production documents without ALLOW_PUBLIC_DOCUMENT_MIGRATION=true");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required");
  }

  const users = await prisma.user.findMany({
    where: { role: "AGENT", docUrl: { not: null } },
    select: { id: true, docUrl: true },
  });
  const legacyUsers = users.filter((user) => user.docUrl && /^https?:\/\//i.test(user.docUrl));
  console.log(`Found ${legacyUsers.length} legacy public document references.`);

  for (const user of legacyUsers) {
    const sourceUrl = user.docUrl;
    const { response, buffer } = await fetchLegacyDocument(sourceUrl);
    const contentType = response.headers.get("content-type")?.split(";")[0] || "application/octet-stream";
    const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : null;
    if (!extension) throw new Error(`Unsupported legacy document type for ${user.id}: ${contentType}`);

    if (buffer.length === 0 || buffer.length > MAX_LEGACY_DOCUMENT_BYTES) throw new Error(`Invalid legacy document size for ${user.id}`);
    const pathname = `verification-documents/${crypto.randomBytes(16).toString("hex")}.${extension}`;
    await put(pathname, buffer, { access: "private", addRandomSuffix: false, contentType, cacheControlMaxAge: 0 });
    await prisma.user.update({ where: { id: user.id }, data: { docUrl: pathname } });
    console.log(`Migrated ${user.id} to ${pathname}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
