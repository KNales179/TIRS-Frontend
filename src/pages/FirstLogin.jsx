// pages/FirstLogin.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../api/api";
import { getToken, logout } from "../data/auth";

export default function FirstLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim()) {
      return setError("Username is required.");
    }

    if (!fullName.trim()) {
      return setError("Full name is required.");
    }

    if (!email.trim()) {
      return setError("Email is required.");
    }

    if (!newPassword) {
      return setError("New password is required.");
    }

    if (newPassword.length < 8) {
      return setError("New password must be at least 8 characters.");
    }

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/auth/complete-first-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            username: username.trim(),
            full_name: fullName.trim(),
            email: email.trim(),
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return setError(data.message || "Setup failed");
      }

      logout();

      alert("Setup completed. Please login again.");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      setError(error.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div
        className="card shadow-sm border-0 mx-auto"
        style={{
          maxWidth: 540,
          borderRadius: 20,
        }}
      >
        <div className="card-body p-4">
          <h3 className="fw-bold mb-1">First Login Setup</h3>

          <div className="text-muted mb-4">
            Complete your administrator account setup.
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Change Username</label>
              <input
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your new username"
                autoComplete="username"
              />
              <div className="form-text">
                This will replace the temporary username assigned to you.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">New Password</label>

              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <i
                    className={`bi ${
                      showPassword ? "bi-eye-slash" : "bi-eye"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Confirm Password</label>

              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <i
                    className={`bi ${
                      showConfirmPassword ? "bi-eye-slash" : "bi-eye"
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Saving..." : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}