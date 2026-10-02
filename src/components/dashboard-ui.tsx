/**
 * Komponen UI kecil yang dipakai bareng oleh halaman /agents dan /tasks
 * supaya tampilannya konsisten (summary card, badge, filter, state).
 */

export type BadgeTone = "green" | "amber" | "gray" | "red" | "blue" | "purple";

const BADGE_TONES: Record<BadgeTone, string> = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  gray: "bg-gray-100 text-gray-700",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
};

/** Pill badge dengan background tinted. */
export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Kartu angka ringkasan di atas filter. */
export function SummaryCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

/** Grup tombol filter (segmented control). */
export function FilterButtons<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase text-gray-500">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-full border px-3 py-1 text-sm ${
            value === option.value
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Input search sederhana. */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-sm md:w-64"
    />
  );
}

/** Placeholder baris saat data masih di-fetch. */
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-200 rounded border border-gray-200 bg-white" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse gap-4 px-4 py-3">
          <div className="h-4 w-1/4 rounded bg-gray-200" />
          <div className="h-4 w-1/6 rounded bg-gray-200" />
          <div className="h-4 flex-1 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

/** Pesan error fetch + tombol retry. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-semibold">Gagal mengambil data dari Supabase.</p>
      <p className="mt-1 font-mono">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded border border-red-300 bg-white px-3 py-1 font-medium hover:bg-red-100"
      >
        Retry
      </button>
    </div>
  );
}

/** Potong teks panjang dengan ellipsis. */
export function truncate(text: string | null, max: number): string {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
