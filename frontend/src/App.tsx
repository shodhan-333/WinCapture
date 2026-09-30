import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Albums from "./pages/Albums";
import AlbumDetails from "./pages/AlbumDetails";
import Files from "./pages/Files";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

import { useAuth } from "./context/AuthContext";

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-center shadow-xl">
        <div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-slate-700 border-t-white" />

        <p className="text-sm text-slate-300">
          Processing Microsoft authentication...
        </p>
      </div>
    </main>
  );
}

function ApiErrorScreen() {
  const { account, error, logout } = useAuth();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-2xl rounded-2xl border border-red-900/60 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-red-300">
              Microsoft account detected
            </p>

            <h1 className="mt-1 text-2xl font-semibold">
              WinCapture authorization failed
            </h1>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Microsoft account
          </p>

          <p className="mt-1 break-all text-sm text-slate-200">
            {account?.name || account?.username || "Unknown"}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-sm leading-6 text-red-200">
            {error ||
              "The WinCapture API rejected the Microsoft access token."}
          </p>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const { account, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (account && !user) {
    return <ApiErrorScreen />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ProtectedRoute>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/albums"
            element={<Albums />}
          />

          <Route
            path="/albums/:albumId"
            element={<AlbumDetails />}
          />

          <Route
            path="/files"
            element={<Files />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          {user.role === "Admin" && (
            <Route
              path="/admin"
              element={<Admin />}
            />
          )}
        </Route>

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </ProtectedRoute>
  );
}