type StatusPanelProps = {
  error: string;
  loading: boolean;
  result: string;
  statusText: string;
};

export function StatusPanel({
  error,
  loading,
  result,
  statusText,
}: StatusPanelProps) {
  const badge = loading ? "Generating" : error ? "Error" : result ? "Ready" : "Idle";

  return (
    <section className="min-h-[320px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {badge}
      </p>
      <p className="mb-3 text-xs leading-6 text-slate-500">{statusText}</p>
      {error ? (
        <p className="whitespace-pre-wrap text-sm leading-7 text-red-600">{error}</p>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
          {result || "生成结果会显示在这里。"}
        </p>
      )}
    </section>
  );
}
