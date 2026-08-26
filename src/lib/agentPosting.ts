export type AgentPostingProfile = {
  agentVerified: boolean;
  isBanned: boolean;
  verificationStatus?: string;
};

export type AgentPostingError = "INACTIVE_AGENT" | "UNVERIFIED_AGENT";

export function getAgentPostingError(profile: AgentPostingProfile): AgentPostingError | null {
  if (profile.isBanned || profile.verificationStatus === "DEACTIVATED") return "INACTIVE_AGENT";
  if (!profile.agentVerified) return "UNVERIFIED_AGENT";
  return null;
}
