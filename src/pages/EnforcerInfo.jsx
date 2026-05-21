// src/pages/EnforcerInfo.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { findEnforcerById, computeTotalApprehended } from "../data/enforcersMock";

function formatMoney(value) {
  if (value == null || value === "") return "—";

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(numericValue);
  }

  return value;
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
        <div className="bg-light border-0 rounded-4 px-3 py-3">{value || "—"}</div>
      )}
    </div>
  );
}

export default function EnforcerInfo() {
  const { id } = useParams();
  const nav = useNavigate();

  const enforcer = useMemo(() => findEnforcerById(id), [id]);

  const [isEdit, setIsEdit] = useState(false);
  const [draft, setDraft] = useState(() => enforcer || null);
  const [showAll, setShowAll] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    date: "",
    personApprehended: "",
    violationCommitted: "",
    location: "",
    commission: "",
    totalApprehension: "1",
  });

  useEffect(() => {
    setDraft(enforcer || null);
    setIsEdit(false);
    setShowAll(false);
  }, [enforcer]);

  if (!enforcer || !draft) {
    return (
      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">
          <div className="fw-bold">Enforcer not found.</div>
          <button className="btn btn-primary mt-3 rounded-4" onClick={() => nav(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const totalApprehended = computeTotalApprehended(draft);
  const list = draft.apprehensionRecord || [];
  const rows = showAll ? list : list.slice(0, 3);

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

  function handleSave() {
    setIsEdit(false);
    alert("Saved (mock). Next step: connect this to your backend or shared enforcers state.");
  }

  function handleNewRecordChange(key, value) {
    setNewRecord((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetNewRecordForm() {
    setNewRecord({
      date: "",
      personApprehended: "",
      violationCommitted: "",
      location: "",
      commission: "",
      totalApprehension: "1",
    });
  }

  function handleCloseAddModal() {
    setShowAddModal(false);
    resetNewRecordForm();
  }

  function handleAddRecord(e) {
    e.preventDefault();

    if (!newRecord.date || !newRecord.personApprehended || !newRecord.violationCommitted) {
      alert("Please complete Date, Person Apprehended, and Violation Committed.");
      return;
    }

    const recordToAdd = {
      date: newRecord.date,
      personApprehended: newRecord.personApprehended,
      violationCommitted: newRecord.violationCommitted,
      location: newRecord.location,
      commission:
        newRecord.commission === "" ? "" : Number(newRecord.commission),
      totalApprehension:
        newRecord.totalApprehension === "" ? "1" : newRecord.totalApprehension,
    };

    setDraft((prev) => ({
      ...prev,
      apprehensionRecord: [...(prev.apprehensionRecord || []), recordToAdd],
    }));

    setShowAll(true);
    setShowAddModal(false);
    resetNewRecordForm();
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
                  isEdit={isEdit}
                  onChange={setField("idNumber")}
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
                    {draft.photoUrl ? (
                      <img
                        src={draft.photoUrl}
                        alt="Enforcer"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <i
                        className="bi bi-person-fill"
                        style={{ fontSize: 90, color: "#9ca3af" }}
                      />
                    )}
                  </div>

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
                </div>
              </div>
            </div>
          </div>

          <hr className="my-4" />

          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold mb-0">Apprehension Record</div>
          </div>

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
                {rows.map((item, index) => (
                  <tr key={`${item.date || "record"}-${index}`}>
                    <td>{item.date || "—"}</td>
                    <td>{item.personApprehended || "—"}</td>
                    <td className="text-primary">{item.violationCommitted || "—"}</td>
                    <td className="text-primary">{item.location || "—"}</td>
                    <td className="text-danger">{formatMoney(item.commission)}</td>
                    <td className="text-danger">{item.totalApprehension || "—"}</td>
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

          {list.length > 3 && (
            <button
              type="button"
              className="btn btn-link px-0"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? "Show Less" : "See More"}
            </button>
          )}

          <div className="d-flex justify-content-between align-items-center mt-4">
            <button
              className="btn btn-primary rounded-4 px-4"
              type="button"
              onClick={() => setShowAddModal(true)}
            >
              + Add New
            </button>

            <div className="d-flex gap-3">
              <button
                className="btn btn-primary rounded-4 px-5"
                type="button"
                onClick={() => setIsEdit(true)}
                disabled={isEdit}
              >
                Edit
              </button>

              <button
                className="btn btn-primary rounded-4 px-5"
                type="button"
                onClick={handleSave}
                disabled={!isEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 rounded-4 shadow">
                <form onSubmit={handleAddRecord}>
                  <div className="modal-header border-0 pb-0">
                    <div>
                      <h5 className="modal-title fw-bold">Add Apprehension Record</h5>
                      <div className="text-muted small">
                        This will add a new apprehension row to this enforcer profile.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseAddModal}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small text-muted">Date</label>
                        <input
                          type="date"
                          className="form-control rounded-4"
                          value={newRecord.date}
                          onChange={(e) => handleNewRecordChange("date", e.target.value)}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">
                          Person Apprehended
                        </label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Full name"
                          value={newRecord.personApprehended}
                          onChange={(e) =>
                            handleNewRecordChange("personApprehended", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">
                          Violation Committed
                        </label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Example: Illegal parking"
                          value={newRecord.violationCommitted}
                          onChange={(e) =>
                            handleNewRecordChange("violationCommitted", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Location</label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Apprehension location"
                          value={newRecord.location}
                          onChange={(e) =>
                            handleNewRecordChange("location", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Commission</label>
                        <input
                          type="number"
                          className="form-control rounded-4"
                          placeholder="0"
                          value={newRecord.commission}
                          onChange={(e) =>
                            handleNewRecordChange("commission", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">
                          Total Apprehension
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-control rounded-4"
                          placeholder="1"
                          value={newRecord.totalApprehension}
                          onChange={(e) =>
                            handleNewRecordChange("totalApprehension", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-4 px-4"
                      onClick={handleCloseAddModal}
                    >
                      Cancel
                    </button>

                    <button type="submit" className="btn btn-primary rounded-4 px-4">
                      Add Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}
