import { createContext } from "react";
import type {
  CompileResult,
  CompanionTreeNode,
  SynctexForwardResult,
  TexStatus,
} from "../services/companion";
import type { Diagnostic } from "../services/diagnostics";
import type { AppSettings } from "../services/settings";

export type WorkspaceStatus = "idle" | "loading" | "ready" | "error";
export type BuildState = "idle" | "running" | "success" | "failed" | "cancelled";

export type EditorTab = {
  path: string;
  content: string;
  savedContent: string;
};

export type WorkspaceContextValue = {
  companionOnline: boolean;
  status: WorkspaceStatus;
  message: string | null;
  projectPath: string | null;
  projectName: string | null;
  tree: CompanionTreeNode[];
  tabs: EditorTab[];
  openPath: string | null;
  openContent: string;
  dirty: boolean;
  anyDirty: boolean;
  saving: boolean;
  previewPath: string | null;
  previewBytes: Uint8Array | null;
  settings: AppSettings;
  texStatus: TexStatus | null;
  buildState: BuildState;
  buildLog: string;
  buildStartedAt: number | null;
  buildResult: CompileResult | null;
  diagnostics: Diagnostic[];
  sidebarCollapsed: boolean;
  settingsOpen: boolean;
  bottomTab: "problems" | "log";
  jumpRequest: { path: string; line: number; token: number } | null;
  pdfFocus: SynctexForwardResult | null;
  openProject: (explicitPath?: string) => Promise<void>;
  openProjectPicker: () => Promise<void>;
  openRecent: (path: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  closeTab: (path: string) => Promise<void>;
  setActiveTab: (path: string) => void;
  setOpenContent: (value: string) => void;
  saveOpenFile: () => Promise<void>;
  saveAll: () => Promise<void>;
  refreshTree: () => Promise<void>;
  createFile: (relativePath: string) => Promise<void>;
  createFolder: (relativePath: string) => Promise<void>;
  renameEntry: (from: string, to: string) => Promise<void>;
  deleteEntry: (target: string) => Promise<void>;
  compile: () => Promise<void>;
  stopCompile: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setSettingsOpen: (value: boolean) => void;
  setBottomTab: (value: "problems" | "log") => void;
  jumpToDiagnostic: (diagnostic: Diagnostic) => void;
  clearJumpRequest: () => void;
  refreshTexStatus: () => Promise<void>;
  openPdfExternally: () => Promise<void>;
  syncTexForward: (line: number, column?: number) => Promise<void>;
  syncTexInverse: (page: number, x: number, y: number) => Promise<void>;
  clearPdfFocus: () => void;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
