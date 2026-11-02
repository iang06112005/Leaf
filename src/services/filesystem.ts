import { basename, joinRelativePath, splitRelativePath } from "./paths";

const SKIP_DIRECTORY_NAMES = new Set([
  ".git",
  "node_modules",
  ".venv",
  "venv",
  "__pycache__",
  ".texflow",
]);

export type ProjectFileNode = {
  kind: "file";
  name: string;
  path: string;
};

export type ProjectDirectoryNode = {
  kind: "directory";
  name: string;
  path: string;
  children: ProjectTreeNode[];
};

export type ProjectTreeNode = ProjectFileNode | ProjectDirectoryNode;

export function canOpenLocalProject(): boolean {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

export async function pickProjectDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!canOpenLocalProject()) {
    throw new Error(
      "This browser cannot open a local folder. Use Chrome or Edge for the File System Access API.",
    );
  }

  return window.showDirectoryPicker!({
    id: "texflow-project",
    mode: "readwrite",
  });
}

function compareNodes(a: ProjectTreeNode, b: ProjectTreeNode): number {
  if (a.kind !== b.kind) {
    return a.kind === "directory" ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

export async function buildProjectTree(
  root: FileSystemDirectoryHandle,
  prefix = "",
): Promise<ProjectTreeNode[]> {
  const children: ProjectTreeNode[] = [];

  for await (const [name, handle] of root.entries()) {
    const path = prefix ? joinRelativePath(prefix, name) : name;

    if (handle.kind === "directory") {
      if (SKIP_DIRECTORY_NAMES.has(name)) continue;
      const directory = handle as FileSystemDirectoryHandle;
      children.push({
        kind: "directory",
        name,
        path,
        children: await buildProjectTree(directory, path),
      });
      continue;
    }

    children.push({
      kind: "file",
      name,
      path,
    });
  }

  return children.sort(compareNodes);
}

async function resolveDirectory(
  root: FileSystemDirectoryHandle,
  segments: string[],
): Promise<FileSystemDirectoryHandle> {
  let current = root;
  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment);
  }
  return current;
}

export async function getProjectFileHandle(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<FileSystemFileHandle> {
  const segments = splitRelativePath(relativePath);
  if (segments.length === 0) {
    throw new Error("A file path is required.");
  }

  const fileName = segments[segments.length - 1]!;
  const directory = await resolveDirectory(root, segments.slice(0, -1));
  return directory.getFileHandle(fileName);
}

export async function readProjectText(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<string> {
  const handle = await getProjectFileHandle(root, relativePath);
  const file = await handle.getFile();
  return file.text();
}

export async function readProjectBytes(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<Uint8Array> {
  const handle = await getProjectFileHandle(root, relativePath);
  const file = await handle.getFile();
  return new Uint8Array(await file.arrayBuffer());
}

export async function writeProjectText(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  contents: string,
): Promise<void> {
  const handle = await getProjectFileHandle(root, relativePath);
  const permission = await handle.requestPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    throw new Error("Write permission was not granted for that file.");
  }

  const writable = await handle.createWritable();
  await writable.write(contents);
  await writable.close();
}

export function projectDisplayName(root: FileSystemDirectoryHandle): string {
  return root.name || basename("project");
}

type TreeLike =
  | { kind: "file"; name: string; path: string }
  | { kind: "directory"; name: string; path: string; children: TreeLike[] };

export function flattenFiles(nodes: TreeLike[]): { name: string; path: string }[] {
  const files: { name: string; path: string }[] = [];
  for (const node of nodes) {
    if (node.kind === "file") {
      files.push(node);
    } else {
      files.push(...flattenFiles(node.children));
    }
  }
  return files;
}

export function findPreferredPdf(nodes: TreeLike[]): string | null {
  const files = flattenFiles(nodes).filter((file) => file.name.toLowerCase().endsWith(".pdf"));
  if (files.length === 0) return null;

  const main = files.find((file) => file.name.toLowerCase() === "main.pdf");
  if (main) return main.path;

  files.sort((a, b) => a.path.localeCompare(b.path, undefined, { sensitivity: "base" }));
  return files[0]?.path ?? null;
}

export function findPreferredTex(nodes: TreeLike[]): string | null {
  const files = flattenFiles(nodes).filter((file) => file.name.toLowerCase().endsWith(".tex"));
  if (files.length === 0) return null;

  const main = files.find((file) => file.name.toLowerCase() === "main.tex");
  if (main) return main.path;

  files.sort((a, b) => a.path.localeCompare(b.path, undefined, { sensitivity: "base" }));
  return files[0]?.path ?? null;
}
