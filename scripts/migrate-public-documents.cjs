const { PrismaClient } = require("@prisma/client");
const { put } = require("@vercel/blob");
const crypto = require("crypto");

const prisma = new PrismaClient();

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
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Unable to download legacy document for ${user.id}: ${response.status}`);
    const contentType = response.headers.get("content-type")?.split(";")[0] || "application/octet-stream";
    const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : null;
    if (!extension) throw new Error(`Unsupported legacy document type for ${user.id}: ${contentType}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) throw new Error(`Invalid legacy document size for ${user.id}`);
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
