export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
