//components/AppLayout.jsx
import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 72 : 280;

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.25s ease",
          minHeight: "100vh",
        }}
        className="d-none d-lg-block"
      >
        <div className="app-content">
          <Outlet />
        </div>
      </main>

      <main className="d-lg-none">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}