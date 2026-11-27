import { createContext } from "react";
import type {
  CompileResult,
  CompanionTreeNode,
  SynctexForwardResult,
  TexStatus,
} from "../services/companion";
import type { BuildHistoryEntry } from "../services/buildHistory";
import type { Diagnostic } from "../services/diagnostics";
import type { AppSettings } from "../services/settings";

export type WorkspaceStatus = "idle" | "loading" | "ready" | "error";
export type BuildState = "idle" | "running" | "success" | "failed" | "cancelled";
export type BottomTab = "problems" | "log" | "history";
export type DiagnosticFilter = "all" | "errors" | "warnings";

export type EditorTab = {
  path: string;
  content: string;
  savedContent: string;
};

export type CursorPosition = {
  line: number;
  column: number;
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
  buildHistory: BuildHistoryEntry[];
  diagnostics: Diagnostic[];
  diagnosticFilter: DiagnosticFilter;
  sidebarCollapsed: boolean;
  settingsOpen: boolean;
  bottomTab: BottomTab;
  jumpRequest: { path: string; line: number; token: number } | null;
  pdfFocus: SynctexForwardResult | null;
  lastPdfClick: { page: number; x: number; y: number } | null;
  cursorPosition: CursorPosition | null;
  openProject: (explicitPath?: string) => Promise<void>;
  openProjectPicker: () => Promise<void>;
  openRecent: (path: string) => Promise<void>;
  newProjectFromTemplate: () => Promise<void>;
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
  cleanArtifacts: (opts?: { confirm?: boolean; quiet?: boolean }) => Promise<void>;
  compile: () => Promise<void>;
  stopCompile: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setSettingsOpen: (value: boolean) => void;
  setBottomTab: (value: BottomTab) => void;
  setDiagnosticFilter: (value: DiagnosticFilter) => void;
  setCursorPosition: (value: CursorPosition | null) => void;
  jumpToDiagnostic: (diagnostic: Diagnostic) => void;
  jumpToLine: (line: number, path?: string) => void;
  clearJumpRequest: () => void;
  refreshTexStatus: () => Promise<void>;
  openPdfExternally: () => Promise<void>;
  syncTexForward: (line: number, column?: number) => Promise<void>;
  syncTexInverse: (page: number, x: number, y: number) => Promise<void>;
  rememberPdfClick: (page: number, x: number, y: number) => void;
  syncTexInverseFromLastClick: () => Promise<void>;
  clearPdfFocus: () => void;
  clearBuildHistory: () => void;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
