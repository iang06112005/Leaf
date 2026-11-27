/** True when the UI runs inside the Tauri desktop shell. */
export function isDesktopHost(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
