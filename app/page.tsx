"use client";

import { DebugPanel } from "@/app/debug-panel";
import { FormEvent, useState } from "react";
import { StatusPanel } from "@/app/status-panel";

function summarizeDebug(data: Record<string, unknown>) {
  const pages = Array.isArray(data.page_attempts) ? data.page_attempts : [];
  const hits = pages.filter(
    (item) => typeof item === "object" && item && (item as { subtitle_count?: number }).subtitle_count,
  );
  const selectedPage = data.selected_page;
  const error = data.error;
  return `共 ${pages.length || 0} 页，命中 ${hits.length} 页字幕${
    selectedPage ? `，当前选中第 ${selectedPage} 页` : ""
  }${error ? `，状态：${String(error)}` : "，状态：可用"}`;
}

export default function Page() {
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("等待输入");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [debugSummary, setDebugSummary] = useState("");
  const [debugLoading, setDebugLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult("");
    setError("");
    setStatusText("正在请求生成接口...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, topic }),
      });

      if (!response.ok) {
        const data = (await response.json()) as {
          debug_payload?: Record<string, unknown>;
          debug_summary?: string;
          message?: string;
        };
        setError([data.message ?? "生成失败，请稍后重试", data.debug_summary].filter(Boolean).join("\n"));
        if (data.debug_summary) setDebugSummary(data.debug_summary);
        if (data.debug_payload) setDebugInfo(JSON.stringify(data.debug_payload, null, 2));
        setStatusText("生成失败");
        return;
      }

      if (!response.body) {
        throw new Error("EMPTY_STREAM");
      }

      setStatusText("正在流式生成脚本...");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value, { stream: true }));
      }

      setResult((prev) => prev + decoder.decode());
      setStatusText("生成完成");
    } catch (submitError) {
      console.error(submitError);
      setError("生成失败，请稍后重试");
      setStatusText("生成失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDebugSubtitle() {
    setDebugLoading(true);
    setDebugInfo("");
    setDebugSummary("");
    setStatusText("正在检查字幕...");

    try {
      const response = await fetch(`/api/debug/subtitle?input=${encodeURIComponent(url)}`);
      const data = (await response.json()) as Record<string, unknown>;
      setDebugSummary(summarizeDebug(data));
      setDebugInfo(JSON.stringify(data, null, 2));
      setStatusText("字幕检查完成");
    } catch (debugError) {
      console.error(debugError);
      setDebugSummary("调试请求失败");
      setDebugInfo(JSON.stringify({ error: "DEBUG_REQUEST_FAILED" }, null, 2));
      setStatusText("字幕检查失败");
    } finally {
      setDebugLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">视频脚本改写器</h1>
          <p className="text-sm text-slate-500">输入原视频链接和新话题，生成结构对齐的新口播稿。</p>
        </div>

        <form className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" onSubmit={handleSubmit}>
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
            placeholder="粘贴 B 站视频链接"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
            placeholder="输入你想做的新话题"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={loading}
              type="submit"
            >
              {loading ? "生成中..." : "生成"}
            </button>
            <button
              className="rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={debugLoading || !url.trim()}
              onClick={handleDebugSubtitle}
              type="button"
            >
              {debugLoading ? "检查中..." : "检查字幕"}
            </button>
          </div>
        </form>
        <StatusPanel error={error} loading={loading} result={result} statusText={statusText} />
        <DebugPanel debugInfo={debugInfo} debugSummary={debugSummary} />
      </div>
    </main>
  );
}
