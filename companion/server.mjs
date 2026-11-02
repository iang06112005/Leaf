#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cancelCompile, getJob, startCompile } from "./lib/compile.mjs";
import { pickDirectory } from "./lib/dialog.mjs";
import {
  buildTree,
  createDirectory,
  createFile,
  deleteEntry,
  pathExists,
  readBinaryFile,
  readTextFile,
  renameEntry,
  writeTextFile,
} from "./lib/fsops.mjs";
import { openPathInOs, openProjectFileInOs, pdfAbsolutePath } from "./lib/open.mjs";
import { assertAbsolutePath } from "./lib/paths.mjs";
import { synctexForward, synctexInverse } from "./lib/synctex.mjs";
import { detectTeX } from "./lib/tex.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.TEXFLOW_COMPANION_PORT || 8787);
const HOST = "127.0.0.1";

const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

async function handle(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        name: "texflow-companion",
        version: "0.1.0",
        pid: process.pid,
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/tex") {
      const texBinDir = url.searchParams.get("texBinDir") || null;
      sendJson(res, 200, await detectTeX({ texBinDir }));
      return;
    }

    if (req.method === "POST" && pathname === "/api/project/open") {
      const body = await readJson(req);
      let projectPath = body.path || null;
      if (!projectPath) {
        projectPath = await pickDirectory();
      }
      if (!projectPath) {
        sendJson(res, 400, { error: "No folder selected." });
        return;
      }
      projectPath = assertAbsolutePath(projectPath);
      if (!(await pathExists(projectPath))) {
        sendJson(res, 404, { error: "That folder does not exist." });
        return;
      }
      sendJson(res, 200, {
        path: projectPath,
        name: path.basename(projectPath),
        tree: await buildTree(projectPath),
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/project/tree") {
      const projectPath = assertAbsolutePath(url.searchParams.get("path") || "");
      sendJson(res, 200, { path: projectPath, tree: await buildTree(projectPath) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/project/file") {
      const projectPath = assertAbsolutePath(url.searchParams.get("path") || "");
      const file = url.searchParams.get("file") || "";
      const binary = url.searchParams.get("binary") === "1";
      if (binary) {
        const bytes = await readBinaryFile(projectPath, file);
        res.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Content-Length": bytes.length,
          "Access-Control-Allow-Origin":
            req.headers.origin && ALLOWED_ORIGINS.has(req.headers.origin)
              ? req.headers.origin
              : undefined,
        });
        res.end(bytes);
        return;
      }
      sendJson(res, 200, {
        path: file,
        content: await readTextFile(projectPath, file),
      });
      return;
    }

    if (req.method === "PUT" && pathname === "/api/project/file") {
      const body = await readJson(req);
      await writeTextFile(body.path, body.file, body.content ?? "");
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && pathname === "/api/project/create-file") {
      const body = await readJson(req);
      const created = await createFile(body.path, body.file, body.content ?? "");
      sendJson(res, 200, { ok: true, file: created });
      return;
    }

    if (req.method === "POST" && pathname === "/api/project/mkdir") {
      const body = await readJson(req);
      const created = await createDirectory(body.path, body.dir);
      sendJson(res, 200, { ok: true, dir: created });
      return;
    }

    if (req.method === "POST" && pathname === "/api/project/rename") {
      const body = await readJson(req);
      const renamed = await renameEntry(body.path, body.from, body.to);
      sendJson(res, 200, { ok: true, path: renamed });
      return;
    }

    if (req.method === "POST" && pathname === "/api/project/delete") {
      const body = await readJson(req);
      await deleteEntry(body.path, body.target);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && pathname === "/api/compile/start") {
      const body = await readJson(req);
      const started = await startCompile(body);
      sendJson(res, 200, started);
      return;
    }

    if (req.method === "POST" && pathname === "/api/compile/cancel") {
      const body = await readJson(req);
      sendJson(res, 200, cancelCompile(body));
      return;
    }

    if (req.method === "GET" && pathname === "/api/compile/stream") {
      const jobId = url.searchParams.get("jobId") || "";
      const job = getJob(jobId);
      if (!job) {
        sendJson(res, 404, { error: "Unknown job." });
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin":
          req.headers.origin && ALLOWED_ORIGINS.has(req.headers.origin)
            ? req.headers.origin
            : "http://127.0.0.1:5173",
      });

      const sendEvent = (event, data) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      sendEvent("log", { stream: "stdout", text: job.log });

      const onLog = (payload) => sendEvent("log", payload);
      const onDone = (result) => {
        sendEvent("done", result);
        cleanup();
        res.end();
      };
      const cleanup = () => {
        job.emitter.off("log", onLog);
        job.emitter.off("done", onDone);
      };

      job.emitter.on("log", onLog);
      if (job.result) {
        onDone(job.result);
      } else {
        job.emitter.on("done", onDone);
      }

      req.on("close", cleanup);
      return;
    }

    if (req.method === "GET" && pathname === "/api/compile/job") {
      const jobId = url.searchParams.get("jobId") || "";
      const job = getJob(jobId);
      if (!job) {
        sendJson(res, 404, { error: "Unknown job." });
        return;
      }
      sendJson(res, 200, {
        jobId: job.jobId,
        projectPath: job.projectPath,
        running: !job.result,
        result: job.result,
        log: job.log,
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/pdf/open") {
      const body = await readJson(req);
      if (body.absolutePath) {
        sendJson(res, 200, await openPathInOs(body.absolutePath));
        return;
      }
      const projectPath = assertAbsolutePath(body.path || "");
      const file = body.file || "";
      sendJson(res, 200, await openProjectFileInOs(projectPath, file));
      return;
    }

    if (req.method === "POST" && pathname === "/api/synctex/forward") {
      const body = await readJson(req);
      const projectPath = assertAbsolutePath(body.path || "");
      const pdfRelative = body.pdfRelative || body.pdf || "main.pdf";
      const absolutePdf = pdfAbsolutePath(projectPath, pdfRelative, body.outputDir || null);
      const result = await synctexForward({
        projectPath,
        texRelative: body.texRelative || body.tex,
        pdfRelative: absolutePdf,
        line: Number(body.line) || 1,
        column: Number(body.column) || 1,
        texBinDir: body.texBinDir || null,
      });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && pathname === "/api/synctex/inverse") {
      const body = await readJson(req);
      const projectPath = assertAbsolutePath(body.path || "");
      const pdfRelative = body.pdfRelative || body.pdf || "main.pdf";
      const absolutePdf = pdfAbsolutePath(projectPath, pdfRelative, body.outputDir || null);
      const result = await synctexInverse({
        projectPath,
        pdfRelative: absolutePdf,
        page: Number(body.page) || 1,
        x: Number(body.x) || 0,
        y: Number(body.y) || 0,
        texBinDir: body.texBinDir || null,
      });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && pathname === "/api/project/pick") {
      const picked = await pickDirectory();
      if (!picked) {
        sendJson(res, 400, {
          error:
            "No folder selected (native dialog unavailable in this environment). Paste an absolute path instead.",
        });
        return;
      }
      const projectPath = assertAbsolutePath(picked);
      sendJson(res, 200, {
        path: projectPath,
        name: path.basename(projectPath),
        tree: await buildTree(projectPath),
      });
      return;
    }

    notFound(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    sendJson(res, 400, { error: message });
  }
}

const server = http.createServer((req, res) => {
  void handle(req, res);
});

server.listen(PORT, HOST, () => {
  const root = path.resolve(__dirname, "..");
  process.stdout.write(`TexFlow companion listening on http://${HOST}:${PORT}\nrepo=${root}\n`);
});

export { server };
