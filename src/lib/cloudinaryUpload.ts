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

function getCloudinaryConfig(): { cloudName: string; uploadPreset: string } | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) return null;
  return { cloudName, uploadPreset };
}

export async function uploadCloudinaryImages(files: File[]): Promise<CloudinaryUploadBatch> {
  const config = getCloudinaryConfig();
  if (!config) {
    return { urls: [], errors: [CLOUDINARY_UPLOAD_CONFIG_ERROR] };
  }

  const results = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", config.uploadPreset);

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
          { method: "POST", body: formData },
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.secure_url) {
          throw new Error(data.error?.message || `Upload failed (${response.status})`);
        }

        return { url: data.secure_url as string, error: null };
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
