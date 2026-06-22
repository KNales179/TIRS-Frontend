// src/pages/EnforcerInfo.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function splitFullName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      first_name: "",
      middle_name: null,
      last_name: "",
      suffix: null,
    };
  }

  if (parts.length === 1) {
    return {
      first_name: parts[0],
      middle_name: null,
      last_name: parts[0],
      suffix: null,
    };
  }

  return {
    first_name: parts[0],
    middle_name: parts.length > 2 ? parts.slice(1, -1).join(" ") : null,
    last_name: parts[parts.length - 1],
    suffix: null,
  };
}

function cleanPhotoUrl(value) {
  const photo = String(value || "").trim();

  if (!photo) return "";

  if (
    photo.toLowerCase() === "enforcer" ||
    photo.toLowerCase() === "null" ||
    photo.toLowerCase() === "undefined"
  ) {
    return "";
  }

  return photo;
}

function normalizeBackendEnforcer(enforcer) {
  return {
    id: enforcer.id,
    enforcer_code: enforcer.enforcer_code,
    idNumber: enforcer.enforcer_code || "",
    name: [
      enforcer.first_name,
      enforcer.middle_name,
      enforcer.last_name,
      enforcer.suffix,
    ]
      .filter(Boolean)
      .join(" "),
    contact: enforcer.contact_number || "",
    address: enforcer.address || "",
    photoUrl: cleanPhotoUrl(enforcer.photo_url),
    status: enforcer.status || "ACTIVE",
    apprehensionRecord: enforcer.apprehensionRecord || [],
    raw: enforcer,
  };
}

function formatMoney(value) {
  if (value == null || value === "") return "—";

  const numericValue = Number(value);

  if (!Number.isNaN(numericValue)) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(numericValue);
  }

  return value;
}

function displayStatus(status) {
  const s = String(status || "NEW").toUpperCase();

  if (s === "ON_PROCESS") return "On Process";
  if (s === "PAID") return "Paid";
  if (s === "SETTLED") return "Settled";
  if (s === "DONE") return "Done";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "DISPUTED") return "Disputed";

  return "New";
}

function normalizeApprehension(item, enforcerId) {
  const violations = item.violations || [];
  const transactions = item.transactions || [];
  const enforcers = item.enforcers || [];
  const linkedEnforcer =
    enforcers.find((e) => Number(e.enforcer_id) === Number(enforcerId)) ||
    enforcers[0] ||
    {};

  const latestPayment =
    transactions.find((t) => t.action_taken === "PAYMENT_RECORDED") ||
    transactions[0] ||
    null;

  return {
    id: item.id || item.apprehension_id,
    ticketNo: item.ticket_number || item.ticketNo || "—",
    date: item.apprehension_date ? String(item.apprehension_date).slice(0, 10) : "—",
    personApprehended:
      item.driver_name ||
      item.unregistered_name ||
      item.personApprehended ||
      "—",
    violation:
      violations.map((v) => v.name || v.violation_name).filter(Boolean).join(", ") ||
      item.violation ||
      item.violation_name ||
      "—",
    location: item.location || "—",
    commission:
      linkedEnforcer.commission_share ||
      item.commission_share ||
      item.commission ||
      0,
    officialFine: item.total_penalty || item.penalty_amount || 0,
    status: displayStatus(item.status),
    orNumber: latestPayment?.or_number || item.or_number || null,
    datePaid: latestPayment?.paid_at || item.paid_at || null,
    raw: item,
  };
}

function getStatusBadge(status) {
  const s = String(status || "").toLowerCase();

  if (["paid", "settled", "done"].includes(s)) {
    return (
      <span className="badge rounded-pill bg-success-subtle text-success-emphasis">
        {status}
      </span>
    );
  }

  if (s === "on process") {
    return (
      <span className="badge rounded-pill bg-info-subtle text-info-emphasis">
        {status}
      </span>
    );
  }

  if (["cancelled", "disputed"].includes(s)) {
    return (
      <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">
        {status}
      </span>
    );
  }

  return (
    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">
      {status || "—"}
    </span>
  );
}

function InfoField({ label, value, isEdit, onChange, col = "col-md-6" }) {
  return (
    <div className={`${col} mb-3`}>
      <div className="small text-muted mb-1">{label}</div>

      {isEdit ? (
        <input
          className="form-control bg-light border-0 rounded-4 px-3 py-3"
          value={value || ""}
          onChange={onChange}
        />
      ) : (
        <div className="bg-light border-0 rounded-4 px-3 py-3">
          {value || "—"}
        </div>
      )}
    </div>
  );
}

export default function EnforcerInfo() {
  const { id } = useParams();
  const nav = useNavigate();

  const [enforcer, setEnforcer] = useState(null);
  const [draft, setDraft] = useState(null);
  const [apprehensions, setApprehensions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [isEdit, setIsEdit] = useState(false);
  const [showAll, setShowAll] = useState(false);



  async function fetchEnforcer() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest(`/enforcers/${id}`);
      const data = response.data || response.enforcer || response;

      const normalized = normalizeBackendEnforcer(data);
      const apprehensionResponse = await apiRequest(`/apprehensions/enforcer/${id}`);
      const apprehensionList = apprehensionResponse.data || apprehensionResponse.apprehensions || [];

      setEnforcer(normalized);
      setDraft(normalized);
      setApprehensions(
        apprehensionList.map((item) => normalizeApprehension(item, id))
      );
      setIsEdit(false);
      setShowAll(false);
    } catch (err) {
      setError(err.message || "Failed to fetch enforcer");
      setEnforcer(null);
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEnforcer();
  }, [id]);

  if (loading) {
    return (
      <div className="alert alert-info rounded-4 py-2">
        Loading enforcer information...
      </div>
    );
  }

  if (!enforcer || !draft) {
    return (
      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">
          <div className="fw-bold">Enforcer not found.</div>

          {error && <div className="text-danger small mt-2">{error}</div>}

          <button
            className="btn btn-primary mt-3 rounded-4"
            onClick={() => nav(-1)}
            type="button"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const totalApprehended = apprehensions.length;
  const rows = showAll ? apprehensions : apprehensions.slice(0, 3);

  function setField(key) {
    return (e) => {
      setDraft((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));
    };
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const photoUrl = URL.createObjectURL(file);

    setDraft((prev) => ({
      ...prev,
      photoUrl,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");

      const nameParts = splitFullName(draft.name);

      const payload = {
        first_name: nameParts.first_name,
        middle_name: nameParts.middle_name,
        last_name: nameParts.last_name,
        suffix: nameParts.suffix,
        contact_number: draft.contact || null,
        address: draft.address || null,
        photo_url: draft.photoUrl || null,
        status: draft.status || "ACTIVE",
      };

      const response = await apiRequest(`/enforcers/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedData = response.data || response.enforcer || response;
      const normalized = normalizeBackendEnforcer(updatedData);

      setEnforcer(normalized);
      setDraft(normalized);
      setIsEdit(false);
    } catch (err) {
      setError(err.message || "Failed to save enforcer");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setDraft(enforcer);
    setIsEdit(false);
    setError("");
  }

  function handleOpenAddApprehension() {
    nav("/violations", {
      state: {
        enforcerId: enforcer.id,
      },
    });
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-bold mb-0">Enforcer’s Information</h1>

        <button
          className="btn btn-outline-primary rounded-4"
          onClick={() => nav(-1)}
          type="button"
          title="Back"
        >
          <i className="bi bi-arrow-left" />
        </button>
      </div>

      {error && <div className="alert alert-danger rounded-4 py-2">{error}</div>}

      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">
          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <div className="row">
                <InfoField
                  label="Enforcer’s Name"
                  value={draft.name}
                  isEdit={isEdit}
                  onChange={setField("name")}
                />

                <InfoField
                  label="ID Number"
                  value={draft.idNumber}
                  isEdit={false}
                  onChange={() => {}}
                />

                <InfoField
                  label="Contact Number"
                  value={draft.contact}
                  isEdit={isEdit}
                  onChange={setField("contact")}
                />

                <InfoField
                  label="Total Apprehended"
                  value={String(totalApprehended)}
                  isEdit={false}
                  onChange={() => {}}
                />

                <InfoField
                  label="Address"
                  value={draft.address}
                  isEdit={isEdit}
                  onChange={setField("address")}
                  col="col-12"
                />
              </div>
            </div>

            <div className="col-lg-4 d-flex justify-content-center">
              <div className="text-center">
                <div
                  className="position-relative mx-auto"
                  style={{ width: 220, height: 220 }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "#e5e7eb",
                    }}
                    title={draft.name}
                  >
                    {cleanPhotoUrl(draft.photoUrl) ? (
                      <img
                        src={cleanPhotoUrl(draft.photoUrl)}
                        alt="Enforcer"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const icon = e.currentTarget.parentElement?.querySelector(".fallback-icon");
                          if (icon) icon.style.display = "block";
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : null}

                    <i
                      className="bi bi-person-fill fallback-icon"
                      style={{
                        fontSize: 90,
                        color: "#9ca3af",
                        display: cleanPhotoUrl(draft.photoUrl) ? "none" : "block",
                      }}
                    />
                  </div>

                  {isEdit && (
                    <label
                      className="position-absolute d-flex align-items-center justify-content-center"
                      style={{
                        bottom: 6,
                        right: 6,
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#9ca3af",
                        color: "#fff",
                        cursor: "pointer",
                        border: "4px solid #fff",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                      }}
                      title="Upload Photo"
                    >
                      <i className="bi bi-plus-lg" style={{ fontSize: 20 }} />

                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="my-4" />

          <div className="d-flex align-items-center justify-content-between mb-2">
            <div>
              <div className="fw-semibold mb-0">Apprehension Record</div>
              <div className="small text-muted">
                Showing real apprehension records connected to this enforcer.
              </div>
            </div>

            <button
              className="btn btn-sm btn-primary rounded-4 px-3"
              type="button"
              onClick={handleOpenAddApprehension}
            >
              + Add Apprehension
            </button>
          </div>

          <div className="table-responsive">
            <table className="tfro-table">
              <thead>
                <tr className="table-primary">
                  <th>Ticket No.</th>
                  <th>Date</th>
                  <th>Person Apprehended</th>
                  <th>Violation Committed</th>
                  <th>Location</th>
                  <th>Official Fine</th>
                  <th>Commission</th>
                  <th>OR Number</th>
                  <th>Date Paid</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item) => (
                  <tr key={item.id || item.ticketNo}>
                    <td>{item.ticketNo}</td>
                    <td>{item.date}</td>
                    <td>{item.personApprehended}</td>
                    <td className="text-primary">{item.violation}</td>
                    <td className="text-primary">{item.location}</td>
                    <td className="text-danger">{formatMoney(item.officialFine)}</td>
                    <td className="text-danger">{formatMoney(item.commission)}</td>
                    <td>{item.orNumber || "—"}</td>
                    <td>{item.datePaid ? String(item.datePaid).slice(0, 10) : "—"}</td>
                    <td>{getStatusBadge(item.status)}</td>
                  </tr>
                ))}

                {apprehensions.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center text-muted py-4">
                      No apprehension records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {apprehensions.length > 3 && (
            <button
              type="button"
              className="btn btn-link px-0"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? "Show Less" : "See More"}
            </button>
          )}

          <div className="d-flex justify-content-end align-items-center mt-4">
            <div className="d-flex gap-3">
              {isEdit && (
                <button
                  className="btn btn-outline-secondary rounded-4 px-5"
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

              <button
                className="btn btn-primary rounded-4 px-5"
                type="button"
                onClick={() => setIsEdit(true)}
                disabled={isEdit || saving}
              >
                Edit
              </button>

              <button
                className="btn btn-primary rounded-4 px-5"
                type="button"
                onClick={handleSave}
                disabled={!isEdit || saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}