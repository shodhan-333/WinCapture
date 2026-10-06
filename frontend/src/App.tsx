import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AlbumsPage from "./pages/AlbumsPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import FilesPage from "./pages/FilesPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

function AuthGate() {
  const {
    account,
    user,
    loading,
    login,
  } = useAuth();

  if (loading) {
    return (
      <main className="auth-screen">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />

        <section className="auth-panel surface">
          <div className="auth-brand">
            <span className="brand-mark" aria-hidden="true">
              <span>W</span>
            </span>

            <div>
              <strong>
                WinCapture
              </strong>

              <small>
                WinWire
              </small>
            </div>
          </div>

          <div className="auth-loader">
            <span className="auth-loader-spinner" />

            <div>
              <h1>
                Connecting to Microsoft
              </h1>

              <p>
                Preparing your secure
                WinCapture workspace.
              </p>
            </div>
          </div>

          <div className="auth-progress">
            <span />
          </div>

          <span className="auth-security-note">
            Microsoft Entra ID authentication
          </span>
        </section>
      </main>
    );
  }

  if (!account && !user) {
    void login();

    return (
      <main className="auth-screen">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />

        <section className="auth-panel surface">
          <div className="auth-brand">
            <span className="brand-mark" aria-hidden="true">
              <span>W</span>
            </span>

            <div>
              <strong>
                WinCapture
              </strong>

              <small>
                WinWire
              </small>
            </div>
          </div>

          <div className="auth-loader">
            <span className="auth-loader-spinner" />

            <div>
              <h1>
                Redirecting to Microsoft
              </h1>

              <p>
                Taking you to secure
                Microsoft sign-in.
              </p>
            </div>
          </div>

          <div className="auth-progress">
            <span />
          </div>

          <span className="auth-security-note">
            Microsoft Entra ID authentication
          </span>
        </section>
      </main>
    );
  }

  return null;
}

export default function App() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading && !user) {
    return <AuthGate />;
  }

  if (!user) {
    return <AuthGate />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/albums"
          element={<AlbumsPage />}
        />

        <Route
          path="/albums/:albumId"
          element={
            <AlbumDetailPage />
          }
        />

        <Route
          path="/files"
          element={<FilesPage />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        {user.role === "Admin" && (
          <Route
            path="/admin"
            element={<AdminPage />}
          />
        )}
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}
