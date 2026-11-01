import { FolderTree } from "lucide-react";
import { Panel } from "./ui/Panel";

export function Sidebar() {
  return (
    <Panel
      title="Project"
      icon={FolderTree}
      className="min-h-40 border-b border-zinc-800 bg-zinc-900 md:min-h-0 md:border-r md:border-b-0"
    >
      <p>No project open.</p>
    </Panel>
  );
}
