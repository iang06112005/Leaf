import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  cancelCompile,
  companionHealth,
  createDir,
  createFile as companionCreateFile,
  deletePath,
  fetchTree,
  getTexStatus,
  openProject as companionOpenProject,
  readBinary,
  readText,
  renamePath,
  startCompile,
  streamCompile,
  writeText,
  type CompanionTreeNode,
  type CompileResult,
  type TexStatus,
} from "../services/companion";
import { parseLatexLog, type Diagnostic } from "../services/diagnostics";
import { isPdfProjectFile, isTextProjectFile } from "../services/fileKinds";
import { findPreferredPdf, findPreferredTex } from "../services/filesystem";
import { loadSettings, saveSettings, type AppSettings } from "../services/settings";
import {
  WorkspaceContext,
  type BuildState,
  type WorkspaceContextValue,
  type WorkspaceStatus,
} from "./workspace-context";

function flattenFiles(nodes: CompanionTreeNode[]): { name: string; path: string }[] {
  const files: { name: string; path: string }[] = [];
  for (const node of nodes) {
    if (node.kind === "file") files.push(node);
    else files.push(...flattenFiles(node.children));
  }
  return files;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [companionOnline, setCompanionOnline] = useState(false);
  const [status, setStatus] = useState<WorkspaceStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [tree, setTree] = useState<CompanionTreeNode[]>([]);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [openContent, setOpenContentState] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewBytes, setPreviewBytes] = useState<Uint8Array | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [texStatus, setTexStatus] = useState<TexStatus | null>(null);
  const [buildState, setBuildState] = useState<BuildState>("idle");
  const [buildLog, setBuildLog] = useState("");
  const [buildResult, setBuildResult] = useState<CompileResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jumpRequest, setJumpRequest] = useState<WorkspaceContextValue["jumpRequest"]>(null);
  const jobIdRef = useRef<string | null>(null);
  const stopStreamRef = useRef<(() => void) | null>(null);
  const pollRef = useRef<number | null>(null);

  const dirty = openPath !== null && openContent !== savedContent;

  const refreshTexStatus = useCallback(async () => {
    if (!(await companionHealth())) {
      setCompanionOnline(false);
      setTexStatus(null);
      return;
    }
    setCompanionOnline(true);
    setTexStatus(await getTexStatus(settings.texBinDir || undefined));
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
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const loadPreview = useCallback(async (root: string, file: string) => {
    const bytes = await readBinary(root, file);
    setPreviewPath(file);
    setPreviewBytes(bytes);
  }, []);

  const loadText = useCallback(async (root: string, file: string) => {
    const result = await readText(root, file);
    setOpenPath(file);
    setOpenContentState(result.content);
    setSavedContent(result.content);
  }, []);

  const refreshTree = useCallback(async () => {
    if (!projectPath) return;
    const result = await fetchTree(projectPath);
    setTree(result.tree);
  }, [projectPath]);

  // Poll tree for external changes while a project is open.
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
        const opened = await companionOpenProject(
          explicitPath || settings.lastProjectPath || undefined,
        );
        setProjectPath(opened.path);
        setProjectName(opened.name);
        setTree(opened.tree);
        setOpenPath(null);
        setOpenContentState("");
        setSavedContent("");
        setPreviewPath(null);
        setPreviewBytes(null);
        setBuildLog("");
        setBuildResult(null);
        setDiagnostics([]);
        setBuildState("idle");
        updateSettings({ lastProjectPath: opened.path });

        const preferredRoot =
          settings.rootFile &&
          flattenFiles(opened.tree).some((file) => file.path === settings.rootFile)
            ? settings.rootFile
            : findPreferredTex(opened.tree);
        if (preferredRoot) {
          await loadText(opened.path, preferredRoot);
          if (!settings.rootFile) updateSettings({ rootFile: preferredRoot });
        }

        const pdf = findPreferredPdf(opened.tree);
        if (pdf) await loadPreview(opened.path, pdf);

        setStatus("ready");
        setMessage(null);
        await refreshTexStatus();
      } catch (error) {
        setStatus(projectPath ? "ready" : "error");
        setMessage(error instanceof Error ? error.message : "Could not open that project.");
      }
    },
    [
      loadPreview,
      loadText,
      projectPath,
      refreshTexStatus,
      settings.lastProjectPath,
      settings.rootFile,
      updateSettings,
    ],
  );

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
        if (dirty) {
          // Autosave first when enabled.
          if (settings.autosave && openPath) {
            await writeText(projectPath, openPath, openContent);
            setSavedContent(openContent);
          } else {
            const proceed = window.confirm("Discard unsaved changes and open the other file?");
            if (!proceed) return;
          }
        }
        await loadText(projectPath, path);
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not open that file.");
      }
    },
    [dirty, loadPreview, loadText, openContent, openPath, projectPath, settings.autosave],
  );

  const setOpenContent = useCallback((value: string) => {
    setOpenContentState(value);
  }, []);

  const saveOpenFile = useCallback(async () => {
    if (!projectPath || !openPath) return;
    setSaving(true);
    try {
      await writeText(projectPath, openPath, openContent);
      setSavedContent(openContent);
      setMessage(`Saved ${openPath}`);
      await refreshTree();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }, [openContent, openPath, projectPath, refreshTree]);

  // Autosave debounce
  useEffect(() => {
    if (!settings.autosave || !dirty || !projectPath || !openPath) return;
    const handle = window.setTimeout(() => {
      void saveOpenFile();
    }, settings.autosaveDelayMs);
    return () => window.clearTimeout(handle);
  }, [
    dirty,
    openContent,
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
      if (openPath === from) {
        setOpenPath(renamed.path);
      }
      if (previewPath === from) {
        setPreviewPath(renamed.path);
      }
      await refreshTree();
    },
    [openPath, previewPath, projectPath, refreshTree],
  );

  const deleteEntryInProject = useCallback(
    async (target: string) => {
      if (!projectPath) return;
      if (!window.confirm(`Delete ${target}?`)) return;
      await deletePath(projectPath, target);
      if (openPath === target) {
        setOpenPath(null);
        setOpenContentState("");
        setSavedContent("");
      }
      if (previewPath === target) {
        setPreviewPath(null);
        setPreviewBytes(null);
      }
      await refreshTree();
    },
    [openPath, previewPath, projectPath, refreshTree],
  );

  const compile = useCallback(async () => {
    if (!projectPath) {
      setMessage("Open a project before compiling.");
      return;
    }
    if (!companionOnline) {
      setMessage("Companion offline — start npm run companion.");
      return;
    }
    if (settings.shellEscape) {
      const ok = window.confirm(
        "shell-escape is ON. TeX may run external programs. Continue compiling?",
      );
      if (!ok) return;
    }
    if (dirty && openPath) {
      await saveOpenFile();
    }

    const rootFile = settings.rootFile || openPath || "main.tex";
    setBuildState("running");
    setBuildLog("");
    setBuildResult(null);
    setDiagnostics([]);
    setMessage(`Compiling ${rootFile}…`);

    try {
      const started = await startCompile({
        projectPath,
        rootFile,
        engine: settings.engine,
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
          setBuildState(result.ok ? "success" : result.signal ? "cancelled" : "failed");
          setMessage(
            result.ok
              ? `Build ok in ${(result.durationMs / 1000).toFixed(1)}s`
              : `Build failed (exit ${result.code ?? "?"})`,
          );
          jobIdRef.current = null;
          if (result.ok && result.pdfRelative) {
            void loadPreview(projectPath, result.pdfRelative.replace(/\\/g, "/"));
          }
          void refreshTree();
        },
        onError: (error) => {
          setBuildState("failed");
          setMessage(error.message);
        },
      });
    } catch (error) {
      setBuildState("failed");
      setMessage(error instanceof Error ? error.message : "Compile failed to start.");
    }
  }, [
    companionOnline,
    dirty,
    loadPreview,
    openPath,
    projectPath,
    refreshTree,
    saveOpenFile,
    settings.engine,
    settings.outputDir,
    settings.rootFile,
    settings.shellEscape,
    settings.synctex,
    settings.texBinDir,
  ]);

  const stopCompile = useCallback(async () => {
    try {
      await cancelCompile({
        jobId: jobIdRef.current ?? undefined,
        projectPath: projectPath ?? undefined,
      });
      setBuildState("cancelled");
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

  const clearJumpRequest = useCallback(() => setJumpRequest(null), []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      companionOnline,
      status,
      message,
      projectPath,
      projectName,
      tree,
      openPath,
      openContent,
      dirty,
      saving,
      previewPath,
      previewBytes,
      settings,
      texStatus,
      buildState,
      buildLog,
      buildResult,
      diagnostics,
      sidebarCollapsed,
      settingsOpen,
      jumpRequest,
      openProject,
      openFile,
      setOpenContent,
      saveOpenFile,
      refreshTree,
      createFile: createFileInProject,
      createFolder: createFolderInProject,
      renameEntry,
      deleteEntry: deleteEntryInProject,
      compile,
      stopCompile,
      updateSettings,
      setSidebarCollapsed,
      setSettingsOpen,
      jumpToDiagnostic,
      clearJumpRequest,
      refreshTexStatus,
    }),
    [
      buildLog,
      buildResult,
      buildState,
      clearJumpRequest,
      companionOnline,
      compile,
      createFileInProject,
      createFolderInProject,
      deleteEntryInProject,
      diagnostics,
      dirty,
      jumpRequest,
      jumpToDiagnostic,
      message,
      openContent,
      openFile,
      openPath,
      openProject,
      previewBytes,
      previewPath,
      projectName,
      projectPath,
      refreshTexStatus,
      refreshTree,
      renameEntry,
      saveOpenFile,
      saving,
      setOpenContent,
      settings,
      settingsOpen,
      sidebarCollapsed,
      status,
      stopCompile,
      texStatus,
      tree,
      updateSettings,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
