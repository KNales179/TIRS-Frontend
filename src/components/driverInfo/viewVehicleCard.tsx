// src/components/driverInfo/viewVehicleCard.tsx
import React, { useEffect, useState } from "react";

export default function ViewVehicleCard({
  details,
  onClose,
  onSaveVehicle,
  onAddFranchise,
  onMarkStatus,
  saving,
}: any) {
  const { vehicle, franchise } = details;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    motor: "",
    modelMake: "",
    chassis: "",
    plateNo: "",
    color: "",
  });

  useEffect(() => {
    setDraft({
      motor: vehicle?.motor || "",
      modelMake: vehicle?.modelMake || "",
      chassis: vehicle?.chassis || "",
      plateNo: vehicle?.plateNo || "",
      color: vehicle?.color || "",
    });
    setIsEditing(false);
  }, [vehicle]);

  function setField(key: string, value: string) {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSaveEdit() {
    await onSaveVehicle({
      ...vehicle,
      ...draft,
    });

    setIsEditing(false);
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header border-0 pb-0">
              <div>
                <h5 className="modal-title fw-bold">Vehicle Details</h5>
                <div className="small text-muted">
                  View and update vehicle information.
                </div>
              </div>

              <button type="button" className="btn-close" onClick={onClose} disabled={saving} />
            </div>

            <div className="modal-body">
              <div className="row g-3 mb-4">
                <EditableDetail label="Motor" value={draft.motor} isEditing={isEditing} onChange={(v: string) => setField("motor", v)} />
                <EditableDetail label="Model/Make" value={draft.modelMake} isEditing={isEditing} onChange={(v: string) => setField("modelMake", v)} />
                <EditableDetail label="Chassis" value={draft.chassis} isEditing={isEditing} onChange={(v: string) => setField("chassis", v)} />
                <EditableDetail label="Plate Number" value={draft.plateNo} isEditing={isEditing} onChange={(v: string) => setField("plateNo", v)} />
                <EditableDetail label="Color" value={draft.color} isEditing={isEditing} onChange={(v: string) => setField("color", v)} />
                <DetailBox label="Current Status" value={vehicle.status} />
              </div>

              <div className="border rounded-4 p-3">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                  <div>
                    <div className="fw-semibold">Franchise Information</div>
                    <div className="small text-muted">A vehicle can have one franchise record.</div>
                  </div>

                  {!franchise && (
                    <button className="btn btn-sm btn-primary rounded-4 px-3" type="button" onClick={onAddFranchise}>
                      + Add Franchise
                    </button>
                  )}
                </div>

                {franchise ? (
                  <div className="row g-3">
                    <DetailBox label="Franchise Number" value={franchise.number} />
                    <DetailBox label="Franchise Type" value={franchise.franchise_type} />
                    <DetailBox label="TODA Name" value={franchise.toda_name} />
                    <DetailBox label="Route Area" value={franchise.route_area} />
                    <DetailBox label="Registration Date" value={franchise.registration_date} />
                    <DetailBox label="Expiry Date" value={franchise.expiry_date} />
                    <DetailBox label="Franchise Status" value={franchise.status} />
                  </div>
                ) : (
                  <div className="text-muted small">
                    No franchise has been added for this vehicle yet.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
              <div className="d-flex gap-2 flex-wrap">
                {!isEditing ? (
                  <button type="button" className="btn btn-outline-primary rounded-4 px-4" onClick={() => setIsEditing(true)}>
                    Edit Vehicle
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary rounded-4 px-4" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? "Saving..." : "Save Edit"}
                  </button>
                )}

                <button type="button" className="btn btn-outline-warning rounded-4 px-4" onClick={() => onMarkStatus(vehicle, "IMPOUNDED")} disabled={saving}>
                  Mark Impounded
                </button>

                <button type="button" className="btn btn-outline-secondary rounded-4 px-4" onClick={() => onMarkStatus(vehicle, "INACTIVE")} disabled={saving}>
                  Mark Inactive
                </button>
              </div>

              <button type="button" className="btn btn-light rounded-4 px-4" onClick={onClose} disabled={saving}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

function EditableDetail({ label, value, isEditing, onChange }: any) {
  return (
    <div className="col-md-6">
      <div className="small text-muted mb-1">{label}</div>
      {isEditing ? (
        <input
          className="form-control rounded-4 px-3 py-3"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="bg-light rounded-4 px-3 py-3">{value || "—"}</div>
      )}
    </div>
  );
}

function DetailBox({ label, value }: any) {
  return (
    <div className="col-md-6">
      <div className="small text-muted mb-1">{label}</div>
      <div className="bg-light rounded-4 px-3 py-3">{value || "—"}</div>
    </div>
  );
}