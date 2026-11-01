import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type PanelProps = {
  title: string;
  icon: LucideIcon;
  className: string;
  children: ReactNode;
};

export function Panel({ title, icon: Icon, className, children }: PanelProps) {
  return (
    <section aria-label={title} className={`flex min-h-0 min-w-0 flex-col ${className}`}>
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-zinc-800 px-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
        <Icon className="size-3.5" aria-hidden="true" />
        {title}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 text-sm text-zinc-300">
        {children}
      </div>
    </section>
  );
}
