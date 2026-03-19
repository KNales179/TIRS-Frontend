import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="with-sidebar">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}