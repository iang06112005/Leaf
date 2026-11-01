import { useCallback, useMemo, useState, type ReactNode } from "react";
import { isPdfProjectFile, isTextProjectFile } from "../services/fileKinds";
import {
  buildProjectTree,
  canOpenLocalProject,
  findPreferredPdf,
  findPreferredTex,
  pickProjectDirectory,
  projectDisplayName,
  readProjectBytes,
  readProjectText,
  writeProjectText,
} from "../services/filesystem";
import {
  WorkspaceContext,
  type WorkspaceContextValue,
  type WorkspaceStatus,
} from "./workspace-context";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WorkspaceStatus>(() =>
    canOpenLocalProject() ? "idle" : "unsupported",
  );
  const [message, setMessage] = useState<string | null>(() =>
    canOpenLocalProject() ? null : "Open project needs Chrome or Edge (File System Access API).",
  );
  const [root, setRoot] = useState<FileSystemDirectoryHandle | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [tree, setTree] = useState<WorkspaceContextValue["tree"]>([]);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [openContent, setOpenContentState] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewBytes, setPreviewBytes] = useState<Uint8Array | null>(null);

  const dirty = openPath !== null && openContent !== savedContent;

  const loadPreview = useCallback(async (directory: FileSystemDirectoryHandle, path: string) => {
    const bytes = await readProjectBytes(directory, path);
    setPreviewPath(path);
    setPreviewBytes(bytes);
  }, []);

  const loadText = useCallback(async (directory: FileSystemDirectoryHandle, path: string) => {
    const text = await readProjectText(directory, path);
    setOpenPath(path);
    setOpenContentState(text);
    setSavedContent(text);
  }, []);

  const refreshTree = useCallback(async () => {
    if (!root) return;
    const nextTree = await buildProjectTree(root);
    setTree(nextTree);
  }, [root]);

  const openProject = useCallback(async () => {
    if (!canOpenLocalProject()) {
      setStatus("unsupported");
      setMessage("Open project needs Chrome or Edge (File System Access API).");
      return;
    }

    setStatus("loading");
    setMessage("Opening folder…");

    try {
      const directory = await pickProjectDirectory();
      const nextTree = await buildProjectTree(directory);
      setRoot(directory);
      setProjectName(projectDisplayName(directory));
      setTree(nextTree);
      setOpenPath(null);
      setOpenContentState("");
      setSavedContent("");
      setPreviewPath(null);
      setPreviewBytes(null);

      const tex = findPreferredTex(nextTree);
      if (tex) {
        await loadText(directory, tex);
      }

      const pdf = findPreferredPdf(nextTree);
      if (pdf) {
        await loadPreview(directory, pdf);
      }

      setStatus("ready");
      setMessage(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus(root ? "ready" : "idle");
        setMessage(null);
        return;
      }

      setStatus(root ? "ready" : "error");
      setMessage(error instanceof Error ? error.message : "Could not open that folder.");
    }
  }, [loadPreview, loadText, root]);

  const openFile = useCallback(
    async (path: string) => {
      if (!root) return;

      try {
        if (isPdfProjectFile(path)) {
          await loadPreview(root, path);
          setMessage(null);
          return;
        }

        if (!isTextProjectFile(path)) {
          setMessage(`Cannot open ${path} in the editor yet.`);
          return;
        }

        if (dirty) {
          const proceed = window.confirm(
            "The current file has unsaved changes. Discard them and open the other file?",
          );
          if (!proceed) return;
        }

        await loadText(root, path);
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not open that file.");
      }
    },
    [dirty, loadPreview, loadText, root],
  );

  const setOpenContent = useCallback((value: string) => {
    setOpenContentState(value);
  }, []);

  const saveOpenFile = useCallback(async () => {
    if (!root || !openPath) return;

    try {
      await writeProjectText(root, openPath, openContent);
      setSavedContent(openContent);
      setMessage(`Saved ${openPath}`);
      await refreshTree();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save that file.");
    }
  }, [openContent, openPath, refreshTree, root]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      status,
      message,
      projectName,
      tree,
      openPath,
      openContent,
      dirty,
      previewPath,
      previewBytes,
      canOpen: canOpenLocalProject(),
      openProject,
      openFile,
      setOpenContent,
      saveOpenFile,
      refreshTree,
    }),
    [
      dirty,
      message,
      openContent,
      openFile,
      openPath,
      openProject,
      previewBytes,
      previewPath,
      projectName,
      refreshTree,
      saveOpenFile,
      setOpenContent,
      status,
      tree,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
