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

export async function companionHealth(): Promise<boolean> {
  try {
    const result = await request<{ ok: boolean }>("/api/health");
    return Boolean(result.ok);
  } catch {
    return false;
  }
}

export function getTexStatus(texBinDir?: string) {
  const query = texBinDir ? `?texBinDir=${encodeURIComponent(texBinDir)}` : "";
  return request<TexStatus>(`/api/tex${query}`);
}

export function openProject(path?: string) {
  return request<{ path: string; name: string; tree: CompanionTreeNode[] }>("/api/project/open", {
    method: "POST",
    body: JSON.stringify(path ? { path } : {}),
  });
}

export function fetchTree(projectPath: string) {
  return request<{ path: string; tree: CompanionTreeNode[] }>(
    `/api/project/tree?path=${encodeURIComponent(projectPath)}`,
  );
}

export function readText(projectPath: string, file: string) {
  return request<{ path: string; content: string }>(
    `/api/project/file?path=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}`,
  );
}

export async function readBinary(projectPath: string, file: string): Promise<Uint8Array> {
  const response = await fetch(
    `${COMPANION_BASE}/api/project/file?path=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}&binary=1`,
  );
  if (!response.ok) {
    throw new Error("Could not read that binary file.");
  }
  return new Uint8Array(await response.arrayBuffer());
}

export function writeText(projectPath: string, file: string, content: string) {
  return request<{ ok: boolean }>("/api/project/file", {
    method: "PUT",
    body: JSON.stringify({ path: projectPath, file, content }),
  });
}

export function createFile(projectPath: string, file: string, content = "") {
  return request<{ ok: boolean; file: string }>("/api/project/create-file", {
    method: "POST",
    body: JSON.stringify({ path: projectPath, file, content }),
  });
}

export function createDir(projectPath: string, dir: string) {
  return request<{ ok: boolean; dir: string }>("/api/project/mkdir", {
    method: "POST",
    body: JSON.stringify({ path: projectPath, dir }),
  });
}

export function renamePath(projectPath: string, from: string, to: string) {
  return request<{ ok: boolean; path: string }>("/api/project/rename", {
    method: "POST",
    body: JSON.stringify({ path: projectPath, from, to }),
  });
}

export function deletePath(projectPath: string, target: string) {
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
  return request<CompileStart>("/api/compile/start", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function cancelCompile(body: { jobId?: string; projectPath?: string }) {
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
  return request<{ path: string; name: string; tree: CompanionTreeNode[] }>("/api/project/pick", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function openPdfInOs(body: { path?: string; file?: string; absolutePath?: string }) {
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
  return request<ProjectTemplateInfo[]>("/api/project/templates");
}

export function createProject(body: { path: string; templateId?: string; force?: boolean }) {
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
  return request<{ ok: boolean; removed: string[]; count: number }>("/api/project/clean", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
