import { FileText } from "lucide-react";
import { useWorkspace } from "../workspace/useWorkspace";
import { PdfPreview } from "./PdfPreview";
import { Panel } from "./ui/Panel";

export function PreviewPane() {
  const { previewPath, previewBytes, buildState } = useWorkspace();

  return (
    <Panel title="Preview" icon={FileText} className="min-h-40 bg-[var(--tf-panel)] md:min-h-0">
      {previewPath && previewBytes ? (
        <PdfPreview path={previewPath} data={previewBytes} />
      ) : (
        <p className="text-sm text-[var(--tf-muted)]">
          No PDF open. Compile successfully to refresh the preview
          {buildState === "running" ? " (build in progress…)" : ""}, or open an existing `.pdf` in
          the tree.
        </p>
      )}
    </Panel>
  );
}
