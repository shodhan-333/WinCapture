import {
  BadgeCheck,
  ChevronRight,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function getInitials(name?: string): string {
  if (!name?.trim()) {
    return "U";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="app-page profile-page">
      <section className="profile-page-header">
        <div>
          <div className="page-kicker">
            <span className="page-kicker-dot" />
            Account
          </div>

          <h1 className="page-heading">
            Profile
          </h1>

          <p className="page-description">
            Manage your WinCapture account
            information and authentication
            details.
          </p>
        </div>
      </section>

      <section className="profile-identity-card surface">
        <div className="profile-identity-background" />

        <div className="profile-identity-main">
          <div className="profile-avatar-large">
            {getInitials(user?.name)}
          </div>

          <div className="profile-identity-copy">
            <div className="profile-name-row">
              <h2>
                {user?.name ??
                  "Unknown user"}
              </h2>

              <span className="profile-role-badge">
                <BadgeCheck
                  aria-hidden="true"
                  size={13}
                  strokeWidth={1.9}
                />

                {user?.role ??
                  "User"}
              </span>
            </div>

            <p>
              <Mail
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />

              {user?.email ??
                "No email available"}
            </p>

            <span className="profile-account-note">
              Your WinCapture account is
              connected to Microsoft Entra ID.
            </span>
          </div>
        </div>

        <div className="profile-identity-status">
          <span className="profile-status-dot" />

          <span>
            Authenticated
          </span>
        </div>
      </section>

      <section className="profile-settings-card surface">
        <div className="profile-section-header">
          <div>
            <p className="dashboard-panel-kicker">
              Account details
            </p>

            <h2 className="section-title">
              Account information
            </h2>
          </div>

          <span className="profile-section-icon">
            <UserRound
              aria-hidden="true"
              size={18}
              strokeWidth={1.8}
            />
          </span>
        </div>

        <div className="profile-settings-list">
          <div className="profile-setting-row">
            <div className="profile-setting-icon blue">
              <UserRound
                aria-hidden="true"
                size={17}
                strokeWidth={1.8}
              />
            </div>

            <div className="profile-setting-copy">
              <span>
                Name
              </span>

              <strong>
                {user?.name ??
                  "Unknown user"}
              </strong>
            </div>
          </div>

          <div className="profile-setting-row">
            <div className="profile-setting-icon purple">
              <Mail
                aria-hidden="true"
                size={17}
                strokeWidth={1.8}
              />
            </div>

            <div className="profile-setting-copy">
              <span>
                Email
              </span>

              <strong>
                {user?.email ??
                  "No email available"}
              </strong>
            </div>
          </div>

          <div className="profile-setting-row">
            <div className="profile-setting-icon green">
              <ShieldCheck
                aria-hidden="true"
                size={17}
                strokeWidth={1.8}
              />
            </div>

            <div className="profile-setting-copy">
              <span>
                Role
              </span>

              <strong>
                {user?.role ??
                  "User"}
              </strong>
            </div>

            <span className="profile-setting-trailing">
              <ChevronRight
                aria-hidden="true"
                size={17}
                strokeWidth={1.8}
              />
            </span>
          </div>
        </div>
      </section>

      <section className="profile-security-card surface">
        <div className="profile-section-header">
          <div>
            <p className="dashboard-panel-kicker">
              Authentication
            </p>

            <h2 className="section-title">
              Microsoft Entra ID
            </h2>
          </div>

          <span className="profile-section-icon microsoft">
            <ShieldCheck
              aria-hidden="true"
              size={18}
              strokeWidth={1.8}
            />
          </span>
        </div>

        <div className="profile-authentication-row">
          <div className="profile-authentication-icon">
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="profile-authentication-copy">
            <strong>
              Microsoft authentication
            </strong>

            <p>
              Your WinCapture session is
              authenticated through your
              organization's Microsoft
              identity.
            </p>
          </div>

          <span className="profile-authentication-badge">
            Connected
          </span>
        </div>
      </section>

      <section className="profile-signout-card">
        <div className="profile-signout-copy">
          <span className="profile-signout-icon">
            <LogOut
              aria-hidden="true"
              size={18}
              strokeWidth={1.8}
            />
          </span>

          <div>
            <strong>
              Sign out of WinCapture
            </strong>

            <p>
              End your current Microsoft
              session on this device.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            void logout()
          }
          className="danger-action"
        >
          <LogOut
            aria-hidden="true"
            size={16}
            strokeWidth={1.8}
          />

          Sign out
        </button>
      </section>
    </div>
  );
}
