//components/violations/ViolationFormModal.jsx
import React from "react";
import { violationsMaster } from "../../data/violationsMaster";

function formatDateInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function computePayableAmount(totalAmount, discountType, discountValue) {
  const baseAmount = Number(totalAmount || 0);
  const discount = Number(discountValue || 0);

  if (discountType === "Fixed") {
    return Math.max(baseAmount - discount, 0);
  }

  if (discountType === "Percent") {
    return Math.max(baseAmount - (baseAmount * discount) / 100, 0);
  }

  return baseAmount;
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

  const payableAmount = computePayableAmount(
    formData.totalAmount,
    formData.discountType,
    formData.discountValue
  );

  function handleFieldChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleViolationSelect(code) {
    const selected = violationsMaster.find((item) => item.code === code);

    setFormData((prev) => ({
      ...prev,
      violationCode: selected?.code || "",
      violation: selected?.name || "",
      violationGroup: selected?.group || "",
      offenseLevel: selected?.offenseLevel || "",
      totalAmount: selected?.penalty || "",
      payableAmount: computePayableAmount(
        selected?.penalty || "",
        prev.discountType,
        prev.discountValue
      ),
    }));
  }

  function handleDiscountTypeChange(value) {
    setFormData((prev) => ({
      ...prev,
      discountType: value,
      discountValue: "",
      discountReason: value === "None" ? "" : prev.discountReason,
      discountApprovedBy: value === "None" ? "" : prev.discountApprovedBy,
      payableAmount: computePayableAmount(prev.totalAmount, value, ""),
    }));
  }

  function handleDiscountValueChange(value) {
    setFormData((prev) => ({
      ...prev,
      discountValue: value,
      payableAmount: computePayableAmount(prev.totalAmount, prev.discountType, value),
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

                <div className="col-md-6">
                  <label className="form-label">Violation</label>
                  <select
                    className="form-select"
                    value={formData.violationCode || ""}
                    onChange={(e) => handleViolationSelect(e.target.value)}
                  >
                    <option value="">Select violation</option>
                    {violationsMaster.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} - {item.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                    <option value="Regular Franchise">Regular Franchise</option>
                    <option value="Temporary Franchise">Temporary Franchise</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Official Penalty</label>
                  <input
                    className="form-control"
                    type="number"
                    value={formData.totalAmount}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-select"
                    value={formData.discountType || "None"}
                    onChange={(e) => handleDiscountTypeChange(e.target.value)}
                  >
                    <option value="None">None</option>
                    <option value="Fixed">Fixed Amount</option>
                    <option value="Percent">Percentage</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {formData.discountType === "Percent"
                      ? "Discount Percentage"
                      : "Discount Value"}
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    value={formData.discountValue || ""}
                    onChange={(e) => handleDiscountValueChange(e.target.value)}
                    disabled={formData.discountType === "None"}
                    placeholder={
                      formData.discountType === "Percent" ? "Enter %" : "Enter amount"
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Payable Amount</label>
                  <input
                    className="form-control"
                    type="number"
                    value={payableAmount}
                    readOnly
                  />
                </div>

                <FormInput
                  label="Discount Reason"
                  value={formData.discountReason || ""}
                  onChange={(val) => handleFieldChange("discountReason", val)}
                />

                <FormInput
                  label="Approved By"
                  value={formData.discountApprovedBy || ""}
                  onChange={(val) => handleFieldChange("discountApprovedBy", val)}
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