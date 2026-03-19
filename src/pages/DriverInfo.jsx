import React, { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { driversMock } from "../data/driversMock";

function openPrintWindow(title, htmlBody) {
  const w = window.open("", "_blank", "width=900,height=650");
  if (!w) return;

  w.document.open();
  w.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1,h2,h3 { margin: 0 0 12px 0; }
          .muted { color: #666; font-size: 12px; }
          .card { border: 1px solid #e9e9ef; border-radius: 16px; padding: 18px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .row { display: grid; grid-template-columns: 1fr; gap: 6px; }
          .label { font-size: 12px; color: #666; }
          .value { background: #f4f5f7; padding: 12px 14px; border-radius: 12px; }
          .span2 { grid-column: 1 / -1; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { text-align: left; font-size: 12px; color:#fff; background: #5b63ff; padding: 10px 12px; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
          .right { text-align: right; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; }
          .badge-danger { background: #ffe8ea; color: #b42318; }
          .badge-ok { background: #e8fff1; color: #027a48; }
          .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; }
          .avatarWrap { display:flex; justify-content:center; }
          .avatar { width: 160px; height: 160px; border-radius: 999px; overflow:hidden; background:#f3d2ff; display:flex; align-items:center; justify-content:center; }
          .avatar img { width:100%; height:100%; object-fit:cover; }
        </style>
      </head>
      <body>
        ${htmlBody}
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

function Field({ label, value, span2 }) {
  return (
    <div className={span2 ? "col-12" : "col-md-6"}>
      <div className="text-muted small mb-1">{label}</div>
      <div className="bg-light border-0 rounded-4 px-3 py-3">{value || "—"}</div>
    </div>
  );
}

export default function DriverInfo() {
  const { id } = useParams();
  const nav = useNavigate();

  const driver = useMemo(() => driversMock.find((d) => String(d.id) === String(id)), [id]);

  const [isEdit, setIsEdit] = useState(false);
  const [draft, setDraft] = useState(() => driver || null);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);

  if (!driver) {
    return (
      <div className="card rounded-4 shadow-sm">
        <div className="card-body">Driver not found.</div>
      </div>
    );
  }

  React.useEffect(() => {
    setDraft(driver);
    setIsEdit(false);
    setSelectedVehicleIndex(0);
  }, [driver]);

  const vehicles = draft?.vehicles || [];
  const selectedVehicle = vehicles[selectedVehicleIndex] || null;
  const violations = selectedVehicle?.violations || [];

  function set(k) {
    return (e) => setDraft((p) => ({ ...p, [k]: e.target.value }));
  }

  function setVehicle(index, k) {
    return (e) =>
      setDraft((p) => {
        const nextVehicles = [...(p.vehicles || [])];
        nextVehicles[index] = {
          ...(nextVehicles[index] || {}),
          [k]: e.target.value,
        };
        return { ...p, vehicles: nextVehicles };
      });
  }

  function handlePrint() {
    const el = document.getElementById("print-driver-info");
    if (!el) return;
    openPrintWindow("Driver Information", el.innerHTML);
  }

  function handleSave() {
    setIsEdit(false);
    alert("Saved (mock). Next step: connect to backend or state store.");
  }

  function getVehicleStatusBadge(status) {
    const s = String(status || "").toLowerCase();
    if (s === "unavailable" || s === "impounded" || s === "colorum") {
      return <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">{status}</span>;
    }
    return <span className="badge rounded-pill bg-success-subtle text-success-emphasis">{status || "—"}</span>;
  }

  function getViolationStatusBadge(status) {
    const s = String(status || "").toLowerCase();
    if (s === "done" || s === "paid" || s === "settled") {
      return <span className="badge rounded-pill bg-success-subtle text-success-emphasis">{status}</span>;
    }
    return <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">{status || "—"}</span>;
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-bold mb-0">Driver’s Information</h1>

        <div className="d-flex gap-2 no-print">
          <button className="btn btn-outline-primary rounded-4" onClick={handlePrint} type="button">
            <i className="bi bi-printer" />
          </button>
          <button className="btn btn-outline-primary rounded-4" onClick={() => nav(-1)} type="button">
            <i className="bi bi-arrow-left" />
          </button>
        </div>
      </div>

      <div className="card rounded-4 shadow-sm">
        <div className="card-body" id="print-driver-info">
          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="text-muted small mb-1">Driver’s Name</div>
                  {isEdit ? (
                    <input className="form-control bg-light border-0 rounded-4 px-3 py-3" value={draft.name || ""} onChange={set("name")} />
                  ) : (
                    <div className="bg-light border-0 rounded-4 px-3 py-3">{driver.name || "—"}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <div className="text-muted small mb-1">Franchise Number</div>
                  {isEdit ? (
                    <input
                      className="form-control bg-light border-0 rounded-4 px-3 py-3"
                      value={draft.franchiseNo || ""}
                      onChange={set("franchiseNo")}
                    />
                  ) : (
                    <div className="bg-light border-0 rounded-4 px-3 py-3">{driver.franchiseNo || "—"}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <div className="text-muted small mb-1">Operator’s Name</div>
                  {isEdit ? (
                    <input
                      className="form-control bg-light border-0 rounded-4 px-3 py-3"
                      value={draft.operatorName || ""}
                      onChange={set("operatorName")}
                    />
                  ) : (
                    <div className="bg-light border-0 rounded-4 px-3 py-3">{driver.operatorName || "—"}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <div className="text-muted small mb-1">Contact Number</div>
                  {isEdit ? (
                    <input
                      className="form-control bg-light border-0 rounded-4 px-3 py-3"
                      value={draft.contact || ""}
                      onChange={set("contact")}
                    />
                  ) : (
                    <div className="bg-light border-0 rounded-4 px-3 py-3">{driver.contact || "—"}</div>
                  )}
                </div>

                <div className="col-12">
                  <div className="text-muted small mb-1">Address</div>
                  {isEdit ? (
                    <input
                      className="form-control bg-light border-0 rounded-4 px-3 py-3"
                      value={draft.address || ""}
                      onChange={set("address")}
                    />
                  ) : (
                    <div className="bg-light border-0 rounded-4 px-3 py-3">{driver.address || "—"}</div>
                  )}
                </div>

                <div className="col-12 mt-2">
                  <div className="fw-semibold mb-2">Vehicle Description</div>

                  <div className="table-responsive">
                    <table className="tfro-table">
                      <thead>
                        <tr className="text-white" style={{ background: "#000000" }}>
                          <th className="text-white">Motor</th>
                          <th className="text-white">Model/Make</th>
                          <th className="text-white">Engine</th>
                          <th className="text-white">Chassis</th>
                          <th className="text-white">Plate Number</th>
                          <th className="text-white">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center text-muted">
                              No vehicle records found.
                            </td>
                          </tr>
                        ) : (
                          vehicles.map((veh, index) => (
                            <tr
                              key={`${veh.plateNo || "vehicle"}-${index}`}
                              onClick={() => setSelectedVehicleIndex(index)}
                              style={{
                                background: index === selectedVehicleIndex ? "#eef2ff" : "",
                                cursor: "pointer",
                              }}
                            >
                              <td>
                                {isEdit ? (
                                  <input
                                    className="form-control form-control-sm"
                                    value={veh.motor || ""}
                                    onChange={setVehicle(index, "motor")}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  veh.motor || "—"
                                )}
                              </td>
                              <td>
                                {isEdit ? (
                                  <input
                                    className="form-control form-control-sm"
                                    value={veh.modelMake || ""}
                                    onChange={setVehicle(index, "modelMake")}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  veh.modelMake || "—"
                                )}
                              </td>
                              <td>
                                {isEdit ? (
                                  <input
                                    className="form-control form-control-sm"
                                    value={veh.engine || ""}
                                    onChange={setVehicle(index, "engine")}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  veh.engine || "—"
                                )}
                              </td>
                              <td>
                                {isEdit ? (
                                  <input
                                    className="form-control form-control-sm"
                                    value={veh.chassis || ""}
                                    onChange={setVehicle(index, "chassis")}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  veh.chassis || "—"
                                )}
                              </td>
                              <td>
                                {isEdit ? (
                                  <input
                                    className="form-control form-control-sm"
                                    value={veh.plateNo || ""}
                                    onChange={setVehicle(index, "plateNo")}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  veh.plateNo || "—"
                                )}
                              </td>
                              <td>
                                {isEdit ? (
                                  <input
                                    className="form-control form-control-sm"
                                    value={veh.status || ""}
                                    onChange={setVehicle(index, "status")}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  getVehicleStatusBadge(veh.status)
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2">
                    <Link to={`/profiles/${driver.id}/transactions`} className="link-primary">
                      View Transaction Details
                    </Link>
                  </div>
                </div>

                <div className="col-12 mt-2">
                  <div className="fw-semibold mb-2">
                    Violation History {selectedVehicle ? `(${violations.length})` : ""}
                  </div>

                  <div className="table-responsive">
                    <table className="tfro-table">
                      <thead>
                        <tr className="text-white" style={{ background: "#000000" }}>
                          <th className="text-white">Date</th>
                          <th className="text-white">Violation</th>
                          <th className="text-white">Location</th>
                          <th className="text-white">Original Fine</th>
                          <th className="text-white">Declared Fine</th>
                          <th className="text-white">Status</th>
                          <th className="text-white">Apprehender</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!selectedVehicle ? (
                          <tr>
                            <td colSpan="7" className="text-center text-muted">
                              Select a vehicle to view violation history.
                            </td>
                          </tr>
                        ) : violations.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center text-muted">
                              No violation history found for this vehicle.
                            </td>
                          </tr>
                        ) : (
                          violations.map((item, index) => (
                            <tr key={`${item.date || "violation"}-${index}`}>
                              <td>{item.date || "—"}</td>
                              <td>{item.violation || "—"}</td>
                              <td>{item.location || "—"}</td>
                              <td>{item.originalFine != null ? `₱${item.originalFine}` : "—"}</td>
                              <td>{item.declaredFine != null ? `₱${item.declaredFine}` : "—"}</td>
                              <td>{getViolationStatusBadge(item.status)}</td>
                              <td>{item.apprehender || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4 d-flex justify-content-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                style={{ width: 220, height: 220, background: "#f3d2ff" }}
              >
                {driver.photoUrl ? (
                  <img src={driver.photoUrl} alt="Driver" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div className="text-muted small">No photo</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center p-4 no-print">
          <button className="btn btn-primary rounded-4 px-4" type="button" onClick={() => alert("Next step: Add new vehicle/history row")}>
            + Add New
          </button>

          <div className="d-flex gap-3">
            <button className="btn btn-primary rounded-4 px-5" type="button" onClick={() => setIsEdit(true)} disabled={isEdit}>
              Edit
            </button>
            <button className="btn btn-primary rounded-4 px-5" type="button" onClick={handleSave} disabled={!isEdit}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}