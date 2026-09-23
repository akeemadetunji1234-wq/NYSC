export type TrustedIdentity = {
  id: string;
  role: string;
  email?: string | null;
  name?: string | null;
};

export function assertRole<T extends TrustedIdentity>(user: T, role: string | string[]): T {
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    throw new Error(`Forbidden: Requires one of roles [${roles.join(", ")}]`);
  }
  return user;
}

export function assertOwnerOrAdmin<T extends TrustedIdentity>(user: T, ownerId: string): T {
  if (!ownerId || ownerId.length > 100) throw new Error("Invalid owner identifier");
  if (user.role !== "ADMIN" && user.id !== ownerId) {
    throw new Error("Forbidden: You do not have permission to modify this resource.");
  }
  return user;
}
