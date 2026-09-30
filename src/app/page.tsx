import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-semibold">Gugi OS Dashboard</h1>
      <p className="mt-1 text-gray-500">Personal mission control</p>

      <ul className="mt-8 divide-y divide-gray-200 rounded border border-gray-200">
        <li>
          <Link href="/cron" className="flex justify-between px-4 py-3 hover:bg-gray-50">
            <span className="font-medium">Cron Monitor</span>
            <span className="font-mono text-sm text-gray-500">/cron</span>
          </Link>
        </li>
        <li className="flex justify-between px-4 py-3 text-gray-400">
          <span>Approval Inbox (coming soon)</span>
          <span className="font-mono text-sm">/approvals</span>
        </li>
        <li className="flex justify-between px-4 py-3 text-gray-400">
          <span>Today&apos;s Brief (coming soon)</span>
          <span className="font-mono text-sm">/</span>
        </li>
      </ul>
    </main>
  );
}
