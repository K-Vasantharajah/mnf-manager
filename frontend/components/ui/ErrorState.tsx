export default function ErrorState({ message = 'Something went wrong. Is the backend running?' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-red-400">{message}</div>
    </div>
  );
}