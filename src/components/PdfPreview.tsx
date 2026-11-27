import { useEffect, useMemo, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useWorkspace } from "../workspace/useWorkspace";

GlobalWorkerOptions.workerSrc = pdfWorker;

type PdfPreviewProps = {
  path: string;
  data: Uint8Array;
};

export function PdfPreview({ path, data }: PdfPreviewProps) {
  const { settings, updateSettings, openPdfExternally, syncTexInverse, pdfFocus, clearPdfFocus } =
    useWorkspace();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Loading PDF…");
  const scrollTopRef = useRef(0);
  const dataKey = useMemo(
    () => `${path}:${data.byteLength}:${data[0]}:${data[data.length - 1]}`,
    [data, path],
  );

  useEffect(() => {
    setPage(1);
  }, [dataKey]);

  useEffect(() => {
    let cancelled = false;
    let documentProxy: PDFDocumentProxy | null = null;

    async function renderAll() {
      setError(null);
      setStatus("Loading PDF…");
      const host = containerRef.current;
      if (!host) return;
      scrollTopRef.current = host.scrollTop;
      host.innerHTML = "";

      try {
        const loadingTask = getDocument({ data: data.slice() });
        documentProxy = await loadingTask.promise;
        if (cancelled) return;
        setPageCount(documentProxy.numPages);

        const scale = settings.pdfScale;
        for (let pageNumber = 1; pageNumber <= documentProxy.numPages; pageNumber += 1) {
          const pdfPage = await documentProxy.getPage(pageNumber);
          if (cancelled) return;
          const viewport = pdfPage.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className =
            "mx-auto mb-3 max-w-full cursor-crosshair rounded border border-[var(--tf-border)] bg-white";
          canvas.dataset.page = String(pageNumber);
          canvas.title = "Click for inverse SyncTeX";
          canvas.addEventListener("click", (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * viewport.width;
            // PDF y grows upward; canvas y grows downward.
            const y = ((rect.bottom - event.clientY) / rect.height) * viewport.height;
            void syncTexInverse(pageNumber, x / scale, y / scale);
          });
          host.appendChild(canvas);
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Could not create a 2D canvas context.");
          await pdfPage.render({ canvasContext: context, canvas, viewport }).promise;

          if (search.trim()) {
            const text = await pdfPage.getTextContent();
            const haystack = text.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ")
              .toLowerCase();
            if (haystack.includes(search.trim().toLowerCase())) {
              canvas.classList.add("outline", "outline-2", "outline-amber-400");
            }
          }
        }

        setStatus(`${path} · ${documentProxy.numPages} page(s)`);
        host.scrollTop = scrollTopRef.current;
      } catch (renderError) {
        if (cancelled) return;
        setError(renderError instanceof Error ? renderError.message : "Could not render that PDF.");
      }
    }

    void renderAll();
    return () => {
      cancelled = true;
      void documentProxy?.cleanup();
    };
  }, [data, dataKey, path, search, settings.pdfScale, syncTexInverse]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host || page < 1) return;
    const canvas = host.querySelector(`canvas[data-page="${page}"]`);
    canvas?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    if (!pdfFocus) return;
    setPage(pdfFocus.page);
    const host = containerRef.current;
    const canvas = host?.querySelector(
      `canvas[data-page="${pdfFocus.page}"]`,
    ) as HTMLCanvasElement | null;
    if (canvas) {
      canvas.classList.add("outline", "outline-2", "outline-sky-400");
      canvas.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(() => {
        canvas.classList.remove("outline", "outline-2", "outline-sky-400");
        clearPdfFocus();
      }, 1200);
    } else {
      clearPdfFocus();
    }
  }, [clearPdfFocus, pdfFocus]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--tf-muted)]">
        <span className="truncate">{status}</span>
        <button
          type="button"
          className="rounded border border-[var(--tf-border)] px-2 py-1 hover:bg-[var(--tf-accent)]"
          onClick={() => updateSettings({ pdfScale: Math.max(0.5, settings.pdfScale - 0.1) })}
        >
          −
        </button>
        <button
          type="button"
          className="rounded border border-[var(--tf-border)] px-2 py-1 hover:bg-[var(--tf-accent)]"
          onClick={() => updateSettings({ pdfScale: 1 })}
        >
          Fit
        </button>
        <button
          type="button"
          className="rounded border border-[var(--tf-border)] px-2 py-1 hover:bg-[var(--tf-accent)]"
          onClick={() => updateSettings({ pdfScale: Math.min(3, settings.pdfScale + 0.1) })}
        >
          +
        </button>
        <label className="flex items-center gap-1">
          Page
          <input
            type="number"
            min={1}
            max={Math.max(1, pageCount)}
            className="w-14 rounded border border-[var(--tf-border)] bg-[var(--tf-panel)] px-1 py-0.5"
            value={page}
            onChange={(event) => setPage(Number(event.target.value) || 1)}
          />
          / {pageCount || "?"}
        </label>
        <input
          className="min-w-32 flex-1 rounded border border-[var(--tf-border)] bg-[var(--tf-panel)] px-2 py-1"
          placeholder="Search text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          type="button"
          className="rounded border border-[var(--tf-border)] px-2 py-1 hover:bg-[var(--tf-accent)]"
          onClick={() => {
            void openPdfExternally();
          }}
        >
          Open in OS
        </button>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto rounded border border-[var(--tf-border)] bg-[var(--tf-panel)] p-2"
      />
    </div>
  );
}
