import { FileCode2 } from "lucide-react";
import { Panel } from "./ui/Panel";

export function EditorPane() {
  return (
    <Panel
      title="Editor"
      icon={FileCode2}
      className="min-h-64 border-b border-zinc-800 bg-zinc-950 md:min-h-0 md:border-r md:border-b-0"
    >
      <p className="font-mono text-zinc-500">No file open.</p>
    </Panel>
  );
}
