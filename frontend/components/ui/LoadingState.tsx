export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">{message}</div>
    </div>
  );
}