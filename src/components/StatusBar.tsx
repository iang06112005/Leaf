type StatusBarProps = {
  appLabel: string;
};

export function StatusBar({ appLabel }: StatusBarProps) {
  return (
    <footer
      aria-label="Status"
      className="flex h-full items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-400"
    >
      <span>Ready</span>
      <span className="truncate">No project</span>
      <span className="truncate">{appLabel}</span>
    </footer>
  );
}
