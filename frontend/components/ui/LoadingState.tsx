export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-line border-t-pitch animate-spin" />
        <div className="text-sm text-muted">{message}</div>
      </div>
    </div>
  );
}
