"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Clock, FileText, Inbox, LayoutDashboard, ListChecks, type LucideIcon } from "lucide-react";

type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Halaman belum dibangun: tampil abu-abu di sidebar, tidak bisa diklik. */
  comingSoon?: boolean;
};

const NAV: NavEntry[] = [
  { href: "/", label: "Brief", icon: LayoutDashboard },
  { href: "/cron", label: "Cron Jobs", icon: Clock },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/approvals", label: "Approvals", icon: Inbox, comingSoon: true },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navigasi global: sidebar kiri di desktop (md+), bottom tab bar di mobile.
 * Item comingSoon cuma tampil di sidebar; di mobile disembunyikan karena
 * tab bar cuma muat 5 item.
 */
export default function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-52 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="px-4 py-5">
          <p className="text-sm font-semibold">Gugi OS</p>
          <p className="text-xs text-gray-500">Mission control</p>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-1 px-2">
          {NAV.map(({ href, label, icon: Icon, comingSoon }) =>
            comingSoon ? (
              <span
                key={label}
                className="flex items-center gap-3 rounded px-3 py-2 text-sm text-gray-400"
              >
                <Icon size={18} aria-hidden />
                <span className="flex-1">{label}</span>
                <span className="text-[10px] uppercase">soon</span>
              </span>
            ) : (
              <Link
                key={label}
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded px-3 py-2 text-sm ${
                  isActive(pathname, href)
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} aria-hidden />
                {label}
              </Link>
            ),
          )}
        </nav>
      </aside>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.filter((n) => !n.comingSoon).map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            aria-current={isActive(pathname, href) ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
              isActive(pathname, href) ? "font-semibold text-gray-900" : "text-gray-500"
            }`}
          >
            <Icon size={20} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
