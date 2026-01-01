import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Dynamic imports to avoid loading vite in production
  const viteModule = await import("vite");
  const viteConfigModule = await import("../vite.config");
  const nanoidModule = await import("nanoid");
  
  const createViteServer = viteModule.createServer;
  const createLogger = viteModule.createLogger;
  const viteConfig = viteConfigModule.default;
  const nanoid = nanoidModule.nanoid;
  
  const viteLogger = createLogger();
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Try multiple path resolution strategies for production compatibility
  let distPath = path.resolve(import.meta.dirname, "public");
  
  // Fallback: try relative to cwd/dist/public
  if (!fs.existsSync(distPath)) {
    distPath = path.resolve(process.cwd(), "dist", "public");
  }
  
  // Fallback: try relative to cwd/public (in case we're already in dist)
  if (!fs.existsSync(distPath)) {
    distPath = path.resolve(process.cwd(), "public");
  }

  console.log(`[serveStatic] Final distPath: ${distPath}`);
  console.log(`[serveStatic] distPath exists: ${fs.existsSync(distPath)}`);

  if (!fs.existsSync(distPath)) {
    console.error(`[serveStatic] Build directory not found. Tried paths based on import.meta.dirname and cwd`);
    console.error(`[serveStatic] import.meta.dirname: ${import.meta.dirname}`);
    console.error(`[serveStatic] process.cwd(): ${process.cwd()}`);
    throw new Error(`Could not find the build directory`);
  }

  const indexPath = path.resolve(distPath, "index.html");
  console.log(`[serveStatic] index.html exists: ${fs.existsSync(indexPath)}`);

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    if (!fs.existsSync(indexPath)) {
      console.error(`[serveStatic] index.html not found at: ${indexPath}`);
      return res.status(500).send("index.html not found");
    }
    res.sendFile(indexPath);
  });
}
