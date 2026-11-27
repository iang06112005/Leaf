use crate::paths::assert_absolute_path;
use serde::Serialize;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

const TEXT_EXT: &[&str] = &[
  ".tex", ".bib", ".cls", ".sty", ".bst", ".md", ".txt", ".json", ".yml", ".yaml", ".toml", ".csv",
];
const SKIP_DIRS: &[&str] = &[".git", "node_modules", ".venv", "venv", "__pycache__", ".texflow"];
const MAX_FILE_BYTES: u64 = 512_000;
const MAX_MATCHES: usize = 200;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
  pub file: String,
  pub line: u32,
  pub column: u32,
  pub preview: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
  pub matches: Vec<SearchMatch>,
  pub truncated: bool,
  pub query: String,
}

fn is_text_file(name: &str) -> bool {
  let lower = name.to_lowercase();
  TEXT_EXT.iter().any(|ext| lower.ends_with(ext))
}

pub fn search_project(
  project_path: &str,
  query: &str,
  max_matches: Option<usize>,
) -> Result<SearchResult, String> {
  let root = assert_absolute_path(project_path)?;
  let needle = query.trim();
  if needle.is_empty() {
    return Ok(SearchResult {
      matches: vec![],
      truncated: false,
      query: String::new(),
    });
  }
  let needle_lower = needle.to_lowercase();
  let limit = max_matches.unwrap_or(MAX_MATCHES).max(1);
  let mut matches = Vec::new();
  let mut truncated = false;

  for entry in WalkDir::new(&root).into_iter().filter_entry(|e| {
    if e.file_type().is_dir() {
      let name = e.file_name().to_string_lossy();
      !SKIP_DIRS.contains(&name.as_ref())
    } else {
      true
    }
  }) {
    if matches.len() >= limit {
      truncated = true;
      break;
    }
    let entry = match entry {
      Ok(e) => e,
      Err(_) => continue,
    };
    if !entry.file_type().is_file() {
      continue;
    }
    let name = entry.file_name().to_string_lossy();
    if !is_text_file(&name) {
      continue;
    }
    let meta = match entry.metadata() {
      Ok(m) => m,
      Err(_) => continue,
    };
    if meta.len() > MAX_FILE_BYTES {
      continue;
    }
    let text = match fs::read_to_string(entry.path()) {
      Ok(t) => t,
      Err(_) => continue,
    };
    let relative = pathdiff(&root, entry.path());
    for (idx, line) in text.split('\n').enumerate() {
      if matches.len() >= limit {
        truncated = true;
        break;
      }
      let lower = line.to_lowercase();
      if let Some(col) = lower.find(&needle_lower) {
        matches.push(SearchMatch {
          file: relative.clone(),
          line: (idx + 1) as u32,
          column: (col + 1) as u32,
          preview: line.chars().take(200).collect(),
        });
      }
    }
  }

  Ok(SearchResult {
    matches,
    truncated,
    query: needle.to_string(),
  })
}

fn pathdiff(root: &Path, file: &Path) -> String {
  file
    .strip_prefix(root)
    .unwrap_or(file)
    .to_string_lossy()
    .replace('\\', "/")
}
