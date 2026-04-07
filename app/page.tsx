"use client";

import { FormEvent, useState } from "react";

export default function Page() {
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult("");
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, topic }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "生成失败，请稍后重试");
        return;
      }

      if (!response.body) {
        throw new Error("EMPTY_STREAM");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value, { stream: true }));
      }

      setResult((prev) => prev + decoder.decode());
    } catch (submitError) {
      console.error(submitError);
      setError("生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            视频脚本改写器
          </h1>
          <p className="text-sm text-slate-500">
            输入原视频链接和新话题，生成结构对齐的新口播稿。
          </p>
        </div>

        <form
          className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          onSubmit={handleSubmit}
        >
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
          <button
            className="rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={loading}
            type="submit"
          >
            {loading ? "生成中..." : "生成"}
          </button>
        </form>

        <section className="min-h-[320px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {error ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-red-600">
              {error}
            </p>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
              {result || "生成结果会显示在这里。"}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
