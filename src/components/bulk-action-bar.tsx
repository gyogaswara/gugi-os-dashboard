"use client";

import { Check, Copy, X } from "lucide-react";
import { useCopyPrompt } from "@/components/action-buttons";
import type { BulkPromptAction } from "@/lib/bulk-prompts";

/**
 * Bar melayang buat aksi batch: muncul kalau ada item terpilih. Tiap aksi
 * menyalin satu prompt gabungan; aksi yang tidak berlaku buat item terpilih
 * dinonaktifkan, dan jumlah item yang berlaku tampil di tombolnya.
 */
export default function BulkActionBar({
  count,
  actions,
  onClear,
}: {
  count: number;
  actions: BulkPromptAction[];
  onClear: () => void;
}) {
  // Toast dinaikkan supaya tidak menutupi bar ini.
  const { copy, copiedId, toastEl } = useCopyPrompt("bottom-40 md:bottom-28");

  if (count === 0) return toastEl;

  return (
    <>
      <div
        role="region"
        aria-label="Aksi untuk konten terpilih"
        className="fixed bottom-20 left-1/2 z-30 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded border border-gray-300 bg-white p-3 shadow-lg md:bottom-6"
      >
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{count} konten dipilih</span>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
          >
            <X size={14} aria-hidden />
            Batal pilih
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={action.count === 0}
              title={action.count === 0 ? "Tidak ada item terpilih yang cocok" : action.prompt}
              onClick={() => copy(action)}
              className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            >
              {copiedId === action.id ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
              {action.label}
              <span className="text-gray-500">({action.count})</span>
            </button>
          ))}
        </div>
      </div>
      {toastEl}
    </>
  );
}
