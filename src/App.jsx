import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profiles from "./pages/Profiles";
import DriverInfo from "./pages/DriverInfo";
import EnforcerInfo from "./pages/EnforcerInfo";
import TransactionDetails from "./pages/TransactionDetails";
import Violations from "./pages/Violations";
import Settings from "./pages/Settings";
import { isAuthed } from "./data/auth";

function Protected({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profiles/:id" element={<DriverInfo />} />
          <Route path="/enforcers/:id" element={<EnforcerInfo />} />
          <Route path="/profiles/:id/transactions" element={<TransactionDetails />} />
          <Route path="/violations" element={<Violations />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}