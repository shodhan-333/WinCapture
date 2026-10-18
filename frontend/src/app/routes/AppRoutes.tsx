import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getAngularAlbumsUrl } from "@/config/auth";
import { Layout } from "@/app/components/Layout";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { NotFoundPage } from "./NotFoundPage";

const Dashboard = lazy(() =>
  import("@/features/dashboard").then((feature) => ({ default: feature.Dashboard })),
);
const AlbumDetailPage = lazy(() =>
  import("@/features/albums").then((feature) => ({ default: feature.AlbumDetailPage })),
);
const FilesPage = lazy(() =>
  import("@/features/files").then((feature) => ({ default: feature.FilesPage })),
);

function AngularAlbumsRedirect() {
  useEffect(() => {
    window.location.replace(getAngularAlbumsUrl());
  }, []);
  return null;
}

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense
        fallback={
          <main className="p-6" role="status">
            Loading page…
          </main>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/albums" element={<AngularAlbumsRedirect />} />
            <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
