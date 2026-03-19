// src/pages/EnforcerInfo.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { findEnforcerById, computeTotalApprehended } from "../data/enforcersMock";


function Field({ label, value, col = "col-lg-6" }) {
  return (
    <div className={`${col} mb-3`}>
      <div className="small text-muted mb-1">{label}</div>
      <input className="form-control bg-light border-0 rounded-4" value={value || ""} readOnly />
    </div>
  );
}

function AvatarBig({ name, photoUrl }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join("");

  return (
    <div className="d-flex justify-content-center align-items-center">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
        style={{
          width: 200,
          height: 200,
          background: "#f2d7ff",
        }}
        title={name}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ fontSize: 42, fontWeight: 800, color: "#5b63ff" }}>{initials}</div>
        )}
      </div>
    </div>
  );
}

export default function EnforcerInfo() {
  const { id } = useParams();
  const nav = useNavigate();

  const enforcer = useMemo(() => findEnforcerById(id), [id]);
  const [showAll, setShowAll] = useState(false);

  if (!enforcer) {
    return (
      <div className="card rounded-4 shadow-sm">
        <div className="card-body">
          <div className="fw-bold">Enforcer not found.</div>
          <button className="btn btn-primary mt-3" onClick={() => nav(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const totalApprehended = computeTotalApprehended(enforcer);
  const list = enforcer.apprehensionRecord || [];
  const rows = showAll ? list : list.slice(0, 3);

  return (
    <div>
      {/* header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-bold mb-0">Enforcer’s Information</h1>

          <button className="btn btn-outline-primary rounded-4" onClick={() => nav(-1)} type="button">
            <i className="bi bi-arrow-left"/>
          </button>
      </div>

      <div className="card rounded-4 shadow-sm">
        <div className="card-body">
          {/* top fields + avatar */}
          <div className="row">
            <div className="col-lg-8">
              <div className="row">
                <Field label="Enforcer’s Name" value={enforcer.name} />
                <Field label="ID Number" value={enforcer.idNumber} />
                <Field label="Contact Number" value={enforcer.contact} />
                <Field label="Total Apprehended" value={String(totalApprehended)} />
                <Field label="Address" value={enforcer.address} col="col-12" />
              </div>
            </div>

            <div className="col-lg-4 d-flex align-items-center justify-content-center">
              <AvatarBig name={enforcer.name} photoUrl={enforcer.photoUrl} />
            </div>
          </div>

          <hr className="my-4" />

          {/* Apprehension Record */}
          <div className="fw-semibold mb-2">Apprehension Record</div>

          <div className="table-responsive">
            <table className="tfro-table">
              <thead>
                <tr className="table-primary">
                  <th>Date</th>
                  <th>Person Apprehended</th>
                  <th>Violation Committed</th>
                  <th>Location</th>
                  <th>Commission</th>
                  <th>Total Apprehension</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x, idx) => (
                  <tr key={idx}>
                    <td>{x.date}</td>
                    <td>{x.personApprehended}</td>
                    <td className="text-primary">{x.violationCommitted}</td>
                    <td className="text-primary">{x.location}</td>
                    <td className="text-danger">
                      {typeof x.commission === "number"
                        ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(x.commission)
                        : x.commission}
                    </td>
                    <td className="text-danger">{x.totalApprehension}</td>
                  </tr>
                ))}

                {list.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No apprehension records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* See more */}
          {list.length > 3 && (
            <button
              type="button"
              className="btn btn-link px-0"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Show Less" : "See More"}
            </button>
          )}

          {/* Bottom buttons (UI only for now) */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <button className="btn btn-primary">
              <span className="me-2">＋</span> Add New
            </button>

            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary">Edit</button>
              <button className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}