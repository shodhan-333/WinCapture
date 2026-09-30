import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AlbumsPage from "./pages/AlbumsPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import FilesPage from "./pages/FilesPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

function AuthGate() {
  const { account, user, loading, login } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f5f7] text-slate-800">
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-slate-200 bg-white/80 px-8 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-sky-500" />
          <p className="text-sm text-slate-500">Connecting to Microsoft...</p>
        </div>
      </main>
    );
  }

  if (!account && !user) {
    void login();
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f5f7] text-slate-800">
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-slate-200 bg-white/80 px-8 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-sky-500" />
          <p className="text-sm text-slate-500">Redirecting to Microsoft sign-in...</p>
        </div>
      </main>
    );
  }

  return null;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return <AuthGate />;
  }

  if (!user) {
    return <AuthGate />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/albums" element={<AlbumsPage />} />
        <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {user.role === "Admin" && <Route path="/admin" element={<AdminPage />} />}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}