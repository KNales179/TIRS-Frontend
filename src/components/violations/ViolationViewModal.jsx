import React from "react";

function money(n) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(n || 0));
}

function deriveStatus(v) {
  if (v?.status) return v.status;
  if (!v?.datePaid) return "New";
  return "On Process";
}

function StatusBadge({ status }) {
  const map = {
    New: "bg-warning-subtle text-warning-emphasis",
    "On Process": "bg-info-subtle text-info-emphasis",
    Done: "bg-success-subtle text-success-emphasis",
  };

  return (
    <span className={`badge rounded-pill ${map[status] || "bg-secondary"}`}>
      {status}
    </span>
  );
}

export default function ViolationViewModal({
  show,
  row,
  onClose,
  onPrint,
}) {
  if (!show || !row) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">
                Violation Details - {row.ticketNo}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <DetailItem label="Ticket No." value={row.ticketNo} />
                <DetailItem label="Violation" value={row.violation} />
                <DetailItem label="Violation Date" value={row.violationDate} />
                <DetailItem label="Driver’s Name" value={row.driverName} />
                <DetailItem label="Classification" value={row.classification} />
                <DetailItem
                  label="Total Amount"
                  value={money(row.totalAmount || 0)}
                />
                <DetailItem
                  label="Date Paid"
                  value={row.datePaid || "unavailable"}
                />
                <DetailItem label="OR Number" value={row.orNumber || "—"} />
                <DetailItem label="Enforcer(s)" value={row.enforcers || "—"} />
                <DetailItem
                  label="Commission"
                  value={money(
                    (row.totalAmount || 0) * (row.commissionRate || 0)
                  )}
                />

                <div className="col-md-6">
                  <div className="text-muted small mb-1">Status</div>
                  <StatusBadge status={deriveStatus(row)} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-light" onClick={onClose} type="button">
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onPrint?.(row)}
                type="button"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="col-md-6">
      <div className="text-muted small mb-1">{label}</div>
      <div className="fw-semibold">{value || "—"}</div>
    </div>
  );
}