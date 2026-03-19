import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { driversMock } from "../data/driversMock";

function openPrintWindow(title, htmlBody) {
  const w = window.open("", "_blank", "width=900,height=650");
  if (!w) return;

  w.document.open();
  w.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          .card { border: 1px solid #e9e9ef; border-radius: 16px; padding: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { text-align: left; font-size: 12px; color:#fff; background: #5b63ff; padding: 10px 12px; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
          .muted { color:#666; font-size:12px; margin-top:8px; }
        </style>
      </head>
      <body>
        ${htmlBody}
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

export default function TransactionDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const driver = useMemo(() => driversMock.find((d) => String(d.id) === String(id)), [id]);
  const rows = driver?.transactions || [];

  function handlePrint() {
    const el = document.getElementById("print-transactions");
    if (!el) return;
    openPrintWindow("Transaction Details", el.innerHTML);
  }

  if (!driver) {
    return (
      <div className="card rounded-4 shadow-sm">
        <div className="card-body">Driver not found.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-bold mb-0">Transaction Details</h1>

        <div className="d-flex gap-2 no-print">
          <button className="btn btn-outline-primary rounded-4" onClick={handlePrint} type="button">
            <i className="bi bi-printer" />
          </button>
          <button className="btn btn-outline-primary rounded-4" onClick={() => nav(-1)} type="button">
            <i className="bi bi-arrow-left"/>
          </button>
        </div>
      </div>

      <div className="card rounded-4 shadow-sm">
        <div className="card-body" id="print-transactions">
          <div className="mb-2">
            <div className="fw-semibold">{driver.name}</div>
            <div className="text-muted small">
              Franchise: <b>{driver.franchiseNo || "—"}</b> • Contact: <b>{driver.contact || "—"}</b> • Address:{" "}
              <b>{driver.address || "—"}</b>
            </div>
          </div>

          <div className="table-responsive mt-3">
            <table className="tfro-table">
              <thead>
                <tr className="text-white" style={{ background: "#5b63ff" }}>
                  <th className="text-white">DATE</th>
                  <th className="text-white">TRANSACTION</th>
                  <th className="text-white">TFRO PERSONNEL</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-muted">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  rows.map((t, idx) => (
                    <tr key={idx}>
                      <td>{t.date || "—"}</td>
                      <td>{t.transaction || "—"}</td>
                      <td>{t.tfroPersonnel || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted small mt-2">
            Printed from TFRO TIRS • {new Date().toLocaleString()}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center p-4 no-print">
          <button className="btn btn-primary rounded-4 px-4" type="button" onClick={() => alert("Next step: Add transaction row")}>
            + Add New
          </button>

          <div className="d-flex gap-3">
            <button className="btn btn-primary rounded-4 px-5" type="button" onClick={() => alert("Next step: enable edit mode")}>
              Edit
            </button>
            <button className="btn btn-primary rounded-4 px-5" type="button" onClick={() => alert("Next step: save changes")}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}