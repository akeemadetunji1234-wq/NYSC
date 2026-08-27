import { rateLimit, type RateLimitResult } from "./rateLimit";

export const CLOUDINARY_USER_UPLOAD_LIMIT = 20;
export const CLOUDINARY_IP_UPLOAD_LIMIT = 40;
export const CLOUDINARY_BATCH_UPLOAD_LIMIT = 5;
export const CLOUDINARY_UPLOAD_WINDOW_MS = 15 * 60 * 1000;

export type CloudinaryUploadLimitResult = {
  user: RateLimitResult;
  ip: RateLimitResult;
  batch: RateLimitResult;
  success: boolean;
  retryAfterSeconds: number;
};

export async function checkCloudinaryUploadLimits(userId: string, ip: string, batchId: string): Promise<CloudinaryUploadLimitResult> {
  const [user, ipResult, batch] = await Promise.all([
    rateLimit(`cloudinary-upload:user:${userId}`, CLOUDINARY_USER_UPLOAD_LIMIT, CLOUDINARY_UPLOAD_WINDOW_MS),
    rateLimit(`cloudinary-upload:ip:${ip}`, CLOUDINARY_IP_UPLOAD_LIMIT, CLOUDINARY_UPLOAD_WINDOW_MS),
    rateLimit(`cloudinary-upload:batch:${userId}:${batchId}`, CLOUDINARY_BATCH_UPLOAD_LIMIT, CLOUDINARY_UPLOAD_WINDOW_MS),
  ]);
  return {
    user,
    ip: ipResult,
    batch,
    success: user.success && ipResult.success && batch.success,
    retryAfterSeconds: Math.max(user.retryAfterSeconds, ipResult.retryAfterSeconds, batch.retryAfterSeconds),
  };
}
