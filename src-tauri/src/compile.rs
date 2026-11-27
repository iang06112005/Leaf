use crate::tex::{build_latexmk_args, build_path_env, detect_tex, pdf_absolute, pdf_relative};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Instant;
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileStart {
  pub job_id: String,
  pub project_path: String,
  pub args: Vec<String>,
  pub latexmk: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileResult {
  pub ok: bool,
  pub code: Option<i32>,
  pub signal: Option<String>,
  pub duration_ms: u64,
  pub log: String,
  pub error: Option<String>,
  pub args: Vec<String>,
  pub latexmk: String,
  pub pdf_path: Option<String>,
  pub pdf_relative: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileLogEvent {
  pub job_id: String,
  pub stream: String,
  pub text: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileDoneEvent {
  pub job_id: String,
  #[serde(flatten)]
  pub result: CompileResult,
}

struct Job {
  child: Option<Child>,
  log: String,
  result: Option<CompileResult>,
  started: Instant,
}

#[derive(Default)]
struct CompileInner {
  by_id: HashMap<String, Job>,
  active_by_project: HashMap<PathBuf, String>,
}

pub struct CompileEngine {
  inner: Arc<Mutex<CompileInner>>,
}

impl Default for CompileEngine {
  fn default() -> Self {
    Self {
      inner: Arc::new(Mutex::new(CompileInner::default())),
    }
  }
}

impl CompileEngine {
  pub fn start(
    &self,
    app: AppHandle,
    project_path: String,
    root_file: String,
    engine: String,
    shell_escape: bool,
    synctex: bool,
    output_dir: Option<String>,
    tex_bin_dir: Option<String>,
  ) -> Result<CompileStart, String> {
    let normalized = crate::paths::assert_absolute_path(&project_path)?;

    {
      let guard = self.inner.lock().map_err(|e| e.to_string())?;
      if guard.active_by_project.contains_key(&normalized) {
        return Err("A build is already running for this project. Stop it first.".into());
      }
    }

    let tex = detect_tex(tex_bin_dir.as_deref());
    let latexmk = tex
      .latexmk
      .clone()
      .ok_or_else(|| format!("latexmk was not found. {}", tex.install_hint))?;
    let args = build_latexmk_args(
      &engine,
      &root_file,
      shell_escape,
      synctex,
      output_dir.as_deref(),
    )?;
    let env_path = build_path_env(tex_bin_dir.as_deref());
    let job_id = format!("job_{}", Uuid::new_v4());

    let mut command = Command::new(&latexmk);
    command
      .args(&args)
      .current_dir(&normalized)
      .env("PATH", &env_path)
      .stdout(Stdio::piped())
      .stderr(Stdio::piped());
    #[cfg(windows)]
    {
      use std::os::windows::process::CommandExt;
      const CREATE_NO_WINDOW: u32 = 0x0800_0000;
      command.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = command.spawn().map_err(|e| e.to_string())?;
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    {
      let mut guard = self.inner.lock().map_err(|e| e.to_string())?;
      guard.by_id.insert(
        job_id.clone(),
        Job {
          child: Some(child),
          log: String::new(),
          result: None,
          started: Instant::now(),
        },
      );
      guard
        .active_by_project
        .insert(normalized.clone(), job_id.clone());
    }

    spawn_log_reader(
      self.inner.clone(),
      app.clone(),
      job_id.clone(),
      stdout,
      "stdout",
    );
    spawn_log_reader(
      self.inner.clone(),
      app.clone(),
      job_id.clone(),
      stderr,
      "stderr",
    );

    let engine_arc = self.inner.clone();
    let job_for_wait = job_id.clone();
    let args_for_wait = args.clone();
    let latexmk_for_wait = latexmk.clone();
    let root_for_wait = normalized.clone();
    let root_file_for_wait = root_file;
    let output_dir_for_wait = output_dir;
    let app_wait = app;

    thread::spawn(move || {
      let code = wait_child(&engine_arc, &job_for_wait);
      let (duration_ms, log) = {
        let guard = engine_arc.lock().ok();
        let job = guard.as_ref().and_then(|g| g.by_id.get(&job_for_wait));
        (
          job.map(|j| j.started.elapsed().as_millis() as u64).unwrap_or(0),
          job.map(|j| j.log.clone()).unwrap_or_default(),
        )
      };
      let pdf_rel = pdf_relative(&root_file_for_wait, output_dir_for_wait.as_deref());
      let pdf_abs = pdf_absolute(
        Path::new(&root_for_wait),
        &root_file_for_wait,
        output_dir_for_wait.as_deref(),
      );
      let result = CompileResult {
        ok: code == Some(0),
        code,
        signal: None,
        duration_ms,
        log,
        error: None,
        args: args_for_wait,
        latexmk: latexmk_for_wait,
        pdf_path: Some(pdf_abs.to_string_lossy().into_owned()),
        pdf_relative: Some(pdf_rel.replace('\\', "/")),
      };
      finish_job(&engine_arc, &job_for_wait, &root_for_wait, result.clone());
      let _ = app_wait.emit(
        "compile-done",
        CompileDoneEvent {
          job_id: job_for_wait,
          result,
        },
      );
    });

    Ok(CompileStart {
      job_id,
      project_path: normalized.to_string_lossy().into_owned(),
      args,
      latexmk,
    })
  }

  pub fn cancel(&self, job_id: Option<String>, project_path: Option<String>) -> Result<(), String> {
    let mut guard = self.inner.lock().map_err(|e| e.to_string())?;
    let id = if let Some(job_id) = job_id {
      job_id
    } else if let Some(path) = project_path {
      let root = crate::paths::assert_absolute_path(&path)?;
      guard
        .active_by_project
        .get(&root)
        .cloned()
        .ok_or_else(|| "No running build matched that request.".to_string())?
    } else {
      return Err("No running build matched that request.".into());
    };

    let job = guard
      .by_id
      .get_mut(&id)
      .ok_or_else(|| "No running build matched that request.".to_string())?;
    if let Some(child) = job.child.as_mut() {
      #[cfg(windows)]
      {
        use std::os::windows::process::CommandExt;
        let pid = child.id();
        let _ = Command::new("taskkill")
          .args(["/pid", &pid.to_string(), "/T", "/F"])
          .creation_flags(0x0800_0000)
          .status();
      }
      #[cfg(not(windows))]
      {
        let _ = child.kill();
      }
    }
    Ok(())
  }
}

fn spawn_log_reader(
  inner: Arc<Mutex<CompileInner>>,
  app: AppHandle,
  job_id: String,
  pipe: Option<impl std::io::Read + Send + 'static>,
  stream: &'static str,
) {
  let Some(pipe) = pipe else { return };
  thread::spawn(move || {
    let reader = BufReader::new(pipe);
    for line in reader.lines().flatten() {
      let text = format!("{line}\n");
      if let Ok(mut guard) = inner.lock() {
        if let Some(job) = guard.by_id.get_mut(&job_id) {
          job.log.push_str(&text);
        }
      }
      let _ = app.emit(
        "compile-log",
        CompileLogEvent {
          job_id: job_id.clone(),
          stream: stream.into(),
          text,
        },
      );
    }
  });
}

fn wait_child(inner: &Arc<Mutex<CompileInner>>, job_id: &str) -> Option<i32> {
  let child = {
    let mut guard = inner.lock().ok()?;
    let job = guard.by_id.get_mut(job_id)?;
    job.child.take()
  };
  child.and_then(|mut c| c.wait().ok().and_then(|s| s.code()))
}

fn finish_job(
  inner: &Arc<Mutex<CompileInner>>,
  job_id: &str,
  project: &Path,
  result: CompileResult,
) {
  if let Ok(mut guard) = inner.lock() {
    if let Some(job) = guard.by_id.get_mut(job_id) {
      job.result = Some(result);
      job.child = None;
    }
    guard.active_by_project.remove(project);
  }
}
