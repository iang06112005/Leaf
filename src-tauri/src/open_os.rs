use crate::paths::{assert_absolute_path, resolve_project_file};
use serde::Serialize;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenResult {
  pub ok: bool,
  pub path: String,
}

pub fn open_path_in_os(target_path: &str) -> Result<OpenResult, String> {
  let absolute = assert_absolute_path(target_path)?;
  if !absolute.exists() {
    return Err("That path does not exist.".into());
  }
  let path_str = absolute.to_string_lossy().into_owned();

  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    Command::new("cmd.exe")
      .args(["/c", "start", "", &path_str])
      .creation_flags(0x0800_0000)
      .spawn()
      .map_err(|e| e.to_string())?;
  }
  #[cfg(target_os = "macos")]
  {
    Command::new("open")
      .arg(&path_str)
      .spawn()
      .map_err(|e| e.to_string())?;
  }
  #[cfg(all(unix, not(target_os = "macos")))]
  {
    Command::new("xdg-open")
      .arg(&path_str)
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  Ok(OpenResult {
    ok: true,
    path: path_str,
  })
}

pub fn open_project_file_in_os(project_path: &str, relative: &str) -> Result<OpenResult, String> {
  let file = resolve_project_file(project_path, relative)?;
  open_path_in_os(&file.absolute.to_string_lossy())
}
