use serde::Serialize;
use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;

const ENGINES: &[&str] = &["pdflatex", "xelatex", "lualatex"];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TexStatus {
  pub ok: bool,
  pub latexmk: Option<String>,
  pub engines: serde_json::Map<String, serde_json::Value>,
  pub version: Option<String>,
  pub install_hint: String,
}

fn path_env_separator() -> char {
  if cfg!(windows) {
    ';'
  } else {
    ':'
  }
}

pub fn build_path_env(tex_bin_dir: Option<&str>) -> String {
  let current = env::var_os("PATH")
    .map(|v| v.to_string_lossy().into_owned())
    .unwrap_or_default();
  match tex_bin_dir {
    Some(dir) if !dir.trim().is_empty() => {
      format!("{}{}{}", dir.trim(), path_env_separator(), current)
    }
    _ => current,
  }
}

fn command_exists(command: &str, env_path: &str) -> Option<String> {
  let extensions: &[&str] = if cfg!(windows) {
    &[".exe", ".bat", ".cmd", ""]
  } else {
    &[""]
  };
  for dir in env::split_paths(std::ffi::OsStr::new(env_path)) {
    for ext in extensions {
      let candidate = dir.join(format!("{command}{ext}"));
      if candidate.is_file() {
        return Some(candidate.to_string_lossy().into_owned());
      }
    }
  }
  None
}

pub fn find_on_path(command: &str, tex_bin_dir: Option<&str>) -> Option<String> {
  command_exists(command, &build_path_env(tex_bin_dir))
}

pub fn detect_tex(tex_bin_dir: Option<&str>) -> TexStatus {
  let env_path = build_path_env(tex_bin_dir);
  let latexmk = command_exists("latexmk", &env_path);
  let mut engines = serde_json::Map::new();
  for engine in ENGINES {
    match command_exists(engine, &env_path) {
      Some(path) => {
        engines.insert((*engine).to_string(), serde_json::Value::String(path));
      }
      None => {
        engines.insert((*engine).to_string(), serde_json::Value::Null);
      }
    }
  }

  let version = latexmk.as_ref().and_then(|bin| {
    let output = Command::new(bin)
      .arg("-v")
      .env("PATH", &env_path)
      .output()
      .ok()?;
    let text = String::from_utf8_lossy(&output.stdout);
    text.lines().next().map(|line| line.to_string())
  });

  let install_hint = if cfg!(windows) {
    "Install TeX Live from https://tug.org/texlive/ and ensure latexmk is on PATH, or set the TeX bin directory in Settings."
  } else {
    "Install TeX Live (e.g. apt install latexmk texlive) or set the TeX bin directory in Settings."
  }
  .to_string();

  TexStatus {
    ok: latexmk.is_some(),
    latexmk,
    engines,
    version,
    install_hint,
  }
}

pub fn build_latexmk_args(
  engine: &str,
  root_file: &str,
  shell_escape: bool,
  synctex: bool,
  output_dir: Option<&str>,
) -> Result<Vec<String>, String> {
  if !ENGINES.contains(&engine) {
    return Err(format!("Unsupported engine: {engine}"));
  }
  let root = root_file.trim();
  if root.is_empty() {
    return Err("rootFile is required.".into());
  }
  if root.contains('\0') || root.split(['/', '\\']).any(|p| p == "..") {
    return Err("Invalid rootFile.".into());
  }

  let mut args = Vec::new();
  match engine {
    "pdflatex" => args.push("-pdf".into()),
    "xelatex" => args.push("-xelatex".into()),
    "lualatex" => args.push("-lualatex".into()),
    _ => {}
  }
  args.push("-interaction=nonstopmode".into());
  args.push("-file-line-error".into());
  if synctex {
    args.push("-synctex=1".into());
  }
  if let Some(dir) = output_dir {
    let dir = dir.trim();
    if !dir.is_empty() {
      if dir.split(['/', '\\']).any(|p| p == "..") {
        return Err("Invalid outputDir.".into());
      }
      args.push(format!("-outdir={dir}"));
    }
  }
  if shell_escape {
    args.push("-latexoption=-shell-escape".into());
  }
  args.push(root.to_string());
  Ok(args)
}

pub fn pdf_relative(root_file: &str, output_dir: Option<&str>) -> String {
  let name = Path::new(root_file)
    .file_stem()
    .and_then(|s| s.to_str())
    .unwrap_or("main");
  let file = format!("{name}.pdf");
  match output_dir {
    Some(dir) if !dir.trim().is_empty() => format!("{}/{}", dir.trim().replace('\\', "/"), file),
    _ => file,
  }
}

pub fn pdf_absolute(project: &Path, root_file: &str, output_dir: Option<&str>) -> PathBuf {
  let rel = pdf_relative(root_file, output_dir);
  project.join(rel.replace('/', std::path::MAIN_SEPARATOR_STR))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn latexmk_args_pdflatex() {
    let args = build_latexmk_args("pdflatex", "main.tex", false, true, None).unwrap();
    assert_eq!(
      args,
      vec![
        "-pdf",
        "-interaction=nonstopmode",
        "-file-line-error",
        "-synctex=1",
        "main.tex"
      ]
    );
  }

  #[test]
  fn latexmk_args_reject_traversal() {
    assert!(build_latexmk_args("pdflatex", "../x.tex", false, true, None).is_err());
  }
}
