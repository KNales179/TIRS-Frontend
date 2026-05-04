import { NavLink, useNavigate } from "react-router-dom";
import { logout, getUser } from "../data/auth";
import tfroSeal from "../assets/tfro-seal.png";

const linkClass = ({ isActive }, collapsed = false) =>
  `nav-link d-flex align-items-center ${
    collapsed
      ? "justify-content-center py-3 px-0"
      : "gap-2 px-3 py-2"
  } rounded-3 ${
    isActive ? "bg-primary text-white" : "text-secondary"
  }`;

function MenuLinks({ onLinkClick, collapsed = false }) {
  const user = getUser();

  const items = [
    {
      to: "/dashboard",
      icon: "bi-speedometer2",
      label: "Dashboard",
      roles: ["Admin", "Staff", "Enforcer"],
    },
    {
      to: "/profiles",
      icon: "bi-person",
      label: "Profiles",
      roles: ["Admin", "Staff"],
    },
    {
      to: "/violations",
      icon: "bi-exclamation-triangle",
      label: "Violations",
      roles: ["Admin", "Staff", "Enforcer"],
    },
    {
      to: "/settings",
      icon: "bi-gear",
      label: "Settings",
      roles: ["Admin"],
    },
  ].filter((item) => item.roles.includes(user?.role));

  return (
    <div className="nav nav-pills flex-column gap-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={(nav) => linkClass(nav, collapsed)}
          onClick={onLinkClick}
          title={collapsed ? item.label : ""}
        >
          <i
            className={`bi ${item.icon}`}
            style={{
              fontSize: 22,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          />
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </div>
  );
}

function BrandHeader({ collapsed, onToggle }) {
  return (
    <div className="p-3 border-bottom bg-white">
      <div
        className={`d-flex align-items-center ${
          collapsed ? "justify-content-center" : "justify-content-between"
        }`}
      >
        <div
          className={`d-flex align-items-center ${
            collapsed ? "justify-content-center" : "gap-3"
          }`}
          style={{ cursor: collapsed ? "pointer" : "default" }}
          onClick={collapsed ? onToggle : undefined}
          title={collapsed ? "Expand sidebar" : ""}
          aria-label={collapsed ? "Expand sidebar" : undefined}
        >
          <img
            src={tfroSeal}
            alt="TFRO Seal"
            style={{ width: 56, height: 56, objectFit: "contain" }}
          />

          {!collapsed && (
            <div className="text-start lh-sm">
              <div
                className="fw-bold"
                style={{
                  fontSize: "22px",
                  letterSpacing: "2px",
                  color: "#1f2937",
                }}
              >
                TIRS
              </div>
              <div className="text-muted small">
                Tricycle Integrated Records System
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="btn btn-light ms-2"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "none",
              boxShadow: "none",
            }}
          >
            <i className="bi bi-chevron-left" />
          </button>
        )}
      </div>
    </div>
  );
}
const user = getUser();
function UserFooter({ onLogout, collapsed }) {
  const user = getUser();
  return (
    <div className="p-3 border-top bg-white">
      {collapsed ? (
        <div className="d-flex flex-column align-items-center gap-3">
          <div
            className="rounded-circle border d-flex align-items-center justify-content-center"
            style={{ width: 40, height: 40 }}
            title="Admin"
          >
            <i className="bi bi-person" style={{ fontSize: 22 }} />
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
      ) : (
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle border d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40 }}
            >
              <i className="bi bi-person" style={{ fontSize: 22 }} />
            </div>

            <div className="lh-sm">
            <div className="fw-semibold">{user?.name || "Unknown User"}</div>
            <div className="text-muted small">{user?.role || "User"}</div>
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
      )}
    </div>
  );
}

export default function Sidebar({ collapsed = false, setCollapsed }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const desktopWidth = collapsed ? 72 : 280;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="d-none d-lg-flex flex-column position-fixed border-end"
        style={{
          width: desktopWidth,
          height: "100vh",
          background: "#fff",
          transition: "width 0.25s ease",
          overflow: "hidden",
          zIndex: 1030,
        }}
      >
        <BrandHeader
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />

        <nav className={collapsed ? "py-3 px-2" : "p-3"}>
          <MenuLinks collapsed={collapsed} />
        </nav>

        <div className="mt-auto">
          <UserFooter onLogout={handleLogout} collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile offcanvas */}
      <div className="offcanvas offcanvas-start" tabIndex="-1" id="tfroSidebar">
        <div className="offcanvas-body d-flex flex-column p-0">
          <BrandHeader collapsed={false} onToggle={() => {}} />

          <div className="p-3">
            <MenuLinks onLinkClick={() => {}} collapsed={false} />
          </div>

          <div className="mt-auto">
            <UserFooter onLogout={handleLogout} collapsed={false} />
          </div>
        </div>
      </div>

      {/* Mobile floating menu button */}
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