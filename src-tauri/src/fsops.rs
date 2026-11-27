use crate::paths::{assert_absolute_path, resolve_project_file};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

const SKIP: &[&str] = &[".git", "node_modules", ".venv", "venv", "__pycache__", ".texflow"];

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum TreeNode {
  #[serde(rename_all = "camelCase")]
  File { name: String, path: String },
  #[serde(rename_all = "camelCase")]
  Directory {
    name: String,
    path: String,
    children: Vec<TreeNode>,
  },
}

pub fn path_exists(project_path: &str) -> Result<bool, String> {
  let root = assert_absolute_path(project_path)?;
  Ok(root.is_dir())
}

pub fn build_tree(project_path: &str) -> Result<Vec<TreeNode>, String> {
  let root = assert_absolute_path(project_path)?;
  walk_dir(&root, "")
}

fn walk_dir(absolute: &Path, prefix: &str) -> Result<Vec<TreeNode>, String> {
  let mut entries = fs::read_dir(absolute)
    .map_err(|e| e.to_string())?
    .filter_map(|e| e.ok())
    .collect::<Vec<_>>();
  entries.sort_by_key(|e| {
    let is_dir = e.file_type().map(|t| t.is_dir()).unwrap_or(false);
    (!is_dir, e.file_name().to_string_lossy().to_lowercase())
  });

  let mut children = Vec::new();
  for entry in entries {
    let name = entry.file_name().to_string_lossy().into_owned();
    let relative = if prefix.is_empty() {
      name.clone()
    } else {
      format!("{prefix}/{name}")
    };
    let file_type = entry.file_type().map_err(|e| e.to_string())?;
    if file_type.is_dir() {
      if SKIP.contains(&name.as_str()) {
        continue;
      }
      children.push(TreeNode::Directory {
        name,
        path: relative.replace('\\', "/"),
        children: walk_dir(&entry.path(), &relative)?,
      });
    } else if file_type.is_file() {
      children.push(TreeNode::File {
        name,
        path: relative.replace('\\', "/"),
      });
    }
  }
  Ok(children)
}

pub fn read_text(project_path: &str, relative: &str) -> Result<String, String> {
  let file = resolve_project_file(project_path, relative)?;
  fs::read_to_string(&file.absolute).map_err(|e| e.to_string())
}

pub fn read_binary(project_path: &str, relative: &str) -> Result<Vec<u8>, String> {
  let file = resolve_project_file(project_path, relative)?;
  fs::read(&file.absolute).map_err(|e| e.to_string())
}

pub fn write_text(project_path: &str, relative: &str, content: &str) -> Result<(), String> {
  let file = resolve_project_file(project_path, relative)?;
  if let Some(parent) = file.absolute.parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }
  fs::write(&file.absolute, content).map_err(|e| e.to_string())
}

pub fn create_file(project_path: &str, relative: &str, content: &str) -> Result<String, String> {
  let file = resolve_project_file(project_path, relative)?;
  if let Some(parent) = file.absolute.parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }
  if file.absolute.exists() {
    return Err("That file already exists.".into());
  }
  fs::write(&file.absolute, content).map_err(|e| e.to_string())?;
  Ok(file.relative)
}

pub fn create_directory(project_path: &str, relative: &str) -> Result<String, String> {
  let file = resolve_project_file(project_path, relative)?;
  fs::create_dir_all(&file.absolute).map_err(|e| e.to_string())?;
  Ok(file.relative)
}

pub fn rename_entry(project_path: &str, from: &str, to: &str) -> Result<String, String> {
  let from_file = resolve_project_file(project_path, from)?;
  let to_file = resolve_project_file(project_path, to)?;
  if let Some(parent) = to_file.absolute.parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }
  fs::rename(&from_file.absolute, &to_file.absolute).map_err(|e| e.to_string())?;
  Ok(to_file.relative)
}

pub fn delete_entry(project_path: &str, relative: &str) -> Result<(), String> {
  let file = resolve_project_file(project_path, relative)?;
  let meta = fs::metadata(&file.absolute).map_err(|e| e.to_string())?;
  if meta.is_dir() {
    fs::remove_dir_all(&file.absolute).map_err(|e| e.to_string())
  } else {
    fs::remove_file(&file.absolute).map_err(|e| e.to_string())
  }
}

pub fn open_project(project_path: &str) -> Result<(PathBuf, String, Vec<TreeNode>), String> {
  let root = assert_absolute_path(project_path)?;
  if !root.is_dir() {
    return Err("That folder does not exist.".into());
  }
  let name = root
    .file_name()
    .map(|n| n.to_string_lossy().into_owned())
    .unwrap_or_else(|| root.to_string_lossy().into_owned());
  let tree = build_tree(project_path)?;
  Ok((root, name, tree))
}
