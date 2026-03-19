import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../data/auth";

import tfroSeal from "../assets/tfro-seal.png";
import illustration from "../assets/illustration.png";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // frontend-only demo auth
    const ok = login(username.trim(), password, remember);
    if (!ok) return setError("Invalid username or password.");

    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="row g-0">
          {/* LEFT */}
          <div className="col-lg-4">
            <div className="auth-left d-flex flex-column align-items-center">
              <img className="auth-logo" src={tfroSeal} alt="TFRO Seal" />
              <div className="auth-title">Log in</div>

              <form onSubmit={handleSubmit} className="w-100 mt-4">
                {error ? (
                  <div className="alert alert-danger py-2">{error}</div>
                ) : null}

                <div className="mb-3">
                  <label className="form-label small text-muted">Username</label>
                  <input
                    className="form-control auth-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user123"
                    autoComplete="username"
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small text-muted">Password</label>
                  <div className="input-group">
                    <input
                      type={showPass ? "text" : "password"}
                      className="form-control auth-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                    type="button"
                    className="btn btn-light"
                    style={{ borderRadius: "12px" }}
                    onClick={() => setShowPass((v) => !v)}
                    >
                    <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-3 mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      id="remember"
                    />
                    <label className="form-check-label small" htmlFor="remember">
                      Remember me
                    </label>
                  </div>

                  <a className="auth-link small" href="#!" onClick={(e) => e.preventDefault()}>
                    Reset Password?
                  </a>
                </div>

                <button type="submit" className="btn btn-primary w-100 auth-btn">
                  Log in
                </button>

                <div className="text-center mt-3 small text-muted">
                  Don’t have account yet?{" "}
                  <a className="auth-link" href="#!" onClick={(e) => e.preventDefault()}>
                    New Account
                  </a>
                </div>

                {/* demo hint */}
                <div className="text-center mt-3 small text-muted">
                  Demo: <b>admin</b> / <b>admin123</b>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-lg-8">
            <div className="auth-right">
              <img
                src={illustration}
                alt="Illustration"
                style={{ width: "80%", maxWidth: 500, maxHeight: 400, objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}