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
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.js";
import { cache, CACHE_KEYS, CACHE_TTL } from "./cache.js";
import { startTrace, endTrace, log, metric, flush } from "./lib/skyview.js";

const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100000, // INCREASED for Load Testing: 5000 -> 100000
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50000, // INCREASED for Load Testing: 500 -> 50000
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
});

const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50000, // INCREASED for Load Testing: 1000 -> 50000
  message: { error: "Too many write operations, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
});
import fs from "fs";
import path from "path";

// File storage configuration - use memory for Vercel + DB Persistence
const fileStorage = multer.memoryStorage();
const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
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
  type Registration,
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
  team2Id: string | null,
  roundName?: string
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

    // Match name format: "Round Name: @username1 vs @username2" or default "Match Chat: ..."
    const prefix = roundName ? roundName : "Match Chat";
    const matchName = `${prefix}: @${team1Username} vs @${team2Username}`;

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
  // SkyView Tracing Middleware
  // Must be first to capture all requests
  const { startTrace, endTrace, log, metric, flush, logError } = await import("./lib/skyview.js");

  app.use(async (req, res, next) => {
    // Parse W3C Trace Context header for distributed tracing
    const traceparent = req.get('traceparent');
    let parentContext;

    if (traceparent) {
      const parts = traceparent.split('-');
      // Format: version-traceId-parentSpanId-traceFlags
      if (parts.length === 4 && parts[0] === '00') {
        parentContext = { traceId: parts[1], parentSpanId: parts[2] };
      }
    }

    // Get user context from session (if available)
    const userContext = req.session?.userId ? {
      userId: req.session.userId,
      username: req.session.username || req.session.userId // Fall back to userId if no username in session
    } : undefined;

    const traceId = startTrace(`${req.method} ${req.url}`, parentContext, userContext);
    const startTime = Date.now();

    // Add traceId to response headers for debugging
    res.setHeader('X-Trace-Id', traceId);

    // Capture response finish
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;

      metric('http.server.duration', duration);
      metric('http.server.requests', 1);

      if (status >= 500) {
        endTrace('ERROR');
      } else {
        endTrace('OK');
      }

      // Flush telemetry before Lambda freezes (crucial for Vercel)
      await flush();
    });

    next();
  });

  // Health check endpoint - no dependencies
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  // DEBUG ROUTES FOR SKYVIEW
  app.get("/api/debug/error", (req, res, next) => {
    startTrace("debug_error_trigger");
    log("INFO", "Triggering manual 500 error for SkyView test");
    try {
      throw new Error("Manual Test Error: 500 Internal Server Error");
    } catch (e) {
      log("ERROR", (e as Error).message);
      endTrace("ERROR");
      next(e); // Pass to error handler
    }
  });

  app.get("/api/debug/slow", async (req, res) => {
    startTrace("debug_slow_trigger");
    log("INFO", "Triggering slow response for SkyView test");
    await new Promise(resolve => setTimeout(resolve, 3000));
    log("INFO", "Slow response completed");
    endTrace("OK");
    res.json({ message: "Slow response completed in 3000ms" });
  });

  // Search users for new chat - Defined early to avoid 404s
  app.get("/api/users/search", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const query = req.query.q as string;
      if (!query) return res.json([]);
      const foundUsers = await storage.searchUsers(query);
      const currentUserId = req.session.userId!;

      // Optimized: Bulk fetch friendship status
      const foundUserIds = foundUsers.map(u => u.id).filter(id => id !== currentUserId);
      const friendRequests = await storage.getBulkFriendRequests(currentUserId, foundUserIds);

      // Create a map for quick access
      // Map key: otherUserId, Value: request status
      const friendshipMap = new Map<string, 'friend' | 'pending_sent' | 'pending_received'>();

      friendRequests.forEach(req => {
        const isSender = req.senderId === currentUserId;
        const otherId = isSender ? req.recipientId : req.senderId;

        if (req.status === 'accepted') {
          friendshipMap.set(otherId, 'friend');
        } else if (req.status === 'pending') {
          friendshipMap.set(otherId, isSender ? 'pending_sent' : 'pending_received');
        }
      });

      const enrichedUsers = foundUsers.map(u => {
        return {
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          friendshipStatus: u.id === currentUserId ? 'none' : (friendshipMap.get(u.id) || 'none')
        };
      });

      res.json(enrichedUsers);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
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
          log('ERROR', `WebSocket channel message error: ${error.message}`, { channelId, userId: userInfo?.userId });
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
          log('ERROR', `WebSocket match message error: ${error.message}`, { matchId, userId: userInfo?.userId });
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
      log('INFO', 'User registration attempt', { email: validatedData.email });

      // Check if email verification should be skipped
      const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';

      // Check if user with email already exists - always reject duplicates
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        log('WARN', 'Registration failed - email exists', { email: validatedData.email });
        endTrace('ERROR');
        await flush();
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
      req.session.username = user.username;

      // Wait for session to be saved before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      log('INFO', 'User registered successfully', { userId: user.id, email: validatedData.email });
      metric('registrations_total', 1);
      endTrace('OK');
      await flush();

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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Registration failed', { error: error.message });
      endTrace('ERROR');
      await flush();
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input data" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const startTime = Date.now();
    const timings: { [key: string]: number } = {};

    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string(),
        rememberMe: z.boolean().optional().default(false),
      });
      const validatedData = loginSchema.parse(req.body);
      log('INFO', 'Login attempt', { email: validatedData.email, rememberMe: validatedData.rememberMe });

      // Find user by email - timing DB lookup
      const dbLookupStart = Date.now();
      const user = await storage.getUserByEmail(validatedData.email);
      timings['db_lookup_ms'] = Date.now() - dbLookupStart;

      if (!user) {
        log('WARN', 'Login failed - user not found', { email: validatedData.email, timings });
        metric('login_failures_total', 1);
        metric('login_duration_ms', Date.now() - startTime);
        endTrace('ERROR');
        await flush();
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password - timing bcrypt comparison (intentionally slow for security)
      const bcrypt = await import('bcrypt');
      if (!user.passwordHash) {
        log('WARN', 'Login failed - no password hash', { email: validatedData.email, timings });
        metric('login_failures_total', 1);
        metric('login_duration_ms', Date.now() - startTime);
        endTrace('ERROR');
        await flush();
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const bcryptStart = Date.now();
      const passwordValid = await bcrypt.compare(validatedData.password, user.passwordHash);
      timings['bcrypt_compare_ms'] = Date.now() - bcryptStart;

      if (!passwordValid) {
        log('WARN', 'Login failed - invalid password', { email: validatedData.email, timings });
        metric('login_failures_total', 1);
        metric('login_duration_ms', Date.now() - startTime);
        endTrace('ERROR');
        await flush();
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if email is verified (skip if SKIP_EMAIL_VERIFICATION is true)
      const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';
      if (user.emailVerified === 0 && !skipEmailVerification) {
        log('WARN', 'Login failed - email not verified', { email: validatedData.email, timings });
        metric('login_duration_ms', Date.now() - startTime);
        endTrace('ERROR');
        await flush();
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

      // Set session duration based on rememberMe flag
      // Default: 2 hours, Remember Me: 30 days
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      req.session.cookie.maxAge = validatedData.rememberMe ? THIRTY_DAYS : TWO_HOURS;

      // Create session - timing session persistence
      const sessionStart = Date.now();
      req.session.userId = user.id;
      req.session.username = user.username;

      // Wait for session to be saved before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      timings['session_save_ms'] = Date.now() - sessionStart;
      timings['total_ms'] = Date.now() - startTime;

      log('INFO', 'Login successful', { userId: user.id, email: validatedData.email, timings });
      metric('logins_total', 1);
      metric('login_duration_ms', timings['total_ms']);
      metric('login_db_lookup_ms', timings['db_lookup_ms']);
      metric('login_bcrypt_ms', timings['bcrypt_compare_ms']);
      metric('login_session_ms', timings['session_save_ms']);
      endTrace('OK');
      await flush();

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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Login error', { error: error.message });
      metric('login_failures_total', 1);
      metric('login_duration_ms', Date.now() - startTime);
      endTrace('ERROR');
      await flush();
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Forgot password - Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const forgotSchema = z.object({
        email: z.string().email(),
      });
      const { email } = forgotSchema.parse(req.body);
      log('INFO', 'Password reset requested', { email });

      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        log('WARN', 'Password reset requested for non-existent email', { email });
        return res.json({ message: "If this email exists, you will receive a password reset link." });
      }

      // Generate reset token (64 chars)
      const resetToken = randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpiry: tokenExpiry,
      });

      // Build reset link
      const domain = req.get('host') || 'localhost:5000';
      const protocol = req.protocol === 'http' ? 'http' : 'https';
      const resetLink = `${protocol}://${domain}/reset-password?token=${resetToken}`;

      // Log the reset link (for development/testing)
      console.log(`\n🔐 PASSWORD RESET LINK for ${email}:\n${resetLink}\n`);

      // Send email
      await sendPasswordResetEmail(email, resetLink, user.displayName || user.username);

      log('INFO', 'Password reset token generated', { userId: user.id });
      res.json({ message: "If this email exists, you will receive a password reset link." });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Reset password - Set new password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const resetSchema = z.object({
        token: z.string().min(1, "Token is required"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      });
      const { token, newPassword } = resetSchema.parse(req.body);
      log('INFO', 'Password reset attempt');

      // Find user by reset token
      const user = await storage.getUserByResetToken(token);

      if (!user) {
        log('WARN', 'Password reset failed - invalid token');
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }

      // Check if token is expired
      if (user.passwordResetExpiry && new Date() > new Date(user.passwordResetExpiry)) {
        log('WARN', 'Password reset failed - expired token', { userId: user.id });
        return res.status(400).json({ error: "Reset link has expired. Please request a new one." });
      }

      // Hash new password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await storage.updateUser(user.id, {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      });

      log('INFO', 'Password reset successful', { userId: user.id });
      res.json({ message: "Password has been reset successfully. You can now log in." });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input data" });
      }
      res.status(500).json({ error: "Failed to reset password" });
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
        log('WARN', 'Auth check - not authenticated');
        endTrace('ERROR');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        log('WARN', 'Auth check - user not found', { userId: req.session.userId });
        req.session.destroy(() => { });
        endTrace('ERROR');
        return res.status(404).json({ error: "User not found" });
      }

      log('INFO', 'Auth check successful', {
        userId: user.id,
        userName: user.username,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.get('user-agent') || 'unknown'
      });
      endTrace('OK');
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        level: user.level,
        language: user.language,
        isAdmin: user.isAdmin,
        role: user.role,
      });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Auth check failed', { error: error.message });
      endTrace('ERROR');
      await flush();
      res.status(500).json({ error: error.message });
    }
  });

  // Tournament routes
  app.get("/api/tournaments", async (req, res) => {
    try {
      const cached = cache.get<any[]>(CACHE_KEYS.TOURNAMENTS_PUBLIC);
      if (cached) {
        log('INFO', 'Tournaments fetched from cache', { count: cached.length });
        endTrace('OK');
        return res.json(cached);
      }
      const tournaments = await storage.getAllTournaments();
      cache.set(CACHE_KEYS.TOURNAMENTS_PUBLIC, tournaments, 300 * 1000); // 5 minutes cache
      log('INFO', 'Tournaments fetched from DB', { count: tournaments.length });
      endTrace('OK');
      res.json(tournaments);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Failed to fetch tournaments', { error: error.message });
      endTrace('ERROR');
      await flush();
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        log('WARN', 'Tournament not found', { tournamentId: req.params.id });
        endTrace('ERROR');
        return res.status(404).json({ error: "Tournament not found" });
      }
      log('INFO', 'Tournament fetched', { tournamentId: req.params.id });
      endTrace('OK');
      res.json(tournament);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Tournament fetch failed', { tournamentId: req.params.id, error: error.message });
      endTrace('ERROR');
      await flush();
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Save tournament (bookmark)
  app.post("/api/tournaments/:id/save", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "You must be logged in to save tournaments" });
      }

      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      const saved = await storage.saveTournament(userId, req.params.id);
      res.status(201).json(saved);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Unsave tournament
  app.delete("/api/tournaments/:id/save", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "You must be logged in" });
      }

      await storage.unsaveTournament(userId, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get saved tournaments for current user
  app.get("/api/users/me/saved-tournaments", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "You must be logged in" });
      }

      const savedTournaments = await storage.getSavedTournamentsByUser(userId);

      // Fetch full tournament details for saved tournaments
      const tournamentIds = savedTournaments.map(st => st.tournamentId);
      const tournaments = await Promise.all(
        tournamentIds.map(id => storage.getTournament(id))
      );

      // Filter out any deleted tournaments and enrich with saved info
      const enrichedTournaments = tournaments
        .filter((t): t is NonNullable<typeof t> => t !== undefined)
        .map(tournament => {
          const savedInfo = savedTournaments.find(st => st.tournamentId === tournament.id);
          return {
            ...tournament,
            savedAt: savedInfo?.savedAt,
          };
        });

      res.json(enrichedTournaments);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Clear all saved tournaments for current user
  app.delete("/api/users/me/saved-tournaments", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "You must be logged in" });
      }

      await storage.clearSavedTournaments(userId);
      res.json({ success: true });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Check if tournament is saved by current user
  app.get("/api/tournaments/:id/saved", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.json({ saved: false });
      }

      const isSaved = await storage.isTournamentSavedByUser(userId, req.params.id);
      res.json({ saved: isSaved });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tournaments", async (req, res) => {
    try {
      log('INFO', 'Tournament creation attempt', { userId: req.session?.userId });
      // Check if user is authenticated
      if (!req.session?.userId) {
        log('WARN', 'Tournament creation unauthorized - not logged in');
        endTrace('ERROR');
        await flush();
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

      // IMPORTANT: Auto-set organizerId to the authenticated user
      const tournamentWithOwner = {
        ...tournamentData,
        organizerId: req.session.userId,
        organizerName: user.username,
      };

      const tournament = await storage.createTournament(tournamentWithOwner as any);

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
      log('INFO', 'Tournament created', { tournamentId: tournament.id, name: tournament.name });
      metric('tournaments_created_total', 1);
      endTrace('OK');
      await flush();
      res.status(201).json(tournament);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Tournament creation failed', { error: error.message });
      endTrace('ERROR');
      await flush();
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
      log('INFO', 'Fetching registration config', { tournamentId });

      const config = await storage.getRegistrationConfigByTournament(tournamentId);

      // If no config exists, return null - do NOT auto-create defaults
      if (!config) {
        log('INFO', 'No registration config found', { tournamentId });
        endTrace('OK');
        return res.json(null);
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

      log('INFO', 'Registration config fetched', { tournamentId, stepsCount: steps.length });
      endTrace('OK');
      res.json({
        ...config,
        steps: stepsWithFields.sort((a, b) => a.stepNumber - b.stepNumber)
      });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Registration config fetch failed', { tournamentId: req.params.id, error: error.message });
      endTrace('ERROR');
      await flush();
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(400).json({ error: error.message });
    }
  });

  // Update team stats (restricted to organizer)
  app.patch("/api/teams/:id/stats", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const tournament = await storage.getTournament(team.tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      // Check permissions
      if (tournament.organizerId !== req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (!user?.isAdmin) {
          return res.status(403).json({ error: "Not authorized to update stats" });
        }
      }

      const { wins, losses, points } = req.body;
      const updatedTeam = await storage.updateTeam(req.params.id, {
        wins: wins !== undefined ? wins : team.wins,
        losses: losses !== undefined ? losses : team.losses,
        points: points !== undefined ? points : team.points,
      });

      log('INFO', 'Team stats updated manually', {
        teamId: team.id,
        userId: req.session.userId,
        updates: { wins, losses, points }
      });

      res.json(updatedTeam);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Team Member routes
  app.patch("/api/teams/:id/members/:memberId", async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      const updatedMember = await storage.updateTeamMember(req.params.memberId, req.body);
      res.json(updatedMember);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/team-members", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const member = await storage.createTeamMember(req.body);
      res.status(201).json(member);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/team-members/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Additional permission check could be added here (e.g., check if user is team owner)
      // For now relying on frontend to only show delete button to owner, 
      // but ideally we should fetch the team and check ownerId here.

      await storage.deleteTeamMember(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Match routes
  app.get("/api/tournaments/:tournamentId/matches", async (req, res) => {
    try {
      const matches = await storage.getMatchesByTournament(req.params.tournamentId);
      res.json(matches);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/matches/:id", async (req, res) => {
    try {
      log('INFO', 'Match update attempt', { matchId: req.params.id });
      const currentMatch = await storage.getMatch(req.params.id);
      if (!currentMatch) {
        log('WARN', 'Match not found', { matchId: req.params.id });
        endTrace('ERROR');
        await flush();
        return res.status(404).json({ error: "Match not found" });
      }

      if (req.body.winnerId) {
        const validTeams = [currentMatch.team1Id, currentMatch.team2Id].filter(Boolean);
        if (!validTeams.includes(req.body.winnerId)) {
          log('WARN', 'Invalid winner ID', { matchId: req.params.id, winnerId: req.body.winnerId });
          endTrace('ERROR');
          await flush();
          return res.status(400).json({ error: "Winner must be one of the match participants" });
        }
      }

      const wasAlreadyCompleted = currentMatch.status === "completed";

      const match = await storage.updateMatch(req.params.id, req.body);
      if (!match) {
        endTrace('ERROR');
        await flush();
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
          const currentRound = match.round;
          const pendingMatches = allMatches.filter(
            (m) => m.round === currentRound && m.status !== "completed"
          );

          if (pendingMatches.length === 0) {
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

      log('INFO', 'Match updated', { matchId: req.params.id });
      metric('matches_updated_total', 1);
      endTrace('OK');
      await flush();
      res.json(match);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Match update failed', { matchId: req.params.id, error: error.message });
      endTrace('ERROR');
      await flush();
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Remove participant from match
  app.delete("/api/matches/:matchId/participants/:participantId", async (req, res) => {
    try {
      if (!req.session.userId) {
        log('WARN', 'Remove participant - not authenticated');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { matchId, participantId } = req.params;

      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Get tournament to check permissions
      const tournament = await storage.getTournament(match.tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      // Check if user is organizer or admin
      const user = await storage.getUser(req.session.userId);
      if (tournament.organizerId !== req.session.userId && !user?.isAdmin) {
        log('WARN', 'Remove participant - not authorized', {
          userId: req.session.userId,
          matchId
        });
        return res.status(403).json({ error: "Not authorized" });
      }

      // Only allow removal from pending matches
      if (match.status !== 'pending') {
        return res.status(400).json({ error: "Can only remove participants from pending matches" });
      }

      // Check which team to remove
      if (match.team1Id !== participantId && match.team2Id !== participantId) {
        return res.status(400).json({ error: "Participant not in this match" });
      }

      // Update match to remove the participant
      const updateData: any = {};
      if (match.team1Id === participantId) {
        updateData.team1Id = null;
      } else {
        updateData.team2Id = null;
      }

      await storage.updateMatch(matchId, updateData);

      log('INFO', 'Participant removed from match', {
        matchId,
        participantId,
        tournamentId: tournament.id,
        userId: req.session.userId
      });

      res.json({ success: true, message: "Participant removed from match" });

    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Remove participant failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Select winner endpoint (marks match complete and removes loser)
  app.post("/api/matches/:matchId/winner", async (req, res) => {
    try {
      const { winnerId } = req.body;
      log('INFO', 'Match winner selection', { matchId: req.params.matchId, winnerId });
      const match = await storage.getMatch(req.params.matchId);

      if (!match) {
        log('WARN', 'Match not found', { matchId: req.params.matchId });
        endTrace('ERROR');
        await flush();
        return res.status(404).json({ error: "Match not found" });
      }

      if (!winnerId) {
        log('WARN', 'Winner ID missing', { matchId: req.params.matchId });
        endTrace('ERROR');
        await flush();
        return res.status(400).json({ error: "Winner ID is required" });
      }

      const validTeams = [match.team1Id, match.team2Id].filter(Boolean);
      if (!validTeams.includes(winnerId)) {
        log('WARN', 'Invalid winner ID', { matchId: req.params.matchId, winnerId });
        endTrace('ERROR');
        await flush();
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

      log('INFO', 'Match completed', { matchId: req.params.matchId, winnerId });
      metric('matches_completed_total', 1);
      endTrace('OK');
      await flush();
      res.json(updatedMatch);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Match winner selection failed', { matchId: req.params.matchId, error: error.message });
      endTrace('ERROR');
      await flush();
      res.status(500).json({ error: error.message });
    }
  });

  // Reverse winner endpoint (clears winner and reverts stats)
  app.delete("/api/matches/:matchId/winner", async (req, res) => {
    try {
      log('INFO', 'Reversing match winner', { matchId: req.params.matchId });
      const match = await storage.getMatch(req.params.matchId);

      if (!match) {
        log('WARN', 'Match not found', { matchId: req.params.matchId });
        return res.status(404).json({ error: "Match not found" });
      }

      if (!match.winnerId) {
        log('WARN', 'Match has no winner to reverse', { matchId: req.params.matchId });
        return res.status(400).json({ error: "Match has no winner to reverse" });
      }

      const winnerId = match.winnerId;
      const validTeams = [match.team1Id, match.team2Id].filter(Boolean);
      const loserId = validTeams.find((id) => id !== winnerId);

      // Revert winner stats
      const winnerTeam = await storage.getTeam(winnerId);
      if (winnerTeam) {
        await storage.updateTeam(winnerId, {
          wins: Math.max(0, (winnerTeam.wins ?? 0) - 1),
          points: Math.max(0, (winnerTeam.points ?? 0) - 3),
        });
      }

      // Revert loser stats
      if (loserId) {
        const loserTeam = await storage.getTeam(loserId);
        if (loserTeam) {
          await storage.updateTeam(loserId, {
            losses: Math.max(0, (loserTeam.losses ?? 0) - 1),
          });
        }
      }

      // Clear winner and reset match status
      const updatedMatch = await storage.updateMatch(req.params.matchId, {
        winnerId: null,
        status: "pending",
      });

      log('INFO', 'Match winner reversed', { matchId: req.params.matchId, previousWinner: winnerId });
      res.json(updatedMatch);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Reverse match winner failed', { matchId: req.params.matchId, error: error.message });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Generate fixtures for a tournament
  app.post("/api/tournaments/:tournamentId/generate-fixtures", async (req, res) => {
    try {
      if (!req.session.userId) {
        log('WARN', 'Generate fixtures - not authenticated');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const tournament = await storage.getTournament(req.params.tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      // Check if user is organizer, admin, or server owner
      const user = await storage.getUser(req.session.userId);

      // Also check if user owns the server (for backwards compatibility when organizerId is null)
      let isServerOwner = false;
      if (tournament.serverId) {
        const server = await storage.getServer(tournament.serverId);
        isServerOwner = server?.ownerId === req.session.userId;
      }

      // Debug logging for authorization issue
      console.log('[GENERATE-FIXTURES] Auth check:', {
        sessionUserId: req.session.userId,
        tournamentOrganizerId: tournament.organizerId,
        isMatch: tournament.organizerId === req.session.userId,
        isAdmin: user?.isAdmin,
        isServerOwner
      });

      const isAuthorized =
        tournament.organizerId === req.session.userId ||
        user?.isAdmin ||
        isServerOwner;

      if (!isAuthorized) {
        log('WARN', 'Generate fixtures - not authorized', {
          userId: req.session.userId,
          tournamentId: tournament.id,
          organizerId: tournament.organizerId
        });
        return res.status(403).json({ error: "Not authorized" });
      }


      // Get teams for this tournament
      const teams = await storage.getTeamsByTournament(tournament.id);
      const activeTeams = teams.filter(t => !t.isRemoved);

      if (activeTeams.length < 2) {
        return res.status(400).json({ error: "Need at least 2 active teams to generate matches" });
      }

      const teamIds = activeTeams.map(t => t.id);


      log('INFO', 'Generating fixtures', {
        tournamentId: tournament.id,
        format: tournament.format,
        teamCount: teamIds.length,
        userId: req.session.userId
      });

      const matches: any[] = [];

      // Generate matches based on format
      if (tournament.format === 'single_elimination') {
        // Single elimination bracket
        const totalTeams = teamIds.length;
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
        const byeCount = nextPowerOf2 - totalTeams;

        // First round
        let round = 1;
        for (let i = 0; i < totalTeams - byeCount; i += 2) {
          if (i + 1 < teamIds.length) {
            matches.push({
              tournamentId: tournament.id,
              team1Id: teamIds[i],
              team2Id: teamIds[i + 1],
              round,
              status: 'pending'
            });
          }
        }

        // Teams with byes advance automatically
        if (byeCount > 0) {
          log('INFO', 'Single elimination with byes', { byeCount, totalTeams });
        }

      } else if (tournament.format === 'round_robin') {
        // Round robin - every team plays every other team
        let round = 1;
        for (let i = 0; i < teamIds.length; i++) {
          for (let j = i + 1; j < teamIds.length; j++) {
            matches.push({
              tournamentId: tournament.id,
              team1Id: teamIds[i],
              team2Id: teamIds[j],
              round,
              status: 'pending'
            });
          }
        }

      } else if (tournament.format === 'swiss') {
        // Swiss system - pair teams for first round
        const rounds = tournament.swissRounds || 3;

        // Shuffle teams for first round pairing
        const shuffled = [...teamIds].sort(() => Math.random() - 0.5);

        // Create first round matches
        for (let i = 0; i < shuffled.length - 1; i += 2) {
          matches.push({
            tournamentId: tournament.id,
            team1Id: shuffled[i],
            team2Id: shuffled[i + 1],
            round: 1,
            status: 'pending'
          });
        }

        // Note: Subsequent rounds in Swiss are generated after previous round completes
        log('INFO', 'Swiss round 1 generated', {
          totalRounds: rounds,
          firstRoundMatches: matches.length
        });
      }

      // Create all matches in database
      const createdMatches = [];
      const roundName = req.body.roundName; // Get round name from request

      for (const matchData of matches) {
        // Add roundName to match data if provided
        if (roundName) {
          matchData.roundName = roundName;
        }

        const match = await storage.createMatch(matchData);
        createdMatches.push(match);
      }

      // Create match threads for all created matches
      // This ensures organizers and participants can chat immediately
      for (const match of createdMatches) {
        await createMatchThreadsForAllMembers(match.id, match.team1Id, match.team2Id, roundName);
      }

      log('INFO', 'Fixtures generated successfully', {
        tournamentId: tournament.id,
        matchCount: createdMatches.length,
        format: tournament.format
      });

      res.status(201).json({
        message: "Fixtures generated successfully",
        matchCount: createdMatches.length,
        matches: createdMatches
      });

    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Generate fixtures failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Permanently eliminate a team
  app.patch("/api/teams/:teamId/eliminate", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify admin, tournament organizer, or server owner
      const user = await storage.getUser(req.session.userId);
      const team = await storage.getTeam(req.params.teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });

      const tournament = await storage.getTournament(team.tournamentId);
      if (!tournament) return res.status(404).json({ error: "Tournament not found" });

      // Check if user owns the server
      let isServerOwner = false;
      if (tournament.serverId) {
        const server = await storage.getServer(tournament.serverId);
        isServerOwner = server?.ownerId === req.session.userId;
      }

      const isAuthorized =
        tournament.organizerId === req.session.userId ||
        user?.isAdmin ||
        isServerOwner;

      if (!isAuthorized) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updatedTeam = await storage.updateTeam(req.params.teamId, { isRemoved: 1 });

      log('INFO', 'Team permanently eliminated', { teamId: req.params.teamId, removedBy: req.session.userId });

      res.json(updatedTeam);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
              logError(e as Error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Registration submission routes
  app.post("/api/tournaments/:tournamentId/registrations", async (req, res) => {
    let registration: Registration | undefined;
    try {
      if (!req.session.userId) {
        log('WARN', 'Registration attempt - not authenticated');
        endTrace('ERROR');
        await flush();
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

      const { responses, paymentProofUrl, paymentTransactionId, teamProfileId } = req.body;

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

      registration = await storage.createRegistration({
        userId: req.session.userId,
        teamName,
        teamProfileId,
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
          logError(e as Error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
          console.error("Failed to parse responses JSON:", e);
        }
      }

      if (registration && parsedResponses && typeof parsedResponses === 'object') {
        await Promise.all(
          Object.entries(parsedResponses).map(([fieldId, value]) =>
            storage.createRegistrationResponse({
              registrationId: registration!.id,
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

        // Auto-generation removed per Prompt 6 requirements.
        // Matches are now generated manually by organizers via "Generate Matches" button.
      }

      log('INFO', 'Registration successful', { tournamentId: req.params.tournamentId, registrationId: registration.id });
      metric('registrations_total', 1);
      endTrace('OK');
      await flush();
      res.status(201).json(registration);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Registration failed', { tournamentId: req.params.tournamentId, error: error.message });

      // Rollback: if registration was created but subsequent steps failed, delete it
      if (registration) {
        try {
          await storage.deleteRegistration(registration.id);
          log('INFO', 'Rolled back registration due to error', { registrationId: registration.id });
        } catch (rollbackError) {
          log('ERROR', 'Failed to rollback registration', { error: rollbackError });
        }
      }

      endTrace('ERROR');
      await flush();
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
          logError(error as Error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
          console.error("[FIXTURES] Error auto-generating fixtures:", error);
          // Don't fail registration if fixture generation fails
        }
      }

      res.json(registration);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error fetching channels:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all servers (for user discovery or admin)
  app.get("/api/servers", async (req, res) => {
    try {
      // Return all public servers with actual member counts
      const [allServers, memberCounts] = await Promise.all([
        storage.getAllServers(),
        storage.getServerMemberCounts()
      ]);

      const serversWithMemberCount = allServers.map((server) => {
        return {
          ...server,
          memberCount: memberCounts[server.id] || 0,
        };
      });
      res.json(serversWithMemberCount);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error creating channel message:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /api/channels/:channelId/messages/:id - Edit announcement
  app.patch("/api/channels/:channelId/messages/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        log('WARN', 'Announcement edit - not authenticated');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { message } = req.body;
      const { id, channelId } = req.params;

      // Get the existing message
      const existingMessage = await storage.getChannelMessage(id);
      if (!existingMessage) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if user is author or admin
      const user = await storage.getUser(req.session.userId);
      if (existingMessage.userId !== req.session.userId && !user?.isAdmin) {
        log('WARN', 'Announcement edit - not authorized', {
          userId: req.session.userId,
          messageId: id
        });
        return res.status(403).json({ error: "Not authorized" });
      }

      // Update the message
      const updated = await storage.updateChannelMessage(id, { message: message.trim() });

      log('INFO', 'Announcement edited', {
        messageId: id,
        channelId,
        userId: req.session.userId,
        userName: user?.username
      });

      res.json(updated);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Announcement edit failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/channels/:channelId/messages/:id - Delete announcement
  app.delete("/api/channels/:channelId/messages/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        log('WARN', 'Announcement delete - not authenticated');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id, channelId } = req.params;

      // Get the existing message
      const existingMessage = await storage.getChannelMessage(id);
      if (!existingMessage) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if user is author or admin
      const user = await storage.getUser(req.session.userId);
      if (existingMessage.userId !== req.session.userId && !user?.isAdmin) {
        log('WARN', 'Announcement delete - not authorized', {
          userId: req.session.userId,
          messageId: id
        });
        return res.status(403).json({ error: "Not authorized" });
      }

      // Delete the message
      await storage.deleteChannelMessage(id);

      log('INFO', 'Announcement deleted', {
        messageId: id,
        channelId,
        userId: req.session.userId,
        userName: user?.username
      });

      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Announcement delete failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Mobile preview API routes
  app.get("/api/mobile-preview/servers", async (req, res) => {
    try {
      const cached = cache.get<any[]>(CACHE_KEYS.SERVERS_LIST);
      if (cached) {
        return res.json(cached);
      }

      // OPTIMIZED: Fetch servers and member counts in parallel batch queries
      const [servers, memberCounts] = await Promise.all([
        storage.getAllServers(),
        storage.getServerMemberCounts()
      ]);

      const serversWithMemberCount = servers.map((server) => ({
        ...server,
        memberCount: memberCounts[server.id] || 0,
      }));

      // Increase cache TTL to 5 minutes (was 60s)
      cache.set(CACHE_KEYS.SERVERS_LIST, serversWithMemberCount, 300 * 1000);
      res.json(serversWithMemberCount);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mobile-preview/messages", async (req, res) => {
    try {
      const messages = await storage.getAllMessageThreads();
      res.json(messages);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Server routes
  app.post("/api/servers", async (req, res) => {
    try {
      if (!req.session.userId) {
        log('WARN', 'Server creation - not authenticated');
        endTrace('ERROR');
        await flush();
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
      log('INFO', 'Server created', { serverId: server.id, serverName: server.name });
      metric('servers_created_total', 1);
      endTrace('OK');
      await flush();
      res.status(201).json(server);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Server creation failed', { error: error.message });
      endTrace('ERROR');
      await flush();
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
      const memberCount = await storage.getServerMemberCount(server.id);
      res.json({
        ...server,
        memberCount,
      });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/servers/:id - Update server details
  app.patch("/api/servers/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const server = await storage.getServer(req.params.id);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // Only owner can update server
      if (server.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Only the server owner can update settings" });
      }

      const allowedUpdates = {
        name: req.body.name,
        description: req.body.description,
        isPublic: req.body.isPublic,
        welcomeMessage: req.body.welcomeMessage,
        iconUrl: req.body.iconUrl,
        backgroundUrl: req.body.backgroundUrl,
      };

      // Filter out undefined values
      const updates = Object.fromEntries(
        Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
      );

      const updatedServer = await storage.updateServer(req.params.id, updates);
      res.json(updatedServer);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/servers/:id - Delete server
  app.delete("/api/servers/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const server = await storage.getServer(req.params.id);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // Only owner can delete server
      if (server.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Only the server owner can delete the server" });
      }

      await storage.deleteServer(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/servers/:serverId/members/:userId - Kick member or Leave server
  app.delete("/api/servers/:serverId/members/:userId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { serverId, userId } = req.params;

      const server = await storage.getServer(serverId);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // Check if user is leaving themselves (allowed for anyone)
      const isLeavingSelf = userId === req.session.userId;

      if (isLeavingSelf) {
        // User is leaving the server (not kicking someone else)
        if (userId === server.ownerId) {
          return res.status(400).json({ error: "Server owner cannot leave. Transfer ownership or delete the server." });
        }
        await storage.deleteMemberFromServer(serverId, userId);
        return res.status(204).send();
      }

      // User is trying to kick someone else - only owner can do this
      if (server.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Only the server owner can kick members" });
      }

      // Cannot kick the owner
      if (userId === server.ownerId) {
        return res.status(400).json({ error: "Cannot kick the server owner" });
      }

      await storage.deleteMemberFromServer(serverId, userId);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/servers/:serverId/join", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        log('WARN', 'Server join - userId missing', { serverId: req.params.serverId });
        endTrace('ERROR');
        await flush();
        return res.status(400).json({ error: "userId is required" });
      }

      // Check if user is already in server
      const existingMember = await storage.getServerMember(req.params.serverId, userId);
      if (existingMember) {
        // Return success with alreadyMember flag - idempotent behavior
        const user = await storage.getUser(userId);
        const server = await storage.getServer(req.params.serverId);
        log('INFO', 'Server join - already member', {
          userId,
          userName: user?.username || 'unknown',
          serverId: req.params.serverId,
          serverName: server?.name || 'unknown',
          ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        });
        endTrace('OK');
        await flush();
        return res.status(200).json({
          member: existingMember,
          alreadyMember: true,
          serverId: req.params.serverId
        });
      }

      const member = await storage.joinServer(req.params.serverId, userId);
      const user = await storage.getUser(userId);
      const server = await storage.getServer(req.params.serverId);
      log('INFO', 'Server join successful', {
        userId,
        userName: user?.username || 'unknown',
        serverId: req.params.serverId,
        serverName: server?.name || 'unknown',
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.get('user-agent') || 'unknown'
      });
      metric('server_joins_total', 1);
      endTrace('OK');
      await flush();
      res.status(201).json({
        member,
        alreadyMember: false,
        serverId: req.params.serverId
      });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      log('ERROR', 'Server join failed', { serverId: req.params.serverId, error: error.message });
      endTrace('ERROR');
      await flush();
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/servers", async (req, res) => {
    try {
      const servers = await storage.getServersByUser(req.params.userId);
      const serverIds = servers.map(s => s.id);

      const memberCounts = await storage.getServerMemberCounts(serverIds);

      const serversWithMemberCount = servers.map((server) => {
        return {
          ...server,
          memberCount: memberCounts[server.id] || 0,
        };
      });
      res.json(serversWithMemberCount);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Channel routes
  app.get("/api/servers/:serverId/channels", async (req, res) => {
    try {
      const channels = await storage.getChannelsByServer(req.params.serverId);
      res.json(channels);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/servers/:serverId/channels", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const server = await storage.getServer(req.params.serverId);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      const user = await storage.getUser(req.session.userId);
      if (server.ownerId !== req.session.userId && !user?.isAdmin) {
        return res.status(403).json({ error: "Not authorized to create channels" });
      }

      const validatedData = insertChannelSchema.parse({
        ...req.body,
        serverId: req.params.serverId,
      });
      const channel = await storage.createChannel(validatedData);
      res.status(201).json(channel);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/poster-templates/:id", async (req, res) => {
    try {
      await storage.deletePosterTemplate(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/poster-templates/:id/tags", async (req, res) => {
    try {
      const tags = await storage.getTagsByTemplate(req.params.id);
      res.json(tags);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("[ACHIEVEMENT] Error:", error.message);
      res.status(400).json({ error: error.message });
    }
  });

  // Bulk Team Achievement - creates achievement for team AND distributes to all members
  app.post("/api/achievements/team", async (req, res) => {
    try {
      const { teamProfileId, title, description, iconUrl, reward, game, region, serverId, category, awardedBy } = req.body;

      if (!teamProfileId) {
        return res.status(400).json({ error: "Team Profile ID is required" });
      }

      console.log("[TEAM_ACHIEVEMENT] Awarding to team:", teamProfileId);

      // 1. Get the team profile
      const teamProfile = await storage.getTeamProfile(teamProfileId);
      if (!teamProfile) {
        return res.status(404).json({ error: "Team profile not found" });
      }

      console.log("[TEAM_ACHIEVEMENT] Found team:", teamProfile.name);

      // 2. Get all current team members (the "snapshot")
      const teamMembers = await storage.getTeamMembersWithUsers(teamProfileId);
      console.log("[TEAM_ACHIEVEMENT] Team has", teamMembers.length, "members");

      // 3. Create the primary team achievement record
      const teamAchievementData = {
        teamProfileId,
        userId: null, // Team achievement, not individual
        serverId,
        title,
        description: description || `Awarded to team ${teamProfile.name}`,
        iconUrl,
        reward,
        game,
        region,
        category,
        type: "team" as const,
        awardedBy,
        awardedViaTeam: 0, // This IS the team achievement itself
      };

      const teamAchievement = await storage.createAchievement(teamAchievementData);
      console.log("[TEAM_ACHIEVEMENT] Created team achievement:", teamAchievement.id);

      // 4. Distribute individual copies to each team member
      const memberAchievements: any[] = [];
      for (const member of teamMembers) {
        if (member.userId) {
          const memberAchievementData = {
            userId: member.userId,
            teamProfileId, // Link back to the team
            serverId,
            title,
            description: description ? `${description} (via team ${teamProfile.name})` : `Awarded via team ${teamProfile.name}`,
            iconUrl,
            reward,
            game,
            region,
            category,
            type: "team" as const,
            awardedBy,
            awardedViaTeam: 1, // This is a distributed copy
          };

          const memberAchievement = await storage.createAchievement(memberAchievementData);
          memberAchievements.push(memberAchievement);

          // Create notification for each member
          await storage.createNotification({
            userId: member.userId,
            senderId: awardedBy || "system",
            type: "system" as const,
            title: "Team Achievement Unlocked!",
            message: `Your team "${teamProfile.name}" earned: ${title}`,
            actionUrl: `/team/${teamProfileId}`,
          });

          console.log("[TEAM_ACHIEVEMENT] Distributed to member:", member.userId);
        }
      }

      res.status(201).json({
        teamAchievement,
        memberAchievements,
        distributedTo: memberAchievements.length,
        message: `Team achievement created and distributed to ${memberAchievements.length} members`,
      });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("[TEAM_ACHIEVEMENT] Error:", error.message);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievementsByUser(req.params.userId);
      res.json(achievements);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Team search endpoint - used by Award Achievement dialog
  app.get("/api/teams/search", async (req, res) => {
    try {
      const query = (req.query.q as string || '').toLowerCase().trim();

      if (query.length < 2) {
        return res.json([]);
      }

      console.log("[TEAM_SEARCH] Searching for:", query);

      // Get all users to look up owners later
      const allUsers = await storage.getAllUsers();

      // We need to get all team profiles - use getAllTeamProfiles or similar
      // Since there's no direct method, we'll fetch profiles by searching all users' teams
      const teamProfileResults: any[] = [];

      // Get teams for all users who might be owners
      for (const user of allUsers.slice(0, 100)) { // Limit to prevent too many queries
        const userTeams = await storage.getTeamProfilesByOwner(user.id);
        for (const team of userTeams) {
          if (
            team.name.toLowerCase().includes(query) ||
            (team.profileId && team.profileId.toLowerCase().includes(query))
          ) {
            // Find owner info
            const owner = allUsers.find(u => u.id === team.ownerId);
            teamProfileResults.push({
              id: team.id,
              name: team.name,
              profileId: team.profileId,
              logoUrl: team.logoUrl,
              game: team.game,
              totalMembers: team.totalMembers,
              captain: owner ? {
                userId: owner.id,
                username: owner.username,
                displayName: owner.displayName,
                avatarUrl: owner.avatarUrl,
              } : null,
            });
          }
        }

        // Stop if we have enough results
        if (teamProfileResults.length >= 10) break;
      }

      console.log("[TEAM_SEARCH] Found", teamProfileResults.length, "matches");
      res.json(teamProfileResults.slice(0, 10));
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Team profile routes
  app.post("/api/team-profiles", async (req, res) => {
    try {
      const validatedData = insertTeamProfileSchema.parse(req.body);
      const teamProfile = await storage.createTeamProfile(validatedData);

      // Automatically add owner as a team member with "Owner" role
      try {
        await storage.createTeamMember({
          teamId: teamProfile.id,
          userId: teamProfile.ownerId,
          role: "Owner",
          position: null,
        });
      } catch (memberError) {
        console.error("Failed to add owner as team member:", memberError);
        // Don't fail team creation if member addition fails - frontend will retry
      }

      res.status(201).json(teamProfile);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/team-profiles/:teamId/members", async (req, res) => {
    try {
      const members = await storage.getTeamMembersWithUsers(req.params.teamId);
      res.json(members);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/team-profiles/:teamId/members/:userId", async (req, res) => {
    try {
      await storage.deleteMemberFromTeam(req.params.teamId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/members", async (req, res) => {
    try {
      const membersWithUsers = await storage.getMembersWithUsers(req.params.serverId);
      const server = await storage.getServer(req.params.serverId);
      const roles = await storage.getRolesByServer(req.params.serverId);

      // Enrich members with role information (no more N+1 user fetching)
      const enrichedMembers = membersWithUsers.map((item) => {
        const member = item;
        const user = item.user;
        const role = member.roleId ? roles.find(r => r.id === member.roleId) : null;

        return {
          ...member,
          username: user?.username || "Unknown",
          displayName: user?.displayName || user?.username || "Unknown",
          avatarUrl: user?.avatarUrl || null,
          isOwner: server?.ownerId === member.userId,
          roleName: role?.name || member.role || "Member",
          roleColor: role?.color || "#99AAB5",
        };
      });
      res.json(enrichedMembers);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/servers/:serverId/members/:userId", async (req, res) => {
    try {
      await storage.deleteMemberFromServer(req.params.serverId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error as Error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // File upload endpoint - saves to Vercel Blob (CDN) or DB fallback
  app.post("/api/objects/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileId = randomUUID();
      const ext = path.extname(file.originalname);
      const filename = `${fileId}${ext}`;

      // Try Vercel Blob first (CDN-backed, much faster)
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const { put } = await import('@vercel/blob');

          const blob = await put(filename, file.buffer, {
            access: 'public',
            contentType: file.mimetype,
            addRandomSuffix: false, // We already have UUID in filename
          });

          console.log(`[BLOB] Uploaded ${filename} to CDN: ${blob.url}`);

          // Return CDN URL (served globally with caching)
          return res.json({
            url: blob.url,
            fileUrl: blob.url
          });
        } catch (blobError: any) {
          console.error('[BLOB] Upload failed, falling back to DB:', blobError.message);
          // Fall through to DB storage
        }
      }

      // Fallback: Store in DB (slower, no CDN)
      console.log(`[DB] Storing ${filename} in PostgreSQL (no Blob token or Blob failed)`);
      const { uploadedFiles } = await import("../shared/schema.js");
      const { db } = await import("./db.js");

      const fileData = file.buffer.toString('base64');

      await db.insert(uploadedFiles).values({
        id: filename,
        filename: file.originalname,
        mimeType: file.mimetype,
        data: fileData,
      });

      // Return a URL to retrieve the file
      const fileUrl = `/api/uploads/${filename}`;
      res.json({ url: fileUrl, fileUrl });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error uploading file:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // In-memory file cache to prevent repeated DB reads (LRU-style, max 100 items)
  const fileCache = new Map<string, { data: Buffer; mimeType: string; timestamp: number }>();
  const MAX_FILE_CACHE_SIZE = 100;
  const FILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const getCachedFile = (fileId: string) => {
    const cached = fileCache.get(fileId);
    if (cached && Date.now() - cached.timestamp < FILE_CACHE_TTL) {
      return cached;
    }
    if (cached) {
      fileCache.delete(fileId); // Expired
    }
    return null;
  };

  const setCachedFile = (fileId: string, data: Buffer, mimeType: string) => {
    // LRU eviction: remove oldest if cache is full
    if (fileCache.size >= MAX_FILE_CACHE_SIZE) {
      const oldestKey = fileCache.keys().next().value;
      if (oldestKey) fileCache.delete(oldestKey);
    }
    fileCache.set(fileId, { data, mimeType, timestamp: Date.now() });
  };

  // Retrieve uploaded file thumbnails - REDIRECT with cache headers
  app.get("/api/uploads/:fileId/thumbnail", (req, res) => {
    // Set cache headers before redirect
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.redirect(301, `/api/uploads/${req.params.fileId}`);
  });

  // Retrieve uploaded files from DB with in-memory caching
  app.get("/api/uploads/:fileId", async (req, res) => {
    try {
      // Check in-memory cache first
      const cached = getCachedFile(req.params.fileId);
      if (cached) {
        res.set("Content-Type", cached.mimeType);
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.set("ETag", `"${req.params.fileId}"`);
        res.set("X-Cache", "HIT");
        return res.send(cached.data);
      }

      const { uploadedFiles } = await import("../shared/schema.js");
      const { db } = await import("./db.js");
      const { eq } = await import("drizzle-orm");

      const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, req.params.fileId)).limit(1);

      if (!file) {
        // Fallback for thumbnails - just fail gracefully for now
        if (req.params.fileId.includes('_thumb_')) {
          return res.status(404).send('Not found');
        }
        return res.status(404).json({ error: "File not found" });
      }

      const fileBuffer = Buffer.from(file.data, 'base64');

      // Cache for future requests
      setCachedFile(req.params.fileId, fileBuffer, file.mimeType);

      res.set("Content-Type", file.mimeType);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.set("ETag", `"${file.id}"`);
      res.set("X-Cache", "MISS");
      res.send(fileBuffer);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error creating category:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/categories", async (req, res) => {
    try {
      const categories = await storage.getCategoriesByServer(req.params.serverId);
      res.status(200).json(categories);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error updating category:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteChannelCategory(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error deleting category:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Channel update/delete routes
  app.patch("/api/channels/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const channel = await storage.getChannel(req.params.id);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }

      const server = await storage.getServer(channel.serverId);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      const user = await storage.getUser(req.session.userId);
      if (server.ownerId !== req.session.userId && !user?.isAdmin) {
        return res.status(403).json({ error: "Not authorized to update channels" });
      }

      const updateSchema = z.object({
        name: z.string().optional(),
        categoryId: z.string().nullable().optional(),
        position: z.number().optional(),
        icon: z.string().optional(),
      });
      const validatedData = updateSchema.parse(req.body);

      // We already have the channel, so we can verify if it exists, but storage.updateChannel works fine.
      const updatedChannel = await storage.updateChannel(req.params.id, validatedData);
      if (!updatedChannel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      res.status(200).json(updatedChannel);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error updating channel:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/channels/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const channel = await storage.getChannel(req.params.id);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      const server = await storage.getServer(channel.serverId);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      const user = await storage.getUser(req.session.userId);
      if (server.ownerId !== req.session.userId && !user?.isAdmin) {
        return res.status(403).json({ error: "Not authorized to delete channels" });
      }
      await storage.deleteChannel(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error searching messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/messages/:id", async (req, res) => {
    try {
      const updatedMessage = await storage.updateChannelMessage(req.params.id, { message: req.body.message });
      res.json(updatedMessage);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error updating message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/messages/:id", async (req, res) => {
    try {
      await storage.deleteChannelMessage(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error creating thread message:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/message-threads/:id/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const before = req.query.before ? new Date(req.query.before as string) : undefined;

      const messages = await storage.getThreadMessages(req.params.id, limit, before);
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error creating role:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/roles", async (req, res) => {
    try {
      const roles = await storage.getRolesByServer(req.params.serverId);
      res.status(200).json(roles);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error updating role:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      await storage.deleteServerRole(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error creating ban:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/bans", async (req, res) => {
    try {
      const bans = await storage.getBansByServer(req.params.serverId);
      res.status(200).json(bans);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error fetching bans:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/servers/:serverId/bans/:userId", async (req, res) => {
    try {
      await storage.deleteBan(req.params.serverId, req.params.userId);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error creating invite:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/servers/:serverId/invites", async (req, res) => {
    try {
      const invites = await storage.getInvitesByServer(req.params.serverId);
      res.status(200).json(invites);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error using invite:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/invites/:id", async (req, res) => {
    try {
      await storage.deleteInvite(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error updating server:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // =============== ADMIN PANEL ROUTES ===============

  // Search registered users for achievement awarding (by username only)


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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get all friends for current user
  // Get all friends for current user
  app.get("/api/friends", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const currentUserId = req.session.userId;

      const { eq, and, or } = await import("drizzle-orm");
      const { friendRequests, users } = await import("../shared/schema.js");
      const { db } = await import("./db.js"); // Fixed import path with .js
      const { alias } = await import("drizzle-orm/pg-core");

      // Use an alias to join users table twice if needed, or just simple logic
      // Since Drizzle join syntax can be verbose, we can do a raw query or a verified select

      // Get all accepted friend requests
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

      // Collect IDs to fetch
      const friendIds = acceptedRequests.map(req =>
        req.senderId === currentUserId ? req.recipientId : req.senderId
      );

      if (friendIds.length === 0) {
        return res.json([]);
      }

      // Fetch all friends in ONE query instead of looping
      const { inArray } = await import("drizzle-orm");
      const friends = await db.select().from(users).where(inArray(users.id, friendIds));

      res.json(friends);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      console.error("Error fetching friends:", error);
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get all tournaments (admin only)
  app.get("/api/admin/tournaments", requireAdmin, async (req, res) => {
    try {
      const tournaments = await storage.getAllTournaments();
      res.json(tournaments);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get all servers (admin only)
  app.get("/api/admin/servers", requireAdmin, async (req, res) => {
    try {
      const servers = await storage.getAllServers();
      res.json(servers);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get all achievements (admin only)
  app.get("/api/admin/achievements", requireAdmin, async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Delete achievement (admin only)
  app.delete("/api/admin/achievements/:achievementId", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAchievement(req.params.achievementId);
      res.json({ success: true });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(400).json({ error: error.message });
    }
  });

  // Get all reports (admin only)
  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports || []);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get customer service messages (admin only)
  app.get("/api/admin/customer-service-messages", requireAdmin, async (req, res) => {
    try {
      const messages = await storage.getAllCustomerServiceMessages();
      res.json(messages || []);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get all organizers (admin only)
  app.get("/api/admin/organizers", requireAdmin, async (req, res) => {
    try {
      const organizers = await storage.getOrganizerUsers();
      res.json(organizers || []);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
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
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // --- Personal Messaging Routes ---

  // Search users for new chat


  // Get all threads for current user (with caching)
  app.get("/api/threads", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const cacheKey = `threads:user:${userId}`;

      // Check cache first
      const cached = cache.get<any[]>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const threads = await storage.getMessageThreadsForParticipant(userId);
      const groupThreads = await storage.getGroupThreadsForUser(userId);

      const allThreads = [...threads, ...groupThreads].sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      // Cache for 30 seconds (threads don't change that frequently)
      cache.set(cacheKey, allThreads, 30);

      res.json(allThreads);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Create a group thread
  app.post("/api/threads/group", requireAuth, async (req, res) => {
    try {
      const { groupName, participantIds } = req.body;
      const userId = req.session.userId!;

      if (!groupName || !groupName.trim()) {
        return res.status(400).json({ error: "Group name is required" });
      }

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
        return res.status(400).json({ error: "At least one participant is required" });
      }

      // Include the creator in the participant list
      const allParticipantIds = Array.from(new Set([userId, ...participantIds]));

      const thread = await storage.createGroupThread({
        groupName: groupName.trim(),
        createdBy: userId,
        participantIds: allParticipantIds,
      });

      // Invalidate cache for all participants
      for (const participantId of allParticipantIds) {
        cache.delete(`threads:user:${participantId}`);
      }

      res.status(201).json(thread);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Create or get existing thread with a user
  app.post("/api/threads", requireAuth, async (req, res) => {
    try {
      const { participantId } = req.body;
      const userId = req.session.userId!;

      if (!participantId) {
        return res.status(400).json({ error: "Participant ID required" });
      }

      // Check for existing thread
      const existing = await storage.findExistingThread(userId, participantId);
      if (existing) {
        return res.json(existing);
      }

      // Get participant details for the thread metadata
      const participant = await storage.getUser(participantId);
      if (!participant) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create new thread
      const thread = await storage.createMessageThread({
        userId,
        participantId,
        participantName: participant.displayName || participant.username,
        participantAvatar: participant.avatarUrl,
        lastMessage: "Started a new conversation",
        lastMessageSenderId: userId,
        unreadCount: 0
      });

      res.status(201).json(thread);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get thread details
  app.get("/api/threads/:threadId", requireAuth, async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const thread = await storage.getMessageThread(threadId);

      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      res.json(thread);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a thread
  app.delete("/api/threads/:threadId", requireAuth, async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const userId = req.session.userId!;

      const thread = await storage.getMessageThread(threadId);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      // Only allow participants to delete
      if (thread.userId !== userId && thread.participantId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this thread" });
      }

      await storage.deleteThread(threadId);
      res.sendStatus(204);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get messages for a thread
  app.get("/api/threads/:threadId/messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getThreadMessages(req.params.threadId);
      res.json(messages);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Send a message to a thread
  app.post("/api/threads/:threadId/messages", requireAuth, async (req, res) => {
    try {
      const { message, imageUrl } = req.body;
      const userId = req.session.userId!;
      const threadId = req.params.threadId;

      const user = await storage.getUser(userId);

      const newMessage = await storage.createThreadMessage({
        threadId,
        userId,
        username: user?.username || "Unknown",
        message,
        replyToId: null,
        imageUrl: imageUrl || null,
        tournamentId: null // Optional if needed
      });

      // Update thread last message
      await storage.updateMessageThread(threadId, {
        lastMessage: message,
        lastMessageSenderId: userId,
        lastMessageTime: new Date()
      });

      // Invalidate threads cache for sender
      cache.delete(`threads:user:${userId}`);

      // Also invalidate for the thread participants (get thread to find participant)
      const thread = await storage.getMessageThread(threadId);
      if (thread?.participantId && thread.participantId !== userId) {
        cache.delete(`threads:user:${thread.participantId}`);
      }
      if (thread?.userId && thread.userId !== userId) {
        cache.delete(`threads:user:${thread.userId}`);
      }

      res.status(201).json(newMessage);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Get group participants with user details
  app.get("/api/threads/:threadId/participants", requireAuth, async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const userId = req.session.userId!;

      // Check if thread exists and is a group
      const thread = await storage.getMessageThread(threadId);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      if (!thread.isGroup) {
        return res.status(400).json({ error: "This is not a group chat" });
      }

      // Get participants with their user details
      const participants = await storage.getGroupParticipantsWithDetails(threadId);

      // Also include the creator info
      const response = {
        participants,
        createdBy: thread.createdBy,
        groupName: thread.groupName,
        groupIconUrl: thread.groupIconUrl,
      };

      res.json(response);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Kick a participant from group
  app.delete("/api/threads/:threadId/participants/:userId", requireAuth, async (req, res) => {
    try {
      const { threadId, userId: targetUserId } = req.params;
      const currentUserId = req.session.userId!;

      // Check if thread exists and is a group
      const thread = await storage.getMessageThread(threadId);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      if (!thread.isGroup) {
        return res.status(400).json({ error: "This is not a group chat" });
      }

      // Check if current user is admin
      const isAdmin = await storage.isGroupAdmin(threadId, currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "Only group admins can remove members" });
      }

      // Cannot kick the creator
      if (thread.createdBy === targetUserId) {
        return res.status(403).json({ error: "Cannot remove the group creator" });
      }

      // Remove the participant
      await storage.removeGroupParticipant(threadId, targetUserId);

      // Invalidate cache for the kicked user
      cache.delete(`threads:user:${targetUserId}`);

      res.json({ success: true });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Invite users to existing group
  app.post("/api/threads/:threadId/participants", requireAuth, async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const currentUserId = req.session.userId!;
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "User IDs array is required" });
      }

      // Check if thread exists and is a group
      const thread = await storage.getMessageThread(threadId);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      if (!thread.isGroup) {
        return res.status(400).json({ error: "This is not a group chat" });
      }

      // Check if current user is admin
      const isAdmin = await storage.isGroupAdmin(threadId, currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "Only group admins can add members" });
      }

      // Add the participants
      await storage.addGroupParticipants(threadId, userIds);

      // Invalidate cache for all new participants
      for (const userId of userIds) {
        cache.delete(`threads:user:${userId}`);
      }

      res.json({ success: true, addedCount: userIds.length });
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  // Update group settings (name and/or icon)
  app.patch("/api/threads/:threadId", requireAuth, async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const currentUserId = req.session.userId!;
      const { groupName, groupIconUrl } = req.body;

      // Check if thread exists and is a group
      const thread = await storage.getMessageThread(threadId);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      if (!thread.isGroup) {
        return res.status(400).json({ error: "This is not a group chat" });
      }

      // Check if current user is admin
      const isAdmin = await storage.isGroupAdmin(threadId, currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "Only group admins can update group settings" });
      }

      // Update the group
      const updates: { groupName?: string; groupIconUrl?: string } = {};
      if (groupName !== undefined) updates.groupName = groupName;
      if (groupIconUrl !== undefined) updates.groupIconUrl = groupIconUrl;

      const updatedThread = await storage.updateGroupThread(threadId, updates);

      // Invalidate cache for all participants
      const participants = await storage.getGroupParticipants(threadId);
      for (const participant of participants) {
        cache.delete(`threads:user:${participant.userId}`);
      }

      res.json(updatedThread);
    } catch (error: any) {
      logError(error, { endpoint: req?.method + " " + req?.path, userId: req?.session?.userId });
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
