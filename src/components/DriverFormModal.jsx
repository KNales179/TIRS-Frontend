import React, { useEffect, useMemo, useState } from "react";

const TYPE_OPTIONS = ["WITH FRANCHISE", "SPECIAL FRANCHISE"];

const initialForm = (mode) => ({
  driverName: "",
  operatorName: "",
  address: "",
  contact: "",
  toda: "",
  motor: "",
  modelMake: "",
  engine: "",
  chassis: "",
  plateNo: "",
  type: mode === "COLORUM" ? "COLORUM" : "WITH FRANCHISE",
  franchiseNo: "",
  photoFile: null,
});

export default function DriverFormModal({ show, mode, onClose, onSubmit }) {
  const title = useMemo(
    () => (mode === "COLORUM" ? "Colorum Form" : "Driver’s Form"),
    [mode]
  );

  const [form, setForm] = useState(initialForm(mode));

  useEffect(() => {
    if (show) {
      setForm(initialForm(mode));
    }
  }, [show, mode]);

  if (!show) return null;

  const set = (key) => (e) => {
    const value =
      key === "photoFile" ? e.target.files?.[0] || null : e.target.value;

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const canSubmit =
    form.driverName.trim() &&
    form.address.trim() &&
    form.contact.trim() &&
    (mode === "COLORUM" ? true : form.toda.trim()) &&
    form.motor.trim() &&
    form.modelMake.trim() &&
    form.engine.trim() &&
    form.chassis.trim() &&
    (mode === "COLORUM" ? true : form.franchiseNo.trim());

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    const photoUrl = form.photoFile ? URL.createObjectURL(form.photoFile) : "";

    onSubmit({
      type: mode === "COLORUM" ? "COLORUM" : form.type,
      name: form.driverName.trim(),
      operatorName: form.operatorName.trim(),
      address: form.address.trim(),
      contact: form.contact.trim(),
      toda: mode === "COLORUM" ? "Unregistered" : form.toda.trim(),
      franchiseNo: mode === "COLORUM" ? "" : form.franchiseNo.trim(),
      photoUrl,
      vehicles: [
        {
          motor: form.motor.trim(),
          modelMake: form.modelMake.trim(),
          engine: form.engine.trim(),
          chassis: form.chassis.trim(),
          plateNo: form.plateNo.trim(),
          status: mode === "COLORUM" ? "Colorum" : form.type,
          violations: [],
        },
      ],
      transactions: [],
      franchises:
        mode === "COLORUM"
          ? []
          : [
              {
                id: `f_${Date.now()}`,
                number: form.franchiseNo.trim(),
                vehicleIndex: 0,
              },
            ],
    });

    onClose();
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{ background: "rgba(0,0,0,.35)", zIndex: 2000, padding: 16 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4 shadow-lg w-100"
        style={{
          maxWidth: 460,
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="h5 fw-bold mb-0">{title}</h2>
            <button
              className="btn btn-light rounded-circle"
              type="button"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <div className="small text-muted mb-1">Attach Photo (optional)</div>
              <input
                className="form-control"
                type="file"
                accept="image/*"
                onChange={set("photoFile")}
              />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Driver’s Name</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.driverName}
                onChange={set("driverName")}
              />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Operator’s Name</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.operatorName}
                onChange={set("operatorName")}
              />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Address</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.address}
                onChange={set("address")}
              />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Contact No.</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.contact}
                onChange={set("contact")}
              />
            </div>

            {mode !== "COLORUM" && (
              <div className="mb-3">
                <div className="small text-muted mb-1">Driver Type</div>
                <select
                  className="form-select bg-light border-0 rounded-4"
                  value={form.type}
                  onChange={set("type")}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode !== "COLORUM" && (
              <div className="mb-3">
                <div className="small text-muted mb-1">TODA</div>
                <input
                  className="form-control bg-light border-0 rounded-4"
                  value={form.toda}
                  onChange={set("toda")}
                />
              </div>
            )}

            <div className="mb-3">
              <div className="small text-muted mb-1">Motor</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.motor}
                onChange={set("motor")}
              />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Model / Make</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.modelMake}
                onChange={set("modelMake")}
              />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Engine</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.engine}
                onChange={set("engine")}
              />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Chassis</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.chassis}
                onChange={set("chassis")}
              />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Plate Number</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.plateNo}
                onChange={set("plateNo")}
              />
            </div>

            {mode !== "COLORUM" && (
              <div className="mb-4">
                <div className="small text-muted mb-1">Franchise Number</div>
                <input
                  className="form-control bg-light border-0 rounded-4"
                  value={form.franchiseNo}
                  onChange={set("franchiseNo")}
                />
              </div>
            )}

            <button
              className="btn btn-primary w-100 rounded-4 py-2"
              type="submit"
              disabled={!canSubmit}
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}