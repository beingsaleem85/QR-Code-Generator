import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-gray-500">
        The page you are looking for does not exist or has moved.
      </p>
      <Link href="/" className="rounded-md border px-4 py-2 text-sm font-medium">
        Back to home
      </Link>
    </div>
  );
}
