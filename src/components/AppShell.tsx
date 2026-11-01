import { appLabel } from "../appLabel";
import { EditorPane } from "./EditorPane";
import { PreviewPane } from "./PreviewPane";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";

export function AppShell() {
  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_1.75rem] bg-zinc-950 text-zinc-100 antialiased">
      <div className="grid min-h-0 grid-cols-1 overflow-auto md:grid-cols-[15rem_minmax(0,1fr)_minmax(16rem,0.85fr)] md:overflow-hidden">
        <Sidebar />
        <EditorPane />
        <PreviewPane />
      </div>
      <StatusBar appLabel={appLabel()} />
    </div>
  );
}
