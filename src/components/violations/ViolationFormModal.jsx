import React from "react";

function formatDateInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function ViolationFormModal({
  show,
  mode = "add",
  formData,
  setFormData,
  onClose,
  onSave,
}) {
  if (!show) return null;

  function handleFieldChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleAddEnforcer() {
    setFormData((prev) => ({
      ...prev,
      enforcers: [...prev.enforcers, ""],
    }));
  }

  function handleRemoveEnforcer(index) {
    setFormData((prev) => ({
      ...prev,
      enforcers:
        prev.enforcers.length === 1
          ? prev.enforcers
          : prev.enforcers.filter((_, i) => i !== index),
    }));
  }

  function handleEnforcerChange(index, value) {
    setFormData((prev) => {
      const updated = [...prev.enforcers];
      updated[index] = value;

      return {
        ...prev,
        enforcers: updated,
      };
    });
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">
                {mode === "add" ? "Add Violation" : "Edit Violation"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <FormInput
                  label="Ticket No."
                  value={formData.ticketNo}
                  onChange={(val) => handleFieldChange("ticketNo", val)}
                />

                <FormInput
                  label="Violation"
                  value={formData.violation}
                  onChange={(val) => handleFieldChange("violation", val)}
                />

                <FormInput
                  label="Violation Date"
                  value={formData.violationDate}
                  placeholder="MM/DD/YYYY"
                  maxLength={10}
                  onChange={(val) =>
                    handleFieldChange("violationDate", formatDateInput(val))
                  }
                />

                <FormInput
                  label="Driver’s Name"
                  value={formData.driverName}
                  onChange={(val) => handleFieldChange("driverName", val)}
                />

                <div className="col-md-6">
                  <label className="form-label">Classification</label>
                  <select
                    className="form-select"
                    value={formData.classification}
                    onChange={(e) =>
                      handleFieldChange("classification", e.target.value)
                    }
                  >
                    <option value="Colorum">Colorum</option>
                    <option value="Registered">Registered</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>

                <FormInput
                  label="Total Amount"
                  type="number"
                  value={formData.totalAmount}
                  onChange={(val) => handleFieldChange("totalAmount", val)}
                />

                <FormInput
                  label="Date Paid"
                  value={formData.datePaid}
                  placeholder="MM/DD/YYYY"
                  maxLength={10}
                  onChange={(val) =>
                    handleFieldChange("datePaid", formatDateInput(val))
                  }
                />

                <FormInput
                  label="OR Number"
                  value={formData.orNumber}
                  onChange={(val) => handleFieldChange("orNumber", val)}
                />

                <div className="col-md-6">
                  <label className="form-label">Enforcer(s)</label>

                  {formData.enforcers.map((name, index) => (
                    <div key={index} className="d-flex gap-2 mb-2">
                      <input
                        className="form-control"
                        type="text"
                        placeholder={`Enforcer ${index + 1}`}
                        value={name}
                        onChange={(e) =>
                          handleEnforcerChange(index, e.target.value)
                        }
                      />

                      {formData.enforcers.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleRemoveEnforcer(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleAddEnforcer}
                  >
                    + Add Enforcer
                  </button>
                </div>

                <FormInput
                  label="Commission Rate"
                  type="number"
                  value={formData.commissionRate}
                  onChange={(val) => handleFieldChange("commissionRate", val)}
                />

                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                  >
                    <option value="New">New</option>
                    <option value="On Process">On Process</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-light" onClick={onClose} type="button">
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onSave} type="button">
                {mode === "add" ? "Save Violation" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  maxLength,
}) {
  return (
    <div className="col-md-6">
      <label className="form-label">{label}</label>
      <input
        className="form-control"
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}