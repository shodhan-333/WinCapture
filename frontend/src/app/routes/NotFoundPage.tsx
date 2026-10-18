import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-[50vh] max-w-xl place-content-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className="primary-action justify-self-center" to="/dashboard">
        Return to dashboard
      </Link>
    </main>
  );
}
