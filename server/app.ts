import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db.js";
import path from "path";

// Shared session secret for both session middleware and WebSocket authentication
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';

export function createApp() {
    const app = express();

    // Trust proxy for rate limiting to work correctly
    app.set('trust proxy', 1);

    // Disable ETags globally
    app.set('etag', false);

    app.use(express.json({
        verify: (req, _res, buf) => {
            (req as any).rawBody = buf;
        }
    }));
    app.use(express.urlencoded({ extended: false }));

    const PgSession = connectPg(session);

    app.use(session({
        store: new PgSession({
            pool: pool,
            tableName: 'session',
            createTableIfMissing: true,
        }),
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            path: '/',
        },
    }));

    // Serve attached_assets directory
    app.use('/attached_assets', express.static(path.resolve(process.cwd(), 'attached_assets')));

    return app;
}
