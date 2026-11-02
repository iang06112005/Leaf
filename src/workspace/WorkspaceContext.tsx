import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  cancelCompile,
  cleanProject,
  companionHealth,
  createDir,
  createFile as companionCreateFile,
  createProject,
  deletePath,
  fetchTree,
  getTexStatus,
  openPdfInOs,
  openProject as companionOpenProject,
  pickProject,
  readBinary,
  readText,
  renamePath,
  startCompile,
  streamCompile,
  synctexForward,
  synctexInverse,
  writeText,
  type CompanionTreeNode,
  type CompileResult,
  type SynctexForwardResult,
  type TexStatus,
} from "../services/companion";
import {
  appendBuildHistory,
  loadBuildHistory,
  persistBuildHistory,
  type BuildHistoryEntry,
} from "../services/buildHistory";
import { parseBibEntries } from "../services/bib";
import { setBibEntries } from "../services/bibCache";
import { parseLatexLog, type Diagnostic } from "../services/diagnostics";
import { isPdfProjectFile, isTextProjectFile } from "../services/fileKinds";
import { findPreferredPdf, findPreferredTex, flattenFiles } from "../services/filesystem";
import {
  loadSettings,
  pushRecentProject,
  saveSettings,
  type AppSettings,
} from "../services/settings";
import {
  WorkspaceContext,
  type BottomTab,
  type BuildState,
  type CursorPosition,
  type DiagnosticFilter,
  type EditorTab,
  type WorkspaceContextValue,
  type WorkspaceStatus,
} from "./workspace-context";

function tabDirty(tab: EditorTab): boolean {
  return tab.content !== tab.savedContent;
}

function isTexPath(filePath: string | null | undefined): boolean {
  return Boolean(filePath && /\.tex$/i.test(filePath));
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [companionOnline, setCompanionOnline] = useState(false);
  const [status, setStatus] = useState<WorkspaceStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [tree, setTree] = useState<CompanionTreeNode[]>([]);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewBytes, setPreviewBytes] = useState<Uint8Array | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [texStatus, setTexStatus] = useState<TexStatus | null>(null);
  const [buildState, setBuildState] = useState<BuildState>("idle");
  const [buildLog, setBuildLog] = useState("");
  const [buildStartedAt, setBuildStartedAt] = useState<number | null>(null);
  const [buildResult, setBuildResult] = useState<CompileResult | null>(null);
  const [buildHistory, setBuildHistory] = useState<BuildHistoryEntry[]>(() => loadBuildHistory());
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [diagnosticFilter, setDiagnosticFilter] = useState<DiagnosticFilter>("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("problems");
  const [jumpRequest, setJumpRequest] = useState<WorkspaceContextValue["jumpRequest"]>(null);
  const [pdfFocus, setPdfFocus] = useState<SynctexForwardResult | null>(null);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const stopStreamRef = useRef<(() => void) | null>(null);
  const pollRef = useRef<number | null>(null);
  const compileOnSaveTimer = useRef<number | null>(null);
  const compileRef = useRef<() => Promise<void>>(async () => undefined);
  const buildStateRef = useRef<BuildState>("idle");

  const activeTab = tabs.find((tab) => tab.path === openPath) ?? null;
  const openContent = activeTab?.content ?? "";
  const dirty = activeTab ? tabDirty(activeTab) : false;
  const anyDirty = tabs.some(tabDirty);

  useEffect(() => {
    buildStateRef.current = buildState;
  }, [buildState]);

  const refreshTexStatus = useCallback(async () => {
    if (!(await companionHealth())) {
      setCompanionOnline(false);
      setTexStatus(null);
      return;
    }
    setCompanionOnline(true);
    try {
      setTexStatus(await getTexStatus(settings.texBinDir || undefined));
    } catch (error) {
      setTexStatus(null);
      setMessage(error instanceof Error ? error.message : "Could not detect TeX.");
    }
  }, [settings.texBinDir]);

  useEffect(() => {
    void refreshTexStatus();
    const id = window.setInterval(() => {
      void refreshTexStatus();
    }, 8000);
    return () => window.clearInterval(id);
  }, [refreshTexStatus]);

  useEffect(() => {
    saveSettings(settings);
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.colorScheme = settings.theme;
  }, [settings]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!anyDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const loadPreview = useCallback(async (root: string, file: string) => {
    const bytes = await readBinary(root, file);
    setPreviewPath(file);
    setPreviewBytes(bytes);
  }, []);

  const upsertTab = useCallback((path: string, content: string) => {
    setTabs((current) => {
      const existing = current.find((tab) => tab.path === path);
      if (existing) {
        return current.map((tab) =>
          tab.path === path ? { ...tab, content, savedContent: content } : tab,
        );
      }
      return [...current, { path, content, savedContent: content }];
    });
    setOpenPath(path);
  }, []);

  const loadText = useCallback(
    async (root: string, file: string) => {
      const result = await readText(root, file);
      upsertTab(file, result.content);
    },
    [upsertTab],
  );

  const refreshTree = useCallback(async () => {
    if (!projectPath) return;
    const result = await fetchTree(projectPath);
    setTree(result.tree);
  }, [projectPath]);

  useEffect(() => {
    if (!projectPath || !companionOnline) return;
    const tick = () => {
      void fetchTree(projectPath)
        .then((result) => setTree(result.tree))
        .catch(() => undefined);
    };
    pollRef.current = window.setInterval(tick, 2500);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [companionOnline, projectPath]);

  useEffect(() => {
    if (!projectPath) {
      setBibEntries([]);
      return;
    }
    const bibFiles = flattenFiles(tree).filter((file) => /\.bib$/i.test(file.path));
    let cancelled = false;
    void (async () => {
      const entries = [];
      for (const file of bibFiles) {
        try {
          const result = await readText(projectPath, file.path);
          entries.push(...parseBibEntries(result.content, file.path));
        } catch {
          // ignore unreadable bib
        }
      }
      if (!cancelled) setBibEntries(entries);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectPath, tree]);

  const scheduleCompileOnSave = useCallback(() => {
    if (!settings.compileOnSave) return;
    if (compileOnSaveTimer.current) window.clearTimeout(compileOnSaveTimer.current);
    compileOnSaveTimer.current = window.setTimeout(() => {
      if (buildStateRef.current === "running") return;
      void compileRef.current();
    }, 400);
  }, [settings.compileOnSave]);

  const applyOpenedProject = useCallback(
    async (opened: { path: string; name: string; tree: CompanionTreeNode[] }) => {
      setProjectPath(opened.path);
      setProjectName(opened.name);
      setTree(opened.tree);
      setTabs([]);
      setOpenPath(null);
      setPreviewPath(null);
      setPreviewBytes(null);
      setBuildLog("");
      setBuildResult(null);
      setDiagnostics([]);
      setBuildState("idle");
      setBuildStartedAt(null);
      setPdfFocus(null);
      setCursorPosition(null);
      setSettings((current) => pushRecentProject(current, opened.path));

      const preferredRoot =
        settings.rootFile &&
        flattenFiles(opened.tree).some((file) => file.path === settings.rootFile)
          ? settings.rootFile
          : findPreferredTex(opened.tree);
      if (preferredRoot) {
        await loadText(opened.path, preferredRoot);
        if (!settings.rootFile) {
          setSettings((current) => ({ ...current, rootFile: preferredRoot }));
        }
      }

      const pdf = findPreferredPdf(opened.tree);
      if (pdf) await loadPreview(opened.path, pdf);

      setStatus("ready");
      setMessage(null);
      await refreshTexStatus();
    },
    [loadPreview, loadText, refreshTexStatus, settings.rootFile],
  );

  const openProject = useCallback(
    async (explicitPath?: string) => {
      setStatus("loading");
      setMessage("Opening project…");
      try {
        if (!(await companionHealth())) {
          throw new Error(
            "Companion is offline. Run npm run dev (or npm run companion) so latexmk and project I/O work.",
          );
        }
        if (anyDirty) {
          const proceed = window.confirm("You have unsaved changes. Open another project anyway?");
          if (!proceed) {
            setStatus(projectPath ? "ready" : "idle");
            setMessage(null);
            return;
          }
        }
        const opened = await companionOpenProject(
          explicitPath || settings.lastProjectPath || undefined,
        );
        await applyOpenedProject(opened);
      } catch (error) {
        setStatus(projectPath ? "ready" : "error");
        setMessage(error instanceof Error ? error.message : "Could not open that project.");
      }
    },
    [anyDirty, applyOpenedProject, projectPath, settings.lastProjectPath],
  );

  const openProjectPicker = useCallback(async () => {
    setStatus("loading");
    setMessage("Opening folder picker…");
    try {
      if (!(await companionHealth())) {
        throw new Error("Companion offline — start npm run companion.");
      }
      if (anyDirty) {
        const proceed = window.confirm("You have unsaved changes. Open another project anyway?");
        if (!proceed) {
          setStatus(projectPath ? "ready" : "idle");
          setMessage(null);
          return;
        }
      }
      try {
        const opened = await pickProject();
        await applyOpenedProject(opened);
      } catch {
        const path = window.prompt(
          "Native folder dialog unavailable here. Paste an absolute project path:",
          settings.lastProjectPath || "",
        );
        if (!path) {
          setStatus(projectPath ? "ready" : "idle");
          setMessage(null);
          return;
        }
        await openProject(path.trim());
      }
    } catch (error) {
      setStatus(projectPath ? "ready" : "error");
      setMessage(error instanceof Error ? error.message : "Could not open a folder.");
    }
  }, [anyDirty, applyOpenedProject, openProject, projectPath, settings.lastProjectPath]);

  const openRecent = useCallback(
    async (path: string) => {
      await openProject(path);
    },
    [openProject],
  );

  const newProjectFromTemplate = useCallback(async () => {
    setStatus("loading");
    setMessage("Creating project from template…");
    try {
      if (!(await companionHealth())) {
        throw new Error("Companion offline — start npm run companion.");
      }
      if (anyDirty) {
        const proceed = window.confirm("You have unsaved changes. Create a new project anyway?");
        if (!proceed) {
          setStatus(projectPath ? "ready" : "idle");
          setMessage(null);
          return;
        }
      }
      const suggested =
        settings.lastProjectPath?.replace(/[/\\][^/\\]+$/, "") ||
        (typeof navigator !== "undefined" && /Win/i.test(navigator.userAgent)
          ? "C:\\Repo_me\\my-paper"
          : "");
      const target = window.prompt(
        "Absolute path for the new empty project folder (ordinary directory):",
        suggested,
      );
      if (!target?.trim()) {
        setStatus(projectPath ? "ready" : "idle");
        setMessage(null);
        return;
      }
      const created = await createProject({
        path: target.trim(),
        templateId: "article",
      });
      await applyOpenedProject(created);
      setSettings((current) => ({ ...current, rootFile: "main.tex" }));
      setMessage(`Created project from Article template at ${created.path}`);
    } catch (error) {
      setStatus(projectPath ? "ready" : "error");
      setMessage(error instanceof Error ? error.message : "Could not create project.");
    }
  }, [anyDirty, applyOpenedProject, projectPath, settings.lastProjectPath]);

  const setActiveTab = useCallback((path: string) => {
    setOpenPath(path);
  }, []);

  const openFile = useCallback(
    async (path: string) => {
      if (!projectPath) return;
      try {
        if (isPdfProjectFile(path)) {
          await loadPreview(projectPath, path);
          setMessage(null);
          return;
        }
        if (!isTextProjectFile(path)) {
          setMessage(`Cannot open ${path} in the editor.`);
          return;
        }
        const existing = tabs.find((tab) => tab.path === path);
        if (existing) {
          setOpenPath(path);
          setMessage(null);
          return;
        }
        await loadText(projectPath, path);
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not open that file.");
      }
    },
    [loadPreview, loadText, projectPath, tabs],
  );

  const setOpenContent = useCallback(
    (value: string) => {
      if (!openPath) return;
      setTabs((current) =>
        current.map((tab) => (tab.path === openPath ? { ...tab, content: value } : tab)),
      );
    },
    [openPath],
  );

  const saveOpenFile = useCallback(async () => {
    if (!projectPath || !openPath || !activeTab) return;
    setSaving(true);
    try {
      await writeText(projectPath, openPath, activeTab.content);
      setTabs((current) =>
        current.map((tab) => (tab.path === openPath ? { ...tab, savedContent: tab.content } : tab)),
      );
      setMessage(`Saved ${openPath}`);
      await refreshTree();
      if (isTexPath(openPath)) scheduleCompileOnSave();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }, [activeTab, openPath, projectPath, refreshTree, scheduleCompileOnSave]);

  const saveAll = useCallback(async () => {
    if (!projectPath) return;
    setSaving(true);
    try {
      let savedTex = false;
      for (const tab of tabs) {
        if (!tabDirty(tab)) continue;
        await writeText(projectPath, tab.path, tab.content);
        if (isTexPath(tab.path)) savedTex = true;
      }
      setTabs((current) => current.map((tab) => ({ ...tab, savedContent: tab.content })));
      setMessage("Saved all open files");
      await refreshTree();
      if (savedTex) scheduleCompileOnSave();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save all files.");
    } finally {
      setSaving(false);
    }
  }, [projectPath, refreshTree, scheduleCompileOnSave, tabs]);

  const closeTab = useCallback(
    async (path: string) => {
      const tab = tabs.find((item) => item.path === path);
      if (!tab) return;
      if (tabDirty(tab)) {
        if (settings.autosave && projectPath) {
          await writeText(projectPath, tab.path, tab.content);
        } else {
          const proceed = window.confirm(`${path} has unsaved changes. Close anyway?`);
          if (!proceed) return;
        }
      }
      setTabs((current) => {
        const next = current.filter((item) => item.path !== path);
        if (openPath === path) {
          setOpenPath(next[next.length - 1]?.path ?? null);
        }
        return next;
      });
    },
    [openPath, projectPath, settings.autosave, tabs],
  );

  useEffect(() => {
    if (!settings.autosave || !dirty || !projectPath || !openPath || !activeTab) return;
    const handle = window.setTimeout(() => {
      void saveOpenFile();
    }, settings.autosaveDelayMs);
    return () => window.clearTimeout(handle);
  }, [
    activeTab,
    dirty,
    openPath,
    projectPath,
    saveOpenFile,
    settings.autosave,
    settings.autosaveDelayMs,
  ]);

  const createFileInProject = useCallback(
    async (relativePath: string) => {
      if (!projectPath) return;
      await companionCreateFile(projectPath, relativePath, "% new file\n");
      await refreshTree();
      await openFile(relativePath);
    },
    [openFile, projectPath, refreshTree],
  );

  const createFolderInProject = useCallback(
    async (relativePath: string) => {
      if (!projectPath) return;
      await createDir(projectPath, relativePath);
      await refreshTree();
    },
    [projectPath, refreshTree],
  );

  const renameEntry = useCallback(
    async (from: string, to: string) => {
      if (!projectPath) return;
      const renamed = await renamePath(projectPath, from, to);
      setTabs((current) =>
        current.map((tab) => (tab.path === from ? { ...tab, path: renamed.path } : tab)),
      );
      if (openPath === from) setOpenPath(renamed.path);
      if (previewPath === from) setPreviewPath(renamed.path);
      await refreshTree();
    },
    [openPath, previewPath, projectPath, refreshTree],
  );

  const deleteEntryInProject = useCallback(
    async (target: string) => {
      if (!projectPath) return;
      if (!window.confirm(`Delete ${target}?`)) return;
      await deletePath(projectPath, target);
      setTabs((current) => current.filter((tab) => tab.path !== target));
      if (openPath === target) setOpenPath(null);
      if (previewPath === target) {
        setPreviewPath(null);
        setPreviewBytes(null);
      }
      await refreshTree();
    },
    [openPath, previewPath, projectPath, refreshTree],
  );

  const cleanArtifacts = useCallback(async () => {
    if (!projectPath) {
      setMessage("Open a project before cleaning.");
      return;
    }
    if (!window.confirm("Delete TeX auxiliary files (.aux, .log, .synctex.gz, …)? PDF is kept.")) {
      return;
    }
    try {
      const result = await cleanProject({
        path: projectPath,
        outputDir: settings.outputDir || null,
      });
      setMessage(`Cleaned ${result.count} auxiliary file(s).`);
      await refreshTree();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Clean failed.");
    }
  }, [projectPath, refreshTree, settings.outputDir]);

  const compile = useCallback(async () => {
    if (!projectPath) {
      setMessage("Open a project before compiling.");
      return;
    }
    if (!companionOnline) {
      setMessage("Companion offline — start npm run companion.");
      return;
    }
    if (!texStatus?.ok) {
      setMessage(
        texStatus?.installHint ??
          "latexmk was not found. Install TeX Live or set TeX bin directory in Settings.",
      );
      setSettingsOpen(true);
      return;
    }
    if (buildStateRef.current === "running") {
      setMessage("A build is already running.");
      return;
    }
    if (compileOnSaveTimer.current) {
      window.clearTimeout(compileOnSaveTimer.current);
      compileOnSaveTimer.current = null;
    }
    if (settings.shellEscape) {
      const ok = window.confirm(
        "shell-escape is ON. TeX may run external programs. Continue compiling?",
      );
      if (!ok) return;
    }
    if (anyDirty) await saveAll();

    const rootFile = settings.rootFile || openPath || "main.tex";
    const engine = settings.engine;
    setBuildState("running");
    setBuildStartedAt(Date.now());
    setBuildLog("");
    setBuildResult(null);
    setDiagnostics([]);
    setBottomTab("log");
    setMessage(`Compiling ${rootFile} with ${engine}…`);

    try {
      const started = await startCompile({
        projectPath,
        rootFile,
        engine,
        shellEscape: settings.shellEscape,
        synctex: settings.synctex,
        outputDir: settings.outputDir || null,
        texBinDir: settings.texBinDir || null,
      });
      jobIdRef.current = started.jobId;
      stopStreamRef.current?.();
      stopStreamRef.current = streamCompile(started.jobId, {
        onLog: ({ text }) => setBuildLog((current) => current + text),
        onDone: (result) => {
          setBuildResult(result);
          setBuildLog(result.log);
          setDiagnostics(parseLatexLog(result.log));
          const cancelled = Boolean(result.signal);
          setBuildState(result.ok ? "success" : cancelled ? "cancelled" : "failed");
          setBuildStartedAt(null);
          setBuildHistory((current) =>
            appendBuildHistory(current, {
              at: Date.now(),
              engine,
              rootFile,
              ok: result.ok,
              cancelled,
              durationMs: result.durationMs,
              code: result.code,
            }),
          );
          setMessage(
            result.ok
              ? `Build ok in ${(result.durationMs / 1000).toFixed(1)}s`
              : `Build failed (exit ${result.code ?? "?"})`,
          );
          jobIdRef.current = null;
          if (!result.ok) setBottomTab("problems");
          if (result.ok && result.pdfRelative) {
            void loadPreview(projectPath, result.pdfRelative.replace(/\\/g, "/"));
          }
          void refreshTree();
        },
        onError: (error) => {
          setBuildState("failed");
          setBuildStartedAt(null);
          setMessage(error.message);
        },
      });
    } catch (error) {
      setBuildState("failed");
      setBuildStartedAt(null);
      setMessage(error instanceof Error ? error.message : "Compile failed to start.");
    }
  }, [
    anyDirty,
    companionOnline,
    loadPreview,
    openPath,
    projectPath,
    refreshTree,
    saveAll,
    settings.engine,
    settings.outputDir,
    settings.rootFile,
    settings.shellEscape,
    settings.synctex,
    settings.texBinDir,
    texStatus,
  ]);

  useEffect(() => {
    compileRef.current = compile;
  }, [compile]);

  const stopCompile = useCallback(async () => {
    try {
      await cancelCompile({
        jobId: jobIdRef.current ?? undefined,
        projectPath: projectPath ?? undefined,
      });
      setBuildState("cancelled");
      setBuildStartedAt(null);
      setMessage("Build cancelled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not stop the build.");
    }
  }, [projectPath]);

  const jumpToDiagnostic = useCallback((diagnostic: Diagnostic) => {
    if (!diagnostic.file || !diagnostic.line) {
      setMessage(diagnostic.message);
      return;
    }
    setJumpRequest({
      path: diagnostic.file.replace(/\\/g, "/"),
      line: diagnostic.line,
      token: Date.now(),
    });
  }, []);

  const jumpToLine = useCallback(
    (line: number, path?: string) => {
      const target = path ?? openPath;
      if (!target) return;
      setJumpRequest({ path: target, line, token: Date.now() });
    },
    [openPath],
  );

  const clearJumpRequest = useCallback(() => setJumpRequest(null), []);
  const clearPdfFocus = useCallback(() => setPdfFocus(null), []);
  const clearBuildHistory = useCallback(() => {
    setBuildHistory([]);
    persistBuildHistory([]);
  }, []);

  const openPdfExternally = useCallback(async () => {
    if (!projectPath || !previewPath) {
      setMessage("No PDF to open.");
      return;
    }
    try {
      const result = await openPdfInOs({ path: projectPath, file: previewPath });
      setMessage(`Opened ${result.path}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open PDF in the OS.");
    }
  }, [previewPath, projectPath]);

  const syncTexForward = useCallback(
    async (line: number, column = 1) => {
      if (!projectPath || !openPath || !previewPath) {
        setMessage("Open a TeX file and PDF before SyncTeX.");
        return;
      }
      if (!settings.synctex) {
        setMessage("Enable SyncTeX in Settings, then recompile.");
        return;
      }
      try {
        const result = await synctexForward({
          path: projectPath,
          texRelative: openPath,
          pdfRelative: previewPath,
          line,
          column,
          outputDir: settings.outputDir || null,
          texBinDir: settings.texBinDir || null,
        });
        setPdfFocus(result);
        setMessage(`SyncTeX → page ${result.page}`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Forward SyncTeX failed.");
      }
    },
    [openPath, previewPath, projectPath, settings.outputDir, settings.synctex, settings.texBinDir],
  );

  const syncTexInverse = useCallback(
    async (page: number, x: number, y: number) => {
      if (!projectPath || !previewPath || !settings.synctex) return;
      try {
        const result = await synctexInverse({
          path: projectPath,
          pdfRelative: previewPath,
          page,
          x,
          y,
          outputDir: settings.outputDir || null,
          texBinDir: settings.texBinDir || null,
        });
        setJumpRequest({
          path: result.file.replace(/^\.\//, ""),
          line: result.line,
          token: Date.now(),
        });
        setMessage(`SyncTeX ← ${result.file}:${result.line}`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Inverse SyncTeX failed.");
      }
    },
    [previewPath, projectPath, settings.outputDir, settings.synctex, settings.texBinDir],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      companionOnline,
      status,
      message,
      projectPath,
      projectName,
      tree,
      tabs,
      openPath,
      openContent,
      dirty,
      anyDirty,
      saving,
      previewPath,
      previewBytes,
      settings,
      texStatus,
      buildState,
      buildLog,
      buildStartedAt,
      buildResult,
      buildHistory,
      diagnostics,
      diagnosticFilter,
      sidebarCollapsed,
      settingsOpen,
      bottomTab,
      jumpRequest,
      pdfFocus,
      cursorPosition,
      openProject,
      openProjectPicker,
      openRecent,
      newProjectFromTemplate,
      openFile,
      closeTab,
      setActiveTab,
      setOpenContent,
      saveOpenFile,
      saveAll,
      refreshTree,
      createFile: createFileInProject,
      createFolder: createFolderInProject,
      renameEntry,
      deleteEntry: deleteEntryInProject,
      cleanArtifacts,
      compile,
      stopCompile,
      updateSettings,
      setSidebarCollapsed,
      setSettingsOpen,
      setBottomTab,
      setDiagnosticFilter,
      setCursorPosition,
      jumpToDiagnostic,
      jumpToLine,
      clearJumpRequest,
      refreshTexStatus,
      openPdfExternally,
      syncTexForward,
      syncTexInverse,
      clearPdfFocus,
      clearBuildHistory,
    }),
    [
      anyDirty,
      bottomTab,
      buildHistory,
      buildLog,
      buildResult,
      buildStartedAt,
      buildState,
      cleanArtifacts,
      clearBuildHistory,
      clearJumpRequest,
      clearPdfFocus,
      closeTab,
      companionOnline,
      compile,
      createFileInProject,
      createFolderInProject,
      cursorPosition,
      deleteEntryInProject,
      diagnosticFilter,
      diagnostics,
      dirty,
      jumpRequest,
      jumpToDiagnostic,
      jumpToLine,
      message,
      newProjectFromTemplate,
      openContent,
      openFile,
      openPath,
      openPdfExternally,
      openProject,
      openProjectPicker,
      openRecent,
      pdfFocus,
      previewBytes,
      previewPath,
      projectName,
      projectPath,
      refreshTexStatus,
      refreshTree,
      renameEntry,
      saveAll,
      saveOpenFile,
      saving,
      setActiveTab,
      setOpenContent,
      settings,
      settingsOpen,
      sidebarCollapsed,
      status,
      stopCompile,
      syncTexForward,
      syncTexInverse,
      tabs,
      texStatus,
      tree,
      updateSettings,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
