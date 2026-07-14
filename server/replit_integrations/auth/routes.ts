import type { Express, RequestHandler } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { db } from "../../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { registerEmailAuthRoutes } from "./emailAuth";

// Middleware: allow either Replit OIDC session OR email session
export const isAuthenticatedAny: RequestHandler = async (req: any, res, next) => {
  // Check Replit OIDC session first
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  // Check email session
  if (req.session?.emailUser?.id) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Register email auth routes (register, login, verify, resend-otp, logout-email)
  registerEmailAuthRoutes(app);

  // Get current authenticated user — supports both Replit OIDC and email sessions
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Email session path
      if (req.session?.emailUser?.id) {
        const userId = req.session.emailUser.id;
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) return res.status(401).json({ message: "Unauthorized" });
        if (user.isActive === false) return res.status(403).json({ message: "Akun Anda telah dinonaktifkan." });
        return res.json(user);
      }

      // Replit OIDC session path
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const userId = req.user.claims?.sub;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const user = await authStorage.getUser(userId);
        if (!user) return res.status(401).json({ message: "Unauthorized" });
        if (user.isActive === false) return res.status(403).json({ message: "Akun Anda telah dinonaktifkan." });
        return res.json(user);
      }

      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
