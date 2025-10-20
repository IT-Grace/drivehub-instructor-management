// Replit Auth integration
// Referenced from javascript_log_in_with_replit blueprint

import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import memoize from "memoizee";
import passport from "passport";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  // Generate session secret if not provided
  const sessionSecret =
    process.env.SESSION_SECRET ||
    (() => {
      const crypto = require("crypto");
      const generated = crypto.randomBytes(64).toString("hex");
      console.warn(
        "⚠️  No SESSION_SECRET provided. Auto-generated one for this session."
      );
      console.warn(
        "🔑 For production, set SESSION_SECRET in your environment variables."
      );
      console.warn(`🔧 Generated secret: ${generated}`);
      return generated;
    })();

  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Development mode: Skip Replit Auth and create mock users
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Development mode: Using mock authentication");

    // Create multiple test users for development
    const testUsers = [
      {
        id: "dev-admin-1",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "super_admin",
      },
      {
        id: "dev-instructor-1",
        email: "instructor@example.com",
        firstName: "John",
        lastName: "Instructor",
        role: "instructor",
      },
      {
        id: "dev-student-1",
        email: "student@example.com",
        firstName: "Jane",
        lastName: "Student",
        role: "student",
      },
    ];

    // Create all test users in database
    for (const user of testUsers) {
      await storage.upsertUser(user);
    }

    // Create corresponding student and instructor profiles
    try {
      // Create instructor profile for instructor user
      const existingInstructor = await storage.getInstructor(
        "dev-instructor-1"
      );
      if (!existingInstructor) {
        await storage.createInstructor({
          userId: "dev-instructor-1",
          licenseNumber: "INST-12345",
          phone: "(555) 987-6543",
          specializations: [
            "Manual transmission",
            "Highway driving",
            "Defensive driving",
          ],
          bio: "Experienced driving instructor with 5 years of teaching safe driving practices.",
        });
      }

      // Create student profile for student user
      const existingStudent = await storage.getStudent("dev-student-1");
      if (!existingStudent) {
        await storage.createStudent({
          userId: "dev-student-1",
          instructorId: "dev-instructor-1", // Assign to our test instructor
          licenseNumber: null,
          phone: "(555) 123-4567",
          address: "123 Student Street, Learning City, LC 12345",
          hoursCompleted: "12.50",
          totalHours: "40.00",
          notes:
            "Progressing well with parallel parking. Needs more highway practice.",
        });
      }
    } catch (error) {
      console.log("Note: Some test profiles may already exist");
    }

    // Development login selection page
    app.get("/api/login", (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>DriveHub - Development Login</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 600px; 
              margin: 100px auto; 
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 { 
              color: #333; 
              text-align: center;
              margin-bottom: 30px;
            }
            .user-card {
              border: 2px solid #e5e5e5;
              border-radius: 8px;
              padding: 20px;
              margin: 15px 0;
              cursor: pointer;
              transition: all 0.2s;
              text-decoration: none;
              color: inherit;
              display: block;
            }
            .user-card:hover {
              border-color: #007bff;
              background: #f8f9fa;
              transform: translateY(-2px);
            }
            .user-name { font-weight: bold; font-size: 18px; }
            .user-email { color: #666; margin: 5px 0; }
            .user-role { 
              display: inline-block;
              background: #007bff;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              text-transform: uppercase;
              font-weight: bold;
            }
            .admin { background: #dc3545; }
            .instructor { background: #28a745; }
            .student { background: #ffc107; color: #333; }
            .note {
              text-align: center;
              color: #666;
              margin-top: 20px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚗 DriveHub Development Login</h1>
            <p style="text-align: center; color: #666; margin-bottom: 30px;">
              Choose a user to sign in as:
            </p>
            
            <a href="/api/dev-login/dev-admin-1" class="user-card">
              <div class="user-name">Admin User</div>
              <div class="user-email">admin@example.com</div>
              <div class="user-role admin">Super Admin</div>
            </a>
            
            <a href="/api/dev-login/dev-instructor-1" class="user-card">
              <div class="user-name">John Instructor</div>
              <div class="user-email">instructor@example.com</div>
              <div class="user-role instructor">Instructor</div>
            </a>
            
            <a href="/api/dev-login/dev-student-1" class="user-card">
              <div class="user-name">Jane Student</div>
              <div class="user-email">student@example.com</div>
              <div class="user-role student">Student</div>
            </a>
            
            <div class="note">
              This is development mode only. Production uses Replit Auth.
            </div>
          </div>
        </body>
        </html>
      `);
    });

    // Development login handler for specific user
    app.get("/api/dev-login/:userId", async (req, res) => {
      const { userId } = req.params;
      const user = testUsers.find((u) => u.id === userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const mockUser = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        },
      };

      req.login(mockUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.redirect("/");
      });
    });

    // Mock logout
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    return;
  }

  // Production Replit Auth setup
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

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Development mode: Always authenticate mock user
  if (process.env.NODE_ENV === "development") {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return next();
  }

  // Production Replit Auth validation
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Role-based authorization middleware
export const requireRole = (...allowedRoles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      let userId: string;

      // Development mode: Get from session user
      if (process.env.NODE_ENV === "development") {
        userId = req.user?.claims?.sub;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
      } else {
        // Production: Get from JWT claims
        userId = req.user?.claims?.sub;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error("Error checking role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};
