export type Engine = "pdflatex" | "xelatex" | "lualatex";
export type ThemeMode = "dark" | "light";

export type AppSettings = {
  texBinDir: string;
  engine: Engine;
  rootFile: string;
  autosave: boolean;
  autosaveDelayMs: number;
  compileOnSave: boolean;
  editorFontSize: number;
  editorFontFamily: string;
  pdfScale: number;
  outputDir: string;
  shellEscape: boolean;
  synctex: boolean;
  lastProjectPath: string;
  recentProjects: string[];
  theme: ThemeMode;
  showAuxFiles: boolean;
  cleanAuxBeforeCompile: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  texBinDir: "",
  engine: "pdflatex",
  rootFile: "main.tex",
  autosave: true,
  autosaveDelayMs: 800,
  compileOnSave: false,
  editorFontSize: 14,
  editorFontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  pdfScale: 1.25,
  outputDir: "",
  shellEscape: false,
  synctex: true,
  lastProjectPath: "",
  recentProjects: [],
  theme: "dark",
  showAuxFiles: false,
  cleanAuxBeforeCompile: false,
};

const KEY = "texflow.settings.v1";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      compileOnSave: Boolean(parsed.compileOnSave),
      showAuxFiles: Boolean(parsed.showAuxFiles),
      cleanAuxBeforeCompile: Boolean(parsed.cleanAuxBeforeCompile),
      recentProjects: Array.isArray(parsed.recentProjects) ? parsed.recentProjects : [],
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function pushRecentProject(settings: AppSettings, projectPath: string): AppSettings {
  const next = [
    projectPath,
    ...settings.recentProjects.filter((item) => item !== projectPath),
  ].slice(0, 8);
  return {
    ...settings,
    lastProjectPath: projectPath,
    recentProjects: next,
  };
}

/** Absolute paths to try when restoring a project after reload (last first, then recent). */
export function restoreProjectCandidates(settings: AppSettings): string[] {
  const out: string[] = [];
  const push = (path: string | undefined) => {
    const trimmed = path?.trim();
    if (!trimmed || out.includes(trimmed)) return;
    out.push(trimmed);
  };
  push(settings.lastProjectPath);
  for (const path of settings.recentProjects) push(path);
  return out;
}

/** Drop a missing folder from last/recent so boot does not keep retrying it. */
export function dropProjectFromHistory(settings: AppSettings, projectPath: string): AppSettings {
  const lastProjectPath = settings.lastProjectPath === projectPath ? "" : settings.lastProjectPath;
  const recentProjects = settings.recentProjects.filter((item) => item !== projectPath);
  if (
    lastProjectPath === settings.lastProjectPath &&
    recentProjects.length === settings.recentProjects.length
  ) {
    return settings;
  }
  return { ...settings, lastProjectPath, recentProjects };
}
