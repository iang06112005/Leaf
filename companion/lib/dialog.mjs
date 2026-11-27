import { spawn } from "node:child_process";

/**
 * Native folder picker when possible. Returns null if cancelled / unavailable.
 */
export function pickDirectory() {
  if (process.platform === "win32") {
    return runPowerShellFolderPicker();
  }
  if (process.platform === "darwin") {
    return runOsascriptFolderPicker();
  }
  return runZenityFolderPicker();
}

function runPowerShellFolderPicker() {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$d = New-Object System.Windows.Forms.FolderBrowserDialog
$d.Description = 'Open TexFlow project'
$d.ShowNewFolderButton = $true
if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $d.SelectedPath
}
`;
  return runCapture("powershell.exe", ["-NoProfile", "-STA", "-Command", script]);
}

function runOsascriptFolderPicker() {
  return runCapture("osascript", [
    "-e",
    'POSIX path of (choose folder with prompt "Open TexFlow project")',
  ]);
}

function runZenityFolderPicker() {
  return runCapture("zenity", [
    "--file-selection",
    "--directory",
    "--title=Open TexFlow project",
  ]).catch(() => null);
}

function runCapture(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: false, windowsHide: true });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }
      const value = stdout.trim();
      resolve(value || null);
    });
  });
}
