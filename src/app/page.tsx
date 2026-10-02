import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
  subtitle?: string;
  comingSoon?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/cron", label: "Cron Jobs", subtitle: "Scheduled jobs monitor" },
  { href: "/agents", label: "Agents", subtitle: "14 registered" },
  { href: "/tasks", label: "Tasks", subtitle: "Execution log" },
  { href: "/content", label: "Content Pipeline", comingSoon: true },
  { href: "/approvals", label: "Approval Inbox", comingSoon: true },
  { href: "/", label: "Today's Brief", comingSoon: true },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-semibold">Gugi OS Dashboard</h1>
      <p className="mt-1 text-gray-500">Personal mission control</p>

      <ul className="mt-8 divide-y divide-gray-200 rounded border border-gray-200">
        {NAV_ITEMS.map((item) =>
          item.comingSoon ? (
            <li key={item.label} className="flex justify-between px-4 py-3 text-gray-400">
              <span>{item.label} (coming soon)</span>
              <span className="font-mono text-sm">{item.href}</span>
            </li>
          ) : (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <span>
                  <span className="block font-medium">{item.label}</span>
                  {item.subtitle && (
                    <span className="block text-sm text-gray-500">{item.subtitle}</span>
                  )}
                </span>
                <span className="font-mono text-sm text-gray-500">{item.href}</span>
              </Link>
            </li>
          ),
        )}
      </ul>
    </main>
  );
}
