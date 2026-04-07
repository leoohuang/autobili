type DebugPanelProps = {
  debugInfo: string;
  debugSummary: string;
};

export function DebugPanel({ debugInfo, debugSummary }: DebugPanelProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">字幕调试</h2>
      <p className="mb-3 text-xs leading-6 text-slate-500">
        {debugSummary || "点击“检查字幕”后，这里会先显示一段可读摘要。"}
      </p>
      <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
        {debugInfo || "点击“检查字幕”后，这里会显示 B 站字幕接口的调试信息。"}
      </pre>
    </section>
  );
}
