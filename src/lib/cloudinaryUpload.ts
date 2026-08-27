export const CLOUDINARY_UPLOAD_CONFIG_ERROR =
  "Image upload is not configured yet. Please contact the administrator.";

export const CLOUDINARY_ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const CLOUDINARY_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const CLOUDINARY_MAX_IMAGES = 5;

export type CloudinaryUploadBatch = {
  urls: string[];
  errors: string[];
};

export function validateCloudinaryImageSelection(files: File[], existingCount: number): string | null {
  if (existingCount + files.length > CLOUDINARY_MAX_IMAGES) {
    return "You can upload up to 5 images per listing.";
  }

  const invalidFile = files.find(
    (file) =>
      !CLOUDINARY_ALLOWED_IMAGE_TYPES.has(file.type) ||
      file.size > CLOUDINARY_MAX_IMAGE_BYTES,
  );

  if (invalidFile) {
    return `${invalidFile.name} must be a JPG, PNG, or WEBP image smaller than 10 MB.`;
  }

  return null;
}

export async function uploadCloudinaryImages(files: File[]): Promise<CloudinaryUploadBatch> {
  if (files.length === 0) return { urls: [], errors: [] };

  const batchId = crypto.randomUUID();
  const results = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("batchId", batchId);
      formData.append("batchCount", String(files.length));

      try {
        const response = await fetch("/api/upload/cloudinary", {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || typeof data.secureUrl !== "string") {
          throw new Error(data.error || `Upload failed (${response.status})`);
        }

        return { url: data.secureUrl as string, error: null };
      } catch (error) {
        console.error("Image upload failed:", error);
        return {
          url: null,
          error: `${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`,
        };
      }
    }),
  );

  return {
    urls: results.flatMap((result) => (result.url ? [result.url] : [])),
    errors: results.flatMap((result) => (result.error ? [result.error] : [])),
  };
}
