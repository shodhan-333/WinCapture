import {
  BadgeCheck,
  Mail,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/formatters";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="app-page profile-page">
      <section className="profile-page-header">
        <div>
          <h1 className="page-heading">
            Profile
          </h1>
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

      </section>
    </div>
  );
}


