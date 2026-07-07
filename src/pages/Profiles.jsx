// pages/Profiles.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverFormModal from "../components/DriverFormModal";
import EnforcerFormModal from "../components/EnforcerFormModal";
import { exportProfilesToExcel } from "../utils/exportExcel";
import { getToken } from "../data/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function apiRequest(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

async function uploadFileRequest(file, payload) {
  const token = getToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", payload.category);
  formData.append("related_type", payload.related_type);
  formData.append("related_id", payload.related_id);

  const res = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Upload failed");
  }

  return data;
}

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
    t === "REGULAR" ||
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

function frontendTypeToBackendClassification(type) {
  const normalized = normalizeDriverType(type);

  if (normalized === "WITH FRANCHISE") return "REGULAR";
  if (normalized === "SPECIAL FRANCHISE") return "SPECIAL";
  if (normalized === "COLORUM") return "COLORUM";
  if (normalized === "TEMPORARY") return "TEMPORARY";

  return "REGULAR";
}

function splitFullName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      first_name: "",
      middle_name: null,
      last_name: "",
    };
  }

  if (parts.length === 1) {
    return {
      first_name: parts[0],
      middle_name: null,
      last_name: parts[0],
    };
  }

  return {
    first_name: parts[0],
    middle_name: parts.length > 2 ? parts.slice(1, -1).join(" ") : null,
    last_name: parts[parts.length - 1],
  };
}

function fullNameFromBackend(driver) {
  return [driver.first_name, driver.middle_name, driver.last_name, driver.suffix]
    .filter(Boolean)
    .join(" ");
}

function normalizeBackendDriver(driver) {
  return {
    id: driver.id,
    driver_code: driver.driver_code,
    role: "Driver",
    type: driver.classification,
    classification: driver.classification,
    franchiseNo: driver.franchise_number || driver.franchiseNo || "",
    name: fullNameFromBackend(driver),
    operatorName: driver.operator_name || driver.operatorName || "—",
    address: driver.address || "",
    contact: driver.contact_number || "",
    toda: driver.toda || driver.toda_name || "—",
    photoUrl: driver.photo_url || "",
    vehicles: driver.vehicles || [],
    franchises: driver.franchises || [],
    transactions: driver.transactions || [],
    raw: driver,
  };
}

function buildCreateDriverPayload(payload, activeTab) {
  const nameParts = splitFullName(payload.name);

  return {
    classification:
      activeTab === "Colorum"
        ? "COLORUM"
        : frontendTypeToBackendClassification(payload.type || payload.classification),

    first_name: payload.first_name || nameParts.first_name,
    middle_name: payload.middle_name || nameParts.middle_name,
    last_name: payload.last_name || nameParts.last_name,
    suffix: payload.suffix || null,

    birth_date: payload.birth_date || null,
    gender: payload.gender || null,
    contact_number: payload.contact_number || payload.contact || null,
    address: payload.address || null,
    license_number: payload.license_number || null,
    license_expiry: payload.license_expiry || null,
    photo_url: payload.photo_url || payload.photoUrl || null,
    status: payload.status || "ACTIVE",
  };
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

function getFranchiseForVehicle(driver, vehicleIndex) {
  const vehicle = driver.vehicles?.[vehicleIndex];
  const franchises = driver.franchises || [];

  if (!vehicle?.id) return null;

  return franchises.find((f) => Number(f.vehicle_id) === Number(vehicle.id)) || null;
}

function buildDriverTableRows(drivers) {
  return drivers.map((driver) => ({
    rowId: driver.id,
    driver,
  }));
}

function getDriverFranchiseSummary(driver) {
  const franchises = (driver.franchises || []).filter((f) => f?.number || f?.toda_name);

  if (franchises.length === 0) {
    return {
      visible: [],
      hasMore: false,
    };
  }

  return {
    visible: franchises.slice(0, 3),
    hasMore: franchises.length > 3,
  };
}

function normalizeBackendEnforcer(enforcer) {
  return {
    id: enforcer.id,
    enforcer_code: enforcer.enforcer_code,
    idNumber: enforcer.enforcer_code,
    name: [enforcer.first_name, enforcer.middle_name, enforcer.last_name, enforcer.suffix]
      .filter(Boolean)
      .join(" "),
    contact: enforcer.contact_number || "",
    address: enforcer.address || "",
    photoUrl: enforcer.photo_url || "",
    status: enforcer.status || "ACTIVE",
    raw: enforcer,
  };
}

export default function Profiles() {
  const nav = useNavigate();

  const tabs = ["Enforcer", "Driver", "Colorum"];
  const [tab, setTab] = useState("Driver");

  const [drivers, setDrivers] = useState([]);
  const [enforcers, setEnforcers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showEnforcerModal, setShowEnforcerModal] = useState(false);

  async function fetchDrivers() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/drivers");
      const list = response.data || response.drivers || [];
      setDrivers(list.map(normalizeBackendDriver));
    } catch (err) {
      setError(err.message || "Failed to fetch drivers");
    } finally {
      setLoading(false);
    }
  }

  async function fetchEnforcers() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/enforcers");
      const list = response.data || response.enforcers || [];

      setEnforcers(list.map(normalizeBackendEnforcer));
    } catch (err) {
      setError(err.message || "Failed to fetch enforcers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrivers();
    fetchEnforcers();
  }, []);

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
      driverRows = driverRows.filter(({ driver }) => {
        const franchises = driver.franchises || [];
        const vehicles = driver.vehicles || [];

        return [
          driver.name,
          driver.operatorName,
          driver.franchiseNo,
          driver.address,
          driver.contact,
          driver.toda,
          driver.type,
          ...franchises.flatMap((f) => [
            f.number,
            f.toda_name,
            f.franchise_type,
            f.status,
          ]),
          ...vehicles.flatMap((v) => [
            v.plateNo,
            v.motor,
            v.modelMake,
            v.engine,
            v.chassis,
            v.status,
          ]),
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
    if (tab === "Enforcer") {
      setShowEnforcerModal(true);
      return;
    }

    setShowDriverModal(true);
  }

  async function handleDriverSubmit(payload) {
    try {
      setError("");

      const { photoFile, ...driverPayload } = payload;

      const response = await apiRequest("/drivers", {
        method: "POST",
        body: JSON.stringify({
          ...driverPayload,
          photo_url: null,
        }),
      });

      const newDriverId =
        response?.data?.id ||
        response?.data?._id ||
        response?.id ||
        response?._id;

      if (!newDriverId) {
        setShowDriverModal(false);
        await fetchDrivers();
        return;
      }

      if (photoFile) {
        const uploadResponse = await uploadFileRequest(photoFile, {
          category: "PROFILE_PHOTO",
          related_type: "DRIVER",
          related_id: newDriverId,
        });

        const photoUrl =
          uploadResponse?.data?.secure_url ||
          uploadResponse?.data?.file_url ||
          "";

        if (photoUrl) {
          await apiRequest(`/drivers/${newDriverId}`, {
            method: "PUT",
            body: JSON.stringify({
              ...driverPayload,
              photo_url: photoUrl,
            }),
          });
        }
      }

      setShowDriverModal(false);
      nav(`/profiles/${newDriverId}`);
    } catch (err) {
      setError(err.message || "Failed to create driver");
    }
  }
  async function handleEnforcerSubmit(payload) {
    try {
      setError("");

      const { photoFile } = payload;
      const nameParts = splitFullName(payload.name);

      const enforcerPayload = {
        first_name: nameParts.first_name,
        middle_name: nameParts.middle_name,
        last_name: nameParts.last_name,
        suffix: null,
        contact_number: payload.contact || null,
        address: payload.address || null,
        photo_url: null,
        status: "ACTIVE",
      };

      const response = await apiRequest("/enforcers", {
        method: "POST",
        body: JSON.stringify(enforcerPayload),
      });

      const newEnforcerId =
        response?.data?.id ||
        response?.data?._id ||
        response?.id ||
        response?._id;

      if (!newEnforcerId) {
        setShowEnforcerModal(false);
        await fetchEnforcers();
        return;
      }

      if (photoFile) {
        const uploadResponse = await uploadFileRequest(photoFile, {
          category: "PROFILE_PHOTO",
          related_type: "ENFORCER",
          related_id: newEnforcerId,
        });

        const photoUrl =
          uploadResponse?.data?.secure_url ||
          uploadResponse?.data?.file_url ||
          "";

        if (photoUrl) {
          await apiRequest(`/enforcers/${newEnforcerId}`, {
            method: "PUT",
            body: JSON.stringify({
              ...enforcerPayload,
              photo_url: photoUrl,
            }),
          });
        }
      }

      setShowEnforcerModal(false);
      await fetchEnforcers();
    } catch (err) {
      setError(err.message || "Failed to create enforcer");
    }
  }

  function goToProfile(id) {
    if (tab === "Enforcer") nav(`/enforcers/${id}`);
    else nav(`/profiles/${id}`);
  }

  function goToTransactions(id) {
    nav(`/profiles/${id}/transactions`);
  }

  async function handleExportExcel() {
    try {
      await exportProfilesToExcel({
        drivers: exportDrivers,
        enforcers,
        activeTab: tab,
      });
    } catch (err) {
      setError(err.message || "Failed to export Excel");
    }
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

      {error && (
        <div className="alert alert-danger rounded-4 py-2">
          {error}
        </div>
      )}

      {loading && (
        <div className="alert alert-info rounded-4 py-2">
          Loading records...
        </div>
      )}

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
                      rows.map(({ rowId, driver }) => {
                        const franchiseSummary = getDriverFranchiseSummary(driver);

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
                                {franchiseSummary.visible.length === 0 ? (
                                  <div>—</div>
                                ) : (
                                  <div className="d-flex flex-column gap-1">
                                    {franchiseSummary.visible.map((franchise) => (
                                      <div key={franchise.id}>
                                        <div>{franchise.toda_name || "—"}</div>
                                        <div className="small text-muted">
                                          Franchise: {franchise.number || "—"}
                                        </div>
                                      </div>
                                    ))}

                                    {franchiseSummary.hasMore && (
                                      <div className="small text-muted">...</div>
                                    )}
                                  </div>
                                )}
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
                          {loading ? "Loading..." : "No results."}
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