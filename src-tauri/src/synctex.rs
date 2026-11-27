use crate::paths::{assert_absolute_path, resolve_project_file};
use crate::tex::{build_path_env, find_on_path};
use regex::Regex;
use serde::Serialize;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SynctexForwardResult {
  pub page: u32,
  pub x: Option<f64>,
  pub y: Option<f64>,
  pub h: Option<f64>,
  pub v: Option<f64>,
  pub width: Option<f64>,
  pub height: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SynctexInverseResult {
  pub file: String,
  pub line: u32,
  pub column: u32,
}

fn run_synctex(bin: &str, args: &[&str], cwd: &Path, env_path: &str) -> Result<String, String> {
  let mut command = Command::new(bin);
  command.args(args).current_dir(cwd).env("PATH", env_path);
  #[cfg(windows)]
  {
    use std::os::windows::process::CommandExt;
    command.creation_flags(0x0800_0000);
  }
  let output = command.output().map_err(|e| e.to_string())?;
  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    return Err(if !stderr.trim().is_empty() {
      stderr.into_owned()
    } else {
      stdout.into_owned()
    });
  }
  Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

fn parse_f64(re: &Regex, text: &str) -> Option<f64> {
  re.captures(text)
    .and_then(|c| c.get(1))
    .and_then(|m| m.as_str().parse().ok())
}

pub fn synctex_forward(
  project_path: &str,
  tex_relative: &str,
  pdf_relative: &str,
  line: u32,
  column: u32,
  tex_bin_dir: Option<&str>,
) -> Result<SynctexForwardResult, String> {
  let root = assert_absolute_path(project_path)?;
  resolve_project_file(project_path, tex_relative)?;
  let pdf_abs = if Path::new(pdf_relative).is_absolute() {
    Path::new(pdf_relative).to_path_buf()
  } else {
    root.join(pdf_relative.replace('/', std::path::MAIN_SEPARATOR_STR))
  };
  let env_path = build_path_env(tex_bin_dir);
  let bin = find_on_path("synctex", tex_bin_dir).unwrap_or_else(|| "synctex".into());
  let input = format!("{line}:{column}:{}", tex_relative.replace('\\', "/"));
  let pdf_str = pdf_abs.to_string_lossy().into_owned();
  let stdout = run_synctex(&bin, &["view", "-i", &input, "-o", &pdf_str], &root, &env_path)?;

  let page_re = Regex::new(r"(?i)Page:(\d+)").unwrap();
  let page = page_re
    .captures(&stdout)
    .and_then(|c| c.get(1))
    .and_then(|m| m.as_str().parse().ok())
    .ok_or_else(|| "Could not parse synctex view output.".to_string())?;

  Ok(SynctexForwardResult {
    page,
    x: parse_f64(&Regex::new(r"(?i)x:([0-9.]+)").unwrap(), &stdout),
    y: parse_f64(&Regex::new(r"(?i)y:([0-9.]+)").unwrap(), &stdout),
    h: parse_f64(&Regex::new(r"(?i)h:([0-9.]+)").unwrap(), &stdout),
    v: parse_f64(&Regex::new(r"(?i)v:([0-9.]+)").unwrap(), &stdout),
    width: parse_f64(&Regex::new(r"(?i)W:([0-9.]+)").unwrap(), &stdout),
    height: parse_f64(&Regex::new(r"(?i)H:([0-9.]+)").unwrap(), &stdout),
  })
}

pub fn synctex_inverse(
  project_path: &str,
  pdf_relative: &str,
  page: u32,
  x: f64,
  y: f64,
  tex_bin_dir: Option<&str>,
) -> Result<SynctexInverseResult, String> {
  let root = assert_absolute_path(project_path)?;
  let pdf_abs = if Path::new(pdf_relative).is_absolute() {
    Path::new(pdf_relative).to_path_buf()
  } else {
    root.join(pdf_relative.replace('/', std::path::MAIN_SEPARATOR_STR))
  };
  let env_path = build_path_env(tex_bin_dir);
  let bin = find_on_path("synctex", tex_bin_dir).unwrap_or_else(|| "synctex".into());
  let page_arg = format!("{page}:{x}:{y}:{}" , pdf_abs.to_string_lossy());
  let stdout = run_synctex(&bin, &["edit", "-o", &page_arg], &root, &env_path)?;

  let input_re = Regex::new(r"(?i)Input:(.+)").unwrap();
  let line_re = Regex::new(r"(?i)Line:(\d+)").unwrap();
  let col_re = Regex::new(r"(?i)Column:(\d+)").unwrap();
  let file = input_re
    .captures(&stdout)
    .and_then(|c| c.get(1))
    .map(|m| m.as_str().trim().replace('\\', "/"))
    .ok_or_else(|| "Could not parse synctex edit output.".to_string())?;
  let line = line_re
    .captures(&stdout)
    .and_then(|c| c.get(1))
    .and_then(|m| m.as_str().parse().ok())
    .ok_or_else(|| "Could not parse synctex edit output.".to_string())?;
  let column = col_re
    .captures(&stdout)
    .and_then(|c| c.get(1))
    .and_then(|m| m.as_str().parse().ok())
    .unwrap_or(1);
  Ok(SynctexInverseResult { file, line, column })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parse_forward_sample() {
    let sample = "SyncTeX result begin\nPage:2\nx:12.5\ny:40\n";
    let page_re = Regex::new(r"(?i)Page:(\d+)").unwrap();
    assert_eq!(
      page_re
        .captures(sample)
        .unwrap()
        .get(1)
        .unwrap()
        .as_str()
        .parse::<u32>()
        .unwrap(),
      2
    );
  }
}
