import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getAngularAlbumsUrl } from "@/config/auth";
import { Layout } from "@/app/components/Layout";
import { Dashboard } from "@/features/dashboard/pages/Dashboard";
import { AlbumDetailPage } from "@/features/albums/pages/AlbumDetailPage";
import { FilesPage } from "@/features/files/pages/FilesPage";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { NotFoundPage } from "./NotFoundPage";

// Keep the legacy React Albums URL pointed at the Angular Albums implementation.
function AngularAlbumsRedirect() {
  useEffect(() => {
    window.location.replace(getAngularAlbumsUrl());
  }, []);
  return null;
}

// Load route screens with the app so navigation never replaces the page with a loading screen.
export function AppRoutes() {
  return (
    <RouteErrorBoundary>
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
    </RouteErrorBoundary>
  );
}