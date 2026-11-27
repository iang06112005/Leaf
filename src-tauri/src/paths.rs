use std::path::{Component, Path, PathBuf};

#[derive(Debug, Clone)]
pub struct ProjectFile {
  #[allow(dead_code)]
  pub root: PathBuf,
  pub absolute: PathBuf,
  pub relative: String,
}

pub fn assert_absolute_path(project_path: &str) -> Result<PathBuf, String> {
  let trimmed = project_path.trim();
  if trimmed.is_empty() {
    return Err("projectPath is required.".into());
  }
  let path = PathBuf::from(trimmed);
  if !path.is_absolute() {
    return Err("projectPath must be an absolute filesystem path.".into());
  }
  Ok(normalize_path(&path))
}

pub fn resolve_project_file(project_path: &str, relative_file: &str) -> Result<ProjectFile, String> {
  let root = assert_absolute_path(project_path)?;
  let trimmed = relative_file.trim();
  if trimmed.is_empty() {
    return Err("A relative file path is required.".into());
  }
  let relative = trimmed.replace('\\', "/");
  if relative.split('/').any(|part| part == "..") {
    return Err("Relative paths must stay inside the project.".into());
  }
  let absolute = normalize_path(&root.join(Path::new(&relative.replace('/', std::path::MAIN_SEPARATOR_STR))));
  if absolute != root && !absolute.starts_with(&root) {
    return Err("Relative paths must stay inside the project.".into());
  }
  Ok(ProjectFile {
    root,
    absolute,
    relative,
  })
}

pub fn normalize_path(path: &Path) -> PathBuf {
  let mut out = PathBuf::new();
  for component in path.components() {
    match component {
      Component::ParentDir => {
        out.pop();
      }
      Component::CurDir => {}
      other => out.push(other.as_os_str()),
    }
  }
  out
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn rejects_relative_project() {
    assert!(assert_absolute_path("relative/path").is_err());
  }

  #[test]
  fn rejects_traversal() {
    #[cfg(windows)]
    let root = r"C:\projects\demo";
    #[cfg(not(windows))]
    let root = "/projects/demo";
    assert!(resolve_project_file(root, "../secret.tex").is_err());
  }
}
