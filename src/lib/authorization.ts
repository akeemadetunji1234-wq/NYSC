export type TrustedIdentity = {
  id: string;
  role: string;
};

export function assertRole(user: TrustedIdentity, role: string | string[]) {
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    throw new Error(`Forbidden: Requires one of roles [${roles.join(", ")}]`);
  }
  return user;
}

export function assertOwnerOrAdmin(user: TrustedIdentity, ownerId: string) {
  if (!ownerId || ownerId.length > 100) throw new Error("Invalid owner identifier");
  if (user.role !== "ADMIN" && user.id !== ownerId) {
    throw new Error("Forbidden: You do not have permission to modify this resource.");
  }
  return user;
}
