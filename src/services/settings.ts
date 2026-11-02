export type Engine = "pdflatex" | "xelatex" | "lualatex";

export type AppSettings = {
  texBinDir: string;
  engine: Engine;
  rootFile: string;
  autosave: boolean;
  autosaveDelayMs: number;
  editorFontSize: number;
  editorFontFamily: string;
  pdfScale: number;
  outputDir: string;
  shellEscape: boolean;
  synctex: boolean;
  lastProjectPath: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  texBinDir: "",
  engine: "pdflatex",
  rootFile: "main.tex",
  autosave: true,
  autosaveDelayMs: 800,
  editorFontSize: 14,
  editorFontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  pdfScale: 1.25,
  outputDir: "",
  shellEscape: false,
  synctex: true,
  lastProjectPath: "",
};

const KEY = "texflow.settings.v1";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
