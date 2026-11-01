import { FileText } from "lucide-react";
import { useWorkspace } from "../workspace/useWorkspace";
import { PdfPreview } from "./PdfPreview";
import { Panel } from "./ui/Panel";

export function PreviewPane() {
  const { previewPath, previewBytes } = useWorkspace();

  return (
    <Panel title="Preview" icon={FileText} className="min-h-40 bg-zinc-900 md:min-h-0">
      {previewPath && previewBytes ? (
        <PdfPreview path={previewPath} data={previewBytes} />
      ) : (
        <p className="text-sm text-zinc-400">
          No PDF open. Open a folder that already contains a PDF, or click a `.pdf` file in the
          project tree. Compilation is not part of this milestone.
        </p>
      )}
    </Panel>
  );
}
