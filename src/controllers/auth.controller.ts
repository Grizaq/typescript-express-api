// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { ValidationError } from "../utils/errors";

export class AuthController {
  constructor(private authService: AuthService) {}

  // Register a new user
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      const result = await this.authService.register({
        name,
        email,
        password,
      });

      res.status(201).json({
        status: "success",
        message: "User registered successfully. Please verify your email.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Verify email with OTP
  verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.body;

      await this.authService.verifyEmail(token);

      res.status(200).json({
        status: "success",
        message: "Email verified successfully. You can now log in.",
      });
    } catch (error) {
      next(error);
    }
  };

  // Login user
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login({
        email,
        password,
      });

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: "success",
        message: "Logged in successfully",
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Refresh token to get new access token
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get refresh token from cookie or request body
      const token = req.cookies.refreshToken || req.body.refreshToken;

      if (!token) {
        res.status(401).json({
          status: "error",
          message: "Refresh token is required",
        });
        return;
      }

      const result = await this.authService.refreshToken(token);

      // Set new refresh token as HTTP-only cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: "success",
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Logout user
  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get refresh token from cookie or request body
      const token = req.cookies.refreshToken || req.body.refreshToken;

      if (token) {
        // Revoke the token in the database
        await this.authService.revokeToken(token);
      }

      // Clear the refresh token cookie
      res.clearCookie("refreshToken");

      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Resend verification email
  resendVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      await this.authService.resendVerificationEmail(email);

      res.status(200).json({
        status: "success",
        message: "Verification email sent successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Request password reset
  requestPasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      await this.authService.requestPasswordReset(email);

      res.status(200).json({
        status: "success",
        message: "If the email exists, a password reset link has been sent",
      });
    } catch (error) {
      next(error);
    }
  };

  // Reset password
  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      await this.authService.resetPassword(token, newPassword);

      res.status(200).json({
        status: "success",
        message: "Password reset successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Get current user (protected route)
  getCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error("User not authenticated");
      }

      const user = await this.authService.getUserById(req.user.userId);

      res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  // Get all active sessions/devices for current user
  getActiveSessions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error("User not authenticated");
      }

      const sessions = await this.authService.getUserActiveSessions(
        req.user.userId
      );

      res.status(200).json({
        status: "success",
        data: { sessions },
      });
    } catch (error) {
      next(error);
    }
  };

  // Revoke a specific session/device
  revokeSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error("User not authenticated");
      }

      const { tokenId } = req.params;

      await this.authService.revokeSession(parseInt(tokenId), req.user.userId);

      res.status(200).json({
        status: "success",
        message: "Session revoked successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Revoke all sessions except current one
  revokeAllOtherSessions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error("User not authenticated");
      }

      // Get current token from cookie or body
      const currentToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!currentToken) {
        throw new ValidationError("Current session token is required");
      }

      await this.authService.revokeAllOtherSessions(
        req.user.userId,
        currentToken
      );

      res.status(200).json({
        status: "success",
        message: "All other sessions revoked successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
