import fs from "node:fs/promises";
import path from "node:path";
import { assertAbsolutePath } from "./paths.mjs";

export const ARTICLE_TEMPLATE = {
  id: "article",
  name: "Article",
  description: "Simple article with title, section, and a sample paragraph.",
  files: {
    "main.tex": `\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}

\\title{Untitled}
\\author{}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}
Write here.

\\end{document}
`,
    "README.md": `# New TexFlow project

Ordinary folder. Edit \`main.tex\` and compile with latexmk / TexFlow.
`,
  },
};

export const TEMPLATES = [ARTICLE_TEMPLATE];

export function getTemplate(id = "article") {
  const found = TEMPLATES.find((item) => item.id === id) ?? ARTICLE_TEMPLATE;
  return found;
}

/**
 * Create a new ordinary project directory from a built-in template.
 * Fails if the target exists and is not empty (unless force).
 */
export async function createProjectFromTemplate({
  projectPath,
  templateId = "article",
  force = false,
}) {
  const root = assertAbsolutePath(projectPath);
  const template = getTemplate(templateId);

  let exists = true;
  try {
    await fs.access(root);
  } catch {
    exists = false;
  }

  if (exists) {
    const entries = await fs.readdir(root);
    if (entries.length > 0 && !force) {
      throw new Error("That folder already has files. Choose an empty directory.");
    }
  } else {
    await fs.mkdir(root, { recursive: true });
  }

  const written = [];
  for (const [relative, content] of Object.entries(template.files)) {
    const absolute = path.join(root, relative);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content, { encoding: "utf8", flag: force ? "w" : "wx" });
    written.push(relative.replace(/\\/g, "/"));
  }

  return {
    path: root,
    name: path.basename(root),
    templateId: template.id,
    files: written,
  };
}
