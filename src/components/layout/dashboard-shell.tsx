import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b md:w-56 md:border-b-0 md:border-r bg-card">
        <div className="p-4">
          <Link href="/" className="text-lg font-bold text-primary">BusyBeds</Link>
          <p className="mt-1 text-xs text-muted-foreground">{title}</p>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3 md:pb-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground whitespace-nowrap",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
