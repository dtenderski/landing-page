import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.get("/sw.js", (_req, res) => {
    res.set({
      "Content-Type": "text/javascript",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Service-Worker-Allowed": "/",
    });
    res.sendFile(path.resolve(distPath, "sw.js"));
  });

  app.get("/manifest.json", (_req, res) => {
    res.set({
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-cache",
    });
    res.sendFile(path.resolve(distPath, "manifest.json"));
  });

  app.use(express.static(distPath));

  app.use("/{*path}", (_req, res) => {
    res.set({
      "X-Robots-Tag": "index, follow",
    });
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
