// components/DriverFormModal.jsx
import React, { useEffect, useMemo, useState } from "react";

const initialForm = (mode) => ({
  classification: mode === "COLORUM" ? "COLORUM" : "REGULAR",
  operator_name: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  birth_date: "",
  gender: "",
  contact_number: "",
  address: "",
  license_number: "",
  license_expiry: "",
  photoFile: null,
});

export default function DriverFormModal({ show, mode, onClose, onSubmit }) {
  const title = useMemo(
    () => (mode === "COLORUM" ? "New Profile Form" : "New Profile Form"),
    [mode]
  );

  const [form, setForm] = useState(initialForm(mode));
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (show) {
      setForm(initialForm(mode));
      setPreviewUrl("");
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

    if (key === "photoFile") {
      setPreviewUrl(value ? URL.createObjectURL(value) : "");
    }
  };

  const canSubmit =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.address.trim() &&
    form.contact_number.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    await onSubmit({
      classification: mode === "COLORUM" ? "COLORUM" : form.classification,
      operator_name: form.operator_name.trim() || null,
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim() || null,
      last_name: form.last_name.trim(),
      suffix: form.suffix.trim() || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      contact_number: form.contact_number.trim(),
      address: form.address.trim(),
      license_number: form.license_number.trim() || null,
      license_expiry: form.license_expiry || null,
      photo_url: null,
      photoFile: form.photoFile,
      status: "ACTIVE",
    });
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{ background: "rgba(0,0,0,.35)", zIndex: 2000, padding: 16 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4 shadow-lg w-100"
        style={{ maxWidth: 520, maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="h5 fw-bold mb-0">{title}</h2>
            <button className="btn btn-light rounded-circle" type="button" onClick={onClose}>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <div className="small text-muted mb-1">Profile Picture</div>

              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-light border"
                  style={{ width: 72, height: 72, overflow: "hidden", flex: "0 0 auto" }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <i className="bi bi-person text-muted fs-3"></i>
                  )}
                </div>

                <input
                  className="form-control"
                  type="file"
                  accept="image/*"
                  onChange={set("photoFile")}
                />
              </div>
            </div>

            {mode !== "COLORUM" && (
              <div className="mb-3">
                <div className="small text-muted mb-1">Driver Classification</div>
                <select
                  className="form-select bg-light border-0 rounded-4"
                  value={form.classification}
                  onChange={set("classification")}
                >
                  <option value="REGULAR">Regular Driver</option>
                  <option value="SPECIAL">Special Franchise Driver</option>
                  <option value="TEMPORARY">Temporary Driver</option>
                </select>
              </div>
            )}

            <div className="mb-3">
              <div className="small text-muted mb-1">Operator Name</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.operator_name}
                onChange={set("operator_name")}
              />
            </div>

            <div className="row g-2">
              <div className="col-md-6 mb-3">
                <div className="small text-muted mb-1">First Name</div>
                <input
                  className="form-control bg-light border-0 rounded-4"
                  value={form.first_name}
                  onChange={set("first_name")}
                />
              </div>

              <div className="col-md-6 mb-3">
                <div className="small text-muted mb-1">Middle Name</div>
                <input
                  className="form-control bg-light border-0 rounded-4"
                  value={form.middle_name}
                  onChange={set("middle_name")}
                />
              </div>

              <div className="col-md-6 mb-3">
                <div className="small text-muted mb-1">Last Name</div>
                <input
                  className="form-control bg-light border-0 rounded-4"
                  value={form.last_name}
                  onChange={set("last_name")}
                />
              </div>

              <div className="col-md-6 mb-3">
                <div className="small text-muted mb-1">Suffix</div>
                <input
                  className="form-control bg-light border-0 rounded-4"
                  value={form.suffix}
                  onChange={set("suffix")}
                  placeholder="Jr., Sr., III"
                />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-md-6 mb-3">
                <div className="small text-muted mb-1">Birth Date</div>
                <input
                  className="form-control bg-light border-0 rounded-4"
                  type="date"
                  value={form.birth_date}
                  onChange={set("birth_date")}
                />
              </div>

              <div className="col-md-6 mb-3">
                <div className="small text-muted mb-1">Gender</div>
                <select
                  className="form-select bg-light border-0 rounded-4"
                  value={form.gender}
                  onChange={set("gender")}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Contact Number</div>
              <input
                className="form-control bg-light border-0 rounded-4"
                value={form.contact_number}
                onChange={set("contact_number")}
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

            <div className="row g-2">
              <div className="col-md-6 mb-4">
                <div className="small text-muted mb-1">License Number</div>
                <input
                  className="form-control bg-light border-0 rounded-4"
                  value={form.license_number}
                  onChange={set("license_number")}
                />
              </div>

              <div className="col-md-6 mb-4">
                <div className="small text-muted mb-1">License Expiry</div>
                <input
                  className="form-control bg-light border-0 rounded-4"
                  type="date"
                  value={form.license_expiry}
                  onChange={set("license_expiry")}
                />
              </div>
            </div>

            <button className="btn btn-primary w-100 rounded-4 py-2" type="submit" disabled={!canSubmit}>
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}