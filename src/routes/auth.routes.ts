// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { 
  validateUserRegistration,
  validateLogin,
  validateVerification,
  validatePasswordReset,
  validateRefreshToken
} from "../middleware/validation.middleware";

export function createAuthRouter(authController: AuthController): Router {
  const router = Router();

  // Public routes - NO authentication required
  router.post("/register", validateUserRegistration, authController.register);
  router.post("/verify-email", validateVerification, authController.verifyEmail);
  router.post("/login", validateLogin, authController.login);
  router.post("/refresh-token", validateRefreshToken, authController.refreshToken);
  router.post("/logout", authController.logout);
  router.post("/resend-verification", authController.resendVerification);
  router.post("/request-password-reset", authController.requestPasswordReset);
  router.post("/reset-password", validatePasswordReset, authController.resetPassword);

  // Protected routes - authentication required
  router.get("/me", authenticate, authController.getCurrentUser);
  
  // Session management routes - authentication required
  router.get("/sessions", authenticate, authController.getActiveSessions);
  router.delete("/sessions/:tokenId", authenticate, authController.revokeSession);
  router.delete("/sessions", authenticate, authController.revokeAllOtherSessions);

  return router;
}