import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { driversMock } from "../data/driversMock";

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

  if (normalized === "WITH FRANCHISE") {
    return (
      <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-3 py-2">
        WITH FRANCHISE
      </span>
    );
  }

  if (normalized === "SPECIAL FRANCHISE") {
    return (
      <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis px-3 py-2">
        SPECIAL FRANCHISE
      </span>
    );
  }

  if (normalized === "COLORUM") {
    return (
      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis px-3 py-2">
        COLORUM
      </span>
    );
  }

  if (normalized === "TEMPORARY") {
    return (
      <span className="badge rounded-pill bg-info-subtle text-info-emphasis px-3 py-2">
        TEMPORARY
      </span>
    );
  }

  return (
    <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis px-3 py-2">
      {normalized}
    </span>
  );
}

function getVehicleStatusBadge(status) {
  const s = String(status || "").toLowerCase();

  if (s === "unavailable" || s === "impounded" || s === "colorum") {
    return (
      <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">
        {status || "—"}
      </span>
    );
  }

  if (s === "temporary") {
    return (
      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">
        {status || "—"}
      </span>
    );
  }

  return (
    <span className="badge rounded-pill bg-success-subtle text-success-emphasis">
      {status || "—"}
    </span>
  );
}

function getViolationStatusBadge(status) {
  const s = String(status || "").toLowerCase();

  if (["done", "paid", "settled"].includes(s)) {
    return (
      <span className="badge rounded-pill bg-success-subtle text-success-emphasis">
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

function formatMoney(value) {
  if (value == null || value === "") return "—";
  return `₱${Number(value).toLocaleString("en-PH")}`;
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

export default function DriverInfo() {
  const { id } = useParams();
  const nav = useNavigate();

  const driver = useMemo(
    () => driversMock.find((d) => String(d.id) === String(id)),
    [id]
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

  useEffect(() => {
    const styleId = "driver-info-print-style";

    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @media print {
        @page {
          size: auto;
          margin: 10mm;
        }

        body * {
          visibility: hidden;
        }

        #print-driver-info,
        #print-driver-info * {
          visibility: visible;
        }

        #print-driver-info {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: #fff !important;
          color: #000 !important;
          font-family: Arial, sans-serif !important;
        }

        #print-driver-info::before {
          content: "Republic of the Philippines\\A Tricycle Franchising and Regulatory Office\\A DRIVER INFORMATION RECORD";
          white-space: pre;
          display: block;
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          line-height: 1.5;
          padding-bottom: 12px;
          margin-bottom: 18px;
          border-bottom: 4px solid #1d4ed8;
          color: #111;
        }

        #print-driver-info .bg-light {
          border: 1px solid #cbd5e1 !important;
          background: #f8fafc !important;
          border-radius: 6px !important;
          padding: 8px 10px !important;
          min-height: auto !important;
        }

        #print-driver-info .text-muted {
          color: #334155 !important;
          font-weight: bold !important;
        }

        #print-driver-info .fw-semibold {
          font-size: 15px !important;
          font-weight: bold !important;
          color: #111 !important;
          margin-top: 10px !important;
          padding: 8px 10px !important;
          background: #dbeafe !important;
          border-left: 5px solid #1d4ed8 !important;
        }

        .no-print {
          display: none !important;
        }

        .card,
        .card-body {
          box-shadow: none !important;
          border: 0 !important;
          background: #fff !important;
        }

        .table-responsive {
          overflow: visible !important;
        }

        table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: auto;
        }

        th {
          border: 1px solid #111 !important;
          padding: 8px 10px !important;
          font-size: 11px !important;
          vertical-align: top !important;
          background: #1d4ed8 !important;
          color: #fff !important;
          font-weight: bold !important;
        }

        td {
          border: 1px solid #111 !important;
          padding: 8px 10px !important;
          font-size: 11px !important;
          vertical-align: top !important;
          color: #111 !important;
        }

        tr:nth-child(even) td {
          background: #eef4ff !important;
        }

        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .badge {
          border: 1px solid #d9d9d9 !important;
          color: #000 !important;
          background: #fff !important;
        }

        #print-driver-info .print-top-layout {
          display: grid !important;
          grid-template-columns: 1.6fr 0.9fr !important;
          gap: 24px !important;
          align-items: start !important;
        }

        #print-driver-info .print-left,
        #print-driver-info .print-right {
          width: 100% !important;
        }

        #print-driver-info .print-right {
          display: flex !important;
          justify-content: center !important;
          align-items: flex-start !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        #print-driver-info .print-photo-wrap {
          text-align: center !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        #print-driver-info .print-photo {
          width: 170px !important;
          height: 170px !important;
          border-radius: 50% !important;
          overflow: hidden !important;
          margin: 0 auto !important;
          background: #f3d2ff !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        #print-driver-info .print-photo img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        #print-driver-info .print-type {
          margin-top: 12px !important;
          text-align: center !important;
        }

        #print-driver-info .print-top-layout,
        #print-driver-info .print-photo-wrap {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (!driver || !draft) {
    return (
      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">Driver not found.</div>
      </div>
    );
  }

  const driverType = normalizeDriverType(draft.type);
  const isColorum = driverType === "COLORUM";
  const vehicles = draft?.vehicles || [];
  const franchises = draft?.franchises || [];
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
        return { ...prev, vehicles: nextVehicles };
      });
  }

  function handlePrint() {
    window.print();
  }

  function handleSave() {
    setIsEdit(false);
    alert("Saved (mock). Next step: connect to backend or shared state.");
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

    const newFranchiseId = `fr-${Date.now()}`;

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
      originalFine: newViolation.originalFine,
      declaredFine: newViolation.declaredFine,
      status: newViolation.status,
      apprehender: newViolation.apprehender,
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
          <div className="row g-4 align-items-start print-top-layout">
            <div className="col-lg-8 print-left">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="text-muted small mb-1">Driver’s Name</div>
                  {isEdit ? (
                    <input
                      className="form-control bg-light border-0 rounded-4 px-3 py-3"
                      value={draft.name || ""}
                      onChange={setField("name")}
                    />
                  ) : (
                    <div className="bg-light border-0 rounded-4 px-3 py-3">
                      {draft.name || "—"}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <div className="text-muted small mb-1">Operator’s Name</div>
                  {isEdit ? (
                    <input
                      className="form-control bg-light border-0 rounded-4 px-3 py-3"
                      value={draft.operatorName || ""}
                      onChange={setField("operatorName")}
                    />
                  ) : (
                    <div className="bg-light border-0 rounded-4 px-3 py-3">
                      {draft.operatorName || "—"}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <div className="text-muted small mb-1">Contact Number</div>
                  {isEdit ? (
                    <input
                      className="form-control bg-light border-0 rounded-4 px-3 py-3"
                      value={draft.contact || ""}
                      onChange={setField("contact")}
                    />
                  ) : (
                    <div className="bg-light border-0 rounded-4 px-3 py-3">
                      {draft.contact || "—"}
                    </div>
                  )}
                </div>

                {!isColorum && (
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">TODA</div>
                    {isEdit ? (
                      <input
                        className="form-control bg-light border-0 rounded-4 px-3 py-3"
                        value={draft.toda || ""}
                        onChange={setField("toda")}
                      />
                    ) : (
                      <div className="bg-light border-0 rounded-4 px-3 py-3">
                        {draft.toda || "—"}
                      </div>
                    )}
                  </div>
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

                <div className="col-12">
                  <div className="text-muted small mb-1">Address</div>
                  {isEdit ? (
                    <input
                      className="form-control bg-light border-0 rounded-4 px-3 py-3"
                      value={draft.address || ""}
                      onChange={setField("address")}
                    />
                  ) : (
                    <div className="bg-light border-0 rounded-4 px-3 py-3">
                      {draft.address || "—"}
                    </div>
                  )}
                </div>

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
                                  background:
                                    index === selectedVehicleIndex ? "#eef2ff" : "",
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

                                  <td>
                                    {isEdit ? (
                                      <input
                                        className="form-control form-control-sm"
                                        value={veh.motor || ""}
                                        onChange={setVehicle(originalIndex, "motor")}
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
                                        onChange={setVehicle(originalIndex, "modelMake")}
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
                                        onChange={setVehicle(originalIndex, "engine")}
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
                                        onChange={setVehicle(originalIndex, "chassis")}
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
                                        onChange={setVehicle(originalIndex, "plateNo")}
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
                              No selected vehicle.
                            </td>
                          </tr>
                        ) : violations.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center text-muted">
                              No violation history found for this record.
                            </td>
                          </tr>
                        ) : (
                          violations.map((item, index) => (
                            <tr key={`${item.date || "violation"}-${index}`}>
                              <td>{item.date || "—"}</td>
                              <td>{item.violation || "—"}</td>
                              <td>{item.location || "—"}</td>
                              <td>{formatMoney(item.originalFine)}</td>
                              <td>{formatMoney(item.declaredFine)}</td>
                              <td>{getViolationStatusBadge(item.status)}</td>
                              <td>{item.apprehender || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 no-print">
                    <Link
                      to={`/profiles/${driver.id}/transactions`}
                      className="link-primary"
                    >
                      View Transaction Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4 d-flex justify-content-center print-right">
              <div className="text-center print-photo-wrap">
                <div
                  className="position-relative mx-auto print-photo"
                  style={{ width: 220, height: 220 }}
                >
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
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>

                <div className="mt-3 print-type">{getDriverTypeBadge(driverType)}</div>
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
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 rounded-4 shadow">
                <form onSubmit={handleAddVehicle}>
                  <div className="modal-header border-0 pb-0">
                    <div>
                      <h5 className="modal-title fw-bold">
                        {isColorum
                          ? "Add New Vehicle Record"
                          : "Add New Franchise / Vehicle Record"}
                      </h5>
                      <div className="text-muted small">
                        {isColorum
                          ? "This will add a new vehicle row to this driver profile."
                          : "This will add a new franchise and link it to a new vehicle record."}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseAddVehicleModal}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="row g-3">
                      {!isColorum && (
                        <div className="col-md-6">
                          <label className="form-label small text-muted">
                            Franchise Number
                          </label>
                          <input
                            className="form-control rounded-4"
                            placeholder="Example: TFRO-001"
                            value={newVehicle.franchiseNo}
                            onChange={(e) =>
                              handleNewVehicleChange("franchiseNo", e.target.value)
                            }
                          />
                        </div>
                      )}

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Motor</label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Example: Tricycle"
                          value={newVehicle.motor}
                          onChange={(e) =>
                            handleNewVehicleChange("motor", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Model/Make</label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Example: Honda TMX"
                          value={newVehicle.modelMake}
                          onChange={(e) =>
                            handleNewVehicleChange("modelMake", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Engine</label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Engine number"
                          value={newVehicle.engine}
                          onChange={(e) =>
                            handleNewVehicleChange("engine", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Chassis</label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Chassis number"
                          value={newVehicle.chassis}
                          onChange={(e) =>
                            handleNewVehicleChange("chassis", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Plate Number</label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Plate number"
                          value={newVehicle.plateNo}
                          onChange={(e) =>
                            handleNewVehicleChange("plateNo", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Status</label>
                        <select
                          className="form-select rounded-4"
                          value={newVehicle.status}
                          onChange={(e) =>
                            handleNewVehicleChange("status", e.target.value)
                          }
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
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-4 px-4"
                      onClick={handleCloseAddVehicleModal}
                    >
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
      )}

      {showAddViolationModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 rounded-4 shadow">
                <form onSubmit={handleAddViolation}>
                  <div className="modal-header border-0 pb-0">
                    <div>
                      <h5 className="modal-title fw-bold">Add Violation</h5>
                      <div className="text-muted small">
                        This violation will be added to the currently selected vehicle record.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseAddViolationModal}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small text-muted">Date</label>
                        <input
                          type="date"
                          className="form-control rounded-4"
                          value={newViolation.date}
                          onChange={(e) =>
                            handleNewViolationChange("date", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Violation</label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Example: Illegal parking"
                          value={newViolation.violation}
                          onChange={(e) =>
                            handleNewViolationChange("violation", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Location</label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Violation location"
                          value={newViolation.location}
                          onChange={(e) =>
                            handleNewViolationChange("location", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small text-muted">Apprehender</label>
                        <input
                          className="form-control rounded-4"
                          placeholder="Officer name"
                          value={newViolation.apprehender}
                          onChange={(e) =>
                            handleNewViolationChange("apprehender", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small text-muted">
                          Original Fine
                        </label>
                        <input
                          type="number"
                          className="form-control rounded-4"
                          placeholder="0"
                          value={newViolation.originalFine}
                          onChange={(e) =>
                            handleNewViolationChange("originalFine", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small text-muted">
                          Declared Fine
                        </label>
                        <input
                          type="number"
                          className="form-control rounded-4"
                          placeholder="0"
                          value={newViolation.declaredFine}
                          onChange={(e) =>
                            handleNewViolationChange("declaredFine", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small text-muted">Status</label>
                        <select
                          className="form-select rounded-4"
                          value={newViolation.status}
                          onChange={(e) =>
                            handleNewViolationChange("status", e.target.value)
                          }
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
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-4 px-4"
                      onClick={handleCloseAddViolationModal}
                    >
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
      )}
    </div>
  );
}