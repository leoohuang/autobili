"use client";

import { useState, useCallback } from "react";

type StatusPanelProps = {
  error: string;
  loading: boolean;
  result: string;
  statusText: string;
};

/**
 * Count words in mixed CJK/Latin text.
 * - Each CJK character = 1 word
 * - Latin words are split by whitespace, with pure-punctuation tokens excluded
 */
function countWords(text: string): number {
  if (!text.trim()) return 0;
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
  const stripped = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, " ");
  const otherWords = stripped
    .trim()
    .split(/\s+/)
    .filter((w) => w.replace(/[\p{P}\p{S}]/gu, "").length > 0).length;
  return cjkChars + otherWords;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [text]);

  if (!text) return null;

  return (
    <button
      onClick={handleCopy}
      className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 active:bg-slate-200"
      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
    >
      {copied ? "✅ 已复制" : "📋 复制脚本"}
    </button>
  );
}

export function StatusPanel({
  error,
  loading,
  result,
  statusText,
}: StatusPanelProps) {
  const badge = loading ? "Generating" : error ? "Error" : result ? "Ready" : "Idle";
  const wordCount = countWords(result);

  return (
    <section className="min-h-[320px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          {badge}
        </p>
        {result && !loading && (
          <p className="text-xs text-slate-400">{wordCount} 字</p>
        )}
      </div>
      <p className="mb-3 text-xs leading-6 text-slate-500">{statusText}</p>
      {error ? (
        <p className="whitespace-pre-wrap text-sm leading-7 text-red-600">{error}</p>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
            {result || (loading ? "" : "生成结果会显示在这里。")}
          </p>
          {result && !loading && <CopyButton text={result} />}
        </>
      )}
    </section>
  );
}
