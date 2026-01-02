import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createProxyMiddleware } from "http-proxy-middleware";
import { unsign } from "cookie-signature";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { storage } from "./storage.js";
import { pool } from "./db.js";
import { SESSION_SECRET } from "./app.js";
import { sendVerificationEmail } from "./email.js";
import { cache, CACHE_KEYS, CACHE_TTL } from "./cache.js";

const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000, // INCREASED: 100 → 5000 for 1000+ concurrent users
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // INCREASED: 10 → 500 for 1000+ concurrent users
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000, // INCREASED: 30 → 1000 for 1000+ concurrent users
  message: { error: "Too many write operations, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
import fs from "fs";
import path from "path";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File storage configuration - save to disk instead of memory
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const fileId = randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  }
});

const upload = multer({ storage: fileStorage });
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage.js";
import { ObjectPermission } from "./objectAcl.js";
import {
  insertTournamentSchema,
  insertTeamSchema,
  insertMatchSchema,
  insertChatMessageSchema,
  insertRegistrationConfigSchema,
  insertRegistrationStepSchema,
  insertRegistrationFieldSchema,
  insertRegistrationSchema,
  insertRegistrationResponseSchema,
  insertServerSchema,
  insertChannelSchema,
  insertChannelCategorySchema,
  insertServerRoleSchema,
  insertServerBanSchema,
  insertServerInviteSchema,
  insertChannelMessageSchema,
  insertMessageThreadSchema,
  insertThreadMessageSchema,
  insertPosterTemplateSchema,
  insertPosterTemplateTagSchema,
  insertUserSchema,
  insertAchievementSchema,
  insertTeamProfileSchema,
  insertTeamMemberSchema,
  insertServerMemberSchema,
} from "../shared/schema.js";
import { z } from "zod";
import {
  generateRoundRobinBracket,
  generateSingleEliminationBracket,
  generateSwissSystemRound,
} from "./bracket-generator.js";

/**
 * PERMANENT: Creates match chat threads for all team members when a match is created.
 * This ensures the match chat appears in all participants' Messages inbox immediately.
 * Called automatically after every match creation.
 */
async function createMatchThreadsForAllMembers(
  matchId: string,
  team1Id: string | null,
  team2Id: string | null
): Promise<void> {
  try {
    // Get team info for match name
    const team1 = team1Id ? await storage.getTeam(team1Id) : null;
    const team2 = team2Id ? await storage.getTeam(team2Id) : null;

    // Get first member usernames for match name (same format as dashboard)
    let team1Username = "TBD";
    let team2Username = "TBD";

    if (team1Id) {
      const team1Members = await storage.getTeamMembers(team1Id);
      if (team1Members.length > 0) {
        const firstMember = await storage.getUser(team1Members[0].userId);
        if (firstMember) {
          team1Username = firstMember.username;
        }
      }
    }

    if (team2Id) {
      const team2Members = await storage.getTeamMembers(team2Id);
      if (team2Members.length > 0) {
        const firstMember = await storage.getUser(team2Members[0].userId);
        if (firstMember) {
          team2Username = firstMember.username;
        }
      }
    }

    // Match name format: "Match Chat: @username1 vs @username2"
    const matchName = `Match Chat: @${team1Username} vs @${team2Username}`;

    // Collect all members from both teams
    const allMembers: { userId: string }[] = [];

    if (team1Id) {
      const team1Members = await storage.getTeamMembers(team1Id);
      allMembers.push(...team1Members);
    }

    if (team2Id) {
      const team2Members = await storage.getTeamMembers(team2Id);
      allMembers.push(...team2Members);
    }

    // Create thread for each member
    for (const member of allMembers) {
      try {
        await storage.getOrCreateMatchThread(
          matchId,
          member.userId,
          matchName,
          undefined
        );
        console.log(`[MATCH-THREAD-CREATE] Created thread for user ${member.userId} in match ${matchId}`);
      } catch (memberError) {
        console.error(`[MATCH-THREAD-CREATE] Error creating thread for ${member.userId}:`, memberError);
      }
    }

    console.log(`[MATCH-THREAD-CREATE] Successfully created threads for ${allMembers.length} members in match ${matchId}`);
  } catch (error) {
    console.error(`[MATCH-THREAD-CREATE] Error creating match threads:`, error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint - no dependencies
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  app.use('/api', generalRateLimiter);
  app.use('/api/auth', authRateLimiter);

  // Apply write rate limiter to all mutating routes
  app.post('/api/*', writeRateLimiter);
  app.put('/api/*', writeRateLimiter);
  app.patch('/api/*', writeRateLimiter);
  app.delete('/api/*', writeRateLimiter);

  app.use('/expo-app', createProxyMiddleware({
    target: 'http://127.0.0.1:8081',
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      '^/expo-app': ''
    }
  }));
  const httpServer = createServer(app);
  const wss = new WebSocketServer({
    noServer: true
  });

  const matchConnections = new Map<string, Set<WebSocket>>();
  const channelConnections = new Map<string, Set<WebSocket>>();
  const wsUserMap = new Map<WebSocket, { userId: string; username: string }>();
  const userConnectionCount = new Map<string, number>();

  const MAX_CONNECTIONS_PER_USER = 10;
  const MAX_MESSAGE_SIZE = 65536;
  const HEARTBEAT_INTERVAL = 30000;

  // Parse session from cookie and verify authentication
  const getSessionUserId = async (request: any): Promise<{ userId: string; username: string } | null> => {
    try {
      const cookies = request.headers.cookie || '';
      const sessionCookieMatch = cookies.match(/connect\.sid=([^;]+)/);

      if (!sessionCookieMatch) {
        return null;
      }

      // Decode the session ID (it's URL encoded with s: prefix)
      const sessionId = decodeURIComponent(sessionCookieMatch[1]);

      // Verify cookie signature using the shared session secret
      const unsigned = unsign(sessionId, SESSION_SECRET);

      if (!unsigned) {
        // Signature verification failed - cookie was tampered with
        return null;
      }

      // Query session from database using verified sid
      const result = await pool.query('SELECT sess FROM session WHERE sid = $1', [unsigned]);

      if (result.rows.length === 0 || !result.rows[0].sess?.userId) {
        return null;
      }

      const userId = result.rows[0].sess.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return null;
      }

      return {
        userId: user.id,
        username: user.username || user.displayName || 'Unknown',
      };
    } catch (error) {
      console.error('Error parsing session:', error);
      return null;
    }
  };

  httpServer.on('upgrade', async (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;

    if (pathname === '/ws/chat' || pathname === '/ws/channel') {
      const userInfo = await getSessionUserId(request);

      if (!userInfo) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const currentCount = userConnectionCount.get(userInfo.userId) || 0;
      if (currentCount >= MAX_CONNECTIONS_PER_USER) {
        socket.write('HTTP/1.1 429 Too Many Connections\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wsUserMap.set(ws, userInfo);
        userConnectionCount.set(userInfo.userId, currentCount + 1);
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const matchId = url.searchParams.get("matchId");
    const channelId = url.searchParams.get("channelId");
    const userInfo = wsUserMap.get(ws);

    if (!userInfo) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Handle channel connections
    if (channelId) {
      if (!channelConnections.has(channelId)) {
        channelConnections.set(channelId, new Set());
      }
      channelConnections.get(channelId)!.add(ws);

      ws.on("message", async (data) => {
        try {
          // Enforce message size limit (64KB) - close connection on abuse
          const messageBuffer = Buffer.from(data as ArrayBuffer);
          if (messageBuffer.length > MAX_MESSAGE_SIZE) {
            ws.send(JSON.stringify({ error: "Message too large", maxSize: MAX_MESSAGE_SIZE }));
            ws.close(1009, "Message too large");
            return;
          }

          const messageData = JSON.parse(data.toString());

          // Use authenticated user info from session, not client data
          const validatedData = insertChannelMessageSchema.parse({
            channelId: channelId,
            userId: userInfo.userId,
            username: userInfo.username,
            message: messageData.message,
            imageUrl: messageData.imageUrl || null,
            replyToId: messageData.replyToId || null,
          });

          // Create channel message with validated data
          const savedMessage = await storage.createChannelMessage(validatedData);

          // Enrich message with avatarUrl for consistent display
          const user = await storage.getUser(userInfo.userId);
          const enrichedMessage = {
            ...savedMessage,
            avatarUrl: user?.avatarUrl || null,
          };

          // Broadcast to all connections in this channel
          const broadcastPayload = {
            type: "new_message",
            message: enrichedMessage,
          };
          broadcastToChannel(channelId, broadcastPayload);
        } catch (error: any) {
          console.error("Error handling channel WebSocket message:", error);
          ws.send(JSON.stringify({ error: "Failed to process message", details: error.message }));
        }
      });

      ws.on("close", () => {
        const userInfo = wsUserMap.get(ws);
        if (userInfo) {
          const count = userConnectionCount.get(userInfo.userId) || 1;
          if (count <= 1) {
            userConnectionCount.delete(userInfo.userId);
          } else {
            userConnectionCount.set(userInfo.userId, count - 1);
          }
        }
        channelConnections.get(channelId)?.delete(ws);
        wsUserMap.delete(ws);
        if (channelConnections.get(channelId)?.size === 0) {
          channelConnections.delete(channelId);
        }
      });
    }
    // Handle match connections (existing functionality)
    else if (matchId) {
      if (!matchConnections.has(matchId)) {
        matchConnections.set(matchId, new Set());
      }
      matchConnections.get(matchId)!.add(ws);

      // Handle incoming messages
      ws.on("message", async (data) => {
        try {
          // Enforce message size limit (64KB) - close connection on abuse
          const messageBuffer = Buffer.from(data as ArrayBuffer);
          if (messageBuffer.length > MAX_MESSAGE_SIZE) {
            ws.send(JSON.stringify({ error: "Message too large", maxSize: MAX_MESSAGE_SIZE }));
            ws.close(1009, "Message too large");
            return;
          }

          const messageData = JSON.parse(data.toString());

          // Get userId from authenticated user info
          const userInfo = wsUserMap.get(ws);
          if (!userInfo) {
            ws.send(JSON.stringify({ error: "Unauthorized" }));
            return;
          }

          // Validate using schema and ensure matchId from URL is used
          const validatedData = insertChatMessageSchema.parse({
            matchId: matchId, // Use matchId from connection URL for security
            teamId: messageData.teamId || null, // Optional field
            userId: userInfo.userId, // Include userId from authenticated connection
            message: messageData.message,
            imageUrl: messageData.imageUrl || null, // Optional field
          });

          // Save message to storage
          const savedMessage = await storage.createChatMessage(validatedData);
          console.log(`[WS-SAVE] Input validatedData:`, { userId: validatedData.userId, matchId: validatedData.matchId });
          console.log(`[WS-SAVE] Saved message from DB:`, { id: savedMessage.id, userId: savedMessage.userId, matchId: savedMessage.matchId });

          // Enrich message with username and avatarUrl before broadcasting
          const enrichedMessage: any = {
            id: savedMessage.id,
            matchId: savedMessage.matchId,
            teamId: savedMessage.teamId || null,
            userId: savedMessage.userId || null,
            message: savedMessage.message || null,
            imageUrl: savedMessage.imageUrl || null,
            isSystem: savedMessage.isSystem || 0,
            createdAt: savedMessage.createdAt,
          };

          console.log(`[WS-ENRICH] Message saved with userId: ${savedMessage.userId}`);

          if (savedMessage.userId) {
            const sender = await storage.getUser(savedMessage.userId);
            enrichedMessage.username = sender?.username || "Unknown";
            enrichedMessage.avatarUrl = sender?.avatarUrl || null;
            console.log(`[WS-ENRICH] User lookup: userId=${savedMessage.userId} -> username=${enrichedMessage.username}, avatarUrl=${enrichedMessage.avatarUrl}`);
          } else {
            enrichedMessage.username = "Unknown";
            enrichedMessage.avatarUrl = null;
            console.log(`[WS-ENRICH] No userId in savedMessage - will broadcast: ${JSON.stringify(enrichedMessage)}`);
          }

          console.log(`[WS-BROADCAST] Broadcasting message with username: ${enrichedMessage.username}`);

          // Broadcast enriched message to all connections in this match
          const broadcastPayload = {
            type: "new_message",
            message: enrichedMessage,
          };
          broadcastToMatch(matchId, broadcastPayload);
        } catch (error: any) {
          console.error("Error handling WebSocket message:", error);
          console.error("Error details:", error.message);
          ws.send(JSON.stringify({ error: "Failed to process message", details: error.message }));
        }
      });

      ws.on("close", () => {
        const userInfo = wsUserMap.get(ws);
        if (userInfo) {
          const count = userConnectionCount.get(userInfo.userId) || 1;
          if (count <= 1) {
            userConnectionCount.delete(userInfo.userId);
          } else {
            userConnectionCount.set(userInfo.userId, count - 1);
          }
        }
        matchConnections.get(matchId)?.delete(ws);
        wsUserMap.delete(ws);
        if (matchConnections.get(matchId)?.size === 0) {
          matchConnections.delete(matchId);
        }
      });
    }
  });

  const broadcastToMatch = (matchId: string, data: any) => {
    const connections = matchConnections.get(matchId);
    if (connections) {
      const message = JSON.stringify(data);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  };

  const broadcastToChannel = (channelId: string, data: any) => {
    const connections = channelConnections.get(channelId);
    if (connections) {
      const message = JSON.stringify(data);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  };

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const registerSchema = z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      });
      const validatedData = registerSchema.parse(req.body);

      // Check if email verification should be skipped
      const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';

      // Check if user with email already exists - always reject duplicates
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({
          error: "An account with this email already exists. Please log in instead."
        });
      }

      // Hash password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Generate verification token (64 chars)
      const verificationToken = randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user with verified/unverified status based on env var
      const user = await storage.createUser({
        username: validatedData.fullName.toLowerCase().replace(/\s+/g, ''),
        email: validatedData.email,
        passwordHash: hashedPassword,
        displayName: validatedData.fullName,
        bio: null,
        avatarUrl: null,
        language: 'en',
        isDisabled: 0,
        emailVerified: skipEmailVerification ? 1 : 0,
        verificationToken: skipEmailVerification ? null : verificationToken,
        verificationTokenExpiry: skipEmailVerification ? null : tokenExpiry,
      });

      // Send verification email only if not skipped
      if (!skipEmailVerification) {
        const domain = req.get('host') || 'localhost:5000';
        const protocol = req.protocol === 'http' ? 'http' : 'https';
        const verificationLink = `${protocol}://${domain}/verify?token=${verificationToken}`;

        await sendVerificationEmail(
          validatedData.email,
          verificationLink,
          validatedData.fullName
        );
      }

      // Auto-login: Create session immediately after registration
      req.session.userId = user.id;

      // Wait for session to be saved before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(201).json({
        message: "Account created successfully!",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          level: user.level,
          emailVerified: skipEmailVerification,
        }
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input data" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string(),
      });
      const validatedData = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const bcrypt = await import('bcrypt');
      if (!user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const passwordValid = await bcrypt.compare(validatedData.password, user.passwordHash);

      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if email is verified (skip if SKIP_EMAIL_VERIFICATION is true)
      const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';
      if (user.emailVerified === 0 && !skipEmailVerification) {
        return res.status(403).json({
          error: "Please verify your email before logging in",
          unverified: true,
          userId: user.id
        });
      }

      // If account is disabled, automatically reactivate it on successful login
      if (user.isDisabled === 1) {
        await storage.updateUser(user.id, { isDisabled: 0 });
      }

      // Create session
      req.session.userId = user.id;

      // Wait for session to be saved before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          level: user.level,
        },
        token: "session-based-auth",
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input data" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Missing verification token" });
      }

      // Find user by verification token
      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

      // Check if token has expired
      if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
        return res.status(400).json({ error: "Verification token has expired" });
      }

      // Mark email as verified and clear token
      await storage.updateUser(user.id, {
        emailVerified: 1,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      res.json({
        message: "Email verified successfully! You can now log in.",
        verified: true
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.emailVerified === 1) {
        return res.status(400).json({ error: "Email already verified" });
      }

      // Generate new verification token
      const verificationToken = randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Update user with new token
      await storage.updateUser(user.id, {
        verificationToken: verificationToken,
        verificationTokenExpiry: tokenExpiry,
      });

      // Send verification email
      const domain = req.get('host') || 'localhost:5000';
      const protocol = req.protocol === 'http' ? 'http' : 'https';
      const verificationLink = `${protocol}://${domain}/verify?token=${verificationToken}`;

      await sendVerificationEmail(
        email,
        verificationLink,
        user.displayName || user.username
      );

      res.json({
        message: "Verification email resent. Please check your inbox."
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => { });
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        level: user.level,
        language: user.language,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tournament routes
  app.get("/api/tournaments", async (req, res) => {
    try {
      const cached = cache.get<any[]>(CACHE_KEYS.TOURNAMENTS_PUBLIC);
      if (cached) {
        return res.json(cached);
      }
      const tournaments = await storage.getAllTournaments();
      cache.set(CACHE_KEYS.TOURNAMENTS_PUBLIC, tournaments, CACHE_TTL.MEDIUM);
      res.json(tournaments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tournaments/:id", async (req, res) => {
    try {
      // Parse date strings back to Date objects if present
      const updateData = { ...req.body };
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }

      const tournament = await storage.updateTournament(req.params.id, updateData);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      cache.delete(CACHE_KEYS.TOURNAMENTS_PUBLIC);
      res.json(tournament);
    } catch (error: any) {
      console.error('[TOURNAMENT-UPDATE] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete tournament (organizer only)
  app.delete("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      // Check if the user is the organizer or server owner
      // Accept userId from query parameter or request body
      const userId = req.query.userId as string || req.body?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }

      // Check organizer permission
      if (tournament.organizerId !== userId) {
        // Also allow server owner to delete
        if (tournament.serverId) {
          const server = await storage.getServer(tournament.serverId);
          if (!server || server.ownerId !== userId) {
            return res.status(403).json({ error: "Only the tournament organizer or server owner can delete this tournament" });
          }
        } else {
          return res.status(403).json({ error: "Only the tournament organizer can delete this tournament" });
        }
      }

      await storage.deleteTournament(req.params.id);
      cache.delete(CACHE_KEYS.TOURNAMENTS_PUBLIC);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tournaments", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session?.userId) {
        return res.status(401).json({ error: "You must be logged in to create a tournament" });
      }

      // Check if user has permission to host tournaments
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      if (!user.canHostTournaments) {
        return res.status(403).json({ error: "You do not have permission to host tournaments" });
      }

      const validatedData = insertTournamentSchema.parse(req.body);

      // Extract registration config and team names (don't save these to tournament table)
      // Keep serverId - it needs to be saved!
      const { teamNames, registrationConfig, ...tournamentData } = validatedData;

      const tournament = await storage.createTournament(tournamentData as any);

      if (teamNames && teamNames.length > 0) {
        const createdTeams = await Promise.all(
          teamNames.map((name) =>
            storage.createTeam({
              name,
              tournamentId: tournament.id,
            })
          )
        );

        let matches;
        if (tournament.format === "round_robin") {
          matches = generateRoundRobinBracket(tournament.id, createdTeams).matches;
        } else if (tournament.format === "single_elimination") {
          matches = generateSingleEliminationBracket(tournament.id, createdTeams).matches;
        } else if (tournament.format === "swiss") {
          matches = generateSwissSystemRound(tournament.id, createdTeams, 1, []).matches;
        }

        if (matches) {
          const createdMatches = await Promise.all(matches.map((match) => storage.createMatch(match)));
          // PERMANENT: Create match threads for all team members immediately
          for (const createdMatch of createdMatches) {
            await createMatchThreadsForAllMembers(createdMatch.id, createdMatch.team1Id, createdMatch.team2Id);
          }
        }
      }

      console.log('[REGISTRATION] Config received:', registrationConfig ? `Yes - ${registrationConfig.steps?.length || 0} steps` : 'No');
      console.log('[REGISTRATION] Full config:', JSON.stringify(registrationConfig, null, 2));

      if (registrationConfig) {
        let createdConfigId: string | null = null;
        const createdStepIds: string[] = [];

        try {
          const configData = {
            tournamentId: tournament.id,
            requiresPayment: registrationConfig.requiresPayment,
            entryFee: registrationConfig.entryFee,
            paymentUrl: registrationConfig.paymentUrl,
            paymentInstructions: registrationConfig.paymentInstructions
          };

          const validatedConfig = insertRegistrationConfigSchema.parse(configData);
          const createdConfig = await storage.createRegistrationConfig(validatedConfig);
          createdConfigId = createdConfig.id;
          console.log('[REGISTRATION] Config created with ID:', createdConfigId);

          console.log('[REGISTRATION] Processing', registrationConfig.steps?.length || 0, 'steps');
          for (const step of registrationConfig.steps) {
            console.log('[REGISTRATION] Processing step:', step.stepTitle, 'with', step.fields?.length || 0, 'fields');
            const stepData = {
              configId: createdConfig.id,
              stepNumber: step.stepNumber,
              stepTitle: step.stepTitle,
              stepDescription: step.stepDescription
            };
            const validatedStep = insertRegistrationStepSchema.parse(stepData);
            const createdStep = await storage.createRegistrationStep(validatedStep);
            createdStepIds.push(createdStep.id);
            console.log('[REGISTRATION] Step created:', createdStep.id);

            for (const field of step.fields) {
              console.log('[REGISTRATION] Creating field:', field.fieldLabel);
              const fieldData = {
                stepId: createdStep.id,
                fieldType: field.fieldType,
                fieldLabel: field.fieldLabel,
                fieldPlaceholder: field.fieldPlaceholder,
                isRequired: field.isRequired,
                dropdownOptions: field.dropdownOptions,
                displayOrder: field.displayOrder
              };
              const validatedField = insertRegistrationFieldSchema.parse(fieldData);
              await storage.createRegistrationField(validatedField);
              console.log('[REGISTRATION] Field created:', field.fieldLabel);
            }
          }
          console.log('[REGISTRATION] All fields saved successfully');
        } catch (regError: any) {
          console.log('[REGISTRATION] ERROR:', regError.message);
          if (createdConfigId) {
            await storage.deleteRegistrationConfig(createdConfigId);
          }
          throw new Error(`Failed to create registration config: ${regError.message}`);
        }
      }

      cache.delete(CACHE_KEYS.TOURNAMENTS_PUBLIC);
      res.status(201).json(tournament);
    } catch (error: any) {
      console.error('[DEBUG] Tournament creation error:', error);
      if (error.errors) {
        console.error('[DEBUG] Zod validation errors:', JSON.stringify(error.errors, null, 2));
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tournaments/:id/registration/config", async (req, res) => {
    try {
      const tournamentId = req.params.id;
      console.log('[REGISTRATION-GET] Querying config for tournament:', tournamentId);

      const config = await storage.getRegistrationConfigByTournament(tournamentId);
      console.log('[REGISTRATION-GET] Config found:', config ? `Yes - ID: ${config.id}` : 'No');

      // If no config exists, return null - do NOT auto-create defaults
      if (!config) {
        console.log('[REGISTRATION-GET] Returning null - no config for this tournament');
        return res.json(null);
      }

      console.log('[REGISTRATION-GET] Fetching steps for config:', config.id);
      const steps = await storage.getStepsByConfig(config.id);
      console.log('[REGISTRATION-GET] Steps found:', steps.length);

      const stepsWithFields = await Promise.all(
        steps.map(async (step) => {
          const fields = await storage.getFieldsByStep(step.id);
          console.log('[REGISTRATION-GET] Step', step.id, 'has', fields.length, 'fields');
          return {
            ...step,
            fields: fields.sort((a, b) => a.displayOrder - b.displayOrder)
          };
        })
      );

      res.json({
        ...config,
        steps: stepsWithFields.sort((a, b) => a.stepNumber - b.stepNumber)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/tournaments/:id/registration/config", async (req, res) => {
    try {
      const { id } = req.params;
      const registrationConfig = req.body;

      let config = await storage.getRegistrationConfigByTournament(id);

      if (!config) {
        const configData = {
          tournamentId: id,
          requiresPayment: registrationConfig.requiresPayment,
          entryFee: registrationConfig.entryFee,
          paymentUrl: registrationConfig.paymentUrl,
          paymentInstructions: registrationConfig.paymentInstructions
        };
        const validatedConfig = insertRegistrationConfigSchema.parse(configData);
        config = await storage.createRegistrationConfig(validatedConfig);
      } else {
        await storage.updateRegistrationConfig(config.id, {
          requiresPayment: registrationConfig.requiresPayment,
          entryFee: registrationConfig.entryFee,
          paymentUrl: registrationConfig.paymentUrl,
          paymentInstructions: registrationConfig.paymentInstructions
        });
      }

      // Delete all existing steps and their fields for this config
      const existingSteps = await storage.getStepsByConfig(config.id);
      for (const step of existingSteps) {
        const fields = await storage.getFieldsByStep(step.id);
        for (const field of fields) {
          await storage.deleteRegistrationField(field.id);
        }
        await storage.deleteRegistrationStep(step.id);
      }

      // Create all new steps from the organizer's config
      for (const step of registrationConfig.steps) {
        const stepData = {
          configId: config.id,
          stepNumber: step.stepNumber,
          stepTitle: step.stepTitle,
          stepDescription: step.stepDescription
        };
        const validatedStep = insertRegistrationStepSchema.parse(stepData);
        const createdStep = await storage.createRegistrationStep(validatedStep);

        // Create all fields for this step
        for (const field of step.fields) {
          const fieldData = {
            stepId: createdStep.id,
            fieldType: field.fieldType,
            fieldLabel: field.fieldLabel,
            fieldPlaceholder: field.fieldPlaceholder,
            isRequired: field.isRequired,
            dropdownOptions: field.dropdownOptions,
            displayOrder: field.displayOrder
          };
          const validatedField = insertRegistrationFieldSchema.parse(fieldData);
          await storage.createRegistrationField(validatedField);
        }
      }

      const steps = await storage.getStepsByConfig(config.id);
      const stepsWithFields = await Promise.all(
        steps.map(async (step) => {
          const fields = await storage.getFieldsByStep(step.id);
          return {
            ...step,
            fields: fields.sort((a, b) => a.displayOrder - b.displayOrder)
          };
        })
      );

      res.json({
        ...config,
        steps: stepsWithFields.sort((a, b) => a.stepNumber - b.stepNumber)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Team routes
  app.get("/api/tournaments/:tournamentId/teams", async (req, res) => {
    try {
      const teams = await storage.getTeamsByTournament(req.params.tournamentId);

      // Enrich teams with member user info
      const enrichedTeams = await Promise.all(
        teams.map(async (team) => {
          const members = await storage.getMembersByTeam(team.id);
          const membersWithUserInfo = await Promise.all(
            members.map(async (member) => {
              const user = await storage.getUser(member.userId);
              return {
                ...member,
                username: user?.username || "Unknown",
                displayName: user?.displayName || user?.username || "Unknown",
                avatarUrl: user?.avatarUrl || null,
              };
            })
          );
          return {
            ...team,
            members: membersWithUserInfo,
          };
        })
      );

      res.json(enrichedTeams);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      const updatedTeam = await storage.updateTeam(req.params.id, req.body);
      res.json(updatedTeam);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Match routes
  app.get("/api/tournaments/:tournamentId/matches", async (req, res) => {
    try {
      const matches = await storage.getMatchesByTournament(req.params.tournamentId);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Fetch team records - they have the authoritative team names
      const team1 = match.team1Id ? await storage.getTeam(match.team1Id) : null;
      const team2 = match.team2Id ? await storage.getTeam(match.team2Id) : null;

      res.json({
        ...match,
        team1Name: team1?.name || "Team 1",
        team2Name: team2?.name || "Team 2",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/matches/:id", async (req, res) => {
    try {
      const currentMatch = await storage.getMatch(req.params.id);
      if (!currentMatch) {
        return res.status(404).json({ error: "Match not found" });
      }

      if (req.body.winnerId) {
        const validTeams = [currentMatch.team1Id, currentMatch.team2Id].filter(Boolean);
        if (!validTeams.includes(req.body.winnerId)) {
          return res.status(400).json({ error: "Winner must be one of the match participants" });
        }
      }

      const wasAlreadyCompleted = currentMatch.status === "completed";

      const match = await storage.updateMatch(req.params.id, req.body);
      if (!match) {
        return res.status(404).json({ error: "Match not found after update" });
      }

      if (!wasAlreadyCompleted && req.body.winnerId && req.body.team1Score !== undefined && req.body.team2Score !== undefined) {
        const teams = [match.team1Id, match.team2Id].filter(Boolean) as string[];
        const loserId = teams.find((id) => id !== req.body.winnerId);

        if (req.body.winnerId) {
          const winnerTeam = await storage.getTeam(req.body.winnerId);
          if (winnerTeam) {
            await storage.updateTeam(req.body.winnerId, {
              wins: (winnerTeam.wins ?? 0) + 1,
              points: (winnerTeam.points ?? 0) + 3,
            });
          }
        }

        if (loserId) {
          const loserTeam = await storage.getTeam(loserId);
          if (loserTeam) {
            await storage.updateTeam(loserId, {
              losses: (loserTeam.losses ?? 0) + 1,
            });
          }
        }

        const tournament = await storage.getTournament(match.tournamentId);

        if (tournament && tournament.format === "single_elimination" && req.body.winnerId) {
          const allMatches = await storage.getMatchesByTournament(tournament.id);
          const currentRoundMatches = allMatches.filter((m) => m.round === match.round);
          const matchIndex = currentRoundMatches.findIndex((m) => m.id === match.id);

          if (matchIndex !== -1) {
            const nextRoundMatchIndex = Math.floor(matchIndex / 2);
            const nextRoundMatches = allMatches.filter((m) => m.round === match.round + 1);
            const nextMatch = nextRoundMatches[nextRoundMatchIndex];

            if (nextMatch) {
              const isFirstSlot = matchIndex % 2 === 0;
              await storage.updateMatch(nextMatch.id, {
                [isFirstSlot ? "team1Id" : "team2Id"]: req.body.winnerId,
              });
            }
          }
        }

        if (tournament && tournament.format === "swiss") {
          const allMatches = await storage.getMatchesByTournament(tournament.id);
          const currentRoundMatches = allMatches.filter((m) => m.round === tournament.currentRound);
          const allCompleted = currentRoundMatches.every((m) => m.status === "completed");

          const currentRound = tournament.currentRound ?? 1;
          if (allCompleted && currentRound < (tournament.swissRounds ?? 5)) {
            const teams = await storage.getTeamsByTournament(tournament.id);
            const nextRound = currentRound + 1;
            const newMatches = generateSwissSystemRound(tournament.id, teams, nextRound, allMatches).matches;

            const createdMatches = await Promise.all(newMatches.map((m) => storage.createMatch(m)));
            // PERMANENT: Create match threads for all team members immediately
            for (const createdMatch of createdMatches) {
              await createMatchThreadsForAllMembers(createdMatch.id, createdMatch.team1Id, createdMatch.team2Id);
            }
            await storage.updateTournament(tournament.id, { currentRound: nextRound });
          }
        }
      }

      res.json(match);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/matches/:id", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      await storage.deleteMatch(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Select winner endpoint (marks match complete and removes loser)
  app.post("/api/matches/:matchId/winner", async (req, res) => {
    try {
      const { winnerId } = req.body;
      const match = await storage.getMatch(req.params.matchId);

      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      if (!winnerId) {
        return res.status(400).json({ error: "Winner ID is required" });
      }

      const validTeams = [match.team1Id, match.team2Id].filter(Boolean);
      if (!validTeams.includes(winnerId)) {
        return res.status(400).json({ error: "Winner must be one of the match participants" });
      }

      // Update match with winner and complete status
      const updatedMatch = await storage.updateMatch(req.params.matchId, {
        winnerId,
        status: "completed",
      });

      // Update winner stats
      const winnerTeam = await storage.getTeam(winnerId);
      if (winnerTeam) {
        await storage.updateTeam(winnerId, {
          wins: (winnerTeam.wins ?? 0) + 1,
          points: (winnerTeam.points ?? 0) + 3,
        });
      }

      // Record loss for loser
      const loserId = validTeams.find((id) => id !== winnerId);
      if (loserId) {
        const loserTeam = await storage.getTeam(loserId);
        if (loserTeam) {
          await storage.updateTeam(loserId, {
            losses: (loserTeam.losses ?? 0) + 1,
          });
        }
      }

      res.json(updatedMatch);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Archive/close message thread endpoint
  app.delete("/api/message-threads/:threadId", async (req, res) => {
    try {
      const thread = await storage.getMessageThread(req.params.threadId);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      // Delete all messages in the thread
      const messages = await storage.getThreadMessages(req.params.threadId);
      await Promise.all(messages.map((msg) => storage.deleteThreadMessage(msg.id)));

      // Mark thread as deleted by updating it (soft delete)
      await storage.updateMessageThread(req.params.threadId, {
        lastMessage: "[Thread archived]"
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create custom match endpoint
  app.post("/api/tournaments/:tournamentId/matches/custom", async (req, res) => {
    try {
      const { team1Id, team2Id } = req.body;
      console.log("[MATCH-CREATION] Endpoint called with team1Id:", team1Id, "team2Id:", team2Id);
      const tournament = await storage.getTournament(req.params.tournamentId);

      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      const team1 = await storage.getTeam(team1Id);
      const team2 = await storage.getTeam(team2Id);

      if (!team1 || !team2) {
        return res.status(404).json({ error: "One or both teams not found" });
      }

      if (team1.isRemoved || team2.isRemoved) {
        return res.status(400).json({ error: "Cannot create match with eliminated teams" });
      }

      // Get usernames from team members instead of team names
      const team1Members = await storage.getTeamMembers(team1Id);
      const team2Members = await storage.getTeamMembers(team2Id);
      let team1Username = team1.name;
      let team2Username = team2.name;

      if (team1Members.length > 0 && team1Members[0].userId) {
        const user1 = await storage.getUser(team1Members[0].userId);
        if (user1) team1Username = `@${user1.username}`;
      }
      if (team2Members.length > 0 && team2Members[0].userId) {
        const user2 = await storage.getUser(team2Members[0].userId);
        if (user2) team2Username = `@${user2.username}`;
      }

      const allMatches = await storage.getMatchesByTournament(tournament.id);
      console.log("[MATCH-CREATION] Total existing matches in tournament:", allMatches.length);

      // Check if a match already exists between these two teams
      const existingMatch = allMatches.find(m =>
        (m.team1Id === team1Id && m.team2Id === team2Id) ||
        (m.team1Id === team2Id && m.team2Id === team1Id)
      );
      console.log("[MATCH-CREATION] Existing match found:", !!existingMatch);

      let matchToReturn;
      const matchMessage = `Match: ${team1Username} vs ${team2Username}`;
      const threadMessage = `Match updated in ${tournament.name}. Chat with your opponent here!`;

      if (existingMatch) {
        // Update existing match and its message thread
        matchToReturn = existingMatch;

        // PERMANENT: Ensure match threads exist for all team members (in case they're missing)
        await createMatchThreadsForAllMembers(existingMatch.id, team1Id, team2Id);

        // Find and update the message thread for this match
        const allThreads = await storage.getAllMessageThreads();
        const matchThread = allThreads.find(t => t.matchId === existingMatch.id);

        if (matchThread) {
          await storage.updateMessageThread(matchThread.id, {
            lastMessage: threadMessage,
            lastMessageTime: new Date(),
            unreadCount: (matchThread.unreadCount || 0) + 1,
          });
        }
      } else {
        // Create new match and message thread
        const maxRound = Math.max(...allMatches.map(m => m.round || 1), 0);

        matchToReturn = await storage.createMatch({
          tournamentId: tournament.id,
          team1Id,
          team2Id,
          round: maxRound + 1,
          status: "pending",
        });

        console.log("[MATCH-CREATION] New match created:", matchToReturn.id);

        // PERMANENT: Create match threads for all team members immediately
        await createMatchThreadsForAllMembers(matchToReturn.id, team1Id, team2Id);
      }

      res.status(201).json(matchToReturn);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Match details endpoint (for 1v1 tournament match screen)
  app.get("/api/tournaments/:tournamentId/matches/:matchId/details", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      const tournament = await storage.getTournament(req.params.tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      const team1 = match.team1Id ? await storage.getTeam(match.team1Id) : null;
      const team2 = match.team2Id ? await storage.getTeam(match.team2Id) : null;

      res.json({
        match,
        tournament,
        team1,
        team2,
        team1Players: [],
        team2Players: [],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat routes for message inbox match participants (OLD SYSTEM - KEEP FOR MESSAGE INBOX COMPATIBILITY)
  app.get("/api/matches/:matchId/messages", async (req, res) => {
    try {
      const matchId = req.params.matchId;
      console.log(`[DASHBOARD-MATCH-CHAT-GET] Fetching messages for match: ${matchId}`);
      const messages = await storage.getChatMessagesByMatch(matchId);
      console.log(`[DASHBOARD-MATCH-CHAT-GET] Found ${messages.length} raw messages`);

      // Enrich messages with sender username, avatar, and displayName from users table
      const enrichedMessages = await Promise.all(
        messages.map(async (msg: any) => {
          let username = "Unknown";
          let avatarUrl: string | undefined;
          let displayName: string | undefined;

          console.log(`[DASHBOARD-MATCH-CHAT-ENRICH] Processing message ${msg.id}, userId: ${msg.userId}`);

          if (msg.userId) {
            try {
              const sender = await storage.getUser(msg.userId);
              if (sender) {
                username = sender.username || "Unknown";
                avatarUrl = sender.avatarUrl ?? undefined;
                displayName = sender.displayName?.trim() || sender.username || "Unknown";
                console.log(`[DASHBOARD-MATCH-CHAT-ENRICH] Message ${msg.id}: username=${username}, displayName=${displayName}, avatarUrl=${avatarUrl}`);
              } else {
                console.log(`[DASHBOARD-MATCH-CHAT-ENRICH] Message ${msg.id}: sender not found`);
              }
            } catch (e) {
              console.error("[DASHBOARD-MATCH-CHAT-ENRICH] Failed to get user:", msg.userId, e);
            }
          } else {
            console.log(`[DASHBOARD-MATCH-CHAT-ENRICH] Message ${msg.id}: no userId`);
          }

          const enriched: any = {
            id: msg.id,
            matchId: msg.matchId,
            teamId: msg.teamId || null,
            userId: msg.userId || null,
            message: msg.message || null,
            imageUrl: msg.imageUrl || null,
            isSystem: msg.isSystem,
            createdAt: msg.createdAt,
            replyToId: msg.replyToId || null,
            username,
            displayName,
          };

          // Only include avatarUrl if it's actually defined
          if (avatarUrl) {
            enriched.avatarUrl = avatarUrl;
          }

          console.log(`[DASHBOARD-MATCH-CHAT-ENRICH] Final enriched message:`, JSON.stringify(enriched));
          return enriched;
        })
      );

      res.removeHeader("ETag");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, private, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("X-Timestamp", Date.now().toString());
      console.log(`[DASHBOARD-MATCH-CHAT-GET] Returning ${enrichedMessages.length} enriched messages`);
      res.json(enrichedMessages);
    } catch (error: any) {
      console.error("[DASHBOARD-MATCH-CHAT-GET] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/matches/:matchId/messages", async (req, res) => {
    try {
      const matchId = req.params.matchId;
      console.log(`[DASHBOARD-MATCH-CHAT-POST] Received message for match: ${matchId}`, JSON.stringify(req.body));

      // PERMANENT: Validate userId is provided to prevent send failures
      if (!req.body.userId) {
        console.error(`[DASHBOARD-MATCH-CHAT-POST] Missing userId in request body`);
        return res.status(400).json({ error: "userId is required to send a message" });
      }

      // PERMANENT: Validate message content exists
      if (!req.body.message?.trim() && !req.body.imageUrl) {
        console.error(`[DASHBOARD-MATCH-CHAT-POST] Empty message content`);
        return res.status(400).json({ error: "Message content or image is required" });
      }

      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        matchId: matchId,
      });
      console.log(`[DASHBOARD-MATCH-CHAT-POST] Validated data:`, JSON.stringify(validatedData));

      const message = await storage.createChatMessage(validatedData);
      console.log(`[DASHBOARD-MATCH-CHAT-POST] Created message:`, JSON.stringify(message));

      // Get sender info for enriching
      let senderUsername = "Unknown";
      let senderDisplayName = "Unknown";
      let senderAvatarUrl: string | undefined;

      if (message.userId) {
        const sender = await storage.getUser(message.userId);
        if (sender) {
          senderUsername = sender.username || "Unknown";
          senderDisplayName = sender.displayName?.trim() || sender.username || "Unknown";
          senderAvatarUrl = sender.avatarUrl ?? undefined;
        }
      }

      // SYNC TO INBOX: Get match to find both teams and sync to message_threads
      try {
        const match = await storage.getMatch(matchId);
        if (match && match.team1Id && match.team2Id) {
          console.log(`[MATCH-INBOX-SYNC] Found match with teams: ${match.team1Id}, ${match.team2Id}`);

          // Get team members for match thread title (same format as tournament dashboard)
          // Format: "Match Chat: @username1 vs @username2"
          const team1Members = await storage.getMembersByTeam(match.team1Id);
          const team2Members = await storage.getMembersByTeam(match.team2Id);

          // Get first member's username from each team (with @ prefix)
          let team1Display = "TBD";
          let team2Display = "TBD";

          if (team1Members.length > 0) {
            const member1 = await storage.getUser(team1Members[0].userId);
            team1Display = member1?.username ? `@${member1.username}` : "TBD";
          }
          if (team2Members.length > 0) {
            const member2 = await storage.getUser(team2Members[0].userId);
            team2Display = member2?.username ? `@${member2.username}` : "TBD";
          }

          const matchName = `Match Chat: ${team1Display} vs ${team2Display}`;

          // Combine all members from both teams
          const allMembers = [...team1Members, ...team2Members];

          console.log(`[MATCH-INBOX-SYNC] Found ${allMembers.length} total team members`);

          // For each member, create/update their message thread and add the message
          for (const member of allMembers) {
            try {
              // Get or create thread for this user with match name (same as dashboard)
              const thread = await storage.getOrCreateMatchThread(
                matchId,
                member.userId,
                matchName,
                undefined
              );

              // Create the thread message
              await storage.createThreadMessage({
                threadId: thread.id,
                userId: message.userId || "system",
                username: senderUsername,
                message: message.message || null,
                imageUrl: message.imageUrl || null,
                replyToId: message.replyToId || null,
              });

              // Update thread's last message info
              const isOwnMessage = member.userId === message.userId;
              const currentUnread = thread.unreadCount || 0;
              await storage.updateMessageThread(thread.id, {
                lastMessage: message.message || "[Image]",
                lastMessageSenderId: message.userId,
                lastMessageTime: new Date(),
                unreadCount: isOwnMessage ? currentUnread : currentUnread + 1,
              });

              console.log(`[MATCH-INBOX-SYNC] Synced message to user ${member.userId}'s inbox`);
            } catch (memberError) {
              console.error(`[MATCH-INBOX-SYNC] Error syncing to member ${member.userId}:`, memberError);
            }
          }
        } else {
          console.log(`[MATCH-INBOX-SYNC] Match not found or missing teams for matchId: ${matchId}`);
        }
      } catch (syncError) {
        console.error("[MATCH-INBOX-SYNC] Error syncing to inbox:", syncError);
        // Don't fail the request, just log the error
      }

      // Enrich message with username, avatar, and displayName before returning
      const enrichedMessage: any = {
        id: message.id,
        matchId: message.matchId,
        teamId: message.teamId,
        userId: message.userId,
        message: message.message,
        imageUrl: message.imageUrl,
        isSystem: message.isSystem,
        createdAt: message.createdAt,
        replyToId: message.replyToId || null,
        username: senderUsername,
        displayName: senderDisplayName,
      };

      if (senderAvatarUrl) {
        enrichedMessage.avatarUrl = senderAvatarUrl;
      }

      console.log(`[DASHBOARD-MATCH-CHAT-POST] Final enriched message:`, JSON.stringify(enrichedMessage));
      res.status(201).json(enrichedMessage);
    } catch (error: any) {
      console.error("[DASHBOARD-MATCH-CHAT-POST] Error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update match chat message
  app.patch("/api/match-messages/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const updatedMessage = await storage.updateChatMessage(req.params.id, { message: req.body.message });
      res.json(updatedMessage);
    } catch (error: any) {
      console.error("Error updating match chat message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete match chat message
  app.delete("/api/match-messages/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.deleteChatMessage(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting match chat message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Registration Config routes
  app.post("/api/tournaments/:tournamentId/registration-config", async (req, res) => {
    try {
      const { steps, ...configData } = req.body;

      const config = await storage.createRegistrationConfig({
        ...configData,
        tournamentId: req.params.tournamentId,
      });

      if (steps && steps.length > 0) {
        for (const step of steps) {
          const { fields, ...stepData } = step;
          const createdStep = await storage.createRegistrationStep({
            ...stepData,
            configId: config.id,
          });

          if (fields && fields.length > 0) {
            await Promise.all(
              fields.map((field: any) =>
                storage.createRegistrationField({
                  ...field,
                  stepId: createdStep.id,
                })
              )
            );
          }
        }
      }

      res.status(201).json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tournaments/:tournamentId/registration-config", async (req, res) => {
    try {
      const config = await storage.getRegistrationConfigByTournament(req.params.tournamentId);
      if (!config) {
        return res.status(404).json({ error: "Registration config not found" });
      }

      const steps = await storage.getStepsByConfig(config.id);
      const stepsWithFields = await Promise.all(
        steps.map(async (step) => {
          const fields = await storage.getFieldsByStep(step.id);
          return { ...step, fields };
        })
      );

      res.json({ ...config, steps: stepsWithFields });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Registration submission routes
  app.post("/api/tournaments/:tournamentId/registrations", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in to register" });
      }

      const tournamentId = req.params.tournamentId;

      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      // Check if tournament is frozen (registrations blocked)
      if (tournament.isFrozen) {
        return res.status(403).json({ error: "This tournament is currently frozen. Registrations are not allowed." });
      }

      const { responses, paymentProofUrl, paymentTransactionId } = req.body;

      // Get registration config to find the team name step
      const config = await storage.getRegistrationConfigByTournament(tournamentId);

      // Team name comes from a step titled "Team Name" in the registration config
      // The form sends responses with step IDs as keys
      let teamName: string | null = null;

      if (responses && typeof responses === 'object' && config) {
        const steps = await storage.getStepsByConfig(config.id);

        // First, try to use headerFieldId from config (matches a step ID)
        if (config.headerFieldId && responses[config.headerFieldId]) {
          teamName = String(responses[config.headerFieldId]).trim();
        }

        // If no headerFieldId match, look for a step titled "Team Name"
        if (!teamName) {
          const teamNameStep = steps.find(
            s => s.stepTitle.toLowerCase() === 'team name'
          );
          if (teamNameStep && responses[teamNameStep.id]) {
            teamName = String(responses[teamNameStep.id]).trim();
          }
        }

        // Final fallback: use first step's response value
        if (!teamName && steps.length > 0) {
          const firstStep = steps.find(s => s.stepNumber === 1) || steps[0];
          if (firstStep && responses[firstStep.id]) {
            teamName = String(responses[firstStep.id]).trim();
          }
        }
      }

      if (!teamName) {
        console.error("[REGISTRATION] Team name extraction failed. Responses:", responses, "Config:", config);
        return res.status(400).json({ error: "Team name is required. Please ensure your registration form has a 'Team Name' field." });
      }

      const existingTeams = await storage.getTeamsByTournament(tournamentId);
      const existingRegistrations = await storage.getRegistrationsByTournament(tournamentId);

      // Check if this user is already registered for this tournament
      const userRegistration = existingRegistrations.find(
        r => r.userId === req.session.userId
      );

      if (userRegistration) {
        return res.status(409).json({ error: "You are already registered for this tournament" });
      }

      const pendingRegistrations = existingRegistrations.filter(
        r => r.status === "submitted"
      );

      const totalCapacityUsed = existingTeams.length + pendingRegistrations.length;
      // Only check capacity if totalTeams is positive (unlimited is -1)
      if (tournament.totalTeams > 0 && totalCapacityUsed >= tournament.totalTeams) {
        return res.status(409).json({ error: "Tournament is full" });
      }


      let paymentStatus: "pending" | "submitted" | "rejected" | "verified" = "pending";
      let registrationStatus: "draft" | "submitted" | "approved" | "rejected" = "submitted";

      if (config && config.requiresPayment) {
        if (paymentProofUrl || paymentTransactionId) {
          paymentStatus = "submitted";
        }
      } else {
        paymentStatus = "verified";
        registrationStatus = "approved";
      }

      const registration = await storage.createRegistration({
        userId: req.session.userId,
        teamName,
        tournamentId,
        status: registrationStatus,
        paymentStatus,
        paymentProofUrl: paymentProofUrl || null,
        paymentTransactionId: paymentTransactionId || null,
      });

      let parsedResponses = responses;
      if (typeof responses === 'string') {
        try {
          parsedResponses = JSON.parse(responses);
        } catch (e) {
          console.error("Failed to parse responses JSON:", e);
        }
      }

      if (parsedResponses && typeof parsedResponses === 'object') {
        await Promise.all(
          Object.entries(parsedResponses).map(([fieldId, value]) =>
            storage.createRegistrationResponse({
              registrationId: registration.id,
              fieldId,
              responseValue: String(value),
            })
          )
        );
      }

      if (registrationStatus === "approved") {
        const team = await storage.createTeam({
          name: teamName,
          tournamentId: tournament.id,
        });
        // Add registering user as team member
        await storage.createTeamMember({
          teamId: team.id,
          userId: req.session.userId,
        });

        // Auto-generate fixtures when a team registers
        try {
          const allTeams = await storage.getTeamsByTournament(tournament.id);
          const existingMatches = await storage.getMatchesByTournament(tournament.id);

          // Only generate if no matches exist yet
          if (existingMatches.length === 0 && allTeams.length > 0) {
            let matches;
            if (tournament.format === "round_robin") {
              matches = generateRoundRobinBracket(tournament.id, allTeams).matches;
            } else if (tournament.format === "single_elimination") {
              matches = generateSingleEliminationBracket(tournament.id, allTeams).matches;
            } else if (tournament.format === "swiss") {
              matches = generateSwissSystemRound(tournament.id, allTeams, 1, []).matches;
            }

            if (matches && matches.length > 0) {
              // Create all matches
              const createdMatches = await Promise.all(matches.map((match) => storage.createMatch(match)));
              // PERMANENT: Create match threads for all team members immediately
              for (const createdMatch of createdMatches) {
                await createMatchThreadsForAllMembers(createdMatch.id, createdMatch.team1Id, createdMatch.team2Id);
              }
            }
          }
        } catch (error) {
          console.error("[FIXTURES] Error auto-generating fixtures:", error);
          // Don't fail registration if fixture generation fails
        }
      }

      res.status(201).json(registration);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tournaments/:tournamentId/registrations", async (req, res) => {
    try {
      const registrations = await storage.getRegistrationsByTournament(req.params.tournamentId);

      // Join registrations with user data and responses
      const registrationsWithUsers = await Promise.all(
        registrations.map(async (reg) => {
          const user = await storage.getUser(reg.userId);
          const responsesArray = await storage.getResponsesByRegistration(reg.id);

          // Convert responses array to a map of fieldId -> responseValue
          const responses: Record<string, string> = {};
          for (const resp of responsesArray) {
            responses[resp.fieldId] = resp.responseValue;
          }

          return {
            ...reg,
            responses,
            userUsername: user?.username || user?.displayName || 'Unknown',
            userDisplayName: user?.displayName || 'Unknown',
            userAvatar: user?.avatarUrl || null,
          };
        })
      );

      res.json(registrationsWithUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/registrations/:id", async (req, res) => {
    try {
      const registration = await storage.getRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      const responses = await storage.getResponsesByRegistration(registration.id);
      const user = await storage.getUser(registration.userId);

      res.json({
        ...registration,
        responses,
        userUsername: user?.username || user?.displayName || 'Unknown',
        userDisplayName: user?.displayName || 'Unknown',
        userAvatar: user?.avatarUrl || null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/registrations/:id", async (req, res) => {
    try {
      const registration = await storage.updateRegistration(req.params.id, req.body);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      if (req.body.paymentStatus === "verified" && registration.status === "submitted") {
        const team = await storage.createTeam({
          name: registration.teamName,
          tournamentId: registration.tournamentId,
        });
        // Add registering user as team member
        await storage.createTeamMember({
          teamId: team.id,
          userId: registration.userId,
        });

        await storage.updateRegistration(registration.id, { status: "approved" });

        // Auto-generate fixtures when a team registers
        try {
          const tournament = await storage.getTournament(registration.tournamentId);
          if (tournament) {
            const allTeams = await storage.getTeamsByTournament(tournament.id);
            const existingMatches = await storage.getMatchesByTournament(tournament.id);

            // Only generate if no matches exist yet
            if (existingMatches.length === 0 && allTeams.length > 0) {
              let matches;
              if (tournament.format === "round_robin") {
                matches = generateRoundRobinBracket(tournament.id, allTeams).matches;
              } else if (tournament.format === "single_elimination") {
                matches = generateSingleEliminationBracket(tournament.id, allTeams).matches;
              } else if (tournament.format === "swiss") {
                matches = generateSwissSystemRound(tournament.id, allTeams, 1, []).matches;
              }

              if (matches && matches.length > 0) {
                // Create all matches
                const createdMatches = await Promise.all(matches.map((match) => storage.createMatch(match)));
                // PERMANENT: Create match threads for all team members immediately
                for (const createdMatch of createdMatches) {
                  await createMatchThreadsForAllMembers(createdMatch.id, createdMatch.team1Id, createdMatch.team2Id);
                }
              }
            }
          }
        } catch (error) {
          console.error("[FIXTURES] Error auto-generating fixtures:", error);
          // Don't fail registration if fixture generation fails
        }
      }

      res.json(registration);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all channels (for public discovery or user's channels)
  app.get("/api/channels", async (req, res) => {
    try {
      // If serverId is provided, get channels for that server
      const serverId = req.query.serverId as string;
      if (serverId) {
        const channels = await storage.getChannelsByServer(serverId);
        res.json(channels);
      } else {
        // Return empty array - channels require a serverId context
        res.json([]);
      }
    } catch (error: any) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all servers (for user discovery or admin)
  app.get("/api/servers", async (req, res) => {
    try {
      // Return all public servers with actual member counts
      const allServers = await storage.getAllServers();
      const serversWithMemberCount = await Promise.all(
        allServers.map(async (server) => {
          const members = await storage.getMembersByServer(server.id);
          const validMembers = members.filter(m => m.userId);
          return {
            ...server,
            memberCount: validMembers.length,
          };
        })
      );
      res.json(serversWithMemberCount);
    } catch (error: any) {
      console.error("Error fetching servers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // REST endpoint for sending channel messages (alternative to WebSocket)
  app.post("/api/channels/:channelId/messages", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { message, imageUrl, replyToId } = req.body;
      const { channelId } = req.params;

      // Get user info for username
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const validatedData = insertChannelMessageSchema.parse({
        channelId,
        userId: req.session.userId,
        username: user.username || user.displayName || 'Unknown',
        message: message?.trim() || '',
        imageUrl: imageUrl || null,
        replyToId: replyToId || null,
      });

      const savedMessage = await storage.createChannelMessage(validatedData);
      res.status(201).json(savedMessage);
    } catch (error: any) {
      console.error("Error creating channel message:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Mobile preview API routes
  app.get("/api/mobile-preview/servers", async (_req, res) => {
    try {
      const cached = cache.get<any[]>(CACHE_KEYS.SERVERS_LIST);
      if (cached) {
        return res.json(cached);
      }
      const servers = await storage.getAllServers();
      const serversWithMemberCount = await Promise.all(
        servers.map(async (server) => {
          const members = await storage.getMembersByServer(server.id);
          const validMembers = members.filter(m => m.userId);
          return {
            ...server,
            memberCount: validMembers.length,
          };
        })
      );
      cache.set(CACHE_KEYS.SERVERS_LIST, serversWithMemberCount, CACHE_TTL.MEDIUM);
      res.json(serversWithMemberCount);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mobile-preview/messages", async (_req, res) => {
    try {
      const messages = await storage.getAllMessageThreads();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mobile-preview/notifications", async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      // Filter notifications for current user if logged in
      if (req.session?.userId) {
        const userNotifications = notifications.filter(n => n.userId === req.session.userId);

        // Enrich friend request notifications with sender info
        const enrichedNotifications = await Promise.all(
          userNotifications.map(async (n) => {
            if (n.type === 'friend_request' && n.senderId) {
              const sender = await storage.getUser(n.senderId);
              return {
                ...n,
                senderName: sender?.displayName || sender?.username || 'Unknown',
                senderAvatar: sender?.avatarUrl,
              };
            }
            return n;
          })
        );

        return res.json(enrichedNotifications);
      }
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Server routes
  app.post("/api/servers", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Explicitly extract only allowed fields to prevent prototype pollution
      const allowedFields = {
        name: req.body.name,
        description: req.body.description,
        memberCount: req.body.memberCount,
        iconUrl: req.body.iconUrl,
        backgroundUrl: req.body.backgroundUrl,
        category: req.body.category,
        gameTags: req.body.gameTags,
        isPublic: req.body.isPublic,
        welcomeMessage: req.body.welcomeMessage,
      };

      const validatedData = insertServerSchema.omit({ ownerId: true }).parse(allowedFields);
      // Set ownerId from session, not from client
      const server = await storage.createServer({
        ...validatedData,
        ownerId: req.session.userId,
      });

      // Create default channels for the server - announcements first
      const defaultChannels = [
        { name: "announcements", slug: "announcements", type: "announcements", icon: "📢", serverId: server.id, position: 0 },
        { name: "tournament-dashboard", slug: "tournament-dashboard", type: "tournament_dashboard", icon: "🏆", serverId: server.id, position: 1, isPrivate: 1 },
        { name: "general", slug: "general", type: "chat", icon: "💬", serverId: server.id, position: 2 },
      ];

      for (const channelData of defaultChannels) {
        await storage.createChannel(channelData);
      }

      // Add the owner as a member of the server
      await storage.joinServer(server.id, req.session.userId);

      cache.delete(CACHE_KEYS.SERVERS_LIST);
      res.status(201).json(server);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:id", async (req, res) => {
    try {
      const server = await storage.getServer(req.params.id);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      // Get actual member count
      const members = await storage.getMembersByServer(server.id);
      const validMembers = members.filter(m => m.userId);
      res.json({
        ...server,
        memberCount: validMembers.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/servers/:serverId/join", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // Check if user is already in server
      const existingMember = await storage.getServerMember(req.params.serverId, userId);
      if (existingMember) {
        // Return success with alreadyMember flag - idempotent behavior
        return res.status(200).json({
          member: existingMember,
          alreadyMember: true,
          serverId: req.params.serverId
        });
      }

      const member = await storage.joinServer(req.params.serverId, userId);
      res.status(201).json({
        member,
        alreadyMember: false,
        serverId: req.params.serverId
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/servers", async (req, res) => {
    try {
      const servers = await storage.getServersByUser(req.params.userId);
      const serversWithMemberCount = await Promise.all(
        servers.map(async (server) => {
          const members = await storage.getMembersByServer(server.id);
          const validMembers = members.filter(m => m.userId);
          return {
            ...server,
            memberCount: validMembers.length,
          };
        })
      );
      res.json(serversWithMemberCount);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Channel routes
  app.get("/api/servers/:serverId/channels", async (req, res) => {
    try {
      const channels = await storage.getChannelsByServer(req.params.serverId);
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/servers/:serverId/channels", async (req, res) => {
    try {
      const validatedData = insertChannelSchema.parse({
        ...req.body,
        serverId: req.params.serverId,
      });
      const channel = await storage.createChannel(validatedData);
      res.status(201).json(channel);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/channels/:id", async (req, res) => {
    try {
      const channel = await storage.getChannel(req.params.id);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      res.json(channel);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Poster template routes
  app.get("/api/poster-templates", async (req, res) => {
    try {
      const templates = req.query.active === "true"
        ? await storage.getActivePosterTemplates()
        : await storage.getAllPosterTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/poster-templates/:id", async (req, res) => {
    try {
      const template = await storage.getPosterTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/poster-templates", async (req, res) => {
    try {
      const validatedData = insertPosterTemplateSchema.parse(req.body);
      const template = await storage.createPosterTemplate(validatedData);

      if (req.body.tags && Array.isArray(req.body.tags)) {
        for (const tag of req.body.tags) {
          await storage.createPosterTemplateTag({
            templateId: template.id,
            tag,
          });
        }
      }

      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/poster-templates/:id", async (req, res) => {
    try {
      const { tags, ...templateData } = req.body;

      const template = await storage.updatePosterTemplate(req.params.id, templateData);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      if (tags && Array.isArray(tags)) {
        await storage.deleteTagsByTemplate(template.id);
        for (const tag of tags) {
          await storage.createPosterTemplateTag({
            templateId: template.id,
            tag,
          });
        }
      }

      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/poster-templates/:id", async (req, res) => {
    try {
      await storage.deletePosterTemplate(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/poster-templates/:id/tags", async (req, res) => {
    try {
      const tags = await storage.getTagsByTemplate(req.params.id);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        username: z.string().optional(),
        email: z.string().email().optional(),
        displayName: z.string().optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
        language: z.enum(["en", "es", "fr", "de", "ja"]).optional(),
        isDisabled: z.coerce.number().optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      console.log('[PATCH-USER] Updating user:', req.params.id, 'with data:', JSON.stringify(validatedData));
      const user = await storage.updateUser(req.params.id, validatedData);
      console.log('[PATCH-USER] Update result:', JSON.stringify(user));
      if (!user) {
        console.log('[PATCH-USER] User not found:', req.params.id);
        return res.status(404).json({ error: "User not found" });
      }
      console.log('[PATCH-USER] Returning user:', JSON.stringify(user));
      res.json(user);
    } catch (error: any) {
      console.error('[PATCH-USER] Error:', error.message);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/users/:id/password", async (req, res) => {
    try {
      const passwordSchema = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      });
      const validatedData = passwordSchema.parse(req.body);

      const success = await storage.changeUserPassword(
        req.params.id,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      if (!success) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/users/:id/disable", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, { isDisabled: 1 });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Achievement routes
  app.post("/api/achievements", async (req, res) => {
    try {
      let data = { ...req.body };
      console.log("[ACHIEVEMENT] Received request body:", data);

      // If userId looks like a username (starts with @, contains no hyphens typical of UUID), look up the user
      if (data.userId && (data.userId.startsWith("@") || data.userId.length < 20)) {
        const username = data.userId.startsWith("@") ? data.userId.substring(1) : data.userId;
        console.log("[ACHIEVEMENT] Looking up user by username:", username);
        const allUsers = await storage.getAllUsers();
        const user = allUsers.find(u => u.username === username);
        if (user) {
          data.userId = user.id;
          console.log("[ACHIEVEMENT] Found user, setting userId to:", user.id);
        } else {
          throw new Error(`User not found: ${username}`);
        }
      }

      const validatedData = insertAchievementSchema.parse(data);
      console.log("[ACHIEVEMENT] Validated data:", validatedData);
      const achievement = await storage.createAchievement(validatedData);
      console.log("[ACHIEVEMENT] Created achievement:", achievement);

      // Create notification to deliver the achievement to the user
      const achievementTitle = validatedData.title || "New Achievement";
      const notificationData = {
        userId: validatedData.userId,
        senderId: validatedData.awardedBy || "system",
        type: "system" as const,
        title: "Achievement Unlocked!",
        message: `You've earned the achievement: ${achievementTitle}`,
        actionUrl: `/achievements/${achievement.id}`,
      };
      console.log("[ACHIEVEMENT] Creating notification:", notificationData);
      await storage.createNotification(notificationData);
      console.log("[ACHIEVEMENT] Notification created successfully");

      res.status(201).json(achievement);
    } catch (error: any) {
      console.error("[ACHIEVEMENT] Error:", error.message);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievementsByUser(req.params.userId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user roles - optionally filtered by server
  app.get("/api/users/:userId/roles", async (req, res) => {
    try {
      const serverId = req.query.serverId as string;
      if (serverId) {
        const roles = await storage.getRolesByUser(req.params.userId, serverId);
        res.json(roles);
      } else {
        // Return empty array if no serverId specified - roles are server-specific
        res.json([]);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Team profile routes
  app.post("/api/team-profiles", async (req, res) => {
    try {
      const validatedData = insertTeamProfileSchema.parse(req.body);
      const teamProfile = await storage.createTeamProfile(validatedData);
      res.status(201).json(teamProfile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/team-profiles/:id", async (req, res) => {
    try {
      const teamProfile = await storage.getTeamProfile(req.params.id);
      if (!teamProfile) {
        return res.status(404).json({ error: "Team profile not found" });
      }
      res.json(teamProfile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:ownerId/team-profiles", async (req, res) => {
    try {
      const teamProfiles = await storage.getTeamProfilesByOwner(req.params.ownerId);
      // Add actual member count for each team
      const profilesWithCounts = await Promise.all(
        teamProfiles.map(async (profile) => {
          const members = await storage.getTeamMembers(profile.id);
          return { ...profile, totalMembers: members.length };
        })
      );
      res.json(profilesWithCounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/team-profiles/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check authorization - only owner can edit
      const existingTeam = await storage.getTeamProfile(req.params.id);
      if (!existingTeam) {
        return res.status(404).json({ error: "Team profile not found" });
      }
      if (existingTeam.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Only the team owner can edit this team" });
      }

      const teamProfile = await storage.updateTeamProfile(req.params.id, req.body);
      res.json(teamProfile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/team-profiles/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check authorization - only owner can delete
      const existingTeam = await storage.getTeamProfile(req.params.id);
      if (!existingTeam) {
        return res.status(404).json({ error: "Team profile not found" });
      }
      if (existingTeam.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Only the team owner can delete this team" });
      }

      await storage.deleteTeamProfile(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Team member routes
  app.post("/api/team-profiles/:teamId/members", async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse({
        ...req.body,
        teamId: req.params.teamId,
      });
      const member = await storage.createTeamMember(validatedData);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/team-profiles/:teamId/members", async (req, res) => {
    try {
      const members = await storage.getTeamMembersWithUsers(req.params.teamId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/team-members/:memberId", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get the member to find the team
      const existingMember = await storage.getTeamMember(req.params.memberId);
      if (!existingMember) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Check authorization - only team owner can edit members
      const team = await storage.getTeamProfile(existingMember.teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      if (team.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Only the team owner can edit team members" });
      }

      const { position, role, game } = req.body;
      const member = await storage.updateTeamMember(req.params.memberId, { position, role, game });
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/team-profiles/:teamId/members/:userId", async (req, res) => {
    try {
      await storage.deleteMemberFromTeam(req.params.teamId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Server member routes
  app.post("/api/servers/:serverId/members", async (req, res) => {
    try {
      const validatedData = insertServerMemberSchema.parse({
        ...req.body,
        serverId: req.params.serverId,
      });
      const member = await storage.createServerMember(validatedData);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/members", async (req, res) => {
    try {
      const members = await storage.getMembersByServer(req.params.serverId);
      const server = await storage.getServer(req.params.serverId);
      const roles = await storage.getRolesByServer(req.params.serverId);

      // Enrich members with user information
      const enrichedMembers = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          const role = member.roleId ? roles.find(r => r.id === member.roleId) : null;
          return {
            ...member,
            username: user?.username || "Unknown",
            avatarUrl: user?.avatarUrl || null,
            isOwner: server?.ownerId === member.userId,
            roleName: role?.name || member.role || "Member",
            roleColor: role?.color || "#99AAB5",
          };
        })
      );
      res.json(enrichedMembers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/members/:userId", async (req, res) => {
    try {
      const member = await storage.getServerMemberByUserId(req.params.serverId, req.params.userId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/servers/:serverId/members/:userId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const server = await storage.getServer(req.params.serverId);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      const isOwner = server.ownerId === req.session.userId;
      const requesterPermissions = await storage.getEffectivePermissions(
        req.params.serverId,
        req.session.userId
      );
      const canManageRoles = requesterPermissions.includes("manage_roles") ||
        requesterPermissions.includes("manage_server");

      if (!isOwner && !canManageRoles) {
        return res.status(403).json({ error: "Forbidden: Only server owners or users with manage_roles permission can update member permissions" });
      }

      const updateSchema = z.object({
        roleId: z.string().optional(),
        customTitle: z.string().optional(),
        explicitPermissions: z.array(z.string()).optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      const member = await storage.updateServerMember(
        req.params.serverId,
        req.params.userId,
        validatedData
      );
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/members/:userId/permissions", async (req, res) => {
    try {
      const effectivePermissions = await storage.getEffectivePermissions(
        req.params.serverId,
        req.params.userId
      );
      res.json({ permissions: effectivePermissions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/servers/:serverId/members/:userId", async (req, res) => {
    try {
      await storage.deleteMemberFromServer(req.params.serverId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Object Storage Routes - Reference: blueprint:javascript_object_storage
  // Serve uploaded objects (with ACL check)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );

      // Check ACL policy - only serve public files
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.sendStatus(403);
      }

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Request presigned URL for Object Storage upload - Reference: blueprint:javascript_object_storage
  // This endpoint returns a presigned URL that allows direct upload to cloud storage
  app.post("/api/uploads/request-url", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();

      res.json({
        uploadURL,
        objectPath,
        metadata: {
          name: req.body.name,
          size: req.body.size,
          contentType: req.body.contentType
        }
      });
    } catch (error: any) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // File upload endpoint - saves to disk using multer with thumbnail generation
  app.post("/api/objects/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Extract just the filename without extension
      const filename = path.basename(file.filename, path.extname(file.filename));
      const filePath = path.join(uploadsDir, file.filename);

      // Generate thumbnails for images using sharp
      const isImage = file.mimetype.startsWith('image/');
      if (isImage) {
        try {
          const sharp = (await import('sharp')).default;
          const thumbnailSizes = [64, 150, 300];

          for (const size of thumbnailSizes) {
            const thumbPath = path.join(uploadsDir, `${filename}_thumb_${size}.webp`);
            await sharp(filePath)
              .resize(size, size, { fit: 'cover', position: 'center' })
              .webp({ quality: 75 })
              .toFile(thumbPath);
          }
        } catch (thumbError) {
          console.warn("Thumbnail generation failed, continuing without thumbnails:", thumbError);
        }
      }

      // Return a URL to retrieve the file
      const fileUrl = `/api/uploads/${filename}`;
      res.json({ url: fileUrl, fileUrl });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Retrieve uploaded file thumbnails
  app.get("/api/uploads/:fileId/thumbnail", (req, res) => {
    try {
      const size = parseInt(req.query.size as string) || 150;
      const validSizes = [64, 150, 300];
      const targetSize = validSizes.includes(size) ? size : 150;

      const thumbFilename = `${req.params.fileId}_thumb_${targetSize}.webp`;
      const thumbPath = path.join(uploadsDir, thumbFilename);

      if (fs.existsSync(thumbPath)) {
        res.set("Content-Type", "image/webp");
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.set("ETag", `"${req.params.fileId}-${targetSize}"`);
        return res.sendFile(thumbPath);
      }

      // Fallback to original if thumbnail doesn't exist
      const files = fs.readdirSync(uploadsDir);
      const uploadedFile = files.find(f => {
        const baseName = path.basename(f, path.extname(f));
        return baseName === req.params.fileId && !f.includes('_thumb_');
      });

      if (!uploadedFile) {
        return res.status(404).json({ error: "File not found" });
      }

      const filePath = path.join(uploadsDir, uploadedFile);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.sendFile(filePath);
    } catch (error: any) {
      console.error("Error retrieving thumbnail:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Retrieve uploaded files from disk with cache headers
  app.get("/api/uploads/:fileId", (req, res) => {
    try {
      // Search for file with any extension (exclude thumbnails)
      const files = fs.readdirSync(uploadsDir);
      const uploadedFile = files.find(f => {
        const baseName = path.basename(f, path.extname(f));
        return baseName === req.params.fileId && !f.includes('_thumb_');
      });

      if (!uploadedFile) {
        return res.status(404).json({ error: "File not found" });
      }

      const filePath = path.join(uploadsDir, uploadedFile);

      // Detect content type from file magic numbers
      let contentType = "application/octet-stream";
      const buffer = fs.readFileSync(filePath);
      if (buffer.length > 4) {
        const magic = buffer.slice(0, 4).toString("hex");
        if (magic.startsWith("ffd8ff")) contentType = "image/jpeg";
        else if (magic.startsWith("89504e47")) contentType = "image/png";
        else if (magic.startsWith("47494638")) contentType = "image/gif";
        else if (magic.startsWith("52494646") && buffer.length > 12) contentType = "image/webp";
      }

      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.set("ETag", `"${req.params.fileId}"`);
      res.sendFile(filePath);
    } catch (error: any) {
      console.error("Error retrieving file:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generic endpoint to normalize uploaded object path and set ACL policy
  app.post("/api/objects/normalize", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.body.objectPath) {
      return res.status(400).json({ error: "objectPath is required" });
    }

    // Validate that the object path starts with /objects/uploads/ 
    // to prevent users from changing ACLs on arbitrary objects
    if (!req.body.objectPath.startsWith("/objects/uploads/")) {
      return res.status(403).json({ error: "Invalid object path" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      // Set ACL policy for public access (most uploads are public)
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.objectPath,
        {
          owner: req.session.userId,
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: normalizedPath,
      });
    } catch (error: any) {
      console.error("Error normalizing uploaded object:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Normalize tournament poster path after upload and set ACL policy
  app.put("/api/tournament-posters", async (req, res) => {
    if (!req.body.posterURL) {
      return res.status(400).json({ error: "posterURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      // Set ACL policy for public access (tournament posters are public)
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.posterURL,
        {
          owner: "system",
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error: any) {
      console.error("Error setting tournament poster:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Normalize avatar path after upload and set ACL policy
  app.put("/api/avatars", async (req, res) => {
    if (!req.body.avatarURL) {
      return res.status(400).json({ error: "avatarURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.avatarURL,
        {
          owner: req.body.userId || "system",
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error: any) {
      console.error("Error setting avatar:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Channel category routes
  app.post("/api/servers/:serverId/categories", async (req, res) => {
    try {
      const validatedData = insertChannelCategorySchema.parse({
        serverId: req.params.serverId,
        name: req.body.name,
        position: req.body.position,
      });
      const category = await storage.createChannelCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/categories", async (req, res) => {
    try {
      const categories = await storage.getCategoriesByServer(req.params.serverId);
      res.status(200).json(categories);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        name: z.string().optional(),
        position: z.number().optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      const category = await storage.updateChannelCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(200).json(category);
    } catch (error: any) {
      console.error("Error updating category:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteChannelCategory(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Channel update/delete routes
  app.patch("/api/channels/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        name: z.string().optional(),
        categoryId: z.string().nullable().optional(),
        position: z.number().optional(),
        icon: z.string().optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      const channel = await storage.updateChannel(req.params.id, validatedData);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      res.status(200).json(channel);
    } catch (error: any) {
      console.error("Error updating channel:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/channels/:id", async (req, res) => {
    try {
      await storage.deleteChannel(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting channel:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Channel message routes
  app.get("/api/channels/:channelId/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await storage.getChannelMessages(req.params.channelId, limit);

      // Enrich messages with avatarUrl from users
      const enrichedMessages = await Promise.all(
        messages.map(async (msg: any) => {
          if (msg.userId) {
            const user = await storage.getUser(msg.userId);
            if (user?.avatarUrl) {
              return { ...msg, avatarUrl: user.avatarUrl };
            }
          }
          return msg;
        })
      );

      res.status(200).json(enrichedMessages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/channels/:channelId/messages/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query required" });
      }
      const messages = await storage.searchChannelMessages(req.params.channelId, query);
      res.status(200).json(messages);
    } catch (error: any) {
      console.error("Error searching messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/messages/:id", async (req, res) => {
    try {
      const updatedMessage = await storage.updateChannelMessage(req.params.id, { message: req.body.message });
      res.json(updatedMessage);
    } catch (error: any) {
      console.error("Error updating message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/messages/:id", async (req, res) => {
    try {
      await storage.deleteChannelMessage(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Message threads routes (Direct messages / Group chats)
  app.get("/api/message-threads", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const currentUserId = req.session.userId;

      // Get both direct message threads AND match threads for user's teams
      const threads = await storage.getMessageThreadsForParticipant(currentUserId);

      // Batch fetch all unique user IDs (senders, creators, participants) to avoid N+1 queries
      const allUserIds = new Set<string>();
      threads.forEach(t => {
        if (t.lastMessageSenderId) allUserIds.add(t.lastMessageSenderId);
        if (t.userId) allUserIds.add(t.userId);
        if (t.participantId) allUserIds.add(t.participantId);
      });

      const userMap = new Map<string, { displayName?: string | null; username?: string | null; avatarUrl?: string | null }>();

      if (allUserIds.size > 0) {
        const users = await Promise.all(Array.from(allUserIds).map(id => storage.getUser(id)));
        const idsArray = Array.from(allUserIds);
        users.forEach((user, idx) => {
          if (user) {
            userMap.set(idsArray[idx], {
              displayName: user.displayName,
              username: user.username,
              avatarUrl: user.avatarUrl
            });
          }
        });
      }

      // Enrich threads with correct display info based on viewer
      const enrichedThreads = threads.map(thread => {
        let lastMessageSenderName = null;
        if (thread.lastMessageSenderId) {
          const sender = userMap.get(thread.lastMessageSenderId);
          lastMessageSenderName = sender?.displayName || sender?.username || null;
        }

        // Determine the "other person" to display based on who is viewing
        // If current user is the creator (userId), show participant info
        // If current user is the participant, show creator info
        let displayName = thread.participantName;
        let displayAvatar = thread.participantAvatar;

        if (thread.userId && thread.participantId) {
          if (currentUserId === thread.participantId) {
            // Current user is the recipient, show the creator's info
            const creator = userMap.get(thread.userId);
            if (creator) {
              displayName = creator.displayName || creator.username || thread.participantName;
              displayAvatar = creator.avatarUrl || thread.participantAvatar;
            }
          }
          // If current user is the creator, participantName/Avatar is already correct
        }

        return {
          ...thread,
          lastMessageSenderName,
          participantName: displayName,
          participantAvatar: displayAvatar,
        };
      });

      res.json(enrichedThreads);
    } catch (error: any) {
      console.error("Error fetching message threads:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/message-threads", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { participantId, participantName, participantAvatar, lastMessage } = req.body;

      // Check if a thread already exists between these two users
      if (participantId) {
        const existingThread = await storage.findExistingThread(req.session.userId, participantId);
        if (existingThread) {
          // Enrich with sender name before returning
          let lastMessageSenderName = null;
          if (existingThread.lastMessageSenderId) {
            const sender = await storage.getUser(existingThread.lastMessageSenderId);
            lastMessageSenderName = sender?.displayName || sender?.username || null;
          }
          return res.status(200).json({ ...existingThread, lastMessageSenderName });
        }
      }

      const validatedData = insertMessageThreadSchema.parse({
        userId: req.session.userId,
        participantId: participantId || null,
        participantName: participantName,
        participantAvatar: participantAvatar || null,
        lastMessage: lastMessage || "",
        unreadCount: 0,
      });

      const thread = await storage.createMessageThread(validatedData);
      res.status(201).json({ ...thread, lastMessageSenderName: null });
    } catch (error: any) {
      console.error("Error creating message thread:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/message-threads/unread-count", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const count = await storage.getTotalUnreadCount(req.session.userId);
      res.json({ count });
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/message-threads/:id/mark-read", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.markThreadAsRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking thread as read:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark match thread as read by matchId
  app.post("/api/matches/:matchId/mark-read", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { matchId } = req.params;

      // Find the user's thread for this match and mark it as read
      const thread = await storage.getMatchThreadForUser(matchId, req.session.userId);
      if (thread) {
        await storage.markThreadAsRead(thread.id);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking match thread as read:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/message-threads/:id", async (req, res) => {
    try {
      const thread = await storage.getMessageThread(req.params.id);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      res.json(thread);
    } catch (error: any) {
      console.error("Error fetching message thread:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/message-threads/:id/messages", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // PERMANENT: Validate message content exists
      if (!req.body.message?.trim() && !req.body.imageUrl) {
        console.error(`[THREAD-MSG-POST] Empty message content from user ${req.session.userId}`);
        return res.status(400).json({ error: "Message content or image is required" });
      }

      const validatedData = insertThreadMessageSchema.parse({
        threadId: req.params.id,
        userId: req.session.userId,
        username: user.username,
        message: req.body.message,
        imageUrl: req.body.imageUrl || null,
        replyToId: req.body.replyToId || null,
        tournamentId: req.body.tournamentId || null,
      });

      const message = await storage.createThreadMessage(validatedData);

      // Update thread's lastMessage and lastMessageSenderId
      await storage.updateMessageThread(req.params.id, {
        lastMessage: req.body.message,
        lastMessageSenderId: req.session.userId,
        lastMessageTime: new Date(),
      });

      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating thread message:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/message-threads/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getThreadMessages(req.params.id);
      // Enrich messages with sender avatarUrl and displayName from users table
      const enrichedMessages: any[] = await Promise.all(
        messages.map(async (msg) => {
          if (msg.userId) {
            const sender = await storage.getUser(msg.userId);
            const displayName = sender?.displayName?.trim() || sender?.username || msg.username;
            return {
              ...msg,
              avatarUrl: sender?.avatarUrl || undefined,
              displayName: displayName,
              username: msg.username,
            };
          }
          return msg;
        })
      );
      console.log("[THREAD-MSG-ENRICHMENT] Enriched messages:", JSON.stringify(enrichedMessages.slice(0, 2), null, 2));
      res.json(enrichedMessages);
    } catch (error: any) {
      console.error("Error fetching thread messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update thread message
  app.patch("/api/thread-messages/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const updatedMessage = await storage.updateThreadMessage(req.params.id, { message: req.body.message });
      res.json(updatedMessage);
    } catch (error: any) {
      console.error("Error updating thread message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete thread message (legacy route)
  app.delete("/api/thread-messages/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.deleteThreadMessage(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting thread message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete thread message (new route pattern matching frontend)
  app.delete("/api/message-threads/:threadId/messages/:messageId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { threadId, messageId } = req.params;

      // Use transactional delete that also updates thread preview
      await storage.deleteThreadMessageAndSyncPreview(threadId, messageId);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting thread message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get or create message thread for a match (for tournament match chat)
  app.get("/api/matches/:matchId/thread", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { matchId } = req.params;

      // Try to find existing thread for this match using storage
      const threads = await storage.getAllMessageThreads();
      const existingThread = threads.find((t: { matchId: string | null }) => t.matchId === matchId);

      if (existingThread) {
        return res.json(existingThread);
      }

      // Create new match thread if it doesn't exist
      const newThread = await storage.createMessageThread({
        matchId: matchId,
        participantName: `Match Discussion`,
        participantAvatar: null,
        lastMessage: "Match discussion started",
        unreadCount: 0,
      });

      res.json(newThread);
    } catch (error: any) {
      console.error("Error getting/creating match thread:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/message-threads/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updateSchema = z.object({
        participantName: z.string().optional(),
        participantAvatar: z.string().optional(),
        lastMessage: z.string().optional(),
        unreadCount: z.number().optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      const thread = await storage.updateMessageThread(req.params.id, validatedData);

      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      res.json(thread);
    } catch (error: any) {
      console.error("Error updating message thread:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Server role routes
  app.post("/api/servers/:serverId/roles", async (req, res) => {
    try {
      const validatedData = insertServerRoleSchema.parse({
        serverId: req.params.serverId,
        name: req.body.name,
        color: req.body.color,
        permissions: req.body.permissions,
        position: req.body.position,
      });
      const role = await storage.createServerRole(validatedData);
      res.status(201).json(role);
    } catch (error: any) {
      console.error("Error creating role:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/roles", async (req, res) => {
    try {
      const roles = await storage.getRolesByServer(req.params.serverId);
      res.status(200).json(roles);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/roles/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        name: z.string().optional(),
        color: z.string().optional(),
        permissions: z.array(z.string()).optional(),
        position: z.number().optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      const role = await storage.updateServerRole(req.params.id, validatedData);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.status(200).json(role);
    } catch (error: any) {
      console.error("Error updating role:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      await storage.deleteServerRole(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Server ban routes
  app.post("/api/servers/:serverId/bans", async (req, res) => {
    try {
      const validatedData = insertServerBanSchema.parse({
        serverId: req.params.serverId,
        userId: req.body.userId,
        reason: req.body.reason,
        bannedBy: req.body.bannedBy,
      });
      const ban = await storage.createServerBan(validatedData);
      res.status(201).json(ban);
    } catch (error: any) {
      console.error("Error creating ban:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/bans", async (req, res) => {
    try {
      const bans = await storage.getBansByServer(req.params.serverId);
      res.status(200).json(bans);
    } catch (error: any) {
      console.error("Error fetching bans:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/servers/:serverId/bans/:userId", async (req, res) => {
    try {
      await storage.deleteBan(req.params.serverId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting ban:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Server invite routes
  app.post("/api/servers/:serverId/invites", async (req, res) => {
    try {
      const code = Math.random().toString(36).substring(2, 10);
      const validatedData = insertServerInviteSchema.parse({
        serverId: req.params.serverId,
        code,
        createdBy: req.body.createdBy,
        expiresAt: req.body.expiresAt,
        maxUses: req.body.maxUses,
      });
      const invite = await storage.createServerInvite(validatedData);
      res.status(201).json(invite);
    } catch (error: any) {
      console.error("Error creating invite:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/invites", async (req, res) => {
    try {
      const invites = await storage.getInvitesByServer(req.params.serverId);
      res.status(200).json(invites);
    } catch (error: any) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/invites/:code", async (req, res) => {
    try {
      const invite = await storage.getInviteByCode(req.params.code);
      if (!invite) {
        return res.status(404).json({ error: "Invite not found" });
      }
      res.status(200).json(invite);
    } catch (error: any) {
      console.error("Error fetching invite:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/invites/:code/use", async (req, res) => {
    try {
      const invite = await storage.getInviteByCode(req.params.code);
      if (!invite) {
        return res.status(404).json({ error: "Invite not found" });
      }

      if (invite.maxUses && (invite.currentUses || 0) >= invite.maxUses) {
        return res.status(400).json({ error: "Invite has reached maximum uses" });
      }

      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Invite has expired" });
      }

      await storage.incrementInviteUse(req.params.code);
      await storage.joinServer(invite.serverId, req.body.userId);
      res.status(200).json({ success: true, serverId: invite.serverId });
    } catch (error: any) {
      console.error("Error using invite:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/invites/:id", async (req, res) => {
    try {
      await storage.deleteInvite(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting invite:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Server update route
  app.patch("/api/servers/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        welcomeMessage: z.string().optional(),
        iconUrl: z.string().optional(),
        backgroundUrl: z.string().optional(),
        category: z.string().optional(),
        gameTags: z.array(z.string()).optional(),
        isPublic: z.number().optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      const server = await storage.updateServer(req.params.id, validatedData);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      cache.delete(CACHE_KEYS.SERVERS_LIST);
      res.status(200).json(server);
    } catch (error: any) {
      console.error("Error updating server:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // =============== ADMIN PANEL ROUTES ===============

  // Search registered users for achievement awarding (by username only)
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 1) {
        return res.json([]);
      }
      const allUsers = await storage.getAllUsers();
      // Match by username only - more reliable than display name
      const filtered = allUsers.filter(user =>
        user.username.toLowerCase().includes(query.toLowerCase())
      );
      res.json(filtered.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Note: All admin endpoints are defined in the secured admin section below with requireAdmin middleware

  // Send friend request
  app.post("/api/friend-request", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { recipientId } = req.body;
      if (!recipientId) {
        return res.status(400).json({ error: "Recipient ID required" });
      }

      if (recipientId === req.session.userId) {
        return res.status(400).json({ error: "Cannot send friend request to yourself" });
      }

      // Validate that recipientId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(recipientId)) {
        return res.status(400).json({ error: "Invalid recipient ID format" });
      }

      // Verify recipient exists
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if friend request already exists between users
      const existingRequest = await storage.getFriendRequestBetweenUsers(req.session.userId, recipientId);
      if (existingRequest) {
        return res.json({
          success: true,
          friendRequest: existingRequest,
          message: existingRequest.status === "pending" ? "Request already sent" : `Request already ${existingRequest.status}`
        });
      }

      // Create friend request record
      const friendRequest = await storage.createFriendRequest({
        senderId: req.session.userId,
        recipientId: recipientId,
        status: "pending",
      });

      // Create notification for friend request
      const sender = await storage.getUser(req.session.userId);
      const notification = await storage.createNotification({
        userId: recipientId,
        senderId: req.session.userId,
        type: "friend_request",
        title: `Friend request`,
        message: `${sender?.displayName || sender?.username || 'Someone'} sent you a friend request`,
        read: 0,
      });

      res.json({ success: true, friendRequest, notification });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get friend request status between current user and another user
  app.get("/api/friend-requests/status/:userId", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { userId } = req.params;
      console.log('[FRIEND-STATUS] Checking between current user:', req.session.userId, 'and target:', userId);
      const request = await storage.getFriendRequestBetweenUsers(req.session.userId, userId);
      console.log('[FRIEND-STATUS] Found request:', request);

      if (!request) {
        console.log('[FRIEND-STATUS] No request found, returning status: none');
        return res.json({ status: "none" });
      }

      const response = {
        status: request.status,
        isSender: request.senderId === req.session.userId,
        friendRequest: request,
      };
      console.log('[FRIEND-STATUS] Returning:', response);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending friend requests for current user
  app.get("/api/friend-requests/pending", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const requests = await storage.getPendingFriendRequests(req.session.userId);

      // Enrich with sender info
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const sender = await storage.getUser(request.senderId);
          return {
            ...request,
            senderName: sender?.displayName || sender?.username || "Unknown",
            senderAvatar: sender?.avatarUrl,
          };
        })
      );

      res.json(enrichedRequests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept friend request
  app.post("/api/friend-requests/:id/accept", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const request = await storage.updateFriendRequest(req.params.id, {
        status: "accepted",
        respondedAt: new Date(),
      });

      if (!request) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      // Delete friend request notifications from this sender
      await storage.deleteFriendRequestNotifications(req.session.userId, request.senderId);

      res.json({ success: true, friendRequest: request });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept friend request by sender ID (for notifications without friend request record)
  app.post("/api/friend-requests/accept-from/:senderId", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { senderId } = req.params;

      // Check if friend request exists
      let request = await storage.getFriendRequestBetweenUsers(req.session.userId, senderId);

      if (!request) {
        // Create the friend request record if it doesn't exist (for old notifications)
        request = await storage.createFriendRequest({
          senderId: senderId,
          recipientId: req.session.userId,
          status: "pending",
        });
      }

      // Now accept it
      const updated = await storage.updateFriendRequest(request.id, {
        status: "accepted",
        respondedAt: new Date(),
      });

      // Delete friend request notifications from this sender
      await storage.deleteFriendRequestNotifications(req.session.userId, senderId);

      res.json({ success: true, friendRequest: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Decline friend request by sender ID
  app.post("/api/friend-requests/decline-from/:senderId", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { senderId } = req.params;

      let request = await storage.getFriendRequestBetweenUsers(req.session.userId, senderId);

      if (!request) {
        request = await storage.createFriendRequest({
          senderId: senderId,
          recipientId: req.session.userId,
          status: "pending",
        });
      }

      const updated = await storage.updateFriendRequest(request.id, {
        status: "declined",
        respondedAt: new Date(),
      });

      res.json({ success: true, friendRequest: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Decline friend request
  app.post("/api/friend-requests/:id/decline", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const request = await storage.updateFriendRequest(req.params.id, {
        status: "declined",
        respondedAt: new Date(),
      });

      if (!request) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      res.json({ success: true, friendRequest: request });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all friends for current user
  app.get("/api/friends", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const currentUserId = req.session.userId;

      // Get all accepted friend requests where user is sender or recipient
      const { eq, and, or } = await import("drizzle-orm");
      const { friendRequests } = await import("../shared/schema.js");
      const { db } = await import("./db");

      const acceptedRequests = await db.select().from(friendRequests)
        .where(
          and(
            eq(friendRequests.status, "accepted"),
            or(
              eq(friendRequests.senderId, currentUserId),
              eq(friendRequests.recipientId, currentUserId)
            )
          )
        );

      // Get friend user info
      const friends = await Promise.all(
        acceptedRequests.map(async (request) => {
          const friendId = request.senderId === currentUserId ? request.recipientId : request.senderId;
          const friend = await storage.getUser(friendId);
          return friend;
        })
      );

      res.json(friends.filter(Boolean));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ADMIN PANEL ROUTES ============

  // Admin middleware - checks if user is admin
  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  };

  // Get all users (admin only)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ban user (admin only)
  app.post("/api/admin/users/:userId/ban", requireAdmin, async (req, res) => {
    try {
      const user = await storage.banUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unban user (admin only)
  app.post("/api/admin/users/:userId/unban", requireAdmin, async (req, res) => {
    try {
      const user = await storage.unbanUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Set user host permission (admin only)
  app.post("/api/admin/users/:userId/host-permission", requireAdmin, async (req, res) => {
    try {
      const { canHost } = req.body;
      const user = await storage.setUserHostPermission(req.params.userId, canHost);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Set user achievement permission (admin only)
  app.post("/api/admin/users/:userId/achievement-permission", requireAdmin, async (req, res) => {
    try {
      const { canIssue } = req.body;
      const user = await storage.setUserAchievementPermission(req.params.userId, canIssue);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all tournaments (admin only)
  app.get("/api/admin/tournaments", requireAdmin, async (req, res) => {
    try {
      const tournaments = await storage.getAllTournaments();
      res.json(tournaments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete tournament (admin only)
  app.delete("/api/admin/tournaments/:tournamentId", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTournament(req.params.tournamentId);
      cache.delete(CACHE_KEYS.TOURNAMENTS_PUBLIC);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all servers (admin only)
  app.get("/api/admin/servers", requireAdmin, async (req, res) => {
    try {
      const servers = await storage.getAllServers();
      res.json(servers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete server (admin only)
  app.delete("/api/admin/servers/:serverId", requireAdmin, async (req, res) => {
    try {
      await storage.deleteServer(req.params.serverId);
      cache.delete(CACHE_KEYS.SERVERS_LIST);
      cache.delete(CACHE_KEYS.TOURNAMENTS_PUBLIC);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle server verified status (admin only)
  app.patch("/api/admin/servers/:serverId/verify", requireAdmin, async (req, res) => {
    try {
      const { isVerified } = req.body;
      const server = await storage.updateServer(req.params.serverId, { isVerified: isVerified ? 1 : 0 });
      cache.delete(CACHE_KEYS.SERVERS_LIST);
      cache.delete(CACHE_KEYS.TOURNAMENTS_PUBLIC);
      res.json(server);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all achievements (admin only)
  app.get("/api/admin/achievements", requireAdmin, async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete achievement (admin only)
  app.delete("/api/admin/achievements/:achievementId", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAchievement(req.params.achievementId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete any message (admin only)
  app.delete("/api/admin/messages/:messageType/:messageId", requireAdmin, async (req, res) => {
    try {
      const { messageType, messageId } = req.params;
      if (!['chat', 'channel', 'thread'].includes(messageType)) {
        return res.status(400).json({ error: "Invalid message type" });
      }
      await storage.deleteAnyMessage(messageId, messageType as 'chat' | 'channel' | 'thread');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Freeze/unfreeze tournament (admin only)
  app.patch("/api/admin/tournaments/:tournamentId", requireAdmin, async (req, res) => {
    try {
      const { isFrozen } = req.body;
      const tournament = await storage.updateTournament(req.params.tournamentId, { isFrozen });
      cache.delete(CACHE_KEYS.TOURNAMENTS_PUBLIC);
      res.json(tournament);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Give achievement (admin only)
  app.post("/api/admin/achievements", requireAdmin, async (req, res) => {
    try {
      const { userId, title, description, type } = req.body;
      const achievement = await storage.createAchievement({
        userId,
        title,
        description,
        type,
        awardedBy: req.session?.userId || "admin",
      });
      res.status(201).json(achievement);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all reports (admin only)
  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resolve/dismiss report (admin only)
  app.patch("/api/admin/reports/:reportId", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const report = await storage.updateReport(req.params.reportId, {
        status,
        resolvedBy: req.session?.userId,
        resolvedAt: new Date(),
      });
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get customer service messages (admin only)
  app.get("/api/admin/customer-service-messages", requireAdmin, async (req, res) => {
    try {
      const messages = await storage.getAllCustomerServiceMessages();
      res.json(messages || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Respond to customer service message (admin only)
  app.patch("/api/admin/customer-service-messages/:messageId", requireAdmin, async (req, res) => {
    try {
      const { response, status } = req.body;
      const message = await storage.updateCustomerServiceMessage(req.params.messageId, {
        response,
        status,
        respondedBy: req.session?.userId,
        respondedAt: new Date(),
      });
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all organizers (admin only)
  app.get("/api/admin/organizers", requireAdmin, async (req, res) => {
    try {
      const organizers = await storage.getOrganizerUsers();
      res.json(organizers || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Change user role (admin only)
  app.patch("/api/admin/users/:userId/role", requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!["player", "organizer", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const user = await storage.updateUser(req.params.userId, { role });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check if current user is admin
  app.get("/api/admin/check", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.json({ isAdmin: false });
      }
      const user = await storage.getUser(req.session.userId);
      res.json({ isAdmin: !!user?.isAdmin });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Make user admin (only works if no admins exist OR current user is admin)
  app.post("/api/admin/make-admin/:userId", async (req, res) => {
    try {
      // Check if any admin exists
      const allUsers = await storage.getAllUsers();
      const hasAdmin = allUsers.some(u => u.isAdmin);

      if (hasAdmin) {
        // Must be admin to make others admin
        if (!req.session?.userId) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const currentUser = await storage.getUser(req.session.userId);
        if (!currentUser?.isAdmin) {
          return res.status(403).json({ error: "Admin access required" });
        }
      }

      const user = await storage.updateUser(req.params.userId, { isAdmin: 1 });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
