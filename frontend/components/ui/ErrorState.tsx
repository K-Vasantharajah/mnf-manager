export default function ErrorState({
  message = 'Something went wrong. Is the backend running?',
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 px-5 py-4 bg-surface border border-line rounded-xl">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle cx="8" cy="8" r="6.5" stroke="#C05746" strokeWidth="1.3" />
          <path d="M8 5V8.5" stroke="#C05746" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.75" fill="#C05746" />
        </svg>
        <div className="text-sm text-signal">{message}</div>
      </div>
    </div>
  );
}
