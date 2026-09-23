"use server";

// Next.js requires explicit named exports of async functions from "use server" files.
// Do not use export * here.

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
