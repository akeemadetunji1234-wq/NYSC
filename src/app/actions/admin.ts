// Barrel file — server actions are defined in adminPart* modules with "use server".
// This file must not use export * or "use server" (Next.js restriction).

export {
  getDashboardStats,
  getOperationalDiagnostics,
  getAdminNotificationReport,
  getAgents,
  getUnverifiedAgents,
  verifyAgent,
  activateAgent,
  deactivateAgent,
  rejectAgent,
  getAllUsers,
  getCorpMembers,
  getPremiumPayments,
  getPayouts,
} from "./adminPart1";

export {
  updateUserRole,
  toggleUserBan,
  deleteUserAccount,
  upgradeToPremium,
  revokePremium,
  getAdminAnalytics,
  getRegionalHeatmapData,
} from "./adminPart2a";

export {
  getArtisans,
  createArtisan,
  updateArtisan,
  deleteArtisan,
  verifyArtisan,
  getAgentFraudRiskReport,
  getPendingProperties,
  updatePropertyStatus,
  getPartners,
} from "./adminPart2b";
