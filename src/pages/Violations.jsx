import { useMemo, useState } from "react";
import { violations as seed } from "../data/violationsMock";
import { violationsMaster } from "../data/violationsMaster";
import ViolationFormModal from "../components/violations/ViolationFormModal";
import ViolationViewModal from "../components/violations/ViolationViewModal";

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

function formatDateInput(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 8);

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

function openPrintWindow(title, htmlBody) {
  const w = window.open("", "_blank", "width=900,height=700");
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
            padding: 24px;
            color: #111;
          }
          h1, h2, h3, p {
            margin: 0;
          }
          .header {
            margin-bottom: 20px;
            border-bottom: 2px solid #111;
            padding-bottom: 12px;
          }
          .muted {
            color: #666;
            font-size: 12px;
          }
          .card {
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 18px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px 24px;
          }
          .item {
            margin-bottom: 10px;
          }
          .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
          }
          .value {
            font-size: 14px;
            font-weight: 600;
          }
          .full {
            grid-column: 1 / -1;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${htmlBody}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);
  w.document.close();
}

function getEmptyViolationForm() {
  return {
    ticketNo: "",
    violationCode: "",
    violation: "",
    violationGroup: "",
    offenseLevel: "",
    violationDate: "",
    driverName: "",
    classification: "Colorum",
    totalAmount: "",
    discountType: "None",
    discountValue: "",
    payableAmount: "",
    discountReason: "",
    discountApprovedBy: "",
    datePaid: "",
    orNumber: "",
    enforcers: [""],
    commissionRate: 0.2,
    status: "New",
  };
}

export default function Violations() {
  const [mode, setMode] = useState("Task");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [violationCodeFilter, setViolationCodeFilter] = useState("All");
  const [violationFilter, setViolationFilter] = useState("All");
  const [violationDateFilter, setViolationDateFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("All");
  const [data, setData] = useState(seed);

  const [cols, setCols] = useState({
    ticketNo: true,
    violationCode: true,
    violation: true,
    violationDate: true,
    driverName: true,
    classification: true,
    totalAmount: true,
    payableAmount: true,
    datePaid: true,
    orNumber: true,
    enforcers: true,
    commission: true,
    status: true,
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);
  const [formData, setFormData] = useState(getEmptyViolationForm());

  const [viewRow, setViewRow] = useState(null);

  const violationCodeOptions = useMemo(() => {
    const masterCodes = violationsMaster.map((item) => item.code);
    const existingCodes = data.map((item) => item.violationCode).filter(Boolean);

    return ["All", ...new Set([...masterCodes, ...existingCodes])];
  }, [data]);

  const violationOptions = useMemo(() => {
    const masterNames = violationsMaster.map((item) => item.name);
    const existingNames = data.map((item) => item.violation).filter(Boolean);

    return ["All", ...new Set([...masterNames, ...existingNames])];
  }, [data]);

  const classificationOptions = useMemo(() => {
    return ["All", ...new Set(data.map((v) => v.classification).filter(Boolean))];
  }, [data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = !q
      ? data
      : data.filter((v) =>
          [
            v.ticketNo,
            v.violationCode,
            v.violation,
            v.violationGroup,
            v.driverName,
            v.classification,
            v.orNumber,
            v.enforcers,
            v.discountReason,
            v.discountApprovedBy,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );

    if (statusFilter !== "All") {
      list = list.filter((v) => deriveStatus(v) === statusFilter);
    }

    if (violationCodeFilter !== "All") {
      list = list.filter((v) => v.violationCode === violationCodeFilter);
    }

    if (violationFilter !== "All") {
      list = list.filter((v) => v.violation === violationFilter);
    }

    if (classificationFilter !== "All") {
      list = list.filter((v) => v.classification === classificationFilter);
    }

    if (violationDateFilter.trim()) {
      list = list.filter((v) => v.violationDate === violationDateFilter.trim());
    }

    return list;
  }, [
    data,
    query,
    statusFilter,
    violationCodeFilter,
    violationFilter,
    violationDateFilter,
    classificationFilter,
  ]);

  const grouped = useMemo(() => {
    const g = { New: [], "On Process": [], Done: [] };
    data.forEach((v) => {
      const s = deriveStatus(v);
      if (g[s]) g[s].push(v);
    });
    return g;
  }, [data]);

  const headerButtonClass = (active) =>
    `btn ${active ? "btn-primary" : "btn-outline-primary"} rounded-3 px-3`;

  function jumpToStatus(status) {
    setMode("Show All");
    setStatusFilter(status);
  }

  function handleAddViolation() {
    setFormMode("add");
    setSelectedRow(null);
    setFormData(getEmptyViolationForm());
    setShowFormModal(true);
  }

  function handleEdit(v) {
    setFormMode("edit");
    setSelectedRow(v);
    setFormData({
      ...getEmptyViolationForm(),
      ...v,
      totalAmount: v.totalAmount || "",
      discountType: v.discountType || "None",
      discountValue: v.discountValue || "",
      payableAmount:
        v.payableAmount ??
        computePayableAmount(v.totalAmount, v.discountType, v.discountValue),
      discountReason: v.discountReason || "",
      discountApprovedBy: v.discountApprovedBy || "",
      commissionRate: v.commissionRate || 0.2,
      datePaid: v.datePaid || "",
      orNumber: v.orNumber || "",
      enforcers: v.enforcers
        ? String(v.enforcers)
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean)
        : [""],
    });
    setShowFormModal(true);
  }

  function handleCloseFormModal() {
    setShowFormModal(false);
    setSelectedRow(null);
    setFormData(getEmptyViolationForm());
  }

  function handleSaveForm() {
    if (
      !formData.ticketNo.trim() ||
      !formData.violationCode.trim() ||
      !formData.violation.trim() ||
      !formData.violationDate.trim() ||
      !formData.driverName.trim()
    ) {
      alert(
        "Please fill in Ticket No., Violation, Violation Date, and Driver’s Name."
      );
      return;
    }

    if (!formData.enforcers[0]?.trim()) {
      alert("Please enter at least one enforcer.");
      return;
    }

    if (
      formData.discountType !== "None" &&
      (!formData.discountReason || !formData.discountApprovedBy)
    ) {
      alert("Please fill in Discount Reason and Approved By.");
      return;
    }

    const baseAmount = Number(formData.totalAmount || 0);
    const payableAmount = computePayableAmount(
      baseAmount,
      formData.discountType,
      formData.discountValue
    );

    const payload = {
      ...formData,
      enforcers: formData.enforcers
        .map((name) => name.trim())
        .filter(Boolean)
        .join(", "),
      totalAmount: baseAmount,
      discountValue: Number(formData.discountValue || 0),
      payableAmount,
      commissionRate: Number(formData.commissionRate || 0),
      offenseLevel: Number(formData.offenseLevel || 0),
      datePaid: formData.datePaid || null,
      orNumber: formData.orNumber || null,
      status: formData.status || "New",
    };

    if (formMode === "add") {
      const alreadyExists = data.some(
        (item) => String(item.ticketNo) === String(payload.ticketNo)
      );

      if (alreadyExists) {
        alert("Ticket number already exists.");
        return;
      }

      setData((prev) => [payload, ...prev]);
    } else {
      setData((prev) =>
        prev.map((item) =>
          item.ticketNo === selectedRow.ticketNo ? payload : item
        )
      );

      if (viewRow && viewRow.ticketNo === selectedRow.ticketNo) {
        setViewRow(payload);
      }
    }

    handleCloseFormModal();
  }

  function handleView(v) {
    setViewRow(v);
  }

  function handleCloseView() {
    setViewRow(null);
  }

  function handlePrint(v) {
    const commission = (v.payableAmount || v.totalAmount || 0) * (v.commissionRate || 0);
    const status = deriveStatus(v);

    openPrintWindow(
      `Violation ${v.ticketNo}`,
      `
        <div class="header">
          <h1>Violation Details</h1>
          <p class="muted">Ticket No: ${v.ticketNo}</p>
        </div>

        <div class="card">
          <div class="grid">
            <div class="item">
              <div class="label">Ticket No.</div>
              <div class="value">${v.ticketNo || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Violation Code</div>
              <div class="value">${v.violationCode || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Violation</div>
              <div class="value">${v.violation || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Violation Date</div>
              <div class="value">${v.violationDate || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Driver’s Name</div>
              <div class="value">${v.driverName || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Classification</div>
              <div class="value">${v.classification || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Official Penalty</div>
              <div class="value">${money(v.totalAmount)}</div>
            </div>

            <div class="item">
              <div class="label">Payable Amount</div>
              <div class="value">${money(v.payableAmount ?? v.totalAmount)}</div>
            </div>

            <div class="item">
              <div class="label">Discount Type</div>
              <div class="value">${v.discountType || "None"}</div>
            </div>

            <div class="item">
              <div class="label">Discount Value</div>
              <div class="value">${
                v.discountType === "Percent"
                  ? `${Number(v.discountValue || 0)}%`
                  : money(v.discountValue || 0)
              }</div>
            </div>

            <div class="item">
              <div class="label">Discount Reason</div>
              <div class="value">${v.discountReason || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Approved By</div>
              <div class="value">${v.discountApprovedBy || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Date Paid</div>
              <div class="value">${v.datePaid || "unavailable"}</div>
            </div>

            <div class="item">
              <div class="label">OR Number</div>
              <div class="value">${v.orNumber || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Enforcer(s)</div>
              <div class="value">${v.enforcers || "—"}</div>
            </div>

            <div class="item">
              <div class="label">Enforcer’s Commission</div>
              <div class="value">${money(commission)}</div>
            </div>

            <div class="item full">
              <div class="label">Status</div>
              <div class="value">${status}</div>
            </div>
          </div>
        </div>
      `
    );
  }

  function handleDelete(v) {
    const ok = window.confirm(
      `Delete violation record ${v.ticketNo}? This cannot be undone.`
    );
    if (!ok) return;

    setData((prev) => prev.filter((item) => item.ticketNo !== v.ticketNo));

    if (viewRow?.ticketNo === v.ticketNo) {
      setViewRow(null);
    }
  }

  function clearAllFilters() {
    setStatusFilter("All");
    setViolationCodeFilter("All");
    setViolationFilter("All");
    setViolationDateFilter("");
    setClassificationFilter("All");
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="h4 fw-bold mb-0">Violations</h1>

        <div className="d-flex align-items-center gap-2">
          <div className="input-group" style={{ width: 280 }}>
            <input
              className="form-control rounded-start-4"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="input-group-text rounded-end-4 bg-white">
              <i className="bi bi-search text-muted"></i>
            </span>
          </div>

          <button
            className="btn btn-primary rounded-4 px-4"
            onClick={handleAddViolation}
            type="button"
          >
            + Add Violators
          </button>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3">
        <button
          className={headerButtonClass(mode === "Task")}
          onClick={() => {
            setMode("Task");
            clearAllFilters();
          }}
          type="button"
        >
          Task
        </button>

        <button
          className={headerButtonClass(mode === "Show All")}
          onClick={() => setMode("Show All")}
          type="button"
        >
          Show All
        </button>
      </div>

      {mode === "Task" ? (
        <div className="d-grid gap-4">
          <TaskSection
            title="New"
            count={grouped["New"].length}
            rows={grouped["New"]}
            onSeeMore={() => jumpToStatus("New")}
            onView={handleView}
            onPrint={handlePrint}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <TaskSection
            title="On Process"
            count={grouped["On Process"].length}
            rows={grouped["On Process"]}
            onSeeMore={() => jumpToStatus("On Process")}
            onView={handleView}
            onPrint={handlePrint}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <TaskSection
            title="Done"
            count={grouped["Done"].length}
            rows={grouped["Done"]}
            onSeeMore={() => jumpToStatus("Done")}
            onView={handleView}
            onPrint={handlePrint}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      ) : (
        <div className="row g-3 mx-0">
          <div className="col-12">
            <div className="card rounded-4 shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <div className="d-flex flex-wrap align-items-end gap-2">
                    <div>
                      <span className="text-muted small d-block mb-1">Status</span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 150 }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="New">New</option>
                        <option value="On Process">On Process</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-muted small d-block mb-1">Code</span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 130 }}
                        value={violationCodeFilter}
                        onChange={(e) => setViolationCodeFilter(e.target.value)}
                      >
                        {violationCodeOptions.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-muted small d-block mb-1">Violation</span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 240 }}
                        value={violationFilter}
                        onChange={(e) => setViolationFilter(e.target.value)}
                      >
                        {violationOptions.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-muted small d-block mb-1">
                        Violation Date
                      </span>
                      <input
                        className="form-control form-control-sm"
                        style={{ width: 150 }}
                        placeholder="MM/DD/YYYY"
                        value={violationDateFilter}
                        onChange={(e) =>
                          setViolationDateFilter(formatDateInput(e.target.value))
                        }
                      />
                    </div>

                    <div>
                      <span className="text-muted small d-block mb-1">
                        Classification
                      </span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 160 }}
                        value={classificationFilter}
                        onChange={(e) => setClassificationFilter(e.target.value)}
                      >
                        {classificationOptions.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(statusFilter !== "All" ||
                      violationCodeFilter !== "All" ||
                      violationFilter !== "All" ||
                      classificationFilter !== "All" ||
                      violationDateFilter) && (
                      <button
                        className="btn btn-sm btn-light"
                        type="button"
                        onClick={clearAllFilters}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="dropdown">
                    <button
                      className="btn btn-light btn-sm rounded-3 d-flex align-items-center gap-1"
                      data-bs-toggle="dropdown"
                      type="button"
                    >
                      <i className="bi bi-sliders"></i>
                      Columns
                    </button>

                    <div className="dropdown-menu p-3" style={{ minWidth: 250 }}>
                      <FilterCheck
                        label="Ticket Number"
                        checked={cols.ticketNo}
                        onChange={(v) => setCols((c) => ({ ...c, ticketNo: v }))}
                      />
                      <FilterCheck
                        label="Violation Code"
                        checked={cols.violationCode}
                        onChange={(v) =>
                          setCols((c) => ({ ...c, violationCode: v }))
                        }
                      />
                      <FilterCheck
                        label="Violation"
                        checked={cols.violation}
                        onChange={(v) => setCols((c) => ({ ...c, violation: v }))}
                      />
                      <FilterCheck
                        label="Violation Date"
                        checked={cols.violationDate}
                        onChange={(v) =>
                          setCols((c) => ({ ...c, violationDate: v }))
                        }
                      />
                      <FilterCheck
                        label="Driver’s Name"
                        checked={cols.driverName}
                        onChange={(v) => setCols((c) => ({ ...c, driverName: v }))}
                      />
                      <FilterCheck
                        label="Classification"
                        checked={cols.classification}
                        onChange={(v) =>
                          setCols((c) => ({ ...c, classification: v }))
                        }
                      />
                      <FilterCheck
                        label="Official Penalty"
                        checked={cols.totalAmount}
                        onChange={(v) => setCols((c) => ({ ...c, totalAmount: v }))}
                      />
                      <FilterCheck
                        label="Payable Amount"
                        checked={cols.payableAmount}
                        onChange={(v) =>
                          setCols((c) => ({ ...c, payableAmount: v }))
                        }
                      />
                      <FilterCheck
                        label="Date Paid"
                        checked={cols.datePaid}
                        onChange={(v) => setCols((c) => ({ ...c, datePaid: v }))}
                      />
                      <FilterCheck
                        label="OR Number"
                        checked={cols.orNumber}
                        onChange={(v) => setCols((c) => ({ ...c, orNumber: v }))}
                      />
                      <FilterCheck
                        label="Enforcer(s)"
                        checked={cols.enforcers}
                        onChange={(v) => setCols((c) => ({ ...c, enforcers: v }))}
                      />
                      <FilterCheck
                        label="Commission"
                        checked={cols.commission}
                        onChange={(v) => setCols((c) => ({ ...c, commission: v }))}
                      />
                      <FilterCheck
                        label="Status"
                        checked={cols.status}
                        onChange={(v) => setCols((c) => ({ ...c, status: v }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="tfro-table">
                    <thead>
                      <tr className="text-muted small">
                        {cols.ticketNo && <th>Ticket No.</th>}
                        {cols.violationCode && <th>Code</th>}
                        {cols.violation && <th>Violation</th>}
                        {cols.violationDate && <th>Violation Date</th>}
                        {cols.driverName && <th>Driver’s Name</th>}
                        {cols.classification && <th>Classification</th>}
                        {cols.totalAmount && <th>Official Penalty</th>}
                        {cols.payableAmount && <th>Payable Amount</th>}
                        {cols.datePaid && <th>Date Paid</th>}
                        {cols.orNumber && <th>OR number</th>}
                        {cols.enforcers && <th>Enforcer(s)</th>}
                        {cols.commission && <th>Enforcer’s Commission</th>}
                        {cols.status && <th>Status</th>}
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((v) => {
                        const commission =
                          (v.payableAmount ?? v.totalAmount ?? 0) *
                          (v.commissionRate || 0);
                        const status = deriveStatus(v);

                        return (
                          <tr key={v.ticketNo}>
                            {cols.ticketNo && <td>{v.ticketNo}</td>}
                            {cols.violationCode && <td>{v.violationCode || "—"}</td>}
                            {cols.violation && <td>{v.violation}</td>}
                            {cols.violationDate && <td>{v.violationDate}</td>}
                            {cols.driverName && <td>{v.driverName}</td>}
                            {cols.classification && <td>{v.classification}</td>}
                            {cols.totalAmount && (
                              <td className="text-danger fw-semibold">
                                {money(v.totalAmount || 0)}
                              </td>
                            )}
                            {cols.payableAmount && (
                              <td className="text-success fw-semibold">
                                {money(v.payableAmount ?? v.totalAmount ?? 0)}
                              </td>
                            )}
                            {cols.datePaid && (
                              <td className="text-danger">
                                {v.datePaid || "unavailable"}
                              </td>
                            )}
                            {cols.orNumber && (
                              <td className="text-danger">{v.orNumber || "—"}</td>
                            )}
                            {cols.enforcers && <td>{v.enforcers}</td>}
                            {cols.commission && <td>{money(commission)}</td>}
                            {cols.status && (
                              <td>
                                <StatusBadge status={status} />
                              </td>
                            )}

                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-light rounded-circle me-1"
                                onClick={() => handleView(v)}
                                title="View"
                                type="button"
                              >
                                <i className="bi bi-eye" />
                              </button>
                              <button
                                className="btn btn-sm btn-light rounded-circle me-1"
                                onClick={() => handlePrint(v)}
                                title="Print"
                                type="button"
                              >
                                <i className="bi bi-printer" />
                              </button>
                              <button
                                className="btn btn-sm btn-light rounded-circle me-1"
                                onClick={() => handleEdit(v)}
                                title="Edit"
                                type="button"
                              >
                                <i className="bi bi-pencil-square" />
                              </button>
                              <button
                                className="btn btn-sm btn-light rounded-circle"
                                onClick={() => handleDelete(v)}
                                title="Delete"
                                type="button"
                              >
                                <i className="bi bi-trash" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={20} className="text-center text-muted py-5">
                            No results.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ViolationFormModal
        show={showFormModal}
        mode={formMode}
        formData={formData}
        setFormData={setFormData}
        onClose={handleCloseFormModal}
        onSave={handleSaveForm}
      />

      <ViolationViewModal
        show={!!viewRow}
        row={viewRow}
        onClose={handleCloseView}
        onPrint={handlePrint}
      />
    </div>
  );
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

function FilterCheck({ label, checked, onChange }) {
  const safeId = label.replace(/\s+/g, "-").replace(/[^\w-]/g, "");

  return (
    <div className="form-check mb-2">
      <input
        className="form-check-input"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        id={safeId}
      />
      <label className="form-check-label" htmlFor={safeId}>
        {label}
      </label>
    </div>
  );
}

function TaskSection({
  title,
  count,
  rows,
  onSeeMore,
  onView,
  onPrint,
  onEdit,
  onDelete,
}) {
  return (
    <div className="card rounded-4 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold">{title}</div>
            <span className="badge bg-danger-subtle text-danger-emphasis">
              {count}
            </span>
          </div>

          <a
            href="#!"
            onClick={(e) => {
              e.preventDefault();
              onSeeMore?.();
            }}
          >
            See More
          </a>
        </div>

        <div className="table-responsive">
          <table className="tfro-table">
            <thead>
              <tr>
                <th>Ticket No.</th>
                <th>Code</th>
                <th>Violation</th>
                <th>Violation Date</th>
                <th>Driver’s Name</th>
                <th>Classification</th>
                <th>Official Penalty</th>
                <th>Payable Amount</th>
                <th>Date Paid</th>
                <th>OR number</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.slice(0, 5).map((v) => (
                <tr key={v.ticketNo}>
                  <td>{v.ticketNo}</td>
                  <td>{v.violationCode || "—"}</td>
                  <td>{v.violation}</td>
                  <td>{v.violationDate}</td>
                  <td>{v.driverName}</td>
                  <td>{v.classification}</td>
                  <td className="text-danger fw-semibold">
                    {money(v.totalAmount || 0)}
                  </td>
                  <td className="text-success fw-semibold">
                    {money(v.payableAmount ?? v.totalAmount ?? 0)}
                  </td>
                  <td className="text-danger">{v.datePaid || "unavailable"}</td>
                  <td className="text-danger">{v.orNumber || "—"}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-light rounded-circle me-1"
                      onClick={() => onView?.(v)}
                      type="button"
                    >
                      <i className="bi bi-eye" />
                    </button>
                    <button
                      className="btn btn-sm btn-light rounded-circle me-1"
                      onClick={() => onPrint?.(v)}
                      type="button"
                    >
                      <i className="bi bi-printer" />
                    </button>
                    <button
                      className="btn btn-sm btn-light rounded-circle me-1"
                      onClick={() => onEdit?.(v)}
                      type="button"
                    >
                      <i className="bi bi-pencil-square" />
                    </button>
                    <button
                      className="btn btn-sm btn-light rounded-circle"
                      onClick={() => onDelete?.(v)}
                      type="button"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-muted py-4">
                    No records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}