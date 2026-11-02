export type LatexSnippet = {
  id: string;
  label: string;
  trigger: string;
  detail: string;
  /** Monaco snippet body with ${1:} tabstops */
  body: string;
};

export const LATEX_SNIPPETS: LatexSnippet[] = [
  {
    id: "section",
    label: "Section",
    trigger: "sec",
    detail: "\\section{…}",
    body: "\\section{${1:title}}\n\\label{sec:${2:label}}\n$0",
  },
  {
    id: "figure",
    label: "Figure",
    trigger: "fig",
    detail: "figure + includegraphics",
    body: [
      "\\begin{figure}[ht]",
      "  \\centering",
      "  \\includegraphics[width=${1:0.7}\\textwidth]{${2:figure.png}}",
      "  \\caption{${3:Caption}}",
      "  \\label{fig:${4:label}}",
      "\\end{figure}",
      "$0",
    ].join("\n"),
  },
  {
    id: "equation",
    label: "Equation",
    trigger: "eq",
    detail: "equation environment",
    body: "\\begin{equation}\n  ${1}\n  \\label{eq:${2:label}}\n\\end{equation}\n$0",
  },
  {
    id: "itemize",
    label: "Itemize",
    trigger: "itz",
    detail: "itemize list",
    body: "\\begin{itemize}\n  \\item ${1}\n  \\item ${2}\n\\end{itemize}\n$0",
  },
  {
    id: "cite",
    label: "Cite",
    trigger: "cite",
    detail: "\\cite{…}",
    body: "\\cite{${1:key}}$0",
  },
];

export function findSnippet(idOrTrigger: string): LatexSnippet | undefined {
  const key = idOrTrigger.toLowerCase();
  return LATEX_SNIPPETS.find((item) => item.id === key || item.trigger.toLowerCase() === key);
}

export function filterSnippets(query: string): LatexSnippet[] {
  const q = query.trim().toLowerCase();
  if (!q) return LATEX_SNIPPETS;
  return LATEX_SNIPPETS.filter(
    (item) =>
      item.id.includes(q) ||
      item.trigger.includes(q) ||
      item.label.toLowerCase().includes(q) ||
      item.detail.toLowerCase().includes(q),
  );
}
