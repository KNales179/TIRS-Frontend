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
    New: "bg-warning-subtle text-warning-emphasis border border-warning-subtle",
    "On Process": "bg-info-subtle text-info-emphasis border border-info-subtle",
    Done: "bg-success-subtle text-success-emphasis border border-success-subtle",
  };

  return (
    <span className={`badge rounded-pill px-3 py-2 fw-semibold ${map[status] || "bg-secondary"}`}>
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

  const payableAmount = row.payableAmount ?? row.totalAmount ?? 0;
  const commission = payableAmount * (row.commissionRate || 0);

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: 24, overflow: "hidden" }}
          >
            <div
              className="modal-header border-0"
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
                padding: "1.25rem 1.5rem",
              }}
            >
              <div>
                <div className="text-muted small fw-semibold mb-1">
                  Violation Record
                </div>
                <h5 className="modal-title fw-bold mb-0">
                  {row.violation || "Violation Details"}
                </h5>
                <div className="text-muted small mt-1">
                  Ticket No. {row.ticketNo || "—"}
                </div>
              </div>

              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body p-4" style={{ backgroundColor: "#f8fafc" }}>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <SummaryCard
                    label="Official Penalty"
                    value={money(row.totalAmount || 0)}
                    valueClass="text-danger"
                  />
                </div>

                <div className="col-md-4">
                  <SummaryCard
                    label="Payable Amount"
                    value={money(payableAmount)}
                    valueClass="text-success"
                  />
                </div>

                <div className="col-md-4">
                  <div className="h-100 bg-white shadow-sm border-0 p-3" style={{ borderRadius: 18 }}>
                    <div className="text-muted small fw-semibold mb-2">Status</div>
                    <StatusBadge status={deriveStatus(row)} />
                  </div>
                </div>
              </div>

              <SectionCard title="Violation Information">
                <div className="row g-3">
                  <DetailItem label="Ticket No." value={row.ticketNo} />
                  <DetailItem label="Violation Code" value={row.violationCode || "—"} />
                  <DetailItem label="Violation" value={row.violation} />
                  <DetailItem label="Violation Date" value={row.violationDate} />
                  <DetailItem label="Classification" value={row.classification} />
                  <DetailItem label="Driver’s Name" value={row.driverName} />
                </div>
              </SectionCard>

              <SectionCard title="Discount and Payment">
                <div className="row g-3">
                  <DetailItem label="Discount Type" value={row.discountType || "None"} />
                  <DetailItem
                    label="Discount Value"
                    value={
                      row.discountType === "Percent"
                        ? `${Number(row.discountValue || 0)}%`
                        : money(row.discountValue || 0)
                    }
                  />
                  <DetailItem label="Discount Reason" value={row.discountReason || "—"} />
                  <DetailItem label="Approved By" value={row.discountApprovedBy || "—"} />
                  <DetailItem label="Date Paid" value={row.datePaid || "unavailable"} />
                  <DetailItem label="OR Number" value={row.orNumber || "—"} />
                </div>
              </SectionCard>

              <SectionCard title="Enforcement Details">
                <div className="row g-3">
                  <DetailItem label="Enforcer(s)" value={row.enforcers || "—"} />
                  <DetailItem label="Commission Rate" value={`${Number((row.commissionRate || 0) * 100)}%`} />
                  <DetailItem label="Commission" value={money(commission)} />
                </div>
              </SectionCard>
            </div>

            <div
              className="modal-footer border-0 d-flex justify-content-between"
              style={{ padding: "1rem 1.5rem", backgroundColor: "#ffffff" }}
            >
              <button
                className="btn btn-light px-4"
                onClick={onClose}
                type="button"
                style={{ borderRadius: 12 }}
              >
                Close
              </button>

              <button
                className="btn btn-primary px-4"
                onClick={() => onPrint?.(row)}
                type="button"
                style={{ borderRadius: 12 }}
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

function SectionCard({ title, children }) {
  return (
    <div
      className="bg-white shadow-sm mb-3"
      style={{ borderRadius: 20, padding: "1.25rem" }}
    >
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="fw-bold mb-0">{title}</h6>
      </div>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, valueClass = "" }) {
  return (
    <div
      className="h-100 bg-white shadow-sm border-0 p-3"
      style={{ borderRadius: 18 }}
    >
      <div className="text-muted small fw-semibold mb-2">{label}</div>
      <div className={`fs-5 fw-bold ${valueClass}`}>{value || "—"}</div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="col-md-6">
      <div
        className="h-100 px-3 py-3"
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: 16,
          border: "1px solid #eef2f7",
        }}
      >
        <div className="text-muted small fw-semibold mb-1">{label}</div>
        <div className="fw-semibold text-dark">{value || "—"}</div>
      </div>
    </div>
  );
}