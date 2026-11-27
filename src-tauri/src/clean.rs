use crate::paths::assert_absolute_path;
use serde::Serialize;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

const AUX_EXTENSIONS: &[&str] = &[
  ".aux",
  ".bbl",
  ".bcf",
  ".blg",
  ".fdb_latexmk",
  ".fls",
  ".lof",
  ".log",
  ".lot",
  ".nav",
  ".out",
  ".snm",
  ".toc",
  ".vrb",
  ".xdv",
  ".idx",
  ".ilg",
  ".ind",
  ".glo",
  ".gls",
  ".acn",
  ".acr",
  ".alg",
];

const SKIP_DIRS: &[&str] = &[".git", "node_modules", ".venv", "venv", "__pycache__", ".texflow"];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanResult {
  pub ok: bool,
  pub removed: Vec<String>,
  pub count: usize,
}

fn matches_aux(name: &str) -> bool {
  let lower = name.to_lowercase();
  if lower.ends_with(".synctex.gz") || lower.ends_with(".run.xml") {
    return true;
  }
  AUX_EXTENSIONS.iter().any(|ext| lower.ends_with(ext))
}

pub fn clean_project_artifacts(
  project_path: &str,
  output_dir: Option<&str>,
) -> Result<CleanResult, String> {
  let root = assert_absolute_path(project_path)?;
  let mut removed = Vec::new();
  walk_clean(&root, &root, &mut removed)?;
  if let Some(dir) = output_dir {
    let out = root.join(dir);
    if out.is_dir() {
      walk_clean(&root, &out, &mut removed)?;
    }
  }
  let count = removed.len();
  Ok(CleanResult {
    ok: true,
    removed,
    count,
  })
}

fn walk_clean(root: &Path, dir: &Path, removed: &mut Vec<String>) -> Result<(), String> {
  for entry in WalkDir::new(dir).into_iter().filter_entry(|e| {
    if e.file_type().is_dir() {
      let name = e.file_name().to_string_lossy();
      !SKIP_DIRS.contains(&name.as_ref())
    } else {
      true
    }
  }) {
    let entry = match entry {
      Ok(e) => e,
      Err(_) => continue,
    };
    if !entry.file_type().is_file() {
      continue;
    }
    let name = entry.file_name().to_string_lossy();
    if !matches_aux(&name) {
      continue;
    }
    let _ = fs::remove_file(entry.path());
    let relative = entry
      .path()
      .strip_prefix(root)
      .unwrap_or(entry.path())
      .to_string_lossy()
      .replace('\\', "/");
    removed.push(relative);
  }
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn detects_aux() {
    assert!(matches_aux("main.aux"));
    assert!(matches_aux("main.synctex.gz"));
    assert!(!matches_aux("main.tex"));
  }
}
