import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { pool as appPool } from "../../db";

let _oidcConfig: any = null;
let _oidcConfigExpiry = 0;
const getOidcConfig = async () => {
  const now = Date.now();
  if (_oidcConfig && now < _oidcConfigExpiry) return _oidcConfig;
  _oidcConfig = await client.discovery(
    new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
    process.env.REPL_ID!
  );
  _oidcConfigExpiry = now + 3600 * 1000;
  return _oidcConfig;
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  // Pakai ulang pool aplikasi (server/db.ts) — jangan buat pool pg kedua. Ini
  // menekan total koneksi per-instance (penting di autoscale, plafon ~112).
  const sessionStore = new pgStore({
    pool: appPool,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
  // NB: pending agent-share invites are applied in the /api/callback handler
  // (not here) because that's where req/session are available to stash the
  // applied grants for the client's first-login notice.
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      failureRedirect: "/api/login",
    })(req, res, next);
  }, async (req: any, res: any) => {
    const userId = req.user?.claims?.sub;
    const email = req.user?.claims?.email;
    // Apply any pending agent-share invites addressed to this email — non-blocking.
    // Lets an owner invite-by-email before the recipient ever signed in via Replit.
    // Done here (not in upsertUser) so we can stash applied grants in the session
    // for the client's first-login "you now have access to <agent>" notice.
    if (userId && email) {
      try {
        const { storage } = await import("../../storage");
        const grants = await storage.applyPendingInvitesForUser(userId, email);
        if (grants.length > 0) {
          console.log(`[ReplitAuth] Applied ${grants.length} pending agent invite(s) for ${email}`);
          (req.session as any).newAgentGrants = grants;
          await new Promise<void>((resolve) => {
            req.session.save(() => resolve());
          });
        }
      } catch (inviteErr) {
        console.error("[ReplitAuth] Failed to apply pending invites:", inviteErr);
      }
      // Deliver any pre-paid Premium Privat chatbots bought before this signup.
      try {
        const { storage } = await import("../../storage");
        const clones = await storage.applyPendingPremiumDeliveriesForUser(userId, email);
        if (clones.length > 0) console.log(`[ReplitAuth] Delivered ${clones.length} pending Premium Privat clone(s) for ${email}`);
      } catch (delErr) {
        console.error("[ReplitAuth] Failed to deliver pending premium clones:", delErr);
      }
    }
    if (userId) {
      const user = await authStorage.getUser(userId);
      // Blocked users get kicked out
      if (user && user.role === "blocked") {
        return res.redirect("/pending-approval");
      }
    }
    res.redirect("/");
  });

  app.get("/api/logout", (req: any, res) => {
    const hadReplitSession = !!(req.user && (req.user as any).claims);
    const hadEmailSession = !!(req.session && req.session.emailUser);

    // Clear email session if present
    if (hadEmailSession) {
      delete req.session.emailUser;
    }

    req.logout((err: any) => {
      if (err) console.error("[Logout] req.logout error:", err);
      // Destroy whole session to be safe (covers email-only users)
      req.session?.destroy?.(() => {
        res.clearCookie("connect.sid");
        // Only invoke Replit OIDC end-session if user actually had a Replit OIDC session
        if (hadReplitSession) {
          try {
            return res.redirect(
              client.buildEndSessionUrl(config, {
                client_id: process.env.REPL_ID!,
                post_logout_redirect_uri: `${req.protocol}://${req.hostname}/login`,
              }).href
            );
          } catch (e) {
            console.error("[Logout] buildEndSessionUrl failed, falling back:", e);
          }
        }
        res.redirect("/login");
      });
    });
  });
}

const refreshLocks = new Map<string, Promise<boolean>>();

async function performTokenRefresh(user: any, req: any): Promise<boolean> {
  const sessionId = req.sessionID || "default";

  const existing = refreshLocks.get(sessionId);
  if (existing) {
    return existing;
  }

  const refreshPromise = (async () => {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const refreshToken = user.refresh_token;
        if (!refreshToken) return false;
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
        await new Promise<void>((resolve, reject) => {
          req.session?.save((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
        return true;
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        if (isLastAttempt) {
          console.error("Token refresh failed after retries:", error?.message || error);
          return false;
        }
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    return false;
  })();

  refreshLocks.set(sessionId, refreshPromise);
  refreshPromise.finally(() => {
    setTimeout(() => refreshLocks.delete(sessionId), 2000);
  });
  return refreshPromise;
}

// Cache for isActive status to avoid DB calls on every request
const activeStatusCache = new Map<string, { isActive: boolean; expiresAt: number }>();

export function invalidateUserActiveCache(userId: string) {
  activeStatusCache.delete(userId);
}

async function checkUserIsActive(userId: string): Promise<boolean> {
  // Super-admins from env var can never be deactivated
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (adminIds.includes(userId)) return true;

  const cached = activeStatusCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.isActive;
  const user = await authStorage.getUser(userId);
  const isActive = user?.isActive !== false && user?.role !== "blocked";
  activeStatusCache.set(userId, { isActive, expiresAt: Date.now() + 2 * 60 * 1000 });
  return isActive;
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Allow email-session authenticated users through
  if (req.session?.emailUser?.id) {
    // Inject a synthetic req.user so downstream code can read userId consistently
    if (!req.user) {
      req.user = {
        claims: { sub: req.session.emailUser.id },
        emailUser: req.session.emailUser,
      };
    }
    const active = await checkUserIsActive(req.session.emailUser.id);
    if (!active) return res.status(403).json({ message: "Akun Anda telah dinonaktifkan. Hubungi admin Gustafta." });
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!user.expires_at) {
    // Check isActive even without token expiry
    const userId = user.claims?.sub;
    if (userId) {
      const active = await checkUserIsActive(userId);
      if (!active) return res.status(403).json({ message: "Akun Anda telah dinonaktifkan. Hubungi admin Gustafta." });
    }
    return next();
  }

  const now = Math.floor(Date.now() / 1000);
  const gracePeriod = 5 * 60;
  if (now <= user.expires_at + gracePeriod) {
    if (now > user.expires_at - 60) {
      performTokenRefresh(user, req).catch(() => {});
    }
    // Check isActive
    const userId = user.claims?.sub;
    if (userId) {
      const active = await checkUserIsActive(userId);
      if (!active) return res.status(403).json({ message: "Akun Anda telah dinonaktifkan. Hubungi admin Gustafta." });
    }
    return next();
  }

  const refreshed = await performTokenRefresh(user, req);
  if (refreshed) {
    // Check isActive after refresh
    const userId = user.claims?.sub;
    if (userId) {
      const active = await checkUserIsActive(userId);
      if (!active) return res.status(403).json({ message: "Akun Anda telah dinonaktifkan. Hubungi admin Gustafta." });
    }
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};
