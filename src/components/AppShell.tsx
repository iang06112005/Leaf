import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspace } from "../workspace/useWorkspace";
import { CommandPalette } from "./CommandPalette";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { EditorPane } from "./EditorPane";
import { FindInFiles } from "./FindInFiles";
import { PreviewPane } from "./PreviewPane";
import { SettingsModal } from "./SettingsModal";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { Toolbar } from "./Toolbar";

export function AppShell() {
  const { sidebarCollapsed, compile, saveOpenFile, saveAll, buildState, stopCompile } =
    useWorkspace();
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [previewWidth, setPreviewWidth] = useState(420);
  const [diagHeight, setDiagHeight] = useState(220);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const dragging = useRef<"sidebar" | "preview" | "diag" | null>(null);

  const onMouseMove = useCallback((event: MouseEvent) => {
    if (dragging.current === "sidebar") {
      setSidebarWidth(Math.min(480, Math.max(180, event.clientX)));
    } else if (dragging.current === "preview") {
      const fromRight = window.innerWidth - event.clientX;
      setPreviewWidth(Math.min(640, Math.max(260, fromRight)));
    } else if (dragging.current === "diag") {
      const fromBottom = window.innerHeight - event.clientY - 28;
      setDiagHeight(Math.min(480, Math.max(120, fromBottom)));
    }
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFindOpen(true);
        return;
      }
      if (
        meta &&
        (event.key.toLowerCase() === "k" || (event.shiftKey && event.key.toLowerCase() === "p"))
      ) {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (meta && event.key === "Enter") {
        event.preventDefault();
        if (buildState === "running") void stopCompile();
        else void compile();
      }
      if (meta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (event.shiftKey) void saveAll();
        else void saveOpenFile();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [buildState, compile, saveAll, saveOpenFile, stopCompile]);

  const mainColumns = sidebarCollapsed
    ? `minmax(0,1fr) 6px ${previewWidth}px`
    : `${sidebarWidth}px 6px minmax(0,1fr) 6px ${previewWidth}px`;

  return (
    <div className="grid h-full min-h-0 grid-rows-[2.75rem_minmax(0,1fr)_1.75rem] bg-[var(--tf-bg)] text-[var(--tf-text)] antialiased">
      <Toolbar onOpenPalette={() => setPaletteOpen(true)} />
      <div
        className="grid min-h-0"
        style={{ gridTemplateRows: `minmax(0,1fr) 6px ${diagHeight}px` }}
      >
        <div className="grid min-h-0" style={{ gridTemplateColumns: mainColumns }}>
          {!sidebarCollapsed ? <Sidebar /> : null}
          {!sidebarCollapsed ? (
            <div
              role="separator"
              aria-orientation="vertical"
              className="cursor-col-resize bg-[var(--tf-panel)] hover:bg-[var(--tf-accent)]"
              onMouseDown={() => {
                dragging.current = "sidebar";
              }}
            />
          ) : null}
          <EditorPane />
          <div
            role="separator"
            aria-orientation="vertical"
            className="cursor-col-resize bg-[var(--tf-panel)] hover:bg-[var(--tf-accent)]"
            onMouseDown={() => {
              dragging.current = "preview";
            }}
          />
          <PreviewPane />
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="cursor-row-resize bg-[var(--tf-panel)] hover:bg-[var(--tf-accent)]"
          onMouseDown={() => {
            dragging.current = "diag";
          }}
        />
        <DiagnosticsPanel />
      </div>
      <StatusBar />
      <SettingsModal />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onFindInFiles={() => {
          setPaletteOpen(false);
          setFindOpen(true);
        }}
      />
      <FindInFiles open={findOpen} onClose={() => setFindOpen(false)} />
    </div>
  );
}
