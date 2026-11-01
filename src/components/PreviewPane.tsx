import { FileText } from "lucide-react";
import { Panel } from "./ui/Panel";

export function PreviewPane() {
  return (
    <Panel title="Preview" icon={FileText} className="min-h-40 bg-zinc-900 md:min-h-0">
      <p>No preview.</p>
    </Panel>
  );
}
