import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { useState } from "react";
import type { CompanionTreeNode } from "../services/companion";
import { isPdfProjectFile, isTextProjectFile } from "../services/fileKinds";

type FileTreeProps = {
  nodes: CompanionTreeNode[];
  activePath: string | null;
  previewPath: string | null;
  onOpen: (path: string) => void;
};

function isOpenable(path: string): boolean {
  return isTextProjectFile(path) || isPdfProjectFile(path);
}

function TreeNode({
  node,
  activePath,
  previewPath,
  onOpen,
  depth,
}: {
  node: CompanionTreeNode;
  activePath: string | null;
  previewPath: string | null;
  onOpen: (path: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (node.kind === "directory") {
    return (
      <div>
        <button
          type="button"
          className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm text-zinc-300 hover:bg-zinc-800"
          style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? (
            <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
          )}
          <Folder className="size-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded
          ? node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                activePath={activePath}
                previewPath={previewPath}
                onOpen={onOpen}
                depth={depth + 1}
              />
            ))
          : null}
      </div>
    );
  }

  const openable = isOpenable(node.path);
  const active = node.path === activePath || node.path === previewPath;

  return (
    <button
      type="button"
      disabled={!openable}
      className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm ${
        active ? "bg-zinc-800 text-zinc-50" : "text-zinc-300 hover:bg-zinc-800"
      } disabled:cursor-default disabled:text-zinc-600 disabled:hover:bg-transparent`}
      style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
      onClick={() => {
        if (openable) onOpen(node.path);
      }}
      title={node.path}
    >
      <span className="size-3.5 shrink-0" aria-hidden="true" />
      <FileText className="size-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTree({ nodes, activePath, previewPath, onOpen }: FileTreeProps) {
  if (nodes.length === 0) {
    return <p className="px-2 text-sm text-zinc-500">This folder is empty.</p>;
  }

  return (
    <div className="space-y-0.5" role="tree" aria-label="Project files">
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          activePath={activePath}
          previewPath={previewPath}
          onOpen={onOpen}
          depth={0}
        />
      ))}
    </div>
  );
}
