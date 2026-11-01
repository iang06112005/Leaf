import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

type PdfPreviewProps = {
  path: string;
  data: Uint8Array;
};

export function PdfPreview({ path, data }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLabel, setPageLabel] = useState("Loading PDF…");

  useEffect(() => {
    let cancelled = false;
    let documentProxy: PDFDocumentProxy | null = null;

    async function render() {
      setError(null);
      setPageLabel("Loading PDF…");

      try {
        // Copy the bytes. pdf.js may transfer the underlying buffer.
        const loadingTask = getDocument({ data: data.slice() });
        documentProxy = await loadingTask.promise;
        if (cancelled) return;

        const page = await documentProxy.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1.25 });
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Could not create a 2D canvas context.");
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, canvas, viewport }).promise;
        if (cancelled) return;

        setPageLabel(`${path} · page 1 of ${documentProxy.numPages}`);
      } catch (renderError) {
        if (cancelled) return;
        setError(renderError instanceof Error ? renderError.message : "Could not render that PDF.");
      }
    }

    void render();

    return () => {
      cancelled = true;
      void documentProxy?.cleanup();
    };
  }, [data, path]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <p className="truncate text-xs text-zinc-400">{pageLabel}</p>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="min-h-0 flex-1 overflow-auto rounded border border-zinc-800 bg-zinc-950 p-2">
        <canvas ref={canvasRef} className="mx-auto max-w-full" />
      </div>
    </div>
  );
}
