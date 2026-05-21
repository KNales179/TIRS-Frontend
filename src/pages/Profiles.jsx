import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverFormModal from "../components/DriverFormModal";
import EnforcerFormModal from "../components/EnforcerFormModal";
import { exportProfilesToExcel } from "../utils/exportExcel";
import { useTFROData } from "../context/TFRODataContext";

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join("");

  return (
    <div
      className="d-inline-flex align-items-center justify-content-center rounded-circle"
      style={{
        width: 40,
        height: 40,
        background: "#eef2ff",
        color: "#5b63ff",
        fontWeight: 700,
        fontSize: 13,
        flex: "0 0 auto",
      }}
      title={name}
    >
      {initials}
    </div>
  );
}

function normalizeDriverType(type) {
  const t = String(type || "").trim().toUpperCase();

  if (
    t === "REGISTERED" ||
    t === "WITH FRANCHISE" ||
    t === "FRANCHISED" ||
    t === "FOR HAILING"
  ) {
    return "WITH FRANCHISE";
  }

  if (t === "SPECIAL" || t === "SPECIAL FRANCHISE") {
    return "SPECIAL FRANCHISE";
  }

  if (t === "COLORUM") return "COLORUM";
  if (t === "TEMPORARY") return "TEMPORARY";

  return t || "—";
}

function TypeBadge({ type }) {
  const normalized = normalizeDriverType(type);

  const badgeClass =
    normalized === "WITH FRANCHISE"
      ? "bg-success-subtle text-success-emphasis"
      : normalized === "SPECIAL FRANCHISE"
      ? "bg-primary-subtle text-primary-emphasis"
      : normalized === "COLORUM"
      ? "bg-warning-subtle text-warning-emphasis"
      : "bg-secondary-subtle text-secondary-emphasis";

  return <span className={`badge rounded-pill ${badgeClass}`}>{normalized}</span>;
}

function ViolationBadge({ driver }) {
  const violations = (driver.vehicles || []).flatMap((v) => v.violations || []);
  const hasPending = violations.some((v) => {
    const s = String(v.status || "").toLowerCase();
    return !["done", "paid", "settled"].includes(s);
  });

  if (violations.length === 0) {
    return (
      <span className="badge rounded-pill bg-success-subtle text-success-emphasis">
        No Violation
      </span>
    );
  }

  if (hasPending) {
    return (
      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">
        Has Pending
      </span>
    );
  }

  return (
    <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">
      Has Violation
    </span>
  );
}

function makeId(prefix = "x") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function getFranchiseForVehicle(driver, vehicleIndex) {
  const franchises = driver.franchises || [];
  return franchises.find((f) => Number(f.vehicleIndex) === Number(vehicleIndex)) || null;
}

function buildDriverTableRows(drivers) {
  const tableRows = [];

  drivers.forEach((driver) => {
    const vehicles = driver.vehicles || [];

    if (vehicles.length === 0) {
      tableRows.push({
        rowId: `${driver.id}-empty`,
        driver,
        vehicle: null,
        vehicleIndex: -1,
        franchise: null,
      });
      return;
    }

    vehicles.forEach((vehicle, index) => {
      const franchise = getFranchiseForVehicle(driver, index);

      tableRows.push({
        rowId: `${driver.id}-${vehicle.plateNo || index}`,
        driver,
        vehicle,
        vehicleIndex: index,
        franchise,
      });
    });
  });

  return tableRows;
}

export default function Profiles() {
  const nav = useNavigate();

  const { drivers, setDrivers, enforcers, setEnforcers } = useTFROData();

  const tabs = ["Enforcer", "Driver", "Colorum"];
  const [tab, setTab] = useState("Driver");

  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showEnforcerModal, setShowEnforcerModal] = useState(false);

  const baseList = useMemo(() => {
    if (tab === "Driver") {
      return drivers.filter((d) => {
        const type = normalizeDriverType(d.type);
        return type === "WITH FRANCHISE" || type === "SPECIAL FRANCHISE";
      });
    }

    if (tab === "Colorum") {
      return drivers.filter((d) => normalizeDriverType(d.type) === "COLORUM");
    }

    if (tab === "Enforcer") {
      return enforcers;
    }

    return [];
  }, [tab, drivers, enforcers]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (tab === "Enforcer") {
      let list = baseList.filter((e) => {
        if (!q) return true;

        return [e.name, e.idNumber, e.contact, e.address, e.position, e.status]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });

      return [...list].sort((a, b) => {
        const an = (a.name || "").toLowerCase();
        const bn = (b.name || "").toLowerCase();

        if (an < bn) return sortDir === "asc" ? -1 : 1;
        if (an > bn) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    let driverRows = buildDriverTableRows(baseList);

    if (q) {
      driverRows = driverRows.filter(({ driver, vehicle, franchise }) => {
        return [
          driver.name,
          driver.operatorName,
          driver.franchiseNo,
          franchise?.number,
          driver.address,
          driver.contact,
          driver.toda,
          driver.type,
          vehicle?.plateNo,
          vehicle?.motor,
          vehicle?.modelMake,
          vehicle?.engine,
          vehicle?.chassis,
          vehicle?.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }

    return [...driverRows].sort((a, b) => {
      const an = (a.driver?.name || "").toLowerCase();
      const bn = (b.driver?.name || "").toLowerCase();

      if (an < bn) return sortDir === "asc" ? -1 : 1;
      if (an > bn) return sortDir === "asc" ? 1 : -1;

      return 0;
    });
  }, [baseList, query, sortDir, tab]);

  const exportDrivers = useMemo(() => {
    if (tab === "Driver") {
      return drivers.filter((d) => {
        const type = normalizeDriverType(d.type);
        return type === "WITH FRANCHISE" || type === "SPECIAL FRANCHISE";
      });
    }

    if (tab === "Colorum") {
      return drivers.filter((d) => normalizeDriverType(d.type) === "COLORUM");
    }

    return drivers;
  }, [drivers, tab]);

  function headerTitle() {
    if (tab === "Driver") return "Driver Profiles";
    if (tab === "Colorum") return "Colorum Profiles";
    return "Enforcer Profiles";
  }

  function handleAddClick() {
    if (tab === "Enforcer") setShowEnforcerModal(true);
    else setShowDriverModal(true);
  }

  function handleDriverSubmit(payload) {
    const newDriver = {
      id: makeId("d"),
      role: payload.role || "Driver",
      ...payload,
    };

    setDrivers((prev) => [newDriver, ...prev]);
  }

  function handleEnforcerSubmit(payload) {
    const newEnforcer = { id: makeId("e"), ...payload };
    setEnforcers((prev) => [newEnforcer, ...prev]);
  }

  function goToProfile(id) {
    if (tab === "Enforcer") nav(`/enforcers/${id}`);
    else nav(`/profiles/${id}`);
  }

  function goToTransactions(id) {
    nav(`/profiles/${id}/transactions`);
  }

  function handleExportExcel() {
    exportProfilesToExcel({
      drivers: exportDrivers,
      enforcers,
      activeTab: tab,
    });
  }

  const headerButtonClass = (active) =>
    `btn ${active ? "btn-primary" : "btn-outline-primary"} rounded-3 px-3`;

  return (
    <div className="container-fluid">
      <DriverFormModal
        show={showDriverModal}
        mode={tab === "Colorum" ? "COLORUM" : "REGISTERED"}
        onClose={() => setShowDriverModal(false)}
        onSubmit={handleDriverSubmit}
      />

      <EnforcerFormModal
        show={showEnforcerModal}
        onClose={() => setShowEnforcerModal(false)}
        onSubmit={handleEnforcerSubmit}
      />

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="h4 fw-bold mb-0">{headerTitle()}</h1>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group" style={{ width: 280 }}>
            <input
              className="form-control rounded-start-4"
              placeholder={tab === "Enforcer" ? "Search enforcer..." : "Search profile..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="input-group-text rounded-end-4 bg-white">
              <i className="bi bi-search text-muted"></i>
            </span>
          </div>

          <button
            className="btn btn-success rounded-4 px-4 d-flex align-items-center gap-2"
            onClick={handleExportExcel}
            type="button"
          >
            <i className="bi bi-file-earmark-excel"></i>
            Export Excel
          </button>

          <button
            className="btn btn-primary rounded-4 px-4"
            onClick={handleAddClick}
            type="button"
          >
            + Add {tab === "Enforcer" ? "Enforcer" : "Profile"}
          </button>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            className={headerButtonClass(tab === t)}
            onClick={() => {
              setTab(t);
              setQuery("");
            }}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="row g-3 mx-0">
        <div className="col-12">
          <div className="card rounded-4 shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="text-muted small">
                  Total records: <span className="fw-semibold">{rows.length}</span>
                </div>

                <button
                  className="btn btn-light btn-sm rounded-3 d-flex align-items-center gap-1"
                  onClick={() =>
                    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  type="button"
                >
                  <i className="bi bi-arrow-down-up"></i>
                  Sort: {sortDir === "asc" ? "A-Z" : "Z-A"}
                </button>
              </div>

              <div className="table-responsive">
                <table className="tfro-table">
                  <thead>
                    <tr className="text-muted small">
                      <th style={{ minWidth: 260 }}>Name</th>

                      {tab === "Enforcer" ? (
                        <>
                          <th>ID Number</th>
                          <th>Contact</th>
                          <th>Address</th>
                          <th className="text-end">Actions</th>
                        </>
                      ) : (
                        <>
                          <th>Type</th>
                          <th>Contact</th>
                          <th>Address</th>
                          <th>Violation Status</th>
                          {tab !== "Colorum" && <th>TODA / Franchise</th>}
                          <th className="text-end">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {tab === "Enforcer" &&
                      rows.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <Avatar name={item.name} />
                              <div>
                                <div className="fw-semibold">{item.name}</div>
                                <div className="small text-muted">Enforcer record</div>
                              </div>
                            </div>
                          </td>

                          <td>{item.idNumber || "—"}</td>
                          <td>{item.contact || "—"}</td>
                          <td>{item.address || "—"}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-light rounded-circle"
                              title="View Enforcer Information"
                              onClick={() => goToProfile(item.id)}
                              type="button"
                            >
                              <i className="bi bi-eye" />
                            </button>
                          </td>
                        </tr>
                      ))}

                    {tab !== "Enforcer" &&
                      rows.map(({ rowId, driver, franchise }) => {
                        const franchiseNo = franchise?.number || driver.franchiseNo || "—";

                        return (
                          <tr key={rowId}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <Avatar name={driver.name} />
                                <div>
                                  <div className="fw-semibold">{driver.name}</div>
                                  <div className="small text-muted">
                                    Operator: {driver.operatorName || "—"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <TypeBadge type={driver.type} />
                            </td>

                            <td>{driver.contact || "—"}</td>
                            <td>{driver.address || "—"}</td>
                            <td>
                              <ViolationBadge driver={driver} />
                            </td>

                            {tab !== "Colorum" && (
                              <td>
                                <div>{driver.toda || "—"}</div>
                                <div className="small text-muted">
                                  Franchise: {franchiseNo}
                                </div>
                              </td>
                            )}

                            <td className="text-end">
                              <div className="d-inline-flex align-items-center gap-2">
                                <button
                                  className="btn btn-sm btn-light rounded-circle"
                                  title="View Driver Information"
                                  onClick={() => goToProfile(driver.id)}
                                  type="button"
                                >
                                  <i className="bi bi-eye" />
                                </button>

                                <button
                                  className="btn btn-sm btn-light rounded-circle"
                                  title="View Transaction Details"
                                  onClick={() => goToTransactions(driver.id)}
                                  type="button"
                                >
                                  <i className="bi bi-receipt" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={
                            tab === "Enforcer" ? 5 : tab === "Colorum" ? 6 : 7
                          }
                          className="text-center text-muted py-5"
                        >
                          No results.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}