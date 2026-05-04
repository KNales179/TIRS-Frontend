import React, { useMemo, useState } from "react";
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
        body {
          font-family: Arial, sans-serif;
          padding: 28px;
          color: #111;
          text-align: center;
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

        .card {
          border: 2px solid #1d4ed8;
          border-radius: 6px;
          padding: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          border: 1px solid #111;
        }

        th {
          text-align: center;
          font-size: 12px;
          color: #000000;
          background: #1d4ed8;
          padding: 10px 12px;
          border: 1px solid #111;
          font-weight: bold;
          text-transform: uppercase;
        }

        td {
          padding: 10px 12px;
          font-size: 13px;
          border: 1px solid #111;
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
          <div class="office">TRICYLE FRANCHISING REGULATORY OFFICE LUCENA CITY</div>
          <div class="title">Transaction Details Record</div>
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
  w.focus();
  w.print();
  w.close();
}

export default function TransactionDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const driver = useMemo(
    () => driversMock.find((d) => String(d.id) === String(id)),
    [id]
  );

  const [rows, setRows] = useState(() => driver?.transactions || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: "",
    transaction: "",
    tfroPersonnel: "",
  });

  function handlePrint() {
    const el = document.getElementById("print-transactions");
    if (!el) return;
    openPrintWindow("Transaction Details", el.innerHTML);
  }

  function handleChange(key, value) {
    setNewTransaction((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleAddTransaction(e) {
    e.preventDefault();

    if (
      !newTransaction.date ||
      !newTransaction.transaction ||
      !newTransaction.tfroPersonnel
    ) {
      alert("Please complete all fields.");
      return;
    }

    setRows((prev) => [...prev, newTransaction]);

    setNewTransaction({
      date: "",
      transaction: "",
      tfroPersonnel: "",
    });

    setShowAddModal(false);
  }

  function handleCloseModal() {
    setShowAddModal(false);
    setNewTransaction({
      date: "",
      transaction: "",
      tfroPersonnel: "",
    });
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
          <button
            className="btn btn-outline-primary rounded-4"
            onClick={handlePrint}
            type="button"
            title="Print"
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

      <div className="card rounded-4 shadow-sm">
        <div className="card-body" id="print-transactions">
          <div className="table-responsive">
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
        </div>

        <div className="d-flex justify-content-between align-items-center p-4 no-print">
          <button
            className="btn btn-primary rounded-4 px-4"
            type="button"
            onClick={() => setShowAddModal(true)}
          >
            + Add New
          </button>

          <div className="d-flex gap-3">
            <button
              className="btn btn-primary rounded-4 px-5"
              type="button"
              onClick={() => alert("Next step: enable edit mode")}
            >
              Edit
            </button>

            <button
              className="btn btn-primary rounded-4 px-5"
              type="button"
              onClick={() => alert("Next step: save changes")}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow">
                <form onSubmit={handleAddTransaction}>
                  <div className="modal-header border-0 pb-0">
                    <h5 className="modal-title fw-bold">Add New Transaction</h5>

                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseModal}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small text-muted">Date</label>
                      <input
                        type="date"
                        className="form-control rounded-4"
                        value={newTransaction.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small text-muted">
                        Transaction
                      </label>
                      <input
                        className="form-control rounded-4"
                        placeholder="Example: Paid penalty"
                        value={newTransaction.transaction}
                        onChange={(e) =>
                          handleChange("transaction", e.target.value)
                        }
                      />
                    </div>

                    <div className="mb-1">
                      <label className="form-label small text-muted">
                        TFRO Personnel
                      </label>
                      <input
                        className="form-control rounded-4"
                        placeholder="Officer name"
                        value={newTransaction.tfroPersonnel}
                        onChange={(e) =>
                          handleChange("tfroPersonnel", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="modal-footer border-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-4 px-4"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>

                    <button type="submit" className="btn btn-primary rounded-4 px-4">
                      Add Transaction
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}