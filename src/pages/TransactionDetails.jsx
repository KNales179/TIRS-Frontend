import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getToken } from "../data/auth";
import tfroHeadline from "../assets/TFRO-headline.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function apiRequest(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safe(value, fallback = "—") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function openPrintWindow(title, htmlBody) {
  const w = window.open("", "_blank", "width=1000,height=700");
  if (!w) return;

  w.document.open();
  w.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 28px;
            color: #111;
            background: #fff;
          }

          .print-header {
            text-align: center;
            border-bottom: 4px solid #1d4ed8;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }

          .print-header .agency {
            font-size: 13px;
            font-weight: bold;
            color: #1d4ed8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .print-header .office {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 4px;
          }

          .print-header .title {
            font-size: 15px;
            font-weight: bold;
            margin-top: 6px;
            color: #374151;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }

          .summary-item {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            border-radius: 6px;
            font-size: 12px;
          }

          .summary-label {
            color: #6b7280;
            font-size: 11px;
            margin-bottom: 3px;
          }

          .summary-value {
            font-weight: bold;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            border: 1px solid #111;
          }

          th {
            text-align: center;
            font-size: 11px;
            color: #fff;
            background: #1d4ed8;
            padding: 8px 9px;
            border: 1px solid #111;
            font-weight: bold;
            text-transform: uppercase;
          }

          td {
            padding: 8px 9px;
            font-size: 12px;
            border: 1px solid #111;
            vertical-align: top;
          }

          tr:nth-child(even) td {
            background: #eef4ff;
          }

          .print-footer {
            margin-top: 32px;
            display: flex;
            justify-content: space-between;
            gap: 24px;
          }

          .signature-box {
            width: 45%;
            text-align: center;
            font-size: 12px;
          }

          .signature-line {
            border-top: 1px solid #111;
            margin-top: 42px;
            padding-top: 6px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="agency">Republic of the Philippines</div>
          <div class="office">TRICYCLE FRANCHISING REGULATORY OFFICE LUCENA CITY</div>
          <div class="title">Driver Transaction Details Record</div>
        </div>

        ${htmlBody}

        <div class="print-footer">
          <div class="signature-box">
            <div class="signature-line">Prepared By</div>
          </div>

          <div class="signature-box">
            <div class="signature-line">Verified By</div>
          </div>
        </div>
      </body>
    </html>
  `);
  w.document.close();

  setTimeout(() => {
    w.focus();
    w.print();
    w.close();
  }, 500);
}

function openIndexCardPrintWindow({ driver, transactionRows, headlineSrc }) {
  const w = window.open("", "_blank", "width=1200,height=800");
  if (!w) return;

  const vehicles = driver?.vehicles || [];
  const franchises = driver?.franchises || [];
  const primaryFranchise = franchises[0] || null;
  const primaryToda = primaryFranchise?.toda_name || driver?.toda || "";
  const primaryFranchiseNo = primaryFranchise?.number || primaryFranchise?.franchise_number || "";

  const vehicleRows = vehicles.length
    ? vehicles
        .map((vehicle) => {
          return `
            <tr>
              <td>${escapeHtml(safe(vehicle.motor || vehicle.motor_number))}</td>
              <td>${escapeHtml(safe(vehicle.modelMake || vehicle.model_make))}</td>
              <td>${escapeHtml(safe(vehicle.engine || vehicle.motor || vehicle.motor_number))}</td>
              <td>${escapeHtml(safe(vehicle.chassis || vehicle.chassis_number))}</td>
              <td>${escapeHtml(safe(vehicle.plateNo || vehicle.plate_number))}</td>
              <td>${escapeHtml(safe(vehicle.status))}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="6" class="center muted">No vehicle records found.</td></tr>`;

  const transactionCardRows = transactionRows.length
    ? transactionRows
        .map((row) => {
          const transactionText = [
            row.action,
            row.ticketNo && row.ticketNo !== "—" ? `Ticket: ${row.ticketNo}` : "",
            row.violation && row.violation !== "—" ? row.violation : "",
            row.amountPaid ? `Amount: ${formatMoney(row.amountPaid)}` : "",
            row.orNumber && row.orNumber !== "—" ? `OR: ${row.orNumber}` : "",
          ]
            .filter(Boolean)
            .join(" | ");

          return `
            <tr>
              <td>${escapeHtml(formatDate(row.date))}</td>
              <td>${escapeHtml(transactionText || "—")}</td>
              <td>${escapeHtml(safe(row.tfroPersonnel))}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="3" class="center muted">No transaction records found.</td></tr>`;

  w.document.open();
  w.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Driver Index Card</title>
        <style>
          @page {
            size: Letter landscape;
            margin: 0.25in;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #fff;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
          }

          .index-page {
            width: 10.5in;
            min-height: 7.5in;
            padding: 0.1in;
            page-break-after: always;
          }

          .index-page:last-child {
            page-break-after: auto;
          }

          .tfro-headline {
            width: 100%;
            height: 0.82in;
            object-fit: contain;
            object-position: left center;
            display: block;
            margin-bottom: 0.08in;
          }

          .top-row {
            display: grid;
            grid-template-columns: 1fr 2.1in;
            gap: 0.12in;
            align-items: stretch;
          }

          .franchise-box {
            display: grid;
            grid-template-columns: 1.5in 1fr;
            border: 1px solid #111;
            margin-bottom: 0.08in;
            min-height: 0.38in;
          }

          .franchise-label {
            background: #4fb4d8;
            font-weight: 800;
            text-align: center;
            padding: 0.08in;
            border-right: 1px solid #111;
          }

          .franchise-value {
            padding: 0.08in;
            font-weight: 700;
          }

          .card-title {
            text-align: center;
            font-size: 20px;
            font-weight: 700;
            margin: 0.04in 0 0.08in;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1.35in 1fr;
            border-top: 1px solid #111;
            border-left: 1px solid #111;
          }

          .info-label,
          .info-value {
            min-height: 0.36in;
            border-right: 1px solid #111;
            border-bottom: 1px solid #111;
            padding: 0.06in;
            font-size: 15px;
          }

          .info-label {
            font-weight: 800;
          }

          .photo-box {
            border: 1px solid #111;
            min-height: 1.55in;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-weight: 800;
            line-height: 1.25;
            margin-top: 0.44in;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0.16in;
          }

          th,
          td {
            border: 1px solid #111;
            padding: 0.07in;
            font-size: 12px;
            vertical-align: middle;
          }

          th {
            font-weight: 800;
            text-align: center;
            background: #f3f4f6;
          }

          .transaction-table th,
          .transaction-table td {
            font-size: 13px;
            min-height: 0.34in;
          }

          .transaction-table th:nth-child(1),
          .transaction-table td:nth-child(1) {
            width: 1.45in;
            text-align: center;
          }

          .transaction-table th:nth-child(3),
          .transaction-table td:nth-child(3) {
            width: 2.0in;
            text-align: center;
          }

          .center {
            text-align: center;
          }

          .muted {
            color: #6b7280;
          }

          .back-header {
            display: grid;
            grid-template-columns: 1fr 2.1in;
            gap: 0.12in;
            margin-top: 0.1in;
          }

          .print-note {
            margin-top: 0.12in;
            font-size: 11px;
            color: #374151;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <section class="index-page">
          <img class="tfro-headline" src="${escapeHtml(headlineSrc)}" alt="TFRO Header" />

          <div class="franchise-box">
            <div class="franchise-label">FRANCHISE No.</div>
            <div class="franchise-value">${escapeHtml(safe(primaryFranchiseNo, ""))}</div>
          </div>

          <div class="card-title">Driver's Information</div>

          <div class="top-row">
            <div>
              <div class="info-grid">
                <div class="info-label">Name</div>
                <div class="info-value">${escapeHtml(safe(driver?.name))}</div>
                <div class="info-label">Address</div>
                <div class="info-value">${escapeHtml(safe(driver?.address))}</div>
                <div class="info-label">Contact No.</div>
                <div class="info-value">${escapeHtml(safe(driver?.contact))}</div>
                <div class="info-label">TODA</div>
                <div class="info-value">${escapeHtml(safe(primaryToda))}</div>
              </div>
            </div>

            <div class="photo-box">2x2<br />Picture</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>MOTOR</th>
                <th>MODEL/MAKE</th>
                <th>ENGINE</th>
                <th>CHASSIS</th>
                <th>PLATE NUMBER</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${vehicleRows}
            </tbody>
          </table>

          <div class="print-note">FRONT SIDE — Print two-sided / duplex, flip on short edge.</div>
        </section>

        <section class="index-page">
          <img class="tfro-headline" src="${escapeHtml(headlineSrc)}" alt="TFRO Header" />

          <div class="back-header">
            <div class="info-grid">
              <div class="info-label">Name</div>
              <div class="info-value">${escapeHtml(safe(driver?.name))}</div>
              <div class="info-label">Address</div>
              <div class="info-value">${escapeHtml(safe(driver?.address))}</div>
              <div class="info-label">CONTACT No.</div>
              <div class="info-value">${escapeHtml(safe(driver?.contact))}</div>
            </div>

            <div class="photo-box">2x2<br />Picture</div>
          </div>

          <table class="transaction-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>Transaction</th>
                <th>TFRO Personnel</th>
              </tr>
            </thead>
            <tbody>
              ${transactionCardRows}
            </tbody>
          </table>

          <div class="print-note">BACK SIDE — For driver record and transaction tracking.</div>
        </section>
      </body>
    </html>
  `);
  w.document.close();

  setTimeout(() => {
    w.focus();
    w.print();
    w.close();
  }, 500);
}

function getFullName(person) {
  return [
    person?.first_name,
    person?.middle_name,
    person?.last_name,
    person?.suffix,
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeDriver(driver) {
  return {
    id: driver.id,
    driver_code: driver.driver_code,
    name: getFullName(driver),
    classification: driver.classification || "—",
    contact: driver.contact_number || "—",
    address: driver.address || "—",
    operatorName: driver.operator_name || "—",
    vehicles: driver.vehicles || [],
    franchises: driver.franchises || [],
    toda: driver.toda || driver.toda_name || driver.franchises?.[0]?.toda_name || "—",
    raw: driver,
  };
}

function normalizeStatus(status) {
  const s = String(status || "NEW").toUpperCase();

  if (s === "ON_PROCESS") return "On Process";
  if (s === "PAID") return "Paid";
  if (s === "SETTLED") return "Settled";
  if (s === "DONE") return "Done";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "DISPUTED") return "Disputed";

  return "New";
}

function normalizeAction(action) {
  const text = String(action || "").replaceAll("_", " ").toLowerCase();

  if (!text) return "—";

  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(value) {
  if (value == null || value === "") return "—";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

function getViolationText(apprehension) {
  const violations = apprehension?.violations || [];

  return (
    violations
      .map((item) => {
        const code = item.violation_code ? `${item.violation_code} - ` : "";
        return `${code}${item.name || item.violation_name || ""}`.trim();
      })
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function flattenTransactions(apprehensions) {
  return apprehensions.flatMap((apprehension) => {
    const transactions = apprehension.transactions || [];

    return transactions.map((transaction) => ({
      id: transaction.id,
      date:
        transaction.paid_at ||
        transaction.created_at ||
        apprehension.apprehension_date ||
        null,
      ticketNo: apprehension.ticket_number || "—",
      transactionCode: transaction.transaction_code || "—",
      action: normalizeAction(transaction.action_taken),
      violation: getViolationText(apprehension),
      amountPaid: transaction.amount_paid || 0,
      paymentMethod: transaction.payment_method || "—",
      orNumber: transaction.or_number || "—",
      status: normalizeStatus(apprehension.status),
      tfroPersonnel: transaction.created_by || "—",
      remarks: transaction.remarks || apprehension.remarks || "—",
      raw: transaction,
      apprehension,
    }));
  });
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();

  const className = ["paid", "settled", "done"].includes(s)
    ? "bg-success-subtle text-success-emphasis"
    : s === "on process"
    ? "bg-info-subtle text-info-emphasis"
    : ["cancelled", "disputed"].includes(s)
    ? "bg-danger-subtle text-danger-emphasis"
    : "bg-warning-subtle text-warning-emphasis";

  return <span className={`badge rounded-pill ${className}`}>{status}</span>;
}

function SummaryItem({ label, value }) {
  return (
    <div className="col-md-3">
      <div className="bg-light rounded-4 px-3 py-3 h-100">
        <div className="small text-muted mb-1">{label}</div>
        <div className="fw-semibold">{value || "—"}</div>
      </div>
    </div>
  );
}

export default function TransactionDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const [driver, setDriver] = useState(null);
  const [apprehensions, setApprehensions] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchPageData() {
    try {
      setLoading(true);
      setError("");

      const [driverResponse, apprehensionResponse] = await Promise.all([
        apiRequest(`/drivers/${id}`),
        apiRequest(`/apprehensions/driver/${id}`),
      ]);

      const rawDriver =
        driverResponse.data || driverResponse.driver || driverResponse.user;

      if (!rawDriver) {
        throw new Error("Driver not found");
      }

      const apprehensionList =
        apprehensionResponse.data || apprehensionResponse.apprehensions || [];

      setDriver(normalizeDriver(rawDriver));
      setApprehensions(apprehensionList);
    } catch (err) {
      setError(err.message || "Failed to load transaction details");
      setDriver(null);
      setApprehensions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPageData();
  }, [id]);

  const transactionRows = useMemo(() => {
    return flattenTransactions(apprehensions).sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });
  }, [apprehensions]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return transactionRows.filter((row) => {
      const matchesSearch = !q
        ? true
        : [
            row.date,
            row.ticketNo,
            row.transactionCode,
            row.action,
            row.violation,
            row.paymentMethod,
            row.orNumber,
            row.status,
            row.tfroPersonnel,
            row.remarks,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q);

      const matchesStatus =
        statusFilter === "All" ? true : row.status === statusFilter;

      const matchesPayment =
        paymentMethodFilter === "All"
          ? true
          : row.paymentMethod === paymentMethodFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [transactionRows, query, statusFilter, paymentMethodFilter]);

  const statusOptions = useMemo(() => {
    return ["All", ...new Set(transactionRows.map((row) => row.status).filter(Boolean))];
  }, [transactionRows]);

  const paymentMethodOptions = useMemo(() => {
    return [
      "All",
      ...new Set(transactionRows.map((row) => row.paymentMethod).filter(Boolean)),
    ];
  }, [transactionRows]);

  const totalPaid = useMemo(() => {
    return transactionRows.reduce(
      (sum, row) => sum + Number(row.amountPaid || 0),
      0
    );
  }, [transactionRows]);

  const paidApprehensionIds = useMemo(() => {
    return new Set(transactionRows.map((row) => row.apprehension?.id).filter(Boolean));
  }, [transactionRows]);

  const unpaidCount = useMemo(() => {
    return apprehensions.filter((item) => !paidApprehensionIds.has(item.id)).length;
  }, [apprehensions, paidApprehensionIds]);

  function handlePrint() {
    const el = document.getElementById("print-transactions");
    if (!el) return;
    openPrintWindow("Transaction Details", el.innerHTML);
  }

  function handlePrintIndexCard() {
    openIndexCardPrintWindow({
      driver,
      transactionRows,
      headlineSrc: tfroHeadline,
    });
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("All");
    setPaymentMethodFilter("All");
  }

  if (loading) {
    return (
      <div className="alert alert-info rounded-4 py-2">
        Loading transaction details...
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">
          <div className="fw-bold">{error || "Driver not found."}</div>

          <button
            className="btn btn-primary mt-3 rounded-4"
            onClick={() => nav(-1)}
            type="button"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 fw-bold mb-0">Transaction Details</h1>
          <div className="small text-muted">
            Payment and transaction records connected to this driver profile.
          </div>
        </div>

        <div className="d-flex gap-2 no-print">
          <button
            className="btn btn-primary rounded-4"
            onClick={handlePrintIndexCard}
            type="button"
            title="Print Index Card"
          >
            <i className="bi bi-credit-card-2-front me-1" />
            Print Index Card
          </button>

          <button
            className="btn btn-outline-primary rounded-4"
            onClick={handlePrint}
            type="button"
            title="Print Transaction Details"
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

      <div className="card rounded-4 shadow-sm border-0 mb-3">
        <div className="card-body">
          <div className="row g-3">
            <SummaryItem label="Driver ID" value={driver.driver_code} />
            <SummaryItem label="Driver Name" value={driver.name} />
            <SummaryItem label="Classification" value={driver.classification} />
            <SummaryItem label="Contact" value={driver.contact} />
            <SummaryItem label="Total Apprehensions" value={String(apprehensions.length)} />
            <SummaryItem label="Transaction Count" value={String(transactionRows.length)} />
            <SummaryItem label="Total Paid" value={formatMoney(totalPaid)} />
            <SummaryItem label="Without Payment Record" value={String(unpaidCount)} />
          </div>
        </div>
      </div>

      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-end gap-2 mb-3 no-print">
            <div className="input-group" style={{ width: 300 }}>
              <input
                className="form-control rounded-start-4"
                placeholder="Search transactions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="input-group-text rounded-end-4 bg-white">
                <i className="bi bi-search text-muted" />
              </span>
            </div>

            <div>
              <span className="text-muted small d-block mb-1">Status</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 150 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-muted small d-block mb-1">Payment Method</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 170 }}
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                {paymentMethodOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {(query || statusFilter !== "All" || paymentMethodFilter !== "All") && (
              <button
                className="btn btn-sm btn-light rounded-3"
                type="button"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>

          <div id="print-transactions">
            <div className="summary-grid d-none d-print-grid">
              <div className="summary-item">
                <div className="summary-label">Driver ID</div>
                <div className="summary-value">{driver.driver_code}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Driver Name</div>
                <div className="summary-value">{driver.name}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Classification</div>
                <div className="summary-value">{driver.classification}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Total Paid</div>
                <div className="summary-value">{formatMoney(totalPaid)}</div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="tfro-table">
                <thead>
                  <tr className="text-white" style={{ background: "#000000" }}>
                    <th className="text-white">Date</th>
                    <th className="text-white">Ticket No.</th>
                    <th className="text-white">Transaction Code</th>
                    <th className="text-white">Action</th>
                    <th className="text-white">Violation / Case</th>
                    <th className="text-white">Amount Paid</th>
                    <th className="text-white">Payment Method</th>
                    <th className="text-white">OR Number</th>
                    <th className="text-white">Status</th>
                    <th className="text-white">TFRO Personnel</th>
                    <th className="text-white">Remarks</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center text-muted py-4">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={`${row.id}-${row.ticketNo}`}>
                        <td>{formatDate(row.date)}</td>
                        <td>{row.ticketNo}</td>
                        <td>{row.transactionCode}</td>
                        <td>{row.action}</td>
                        <td>{row.violation}</td>
                        <td className="text-danger fw-semibold">
                          {formatMoney(row.amountPaid)}
                        </td>
                        <td>{row.paymentMethod}</td>
                        <td>{row.orNumber}</td>
                        <td>
                          <StatusBadge status={row.status} />
                        </td>
                        <td>{row.tfroPersonnel}</td>
                        <td>{row.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
