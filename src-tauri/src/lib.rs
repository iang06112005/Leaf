mod clean;
mod compile;
mod fsops;
mod open_os;
mod paths;
mod search;
mod synctex;
mod template;
mod tex;

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use compile::CompileEngine;
use serde::Serialize;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Health {
  ok: bool,
  name: &'static str,
  version: &'static str,
  host: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OpenedProject {
  path: String,
  name: String,
  tree: Vec<fsops::TreeNode>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ExistsResult {
  path: String,
  exists: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TextFileResult {
  path: String,
  content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BinaryFileResult {
  path: String,
  base64: String,
}

#[tauri::command]
fn health() -> Health {
  Health {
    ok: true,
    name: "texflow-tauri",
    version: env!("CARGO_PKG_VERSION"),
    host: "tauri",
  }
}

#[tauri::command]
fn get_tex_status(tex_bin_dir: Option<String>) -> tex::TexStatus {
  tex::detect_tex(tex_bin_dir.as_deref())
}

#[tauri::command]
fn project_exists(path: String) -> Result<ExistsResult, String> {
  let exists = fsops::path_exists(&path)?;
  Ok(ExistsResult { path, exists })
}

#[tauri::command]
fn open_project(path: String) -> Result<OpenedProject, String> {
  let (root, name, tree) = fsops::open_project(&path)?;
  Ok(OpenedProject {
    path: root.to_string_lossy().into_owned(),
    name,
    tree,
  })
}

#[tauri::command]
async fn pick_project(app: tauri::AppHandle) -> Result<OpenedProject, String> {
  let folder = app
    .dialog()
    .file()
    .set_title("Open TexFlow project")
    .blocking_pick_folder();
  let Some(folder) = folder else {
    return Err("No folder selected.".into());
  };
  let path = folder.to_string();
  open_project(path)
}

#[tauri::command]
fn project_tree(path: String) -> Result<serde_json::Value, String> {
  let tree = fsops::build_tree(&path)?;
  Ok(serde_json::json!({ "path": path, "tree": tree }))
}

#[tauri::command]
fn read_text_file(path: String, file: String) -> Result<TextFileResult, String> {
  let content = fsops::read_text(&path, &file)?;
  Ok(TextFileResult {
    path: file,
    content,
  })
}

#[tauri::command]
fn read_binary_file(path: String, file: String) -> Result<BinaryFileResult, String> {
  let bytes = fsops::read_binary(&path, &file)?;
  Ok(BinaryFileResult {
    path: file,
    base64: BASE64.encode(bytes),
  })
}

#[tauri::command]
fn write_text_file(path: String, file: String, content: String) -> Result<serde_json::Value, String> {
  fsops::write_text(&path, &file, &content)?;
  Ok(serde_json::json!({ "ok": true }))
}

#[tauri::command]
fn create_file(path: String, file: String, content: Option<String>) -> Result<serde_json::Value, String> {
  let written = fsops::create_file(&path, &file, content.as_deref().unwrap_or(""))?;
  Ok(serde_json::json!({ "ok": true, "file": written }))
}

#[tauri::command]
fn create_dir(path: String, dir: String) -> Result<serde_json::Value, String> {
  let written = fsops::create_directory(&path, &dir)?;
  Ok(serde_json::json!({ "ok": true, "dir": written }))
}

#[tauri::command]
fn rename_path(path: String, from: String, to: String) -> Result<serde_json::Value, String> {
  let written = fsops::rename_entry(&path, &from, &to)?;
  Ok(serde_json::json!({ "ok": true, "path": written }))
}

#[tauri::command]
fn delete_path(path: String, target: String) -> Result<serde_json::Value, String> {
  fsops::delete_entry(&path, &target)?;
  Ok(serde_json::json!({ "ok": true }))
}

#[tauri::command]
fn start_compile(
  app: tauri::AppHandle,
  state: tauri::State<'_, CompileEngine>,
  project_path: String,
  root_file: String,
  engine: String,
  shell_escape: bool,
  synctex: bool,
  output_dir: Option<String>,
  tex_bin_dir: Option<String>,
) -> Result<compile::CompileStart, String> {
  state.start(
    app,
    project_path,
    root_file,
    engine,
    shell_escape,
    synctex,
    output_dir,
    tex_bin_dir,
  )
}

#[tauri::command]
fn cancel_compile(
  state: tauri::State<'_, CompileEngine>,
  job_id: Option<String>,
  project_path: Option<String>,
) -> Result<serde_json::Value, String> {
  state.cancel(job_id, project_path)?;
  Ok(serde_json::json!({ "ok": true }))
}

#[tauri::command]
fn open_pdf(
  path: Option<String>,
  file: Option<String>,
  absolute_path: Option<String>,
) -> Result<open_os::OpenResult, String> {
  if let Some(abs) = absolute_path {
    return open_os::open_path_in_os(&abs);
  }
  let project = path.ok_or_else(|| "path is required".to_string())?;
  let relative = file.ok_or_else(|| "file is required".to_string())?;
  open_os::open_project_file_in_os(&project, &relative)
}

#[tauri::command]
fn synctex_forward(
  path: String,
  tex_relative: String,
  pdf_relative: String,
  line: u32,
  column: Option<u32>,
  tex_bin_dir: Option<String>,
) -> Result<synctex::SynctexForwardResult, String> {
  synctex::synctex_forward(
    &path,
    &tex_relative,
    &pdf_relative,
    line,
    column.unwrap_or(1),
    tex_bin_dir.as_deref(),
  )
}

#[tauri::command]
fn synctex_inverse(
  path: String,
  pdf_relative: String,
  page: u32,
  x: f64,
  y: f64,
  tex_bin_dir: Option<String>,
) -> Result<synctex::SynctexInverseResult, String> {
  synctex::synctex_inverse(
    &path,
    &pdf_relative,
    page,
    x,
    y,
    tex_bin_dir.as_deref(),
  )
}

#[tauri::command]
fn list_templates() -> Vec<template::TemplateInfo> {
  template::list_templates()
}

#[tauri::command]
fn create_project(
  path: String,
  template_id: Option<String>,
  force: Option<bool>,
) -> Result<template::CreateProjectResult, String> {
  template::create_project_from_template(&path, template_id.as_deref(), force.unwrap_or(false))
}

#[tauri::command]
fn clean_project(path: String, output_dir: Option<String>) -> Result<clean::CleanResult, String> {
  clean::clean_project_artifacts(&path, output_dir.as_deref())
}

#[tauri::command]
fn search_project(
  path: String,
  query: String,
  max_matches: Option<usize>,
) -> Result<search::SearchResult, String> {
  search::search_project(&path, &query, max_matches)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .manage(CompileEngine::default())
    .invoke_handler(tauri::generate_handler![
      health,
      get_tex_status,
      project_exists,
      open_project,
      pick_project,
      project_tree,
      read_text_file,
      read_binary_file,
      write_text_file,
      create_file,
      create_dir,
      rename_path,
      delete_path,
      start_compile,
      cancel_compile,
      open_pdf,
      synctex_forward,
      synctex_inverse,
      list_templates,
      create_project,
      clean_project,
      search_project
    ])
    .setup(|app| {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title("TexFlow");
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running TexFlow");
}
