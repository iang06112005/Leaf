import type { CompanionTreeNode } from "./companion";

/** Basename patterns / extensions that are TeX build clutter. */
const AUX_EXT = new Set([
  "aux",
  "bbl",
  "bcf",
  "blg",
  "fdb_latexmk",
  "fls",
  "lof",
  "log",
  "lot",
  "nav",
  "out",
  "snm",
  "toc",
  "vrb",
  "xdv",
  "idx",
  "ilg",
  "ind",
  "glo",
  "gls",
  "acn",
  "acr",
  "alg",
]);

export function isAuxFileName(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.endsWith(".synctex.gz") || lower.endsWith(".run.xml")) return true;
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return false;
  return AUX_EXT.has(lower.slice(dot + 1));
}

export function filterTreeHideAux(nodes: CompanionTreeNode[]): CompanionTreeNode[] {
  const next: CompanionTreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === "file") {
      if (!isAuxFileName(node.name)) next.push(node);
      continue;
    }
    const children = filterTreeHideAux(node.children);
    if (children.length > 0 || node.children.length === 0) {
      next.push({ ...node, children });
    }
  }
  return next;
}
