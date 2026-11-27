use crate::fsops::build_tree;
use crate::paths::assert_absolute_path;
use serde::Serialize;
use std::fs;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateInfo {
  pub id: String,
  pub name: String,
  pub description: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectResult {
  pub path: String,
  pub name: String,
  pub template_id: String,
  pub files: Vec<String>,
  pub tree: Vec<crate::fsops::TreeNode>,
}

const ARTICLE_TEX: &str = r#"\documentclass[11pt]{article}
\usepackage[utf8]{inputenc}
\usepackage{hyperref}

\title{Untitled}
\author{}
\date{\today}

\begin{document}
\maketitle

\section{Introduction}
Write here.

\end{document}
"#;

const ARTICLE_README: &str = "# New TexFlow project\n\nOrdinary folder. Edit `main.tex` and compile with latexmk / TexFlow.\n";

pub fn list_templates() -> Vec<TemplateInfo> {
  vec![TemplateInfo {
    id: "article".into(),
    name: "Article".into(),
    description: "Simple article with title, section, and a sample paragraph.".into(),
  }]
}

pub fn create_project_from_template(
  project_path: &str,
  template_id: Option<&str>,
  force: bool,
) -> Result<CreateProjectResult, String> {
  let root = assert_absolute_path(project_path)?;
  let template_id = template_id.unwrap_or("article");
  if template_id != "article" {
    return Err(format!("Unknown template: {template_id}"));
  }

  if root.exists() {
    let entries = fs::read_dir(&root).map_err(|e| e.to_string())?;
    if entries.count() > 0 && !force {
      return Err("That folder already has files. Choose an empty directory.".into());
    }
  } else {
    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
  }

  let files = [
    ("main.tex", ARTICLE_TEX),
    ("README.md", ARTICLE_README),
  ];
  let mut written = Vec::new();
  for (relative, content) in files {
    let absolute = root.join(relative);
    if let Some(parent) = absolute.parent() {
      fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    if absolute.exists() && !force {
      return Err(format!("Refusing to overwrite {relative}"));
    }
    fs::write(&absolute, content).map_err(|e| e.to_string())?;
    written.push(relative.replace('\\', "/"));
  }

  let name = root
    .file_name()
    .map(|n| n.to_string_lossy().into_owned())
    .unwrap_or_else(|| root.to_string_lossy().into_owned());
  let tree = build_tree(project_path)?;
  Ok(CreateProjectResult {
    path: root.to_string_lossy().into_owned(),
    name,
    template_id: template_id.into(),
    files: written,
    tree,
  })
}
