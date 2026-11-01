import { createContext } from "react";
import type { ProjectTreeNode } from "../services/filesystem";

export type WorkspaceStatus = "idle" | "loading" | "ready" | "unsupported" | "error";

export type WorkspaceContextValue = {
  status: WorkspaceStatus;
  message: string | null;
  projectName: string | null;
  tree: ProjectTreeNode[];
  openPath: string | null;
  openContent: string;
  dirty: boolean;
  previewPath: string | null;
  previewBytes: Uint8Array | null;
  canOpen: boolean;
  openProject: () => Promise<void>;
  openFile: (path: string) => Promise<void>;
  setOpenContent: (value: string) => void;
  saveOpenFile: () => Promise<void>;
  refreshTree: () => Promise<void>;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
