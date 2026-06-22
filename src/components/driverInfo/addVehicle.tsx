// src/components/driverInfo/addVehicle.tsx
import React from "react";

export default function AddVehicleModal({
  newVehicle,
  onChange,
  onClose,
  onSubmit,
  saving,
}: any) {
  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow">
            <form onSubmit={onSubmit}>
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold">Add New Vehicle Record</h5>
                  <div className="small text-muted">
                    Franchise details can be added from the vehicle details view.
                  </div>
                </div>

                <button type="button" className="btn-close" onClick={onClose} disabled={saving} />
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  <FormInput label="Motor" value={newVehicle.motor} onChange={(v: string) => onChange("motor", v)} />
                  <FormInput label="Model/Make" value={newVehicle.modelMake} onChange={(v: string) => onChange("modelMake", v)} />
                  <FormInput label="Chassis" value={newVehicle.chassis} onChange={(v: string) => onChange("chassis", v)} />
                  <FormInput label="Plate Number" value={newVehicle.plateNo} onChange={(v: string) => onChange("plateNo", v)} />
                  <FormInput label="Color" value={newVehicle.color} onChange={(v: string) => onChange("color", v)} placeholder="Example: Green or Yellow" />
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary rounded-4 px-4" onClick={onClose} disabled={saving}>
                  Cancel
                </button>

                <button type="submit" className="btn btn-primary rounded-4 px-4" disabled={saving}>
                  {saving ? "Saving..." : "Add Vehicle"}
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

function FormInput({ label, value, onChange, placeholder = "", type = "text" }: any) {
  return (
    <div className="col-md-6">
      <label className="form-label small text-muted">{label}</label>
      <input
        type={type}
        className="form-control rounded-4"
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}