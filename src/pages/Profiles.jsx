// src/pages/Profiles.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { driversMock as seedDrivers } from "../data/driversMock";
import { enforcersMock as seedEnforcers } from "../data/enforcersMock";
import DriverFormModal from "../components/DriverFormModal";
import EnforcerFormModal from "../components/EnforcerFormModal";

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join("");

  return (
    <div
      className="rounded-circle d-inline-flex align-items-center justify-content-center"
      style={{
        width: 36,
        height: 36,
        background: "#f1f3ff",
        color: "#5b63ff",
        fontWeight: 700,
        fontSize: 12,
        flex: "0 0 auto",
      }}
      title={name}
    >
      {initials}
    </div>
  );
}

function TypeBadge({ type }) {
  const isReg = type === "REGISTERED";
  return (
    <span
      className={`badge rounded-pill ${
        isReg ? "bg-success-subtle text-success-emphasis" : "bg-danger-subtle text-danger-emphasis"
      }`}
    >
      {isReg ? "Registered" : "Colorum"}
    </span>
  );
}

function parseBrgy(text = "") {
  const s = String(text);
  const m = s.match(/\b(brgy\.?|barangay)\s*([a-z0-9-]+)/i);
  if (!m) return "";
  return `Brgy. ${m[2]}`.replace(/\s+/g, " ").trim();
}

function makeId(prefix = "x") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function Profiles() {
  const nav = useNavigate();

  const tabs = ["Enforcer", "Driver", "Colorum"];
  const [tab, setTab] = useState("Driver");

  // local list state (so "Add" works without backend)
  const [drivers, setDrivers] = useState(seedDrivers);
  const [enforcers, setEnforcers] = useState(seedEnforcers);

  // search + sorting
  const [q, setQ] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [openMenuId, setOpenMenuId] = useState(null);

  // filters (Driver/Colorum)
  const [filterTODA, setFilterTODA] = useState("ALL");
  const [filterBrgy, setFilterBrgy] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [hasViolations, setHasViolations] = useState(false);
  const [hasFranchise, setHasFranchise] = useState(false);

  // enforcer filter
  const [enfBrgy, setEnfBrgy] = useState("ALL");

  // modals
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showEnforcerModal, setShowEnforcerModal] = useState(false);

  const baseList = useMemo(() => {
    if (tab === "Driver") return drivers.filter((d) => d.type === "REGISTERED");
    if (tab === "Colorum") return drivers.filter((d) => d.type === "COLORUM");
    if (tab === "Enforcer") return enforcers;
    return [];
  }, [tab, drivers, enforcers]);

  const driverOptions = useMemo(() => {
    if (tab === "Enforcer") return { todas: [], brgys: [], statuses: [] };

    const list = baseList;
    const todos = new Set();
    const brgys = new Set();
    const statuses = new Set();

    list.forEach((d) => {
      if (d.toda) todos.add(d.toda);
      const b = parseBrgy(d.address);
      if (b) brgys.add(b);
      const st = d.vehicle?.status;
      if (st) statuses.add(st);
    });

    return {
      todas: Array.from(todos).sort(),
      brgys: Array.from(brgys).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }, [baseList, tab]);

  const enforcerOptions = useMemo(() => {
    if (tab !== "Enforcer") return { brgys: [] };

    const brgys = new Set();
    baseList.forEach((e) => {
      (e.apprehensionRecord || []).forEach((r) => {
        const b = parseBrgy(r.location || "");
        if (b) brgys.add(b);
      });
    });

    return { brgys: Array.from(brgys).sort() };
  }, [baseList, tab]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = baseList;

    if (tab === "Enforcer") {
      list = list.filter((e) => {
        if (s) {
          const ok =
            (e.name || "").toLowerCase().includes(s) ||
            (e.idNumber || "").toLowerCase().includes(s) ||
            (e.contact || "").toLowerCase().includes(s) ||
            (e.address || "").toLowerCase().includes(s);

          if (!ok) return false;
        }

        if (enfBrgy !== "ALL") {
          const records = e.apprehensionRecord || [];
          const anyMatch = records.some((r) => parseBrgy(r.location || "") === enfBrgy);
          if (!anyMatch) return false;
        }

        return true;
      });
    } else {
      list = list.filter((d) => {
        if (filterTODA !== "ALL" && d.toda !== filterTODA) return false;

        const b = parseBrgy(d.address);
        if (filterBrgy !== "ALL" && b !== filterBrgy) return false;

        const st = d.vehicle?.status || "";
        if (filterStatus !== "ALL" && st !== filterStatus) return false;

        if (hasViolations && (d.violationsHistory || []).length === 0) return false;
        if (hasFranchise && !String(d.franchiseNo || "").trim()) return false;

        if (s) {
          const franchise = (d.franchiseNo || "").toLowerCase();
          const name = (d.name || "").toLowerCase();
          const address = (d.address || "").toLowerCase();
          const contact = (d.contact || "").toLowerCase();
          const toda = (d.toda || "").toLowerCase();
          const plate = (d.vehicle?.plateNo || "").toLowerCase();

          const ok =
            franchise.includes(s) ||
            name.includes(s) ||
            address.includes(s) ||
            contact.includes(s) ||
            toda.includes(s) ||
            plate.includes(s);

          if (!ok) return false;
        }

        return true;
      });
    }

    list = [...list].sort((a, b) => {
      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      if (an < bn) return sortDir === "asc" ? -1 : 1;
      if (an > bn) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [
    baseList,
    tab,
    q,
    sortDir,
    filterTODA,
    filterBrgy,
    filterStatus,
    hasViolations,
    hasFranchise,
    enfBrgy,
  ]);

  function resetFilters() {
    setQ("");
    setFilterTODA("ALL");
    setFilterBrgy("ALL");
    setFilterStatus("ALL");
    setHasViolations(false);
    setHasFranchise(false);
    setEnfBrgy("ALL");
  }

  function goRow(id) {
    setOpenMenuId(null);
    if (tab === "Enforcer") nav(`/enforcers/${id}`);
    else nav(`/profiles/${id}`);
  }

  function goTransactions(id) {
    setOpenMenuId(null);
    nav(`/profiles/${id}/transactions`);
  }

  function closeMenu() {
    setOpenMenuId(null);
  }

  function headerName() {
    if (tab === "Driver") return "Driver’s List";
    if (tab === "Colorum") return "Colorum List";
    return "Enforcer’s List";
  }

  function handleAddClick() {
    if (tab === "Enforcer") setShowEnforcerModal(true);
    else if (tab === "Driver") setShowDriverModal(true);
    else if (tab === "Colorum") setShowDriverModal(true);
  }

  function handleDriverSubmit(payload) {
    const newDriver = { id: makeId("d"), ...payload };
    setDrivers((prev) => [newDriver, ...prev]);
  }

  function handleEnforcerSubmit(payload) {
    const newEnforcer = { id: makeId("e"), ...payload };
    setEnforcers((prev) => [newEnforcer, ...prev]);
  }

  return (
    <div onClick={() => (openMenuId ? closeMenu() : null)}>
      {/* Modals */}
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

      {/* Header + Tabs */}
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 fw-bold mb-1">{headerName()}</h1>
          <div className="text-muted small">Browse and open a record to view full information.</div>
        </div>

        <div className="btn-group">
          {tabs.map((t) => (
            <button
              key={t}
              className={`btn ${tab === t ? "btn-primary" : "btn-outline-primary"}`}
              onClick={(e) => {
                e.stopPropagation();
                setTab(t);
                setOpenMenuId(null);
                resetFilters();
              }}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="card rounded-4 shadow-sm">
        <div className="card-body">
          {/* Count + Actions */}
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
            <div className="text-muted small">
              Showing <b>{filtered.length}</b> record(s)
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={resetFilters}>
                Reset filters
              </button>
              <button className="btn btn-sm btn-primary" type="button" onClick={handleAddClick}>
                + Add New
              </button>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            {tab === "Enforcer" ? (
              <>
                <select
                  className="form-select"
                  style={{ width: 180 }}
                  value={enfBrgy}
                  onChange={(e) => setEnfBrgy(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="ALL">All Barangays</option>
                  {enforcerOptions.brgys.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <input
                  className="form-control"
                  style={{ flex: "1 1 320px", minWidth: 280 }}
                  placeholder="Search name, ID number, address, contact..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </>
            ) : (
              <>
                <select
                  className="form-select"
                  style={{ width: 170 }}
                  value={filterTODA}
                  onChange={(e) => setFilterTODA(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="ALL">All TODA</option>
                  {driverOptions.todas.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select"
                  style={{ width: 170 }}
                  value={filterBrgy}
                  onChange={(e) => setFilterBrgy(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="ALL">All Barangays</option>
                  {driverOptions.brgys.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select"
                  style={{ width: 170 }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="ALL">All Status</option>
                  {driverOptions.statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <label className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={hasViolations}
                      onChange={(e) => setHasViolations(e.target.checked)}
                    />
                    <span className="form-check-label small">Has violations</span>
                  </label>

                  <label className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={hasFranchise}
                      onChange={(e) => setHasFranchise(e.target.checked)}
                    />
                    <span className="form-check-label small">Has franchise #</span>
                  </label>
                </div>

                <input
                  className="form-control"
                  style={{ flex: "1 1 320px", minWidth: 280 }}
                  placeholder="Search name, franchise, plate, address, contact, TODA..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </>
            )}
          </div>

          {/* Table header */}
          <div className="row px-3 text-muted small fw-semibold mb-2">
            <div className="col-4 d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none text-muted fw-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                }}
                title="Sort by name"
              >
                Name <span style={{ fontSize: 10 }}>{sortDir === "asc" ? "▼" : "▲"}</span>
              </button>
            </div>

            {tab === "Enforcer" ? (
              <>
                <div className="col-3">ID Number</div>
                <div className="col-3">Contact number</div>
                <div className="col-2 d-flex justify-content-between">
                  <span>Address</span>
                  <span />
                </div>
              </>
            ) : (
              <>
                <div className="col-3">Address</div>
                <div className="col-3">Contact number</div>
                <div className="col-2 d-flex justify-content-between">
                  <span>TODA</span>
                  <span />
                </div>
              </>
            )}
          </div>

          {/* Rows */}
          <div className="d-flex flex-column gap-3">
            {filtered.map((item) => {
              const isEnforcer = tab === "Enforcer";

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-4 border"
                  style={{ padding: 14, cursor: "pointer" }}
                  onClick={() => goRow(item.id)}
                >
                  <div className="row align-items-center">
                    <div className="col-4 d-flex align-items-center gap-2">
                      <Avatar name={item.name} />
                      <div className="d-flex flex-column">
                        <div className="fw-semibold">{item.name}</div>

                        {!isEnforcer && (
                          <div className="small text-muted d-flex gap-2 align-items-center">
                            <span>{item.franchiseNo || "—"}</span>
                            <span>•</span>
                            <TypeBadge type={item.type} />
                          </div>
                        )}
                      </div>
                    </div>

                    {isEnforcer ? (
                      <>
                        <div className="col-3">{item.idNumber}</div>
                        <div className="col-3">{item.contact}</div>

                        <div className="col-2 d-flex align-items-center justify-content-between position-relative">
                          <div className="text-truncate" title={item.address}>
                            {item.address}
                          </div>

                          <button
                            className="btn btn-sm btn-light"
                            type="button"
                            title="More"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId((cur) => (cur === item.id ? null : item.id));
                            }}
                            style={{ width: 36, height: 32 }}
                          >
                            ⋯
                          </button>

                          {openMenuId === item.id && (
                            <div
                              className="dropdown-menu show"
                              style={{
                                position: "absolute",
                                right: 8,
                                top: 44,
                                zIndex: 10,
                                minWidth: 210,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="dropdown-item"
                                type="button"
                                onClick={() => nav(`/enforcers/${item.id}`)}
                              >
                                View Enforcer Information
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-3">{item.address}</div>
                        <div className="col-3">{item.contact}</div>

                        <div className="col-2 d-flex align-items-center justify-content-between position-relative">
                          <div>{item.toda}</div>

                          <button
                            className="btn btn-sm btn-light"
                            type="button"
                            title="More"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId((cur) => (cur === item.id ? null : item.id));
                            }}
                            style={{ width: 36, height: 32 }}
                          >
                            ⋯
                          </button>

                          {openMenuId === item.id && (
                            <div
                              className="dropdown-menu show"
                              style={{
                                position: "absolute",
                                right: 8,
                                top: 44,
                                zIndex: 10,
                                minWidth: 210,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button className="dropdown-item" type="button" onClick={() => nav(`/profiles/${item.id}`)}>
                                View Driver Information
                              </button>
                              <button className="dropdown-item" type="button" onClick={() => goTransactions(item.id)}>
                                View Transaction Details
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && <div className="text-center text-muted py-5">No records found.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}