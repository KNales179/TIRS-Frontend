import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTFROData } from "../context/TFRODataContext";

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

function getDriverTypeBadge(type) {
  const normalized = normalizeDriverType(type);

  const map = {
    "WITH FRANCHISE": "bg-success-subtle text-success-emphasis",
    "SPECIAL FRANCHISE": "bg-primary-subtle text-primary-emphasis",
    COLORUM: "bg-warning-subtle text-warning-emphasis",
    TEMPORARY: "bg-info-subtle text-info-emphasis",
  };

  return (
    <span className={`badge rounded-pill px-3 py-2 ${map[normalized] || "bg-secondary-subtle text-secondary-emphasis"}`}>
      {normalized}
    </span>
  );
}

function getVehicleStatusBadge(status) {
  const s = String(status || "").toLowerCase();

  if (["unavailable", "impounded", "colorum"].includes(s)) {
    return <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">{status || "—"}</span>;
  }

  if (s === "temporary") {
    return <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">{status || "—"}</span>;
  }

  return <span className="badge rounded-pill bg-success-subtle text-success-emphasis">{status || "—"}</span>;
}

function getViolationStatusBadge(status) {
  const s = String(status || "").toLowerCase();

  if (["done", "paid", "settled"].includes(s)) {
    return <span className="badge rounded-pill bg-success-subtle text-success-emphasis">{status}</span>;
  }

  if (s === "on process") {
    return <span className="badge rounded-pill bg-info-subtle text-info-emphasis">{status}</span>;
  }

  return <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">{status || "—"}</span>;
}

function formatMoney(value) {
  if (value == null || value === "") return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value || 0));
}

function computeVehicleViolationSummary(vehicle) {
  const violations = vehicle?.violations || [];
  const total = violations.length;

  const unresolved = violations.filter((v) => {
    const s = String(v.status || "").toLowerCase();
    return !["done", "paid", "settled"].includes(s);
  }).length;

  return { total, unresolved };
}

function InfoInput({ label, value, isEdit, onChange, col = "col-md-6" }) {
  return (
    <div className={col}>
      <div className="text-muted small mb-1">{label}</div>
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

export default function DriverInfo() {
  const { id } = useParams();
  const nav = useNavigate();

  const { drivers, setDrivers } = useTFROData();

  const driver = useMemo(
    () => drivers.find((d) => String(d.id) === String(id)),
    [drivers, id]
  );

  const [isEdit, setIsEdit] = useState(false);
  const [draft, setDraft] = useState(() => driver || null);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    franchiseNo: "",
    motor: "",
    modelMake: "",
    engine: "",
    chassis: "",
    plateNo: "",
    status: "Available",
  });

  const [showAddViolationModal, setShowAddViolationModal] = useState(false);
  const [newViolation, setNewViolation] = useState({
    date: "",
    violation: "",
    location: "",
    originalFine: "",
    declaredFine: "",
    status: "Pending",
    apprehender: "",
  });

  useEffect(() => {
    setDraft(driver || null);
    setIsEdit(false);
    setSelectedVehicleIndex(0);
    setSelectedFranchiseId(driver?.franchises?.[0]?.id || "");
  }, [driver]);

  if (!driver || !draft) {
    return (
      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">
          <div className="fw-bold">Driver not found.</div>
          <button className="btn btn-primary mt-3 rounded-4" onClick={() => nav(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const driverType = normalizeDriverType(draft.type);
  const isColorum = driverType === "COLORUM";

  const vehicles = draft.vehicles || [];
  const franchises = draft.franchises || [];
  const hasMultipleFranchises = !isColorum && franchises.length >= 2;

  const selectedFranchise = !isColorum
    ? franchises.find((f) => f.id === selectedFranchiseId) || franchises[0] || null
    : null;

  const resolvedVehicleIndex = !isColorum
    ? selectedFranchise?.vehicleIndex ?? 0
    : selectedVehicleIndex;

  const selectedVehicle = vehicles[resolvedVehicleIndex] || null;
  const violations = selectedVehicle?.violations || [];

  function setField(key) {
    return (e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function setVehicle(index, key) {
    return (e) =>
      setDraft((prev) => {
        const nextVehicles = [...(prev.vehicles || [])];

        nextVehicles[index] = {
          ...(nextVehicles[index] || {}),
          [key]: e.target.value,
        };

        return {
          ...prev,
          vehicles: nextVehicles,
        };
      });
  }

  function handleSave() {
    setDrivers((prev) =>
      prev.map((item) => (String(item.id) === String(draft.id) ? draft : item))
    );

    setIsEdit(false);
    alert("Saved.");
  }

  function handlePrint() {
    window.print();
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

  function handleFranchiseChange(e) {
    setSelectedFranchiseId(e.target.value);
  }

  function handleVehicleSelect(index) {
    setSelectedVehicleIndex(index);
  }

  function handleNewVehicleChange(key, value) {
    setNewVehicle((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetNewVehicleForm() {
    setNewVehicle({
      franchiseNo: "",
      motor: "",
      modelMake: "",
      engine: "",
      chassis: "",
      plateNo: "",
      status: "Available",
    });
  }

  function handleCloseAddVehicleModal() {
    setShowAddVehicleModal(false);
    resetNewVehicleForm();
  }

  function handleAddVehicle(e) {
    e.preventDefault();

    if (!newVehicle.motor || !newVehicle.modelMake || !newVehicle.plateNo) {
      alert("Please complete Motor, Model/Make, and Plate Number.");
      return;
    }

    if (!isColorum && !newVehicle.franchiseNo) {
      alert("Please enter Franchise Number.");
      return;
    }

    const vehicleToAdd = {
      motor: newVehicle.motor,
      modelMake: newVehicle.modelMake,
      engine: newVehicle.engine,
      chassis: newVehicle.chassis,
      plateNo: newVehicle.plateNo,
      status: newVehicle.status,
      violations: [],
    };

    const newFranchiseId = `fr_${Date.now()}`;

    setDraft((prev) => {
      const nextVehicles = [...(prev.vehicles || []), vehicleToAdd];
      const newVehicleIndex = nextVehicles.length - 1;

      const nextFranchises = isColorum
        ? prev.franchises || []
        : [
            ...(prev.franchises || []),
            {
              id: newFranchiseId,
              number: newVehicle.franchiseNo,
              vehicleIndex: newVehicleIndex,
            },
          ];

      return {
        ...prev,
        vehicles: nextVehicles,
        franchises: nextFranchises,
        franchiseNo: prev.franchiseNo || newVehicle.franchiseNo,
      };
    });

    if (isColorum) {
      setSelectedVehicleIndex(vehicles.length);
    } else {
      setSelectedFranchiseId(newFranchiseId);
    }

    setShowAddVehicleModal(false);
    resetNewVehicleForm();
  }

  function handleNewViolationChange(key, value) {
    setNewViolation((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetNewViolationForm() {
    setNewViolation({
      date: "",
      violation: "",
      location: "",
      originalFine: "",
      declaredFine: "",
      status: "Pending",
      apprehender: "",
    });
  }

  function handleOpenAddViolationModal() {
    if (!selectedVehicle) {
      alert("Please select a vehicle first.");
      return;
    }

    setShowAddViolationModal(true);
  }

  function handleCloseAddViolationModal() {
    setShowAddViolationModal(false);
    resetNewViolationForm();
  }

  function handleAddViolation(e) {
    e.preventDefault();

    if (!newViolation.date || !newViolation.violation || !newViolation.apprehender) {
      alert("Please complete Date, Violation, and Apprehender.");
      return;
    }

    const targetVehicleIndex = resolvedVehicleIndex;

    const violationToAdd = {
      date: newViolation.date,
      violation: newViolation.violation,
      location: newViolation.location,
      originalFine: Number(newViolation.originalFine || 0),
      declaredFine: Number(newViolation.declaredFine || 0),
      status: newViolation.status,
      apprehender: newViolation.apprehender,
      franchiseId: selectedFranchise?.id || null,
    };

    setDraft((prev) => {
      const nextVehicles = [...(prev.vehicles || [])];

      nextVehicles[targetVehicleIndex] = {
        ...(nextVehicles[targetVehicleIndex] || {}),
        violations: [
          ...((nextVehicles[targetVehicleIndex] || {}).violations || []),
          violationToAdd,
        ],
      };

      return {
        ...prev,
        vehicles: nextVehicles,
      };
    });

    setShowAddViolationModal(false);
    resetNewViolationForm();
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 no-print">
        <h1 className="h4 fw-bold mb-0">Driver’s Information</h1>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary rounded-4"
            onClick={handlePrint}
            type="button"
            title="Print"
          >
            <i className="bi bi-printer" />
          </button>

          <button
            className="btn btn-outline-primary rounded-4"
            onClick={() => nav(-1)}
            type="button"
            title="Back"
          >
            <i className="bi bi-arrow-left" />
          </button>
        </div>
      </div>

      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body" id="print-driver-info">
          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <div className="row g-3">
                <InfoInput
                  label="Driver’s Name"
                  value={draft.name}
                  isEdit={isEdit}
                  onChange={setField("name")}
                />

                <InfoInput
                  label="Operator’s Name"
                  value={draft.operatorName}
                  isEdit={isEdit}
                  onChange={setField("operatorName")}
                />

                <InfoInput
                  label="Contact Number"
                  value={draft.contact}
                  isEdit={isEdit}
                  onChange={setField("contact")}
                />

                {!isColorum && (
                  <InfoInput
                    label="TODA"
                    value={draft.toda}
                    isEdit={isEdit}
                    onChange={setField("toda")}
                  />
                )}

                {!isColorum && !hasMultipleFranchises && (
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">Franchise Number</div>
                    <div className="bg-light border-0 rounded-4 px-3 py-3">
                      {selectedFranchise?.number || draft.franchiseNo || "—"}
                    </div>
                  </div>
                )}

                {hasMultipleFranchises && (
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">Select Franchise</div>
                    <select
                      className="form-select bg-light border-0 rounded-4 px-3 py-3"
                      value={selectedFranchise?.id || ""}
                      onChange={handleFranchiseChange}
                    >
                      {franchises.map((franchise) => (
                        <option key={franchise.id} value={franchise.id}>
                          {franchise.number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <InfoInput
                  label="Address"
                  value={draft.address}
                  isEdit={isEdit}
                  onChange={setField("address")}
                  col="col-12"
                />

                <div className="col-12 mt-2">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-semibold mb-0">
                      {isColorum ? "Vehicle Records" : "Franchise / Vehicle Records"}
                    </div>
                    <div className="small text-muted no-print">
                      {isColorum ? "Select a vehicle record to view its violations" : ""}
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="tfro-table">
                      <thead>
                        <tr className="text-white" style={{ background: "#000000" }}>
                          {!isColorum && <th className="text-white">Franchise No.</th>}
                          <th className="text-white">Motor</th>
                          <th className="text-white">Model/Make</th>
                          <th className="text-white">Engine</th>
                          <th className="text-white">Chassis</th>
                          <th className="text-white">Plate Number</th>
                          <th className="text-white">Status</th>
                          <th className="text-white">Violations</th>
                        </tr>
                      </thead>

                      <tbody>
                        {vehicles.length === 0 ? (
                          <tr>
                            <td colSpan={isColorum ? 7 : 8} className="text-center text-muted">
                              No vehicle records found.
                            </td>
                          </tr>
                        ) : isColorum ? (
                          vehicles.map((veh, index) => {
                            const summary = computeVehicleViolationSummary(veh);

                            return (
                              <tr
                                key={`${veh.plateNo || "vehicle"}-${index}`}
                                onClick={() => handleVehicleSelect(index)}
                                style={{
                                  background: index === selectedVehicleIndex ? "#eef2ff" : "",
                                  cursor: "pointer",
                                }}
                              >
                                <VehicleCells
                                  veh={veh}
                                  index={index}
                                  isEdit={isEdit}
                                  setVehicle={setVehicle}
                                  summary={summary}
                                  isColorum={isColorum}
                                />
                              </tr>
                            );
                          })
                        ) : (
                          vehicles
                            .filter((_, index) => {
                              const franchise =
                                franchises.find((f) => f.vehicleIndex === index) || null;

                              return !hasMultipleFranchises
                                ? true
                                : franchise?.id === selectedFranchise?.id;
                            })
                            .map((veh) => {
                              const originalIndex = vehicles.findIndex((v) => v === veh);
                              const franchise =
                                franchises.find((f) => f.vehicleIndex === originalIndex) || null;
                              const summary = computeVehicleViolationSummary(veh);

                              return (
                                <tr
                                  key={`${veh.plateNo || "vehicle"}-${originalIndex}`}
                                  style={{ background: "#eef2ff" }}
                                >
                                  <td>{franchise?.number || draft.franchiseNo || "—"}</td>

                                  <VehicleCells
                                    veh={veh}
                                    index={originalIndex}
                                    isEdit={isEdit}
                                    setVehicle={setVehicle}
                                    summary={summary}
                                    isColorum={isColorum}
                                  />
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-12 mt-2">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-semibold mb-0">Violation History</div>

                    <button
                      className="btn btn-sm btn-primary rounded-4 px-3 no-print"
                      type="button"
                      onClick={handleOpenAddViolationModal}
                    >
                      + Add Violation
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="tfro-table">
                      <thead>
                        <tr className="text-white" style={{ background: "#000000" }}>
                          <th className="text-white">Date</th>
                          <th className="text-white">Violation</th>
                          <th className="text-white">Location</th>
                          <th className="text-white">Official Fine</th>
                          <th className="text-white">Declared Fine</th>
                          <th className="text-white">Discount</th>
                          <th className="text-white">Status</th>
                          <th className="text-white">Apprehender</th>
                        </tr>
                      </thead>

                      <tbody>
                        {!selectedVehicle ? (
                          <tr>
                            <td colSpan="8" className="text-center text-muted">
                              No selected vehicle.
                            </td>
                          </tr>
                        ) : violations.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center text-muted">
                              No violation history found for this record.
                            </td>
                          </tr>
                        ) : (
                          violations.map((item, index) => {
                            const official = Number(item.originalFine || 0);
                            const declared = Number(item.declaredFine || 0);
                            const discount = Math.max(official - declared, 0);

                            return (
                              <tr key={`${item.date || "violation"}-${index}`}>
                                <td>{item.date || "—"}</td>
                                <td>{item.violation || "—"}</td>
                                <td>{item.location || "—"}</td>
                                <td>{formatMoney(official)}</td>
                                <td>{formatMoney(declared)}</td>
                                <td>{formatMoney(discount)}</td>
                                <td>{getViolationStatusBadge(item.status)}</td>
                                <td>{item.apprehender || "—"}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 no-print">
                    <Link to={`/profiles/${driver.id}/transactions`} className="link-primary">
                      View Transaction Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4 d-flex justify-content-center">
              <div className="text-center">
                <div className="position-relative mx-auto" style={{ width: 220, height: 220 }}>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "#e5e7eb",
                    }}
                  >
                    {draft.photoUrl ? (
                      <img
                        src={draft.photoUrl}
                        alt="Driver"
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
                    className="position-absolute no-print d-flex align-items-center justify-content-center"
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
                    <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                  </label>
                </div>

                <div className="mt-3">{getDriverTypeBadge(driverType)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center p-4 no-print">
          <button
            className="btn btn-primary rounded-4 px-4"
            type="button"
            onClick={() => setShowAddVehicleModal(true)}
          >
            + Add New Vehicle
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

      {showAddVehicleModal && (
        <AddVehicleModal
          isColorum={isColorum}
          newVehicle={newVehicle}
          onChange={handleNewVehicleChange}
          onClose={handleCloseAddVehicleModal}
          onSubmit={handleAddVehicle}
        />
      )}

      {showAddViolationModal && (
        <AddViolationModal
          newViolation={newViolation}
          onChange={handleNewViolationChange}
          onClose={handleCloseAddViolationModal}
          onSubmit={handleAddViolation}
        />
      )}
    </div>
  );
}

function VehicleCells({ veh, index, isEdit, setVehicle, summary, isColorum }) {
  return (
    <>
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

      <td>{getVehicleStatusBadge(veh.status)}</td>

      <td>
        <div className="d-flex flex-column align-items-start gap-1">
          <span className="badge rounded-pill bg-light text-dark border">
            {summary.total} total
          </span>

          {summary.unresolved > 0 && (
            <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">
              {summary.unresolved} pending
            </span>
          )}
        </div>
      </td>
    </>
  );
}

function AddVehicleModal({ isColorum, newVehicle, onChange, onClose, onSubmit }) {
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow">
            <form onSubmit={onSubmit}>
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold">
                    {isColorum ? "Add New Vehicle Record" : "Add New Franchise / Vehicle Record"}
                  </h5>
                  <div className="text-muted small">
                    {isColorum
                      ? "This will add a new vehicle row to this driver profile."
                      : "This will add a new franchise and link it to a new vehicle record."}
                  </div>
                </div>

                <button type="button" className="btn-close" onClick={onClose} />
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  {!isColorum && (
                    <FormInput
                      label="Franchise Number"
                      value={newVehicle.franchiseNo}
                      onChange={(v) => onChange("franchiseNo", v)}
                      placeholder="Example: TFRO-001"
                    />
                  )}

                  <FormInput label="Motor" value={newVehicle.motor} onChange={(v) => onChange("motor", v)} />
                  <FormInput label="Model/Make" value={newVehicle.modelMake} onChange={(v) => onChange("modelMake", v)} />
                  <FormInput label="Engine" value={newVehicle.engine} onChange={(v) => onChange("engine", v)} />
                  <FormInput label="Chassis" value={newVehicle.chassis} onChange={(v) => onChange("chassis", v)} />
                  <FormInput label="Plate Number" value={newVehicle.plateNo} onChange={(v) => onChange("plateNo", v)} />

                  <div className="col-md-6">
                    <label className="form-label small text-muted">Status</label>
                    <select
                      className="form-select rounded-4"
                      value={newVehicle.status}
                      onChange={(e) => onChange("status", e.target.value)}
                    >
                      <option value="Available">Available</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Unavailable">Unavailable</option>
                      <option value="Impounded">Impounded</option>
                      <option value="Colorum">Colorum</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary rounded-4 px-4" onClick={onClose}>
                  Cancel
                </button>

                <button type="submit" className="btn btn-primary rounded-4 px-4">
                  {isColorum ? "Add Vehicle" : "Add Franchise / Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

function AddViolationModal({ newViolation, onChange, onClose, onSubmit }) {
  const official = Number(newViolation.originalFine || 0);
  const declared = Number(newViolation.declaredFine || 0);
  const discount = Math.max(official - declared, 0);

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow">
            <form onSubmit={onSubmit}>
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold">Add Violation</h5>
                  <div className="text-muted small">
                    Official fine minus declared fine becomes the discount.
                  </div>
                </div>

                <button type="button" className="btn-close" onClick={onClose} />
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  <FormInput
                    label="Date"
                    type="date"
                    value={newViolation.date}
                    onChange={(v) => onChange("date", v)}
                  />

                  <FormInput
                    label="Violation"
                    value={newViolation.violation}
                    onChange={(v) => onChange("violation", v)}
                    placeholder="Example: Illegal parking"
                  />

                  <FormInput
                    label="Location"
                    value={newViolation.location}
                    onChange={(v) => onChange("location", v)}
                  />

                  <FormInput
                    label="Apprehender"
                    value={newViolation.apprehender}
                    onChange={(v) => onChange("apprehender", v)}
                  />

                  <FormInput
                    label="Official Fine"
                    type="number"
                    value={newViolation.originalFine}
                    onChange={(v) => onChange("originalFine", v)}
                  />

                  <FormInput
                    label="Declared Fine"
                    type="number"
                    value={newViolation.declaredFine}
                    onChange={(v) => onChange("declaredFine", v)}
                  />

                  <FormInput
                    label="Auto Discount"
                    value={formatMoney(discount)}
                    onChange={() => {}}
                    disabled
                  />

                  <div className="col-md-6">
                    <label className="form-label small text-muted">Status</label>
                    <select
                      className="form-select rounded-4"
                      value={newViolation.status}
                      onChange={(e) => onChange("status", e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="On Process">On Process</option>
                      <option value="Paid">Paid</option>
                      <option value="Settled">Settled</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary rounded-4 px-4" onClick={onClose}>
                  Cancel
                </button>

                <button type="submit" className="btn btn-primary rounded-4 px-4">
                  Add Violation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
}) {
  return (
    <div className="col-md-6">
      <label className="form-label small text-muted">{label}</label>
      <input
        type={type}
        className="form-control rounded-4"
        placeholder={placeholder}
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}