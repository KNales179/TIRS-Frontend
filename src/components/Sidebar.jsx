import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../data/auth";

// put these images in src/assets/
import tfroSeal from "../assets/tfro-seal.png";


const linkClass = ({ isActive }) =>
  `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 ${
    isActive ? "bg-primary text-white" : "text-secondary"
  }`;

function MenuLinks({ onLinkClick }) {
  return (
    <div className="nav nav-pills flex-column gap-2">
      <NavLink to="/dashboard" className={linkClass} onClick={onLinkClick}>
        <i className="bi bi-speedometer2 me-2" /> Dashboard
      </NavLink>

      <NavLink to="/profiles" className={linkClass} onClick={onLinkClick}>
        <i className="bi bi-person me-2" /> Profiles
      </NavLink>

      <NavLink to="/violations" className={linkClass} onClick={onLinkClick}>
        <i className="bi bi-exclamation-triangle me-2" /> Violations
      </NavLink>

      <NavLink to="/settings" className={linkClass} onClick={onLinkClick}>
        <i className="bi bi-gear me-2" /> Settings
      </NavLink>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="p-3 border-bottom bg-white">
      <div className="d-flex align-items-center justify-content-center gap-3">
        <img
          src={tfroSeal}
          alt="TFRO Seal"
          style={{ width: 56, height: 56, objectFit: "contain" }}
        />

        <div className="text-start lh-sm">
          <div
            className="fw-bold"
            style={{
              fontSize: "22px",
              letterSpacing: "2px",
              color: "#1f2937", // slate-800 feel
            }}
          >
            TIRS
          </div>
          <div className="text-muted small">
            Tricycle Integrated Records System
          </div>
        </div>
      </div>
    </div>
  );
}

function UserFooter({ onLogout }) {
  return (
    <div className="p-3 border-top bg-white">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle border d-flex align-items-center justify-content-center"
            style={{ width: 44, height: 44 }}
          >
            <i className="bi bi-person" style={{ fontSize: 22 }} />  
          </div>
          
          <div className="lh-sm">
            <div className="fw-semibold">User Name</div>
            <div className="text-muted small">Admin</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-link text-secondary p-0"
          title="Logout"
          aria-label="Logout"
        >
           <i className="bi bi-box-arrow-right" style={{ fontSize: 25 }} />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="d-none d-lg-flex flex-column position-fixed border-end"
        style={{ width: 280, height: "100vh", background: "#fff" }}
      >
        <BrandHeader />

        <nav className="p-3">
          <MenuLinks />
        </nav>

        <div className="mt-auto">
          <UserFooter onLogout={handleLogout} />
        </div>
      </aside>

      {/* Mobile offcanvas */}
      <div className="offcanvas offcanvas-start" tabIndex="-1" id="tfroSidebar">
        <div className="offcanvas-body d-flex flex-column p-0">
          <BrandHeader />

          <div className="p-3">
            <MenuLinks onLinkClick={() => {}} />
          </div>

          <div className="mt-auto">
            <UserFooter onLogout={handleLogout} />
          </div>
        </div>
      </div>

      {/* Mobile floating menu button (since we removed topbar) */}
      <button
        className="btn btn-primary d-lg-none position-fixed"
        style={{ left: 16, bottom: 16, borderRadius: 14, zIndex: 1050 }}
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#tfroSidebar"
        aria-controls="tfroSidebar"
      >
        ☰
      </button>
    </>
  );
}