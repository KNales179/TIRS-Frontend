// src/components/EnforcerFormModal.jsx
import React, { useState } from "react";

export default function EnforcerFormModal({ show, onClose, onSubmit }) {
  const [form, setForm] = useState({
    idNumber: "",
    name: "",
    contact: "",
    address: "",
    photoFile: null,
  });

  if (!show) return null;

  const set = (k) => (e) => {
    const v = k === "photoFile" ? e.target.files?.[0] || null : e.target.value;
    setForm((p) => ({ ...p, [k]: v }));
  };

  const canSubmit =
    form.idNumber.trim() &&
    form.name.trim() &&
    form.contact.trim() &&
    form.address.trim();

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    const photoUrl = form.photoFile ? URL.createObjectURL(form.photoFile) : "";

    onSubmit({
      idNumber: form.idNumber.trim(),
      name: form.name.trim(),
      contact: form.contact.trim(),
      address: form.address.trim(),
      photoUrl,
      apprehensionRecord: [],
    });

    onClose();
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center"
      style={{ background: "rgba(0,0,0,.35)", zIndex: 2000, padding: 16 }}
      onClick={onClose}
    >
      {/* ✅ scroll container */}
      <div
        className="bg-white rounded-4 shadow-lg w-100"
        style={{
          maxWidth: 440,
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="h5 fw-bold mb-0">Enforcer Form</h2>
            <button className="btn btn-light rounded-circle" type="button" onClick={onClose}>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ✅ Enforcer Photo */}
            <div className="mb-3">
              <div className="small text-muted mb-1">Attach Photo (optional)</div>
              <input className="form-control" type="file" accept="image/*" onChange={set("photoFile")} />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">ID Number</div>
              <input className="form-control bg-light border-0 rounded-4" value={form.idNumber} onChange={set("idNumber")} />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Name</div>
              <input className="form-control bg-light border-0 rounded-4" value={form.name} onChange={set("name")} />
            </div>

            <div className="mb-3">
              <div className="small text-muted mb-1">Contact Number</div>
              <input className="form-control bg-light border-0 rounded-4" value={form.contact} onChange={set("contact")} />
            </div>

            <div className="mb-4">
              <div className="small text-muted mb-1">Address</div>
              <input className="form-control bg-light border-0 rounded-4" value={form.address} onChange={set("address")} />
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