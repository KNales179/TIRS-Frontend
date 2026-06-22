// pages/UserProfile.jsx

import { useEffect, useState } from "react";
import API_BASE_URL from "../api/api";
import { getToken, logout } from "../data/auth";
import { useNavigate } from "react-router-dom";

async function apiRequest(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

function getRoleLabel(role) {
  const labels = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    STAFF: "Staff",
    VIEWER: "Viewer",
  };

  return labels[role] || role || "User";
}

export default function UserProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);

  const [profileForm, setProfileForm] = useState({
    username: "",
    full_name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const res = await apiRequest("/auth/me");
      const user = res.user || res.data || null;

      setProfile(user);

      setProfileForm({
        username: user?.username || "",
        full_name: user?.full_name || "",
        email: user?.email || "",
      });
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveProfile() {
    try {
      if (!profileForm.username.trim()) {
        alert("Username is required.");
        return;
      }

      if (!profileForm.full_name.trim()) {
        alert("Full name is required.");
        return;
      }

      setSavingProfile(true);
      setError("");

      await apiRequest("/admins/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          username: profileForm.username.trim(),
          full_name: profileForm.full_name.trim(),
          email: profileForm.email.trim(),
        }),
      });

      await loadProfile();
      setEditingProfile(false);

      alert("Profile updated successfully. Please login again to refresh your account session.");

      logout();

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    try {
      if (!passwordForm.current_password) {
        alert("Current password is required.");
        return;
      }

      if (!passwordForm.new_password) {
        alert("New password is required.");
        return;
      }

      if (passwordForm.new_password.length < 8) {
        alert("New password must be at least 8 characters.");
        return;
      }

      if (passwordForm.new_password !== passwordForm.confirm_password) {
        alert("New password and confirm password do not match.");
        return;
      }

      setSavingPassword(true);
      setError("");

      await apiRequest("/admins/me/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setChangingPassword(false);

      alert("Password changed successfully. Please login again.");

      logout();

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="container-fluid py-3 py-md-4">
      <div className="mx-auto" style={{ maxWidth: 1100 }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">User Profile</h1>
            <div className="text-muted">
              View your account details, edit profile information, or change password.
            </div>
          </div>

          <button
            className="btn btn-light border rounded-4 px-3"
            type="button"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-2" />
            Back
          </button>
        </div>

        {error && <div className="alert alert-danger rounded-4">{error}</div>}

        {loading ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 text-muted">
              Loading profile...
            </div>
          </div>
        ) : (
          <div className="row g-3">
            <div className="col-12 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4 text-center">
                  <div
                    className="rounded-circle border bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{
                      width: 110,
                      height: 110,
                    }}
                  >
                    <i
                      className="bi bi-person"
                      style={{
                        fontSize: 54,
                        color: "#64748b",
                      }}
                    />
                  </div>

                  <h4 className="fw-bold mb-1">
                    {profile?.full_name || "Unknown User"}
                  </h4>

                  <div className="text-muted mb-3">
                    @{profile?.username || "username"}
                  </div>

                  <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill px-3 py-2">
                    {getRoleLabel(profile?.role)}
                  </span>

                  <div className="border-top mt-4 pt-4 text-start">
                    <InfoRow label="Admin Code" value={profile?.admin_code} />
                    <InfoRow label="Status" value={profile?.status} />
                    <InfoRow
                      label="Created"
                      value={
                        profile?.created_at
                          ? String(profile.created_at).slice(0, 10)
                          : "—"
                      }
                    />
                    <InfoRow
                      label="Last Updated"
                      value={
                        profile?.updated_at
                          ? String(profile.updated_at).slice(0, 10)
                          : "—"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-8">
              <div className="card border-0 shadow-sm rounded-4 mb-3">
                <div className="card-body p-4">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
                    <div>
                      <h5 className="fw-bold mb-1">Profile Information</h5>
                      <div className="text-muted small">
                        Update username, full name, and email.
                      </div>
                    </div>

                    {!editingProfile ? (
                      <button
                        className="btn btn-primary rounded-4 px-3"
                        type="button"
                        onClick={() => setEditingProfile(true)}
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        className="btn btn-light border rounded-4 px-3"
                        type="button"
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileForm({
                            username: profile?.username || "",
                            full_name: profile?.full_name || "",
                            email: profile?.email || "",
                          });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="row g-3">
                    <ProfileInput
                      label="Username"
                      value={profileForm.username}
                      disabled={!editingProfile}
                      onChange={(value) =>
                        setProfileForm({ ...profileForm, username: value })
                      }
                    />

                    <ProfileInput
                      label="Full Name"
                      value={profileForm.full_name}
                      disabled={!editingProfile}
                      onChange={(value) =>
                        setProfileForm({ ...profileForm, full_name: value })
                      }
                    />

                    <ProfileInput
                      label="Email"
                      type="email"
                      value={profileForm.email}
                      disabled={!editingProfile}
                      onChange={(value) =>
                        setProfileForm({ ...profileForm, email: value })
                      }
                    />
                  </div>

                  {editingProfile && (
                    <button
                      className="btn btn-primary rounded-4 px-4 mt-4"
                      type="button"
                      onClick={saveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  )}
                </div>
              </div>

              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
                    <div>
                      <h5 className="fw-bold mb-1">Password Security</h5>
                      <div className="text-muted small">
                        Change your account password.
                      </div>
                    </div>

                    {!changingPassword ? (
                      <button
                        className="btn btn-outline-primary rounded-4 px-3"
                        type="button"
                        onClick={() => setChangingPassword(true)}
                      >
                        Change Password
                      </button>
                    ) : (
                      <button
                        className="btn btn-light border rounded-4 px-3"
                        type="button"
                        onClick={() => {
                          setChangingPassword(false);
                          setPasswordForm({
                            current_password: "",
                            new_password: "",
                            confirm_password: "",
                          });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {changingPassword ? (
                    <>
                      <PasswordInput
                        label="Current Password"
                        value={passwordForm.current_password}
                        show={showCurrentPassword}
                        onToggle={() =>
                          setShowCurrentPassword((prev) => !prev)
                        }
                        onChange={(value) =>
                          setPasswordForm({
                            ...passwordForm,
                            current_password: value,
                          })
                        }
                      />

                      <PasswordInput
                        label="New Password"
                        value={passwordForm.new_password}
                        show={showNewPassword}
                        onToggle={() => setShowNewPassword((prev) => !prev)}
                        onChange={(value) =>
                          setPasswordForm({
                            ...passwordForm,
                            new_password: value,
                          })
                        }
                      />

                      <PasswordInput
                        label="Confirm New Password"
                        value={passwordForm.confirm_password}
                        show={showConfirmPassword}
                        onToggle={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                        onChange={(value) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirm_password: value,
                          })
                        }
                      />

                      <button
                        className="btn btn-primary rounded-4 px-4 mt-2"
                        type="button"
                        onClick={changePassword}
                        disabled={savingPassword}
                      >
                        {savingPassword ? "Saving..." : "Save New Password"}
                      </button>
                    </>
                  ) : (
                    <div className="alert alert-light border rounded-4 mb-0">
                      Password is hidden for security. Use Change Password to update it.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="d-flex justify-content-between gap-3 mb-2">
      <span className="text-muted small">{label}</span>
      <span className="fw-semibold text-end">{value || "—"}</span>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
}) {
  return (
    <div className="col-12 col-md-6">
      <label className="form-label fw-semibold">{label}</label>
      <input
        type={type}
        className="form-control rounded-3"
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PasswordInput({ label, value, onChange, show, onToggle }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>

      <div className="input-group">
        <input
          type={show ? "text" : "password"}
          className="form-control rounded-start-3"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />

        <button
          type="button"
          className="btn btn-light border rounded-end-3"
          onClick={onToggle}
        >
          <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} />
        </button>
      </div>
    </div>
  );
}