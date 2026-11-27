import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { isDesktopHost } from "./host";

export const COMPANION_BASE = "http://127.0.0.1:8787";

export type CompanionTreeNode =
  | { kind: "file"; name: string; path: string }
  | { kind: "directory"; name: string; path: string; children: CompanionTreeNode[] };

export type TexStatus = {
  ok: boolean;
  latexmk: string | null;
  engines: Record<string, string | null>;
  version: string | null;
  installHint: string;
};

export type CompileStart = {
  jobId: string;
  projectPath: string;
  args: string[];
  latexmk: string;
};

export type CompileResult = {
  ok: boolean;
  code: number | null;
  signal: string | null;
  durationMs: number;
  log: string;
  error: string | null;
  args: string[];
  latexmk: string;
  pdfPath: string | null;
  pdfRelative?: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${COMPANION_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { error: text || `Companion request failed (${response.status})` };
  }
  if (!response.ok) {
    const message =
      body && typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `Companion request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

async function desktop<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message, { cause: error });
  }
}

export async function companionHealth(): Promise<boolean> {
  try {
    if (isDesktopHost()) {
      const result = await desktop<{ ok: boolean }>("health");
      return Boolean(result.ok);
    }
    const result = await request<{ ok: boolean }>("/api/health");
    return Boolean(result.ok);
  } catch {
    return false;
  }
}

export function getTexStatus(texBinDir?: string) {
  if (isDesktopHost()) {
    return desktop<TexStatus>("get_tex_status", { texBinDir: texBinDir || null });
  }
  const query = texBinDir ? `?texBinDir=${encodeURIComponent(texBinDir)}` : "";
  return request<TexStatus>(`/api/tex${query}`);
}

export function projectExists(projectPath: string) {
  if (isDesktopHost()) {
    return desktop<{ path: string; exists: boolean }>("project_exists", { path: projectPath });
  }
  return request<{ path: string; exists: boolean }>(
    `/api/project/exists?path=${encodeURIComponent(projectPath)}`,
  );
}

export function openProject(path?: string) {
  if (isDesktopHost()) {
    if (!path) {
      return desktop<{ path: string; name: string; tree: CompanionTreeNode[] }>("pick_project");
    }
    return desktop<{ path: string; name: string; tree: CompanionTreeNode[] }>("open_project", {
      path,
    });
  }
  return request<{ path: string; name: string; tree: CompanionTreeNode[] }>("/api/project/open", {
    method: "POST",
    body: JSON.stringify(path ? { path } : {}),
  });
}

export function fetchTree(projectPath: string) {
  if (isDesktopHost()) {
    return desktop<{ path: string; tree: CompanionTreeNode[] }>("project_tree", {
      path: projectPath,
    });
  }
  return request<{ path: string; tree: CompanionTreeNode[] }>(
    `/api/project/tree?path=${encodeURIComponent(projectPath)}`,
  );
}

export function readText(projectPath: string, file: string) {
  if (isDesktopHost()) {
    return desktop<{ path: string; content: string }>("read_text_file", {
      path: projectPath,
      file,
    });
  }
  return request<{ path: string; content: string }>(
    `/api/project/file?path=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}`,
  );
}

export async function readBinary(projectPath: string, file: string): Promise<Uint8Array> {
  if (isDesktopHost()) {
    const result = await desktop<{ path: string; base64: string }>("read_binary_file", {
      path: projectPath,
      file,
    });
    const binary = atob(result.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  const response = await fetch(
    `${COMPANION_BASE}/api/project/file?path=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}&binary=1`,
  );
  if (!response.ok) {
    throw new Error("Could not read that binary file.");
  }
  return new Uint8Array(await response.arrayBuffer());
}

export function writeText(projectPath: string, file: string, content: string) {
  if (isDesktopHost()) {
    return desktop<{ ok: boolean }>("write_text_file", {
      path: projectPath,
      file,
      content,
    });
  }
  return request<{ ok: boolean }>("/api/project/file", {
    method: "PUT",
    body: JSON.stringify({ path: projectPath, file, content }),
  });
}

export function createFile(projectPath: string, file: string, content = "") {
  if (isDesktopHost()) {
    return desktop<{ ok: boolean; file: string }>("create_file", {
      path: projectPath,
      file,
      content,
    });
  }
  return request<{ ok: boolean; file: string }>("/api/project/create-file", {
    method: "POST",
    body: JSON.stringify({ path: projectPath, file, content }),
  });
}

export function createDir(projectPath: string, dir: string) {
  if (isDesktopHost()) {
    return desktop<{ ok: boolean; dir: string }>("create_dir", { path: projectPath, dir });
  }
  return request<{ ok: boolean; dir: string }>("/api/project/mkdir", {
    method: "POST",
    body: JSON.stringify({ path: projectPath, dir }),
  });
}

export function renamePath(projectPath: string, from: string, to: string) {
  if (isDesktopHost()) {
    return desktop<{ ok: boolean; path: string }>("rename_path", {
      path: projectPath,
      from,
      to,
    });
  }
  return request<{ ok: boolean; path: string }>("/api/project/rename", {
    method: "POST",
    body: JSON.stringify({ path: projectPath, from, to }),
  });
}

export function deletePath(projectPath: string, target: string) {
  if (isDesktopHost()) {
    return desktop<{ ok: boolean }>("delete_path", { path: projectPath, target });
  }
  return request<{ ok: boolean }>("/api/project/delete", {
    method: "POST",
    body: JSON.stringify({ path: projectPath, target }),
  });
}

export function startCompile(body: {
  projectPath: string;
  rootFile: string;
  engine: string;
  shellEscape: boolean;
  synctex: boolean;
  outputDir: string | null;
  texBinDir: string | null;
}) {
  if (isDesktopHost()) {
    return desktop<CompileStart>("start_compile", {
      projectPath: body.projectPath,
      rootFile: body.rootFile,
      engine: body.engine,
      shellEscape: body.shellEscape,
      synctex: body.synctex,
      outputDir: body.outputDir,
      texBinDir: body.texBinDir,
    });
  }
  return request<CompileStart>("/api/compile/start", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function cancelCompile(body: { jobId?: string; projectPath?: string }) {
  if (isDesktopHost()) {
    return desktop<{ ok: boolean }>("cancel_compile", {
      jobId: body.jobId ?? null,
      projectPath: body.projectPath ?? null,
    });
  }
  return request<{ ok: boolean }>("/api/compile/cancel", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function streamCompile(
  jobId: string,
  handlers: {
    onLog: (payload: { stream: string; text: string }) => void;
    onDone: (result: CompileResult) => void;
    onError?: (error: Error) => void;
  },
): () => void {
  if (isDesktopHost()) {
    let closed = false;
    const unlisteners: UnlistenFn[] = [];
    const cleanup = () => {
      closed = true;
      for (const stop of unlisteners) stop();
      unlisteners.length = 0;
    };

    void (async () => {
      try {
        unlisteners.push(
          await listen<{ jobId: string; stream: string; text: string }>("compile-log", (event) => {
            if (closed || event.payload.jobId !== jobId) return;
            handlers.onLog({ stream: event.payload.stream, text: event.payload.text });
          }),
        );
        unlisteners.push(
          await listen<{ jobId: string } & CompileResult>("compile-done", (event) => {
            if (closed || event.payload.jobId !== jobId) return;
            const payload = event.payload;
            handlers.onDone({
              ok: payload.ok,
              code: payload.code,
              signal: payload.signal,
              durationMs: payload.durationMs,
              log: payload.log,
              error: payload.error,
              args: payload.args,
              latexmk: payload.latexmk,
              pdfPath: payload.pdfPath,
              pdfRelative: payload.pdfRelative,
            });
            cleanup();
          }),
        );
      } catch (error) {
        handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
        cleanup();
      }
    })();

    return cleanup;
  }

  const source = new EventSource(
    `${COMPANION_BASE}/api/compile/stream?jobId=${encodeURIComponent(jobId)}`,
  );

  source.addEventListener("log", (event) => {
    handlers.onLog(JSON.parse((event as MessageEvent).data));
  });
  source.addEventListener("done", (event) => {
    handlers.onDone(JSON.parse((event as MessageEvent).data));
    source.close();
  });
  source.onerror = () => {
    handlers.onError?.(new Error("Lost connection to the compile stream."));
    source.close();
  };

  return () => source.close();
}

export function pickProject() {
  if (isDesktopHost()) {
    return desktop<{ path: string; name: string; tree: CompanionTreeNode[] }>("pick_project");
  }
  return request<{ path: string; name: string; tree: CompanionTreeNode[] }>("/api/project/pick", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function openPdfInOs(body: { path?: string; file?: string; absolutePath?: string }) {
  if (isDesktopHost()) {
    return desktop<{ ok: boolean; path: string }>("open_pdf", {
      path: body.path ?? null,
      file: body.file ?? null,
      absolutePath: body.absolutePath ?? null,
    });
  }
  return request<{ ok: boolean; path: string }>("/api/pdf/open", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type SynctexForwardResult = {
  page: number;
  x: number | null;
  y: number | null;
  h: number | null;
  v: number | null;
  width: number | null;
  height: number | null;
};

export type SynctexInverseResult = {
  file: string;
  line: number;
  column: number;
};

export function synctexForward(body: {
  path: string;
  texRelative: string;
  pdfRelative: string;
  line: number;
  column?: number;
  outputDir?: string | null;
  texBinDir?: string | null;
}) {
  if (isDesktopHost()) {
    return desktop<SynctexForwardResult>("synctex_forward", {
      path: body.path,
      texRelative: body.texRelative,
      pdfRelative: body.pdfRelative,
      line: body.line,
      column: body.column ?? 1,
      texBinDir: body.texBinDir ?? null,
    });
  }
  return request<SynctexForwardResult>("/api/synctex/forward", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function synctexInverse(body: {
  path: string;
  pdfRelative: string;
  page: number;
  x: number;
  y: number;
  outputDir?: string | null;
  texBinDir?: string | null;
}) {
  if (isDesktopHost()) {
    return desktop<SynctexInverseResult>("synctex_inverse", {
      path: body.path,
      pdfRelative: body.pdfRelative,
      page: body.page,
      x: body.x,
      y: body.y,
      texBinDir: body.texBinDir ?? null,
    });
  }
  return request<SynctexInverseResult>("/api/synctex/inverse", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ProjectTemplateInfo = {
  id: string;
  name: string;
  description: string;
};

export function listTemplates() {
  if (isDesktopHost()) {
    return desktop<ProjectTemplateInfo[]>("list_templates");
  }
  return request<ProjectTemplateInfo[]>("/api/project/templates");
}

export function createProject(body: { path: string; templateId?: string; force?: boolean }) {
  if (isDesktopHost()) {
    return desktop<{
      path: string;
      name: string;
      templateId: string;
      files: string[];
      tree: CompanionTreeNode[];
    }>("create_project", {
      path: body.path,
      templateId: body.templateId ?? "article",
      force: body.force ?? false,
    });
  }
  return request<{
    path: string;
    name: string;
    templateId: string;
    files: string[];
    tree: CompanionTreeNode[];
  }>("/api/project/new", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function cleanProject(body: { path: string; outputDir?: string | null }) {
  if (isDesktopHost()) {
    return desktop<{ ok: boolean; removed: string[]; count: number }>("clean_project", {
      path: body.path,
      outputDir: body.outputDir ?? null,
    });
  }
  return request<{ ok: boolean; removed: string[]; count: number }>("/api/project/clean", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type SearchMatch = {
  file: string;
  line: number;
  column: number;
  preview: string;
};

export function searchProjectFiles(body: { path: string; query: string; maxMatches?: number }) {
  if (isDesktopHost()) {
    return desktop<{ matches: SearchMatch[]; truncated: boolean; query: string }>(
      "search_project",
      {
        path: body.path,
        query: body.query,
        maxMatches: body.maxMatches ?? null,
      },
    );
  }
  return request<{ matches: SearchMatch[]; truncated: boolean; query: string }>(
    "/api/project/search",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
