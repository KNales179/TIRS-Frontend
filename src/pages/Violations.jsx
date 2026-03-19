import { useMemo, useState } from "react";
import { violations as seed } from "../data/violationsMock";

function money(n) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n);
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

function deriveStatus(v) {
  if (v.status === "New" || v.status === "On Process" || v.status === "Done") return v.status;
  if (!v.datePaid) return "New";
  return "On Process";
}

export default function Violations() {
  const [mode, setMode] = useState("Task");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [cols, setCols] = useState({
    ticketNo: true,
    violation: true,
    violationDate: true,
    driverName: true,
    classification: true,
    totalAmount: true,
    datePaid: true,
    orNumber: true,
    enforcers: true,
    commission: true,
    status: true,
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = !q
      ? seed
      : seed.filter((v) =>
          [
            v.ticketNo,
            v.violation,
            v.driverName,
            v.classification,
            v.orNumber,
            v.enforcers,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );

    if (statusFilter !== "All") {
      list = list.filter((v) => deriveStatus(v) === statusFilter);
    }

    return list;
  }, [query, statusFilter]);

  const grouped = useMemo(() => {
    const g = { New: [], "On Process": [], Done: [] };
    seed.forEach((v) => {
      const s = deriveStatus(v);
      if (g[s]) g[s].push(v);
    });
    return g;
  }, []);

  const headerButtonClass = (active) =>
    `btn ${active ? "btn-primary" : "btn-outline-primary"} rounded-3 px-3`;

  function jumpToStatus(status) {
    setMode("Show All");
    setStatusFilter(status);
  }

  return (
    <div className="container-fluid">
      {/* Header */}
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

          <button className="btn btn-primary rounded-4 px-4">
            + Add Violation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={headerButtonClass(mode === "Task")}
          onClick={() => {
            setMode("Task");
            setStatusFilter("All");
          }}
        >
          Task
        </button>

        <button
          className={headerButtonClass(mode === "Show All")}
          onClick={() => setMode("Show All")}
        >
          Show All
        </button>
      </div>

      {mode === "Task" ? (
        <div className="d-grid gap-4">
          <TaskSection title="New" count={grouped["New"].length} rows={grouped["New"]} onSeeMore={() => jumpToStatus("New")} />
          <TaskSection title="On Process" count={grouped["On Process"].length} rows={grouped["On Process"]} onSeeMore={() => jumpToStatus("On Process")} />
          <TaskSection title="Done" count={grouped["Done"].length} rows={grouped["Done"]} onSeeMore={() => jumpToStatus("Done")} />
        </div>
      ) : (
        <div className="row g-3 mx-0">
          <div className="col-12">
            <div className="card rounded-4 shadow-sm border-0">
              <div className="card-body">
                {/* Top Filter Bar */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">Status:</span>

                    <select
                      className="form-select form-select-sm"
                      style={{ width: 170 }}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="New">New</option>
                      <option value="On Process">On Process</option>
                      <option value="Done">Done</option>
                    </select>

                    {statusFilter !== "All" && (
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => setStatusFilter("All")}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Column Filter Dropdown */}
                  <div className="dropdown">
                  <button className="btn btn-light btn-sm rounded-3 d-flex align-items-center gap-1" data-bs-toggle="dropdown">
                    <i className="bi bi-sliders"></i>
                    Columns
                  </button>

                    <div className="dropdown-menu p-3" style={{ minWidth: 250 }}>
                      <FilterCheck label="Ticket Number" checked={cols.ticketNo} onChange={(v)=>setCols(c=>({...c, ticketNo:v}))}/>
                      <FilterCheck label="Violation" checked={cols.violation} onChange={(v)=>setCols(c=>({...c, violation:v}))}/>
                      <FilterCheck label="Violation Date" checked={cols.violationDate} onChange={(v)=>setCols(c=>({...c, violationDate:v}))}/>
                      <FilterCheck label="Driver’s Name" checked={cols.driverName} onChange={(v)=>setCols(c=>({...c, driverName:v}))}/>
                      <FilterCheck label="Classification" checked={cols.classification} onChange={(v)=>setCols(c=>({...c, classification:v}))}/>
                      <FilterCheck label="Total Amount" checked={cols.totalAmount} onChange={(v)=>setCols(c=>({...c, totalAmount:v}))}/>
                      <FilterCheck label="Date Paid" checked={cols.datePaid} onChange={(v)=>setCols(c=>({...c, datePaid:v}))}/>
                      <FilterCheck label="OR Number" checked={cols.orNumber} onChange={(v)=>setCols(c=>({...c, orNumber:v}))}/>
                      <FilterCheck label="Enforcer(s)" checked={cols.enforcers} onChange={(v)=>setCols(c=>({...c, enforcers:v}))}/>
                      <FilterCheck label="Commission" checked={cols.commission} onChange={(v)=>setCols(c=>({...c, commission:v}))}/>
                      <FilterCheck label="Status" checked={cols.status} onChange={(v)=>setCols(c=>({...c, status:v}))}/>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                  <table className="tfro-table">
                    <thead>
                      <tr className="text-muted small">
                        {cols.ticketNo && <th>Ticket No.</th>}
                        {cols.violation && <th>Violation</th>}
                        {cols.violationDate && <th>Violation Date</th>}
                        {cols.driverName && <th>Driver’s Name</th>}
                        {cols.classification && <th>Classification</th>}
                        {cols.totalAmount && <th>Total Amount</th>}
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
                        const commission = (v.totalAmount || 0) * (v.commissionRate || 0);
                        const status = deriveStatus(v);

                        return (
                          <tr key={v.ticketNo}>
                            {cols.ticketNo && <td>{v.ticketNo}</td>}
                            {cols.violation && <td>{v.violation}</td>}
                            {cols.violationDate && <td>{v.violationDate}</td>}
                            {cols.driverName && <td>{v.driverName}</td>}
                            {cols.classification && <td>{v.classification}</td>}
                            {cols.totalAmount && <td className="text-danger fw-semibold">{money(v.totalAmount || 0)}</td>}
                            {cols.datePaid && <td className="text-danger">{v.datePaid || "unavailable"}</td>}
                            {cols.orNumber && <td className="text-danger">{v.orNumber || "—"}</td>}
                            {cols.enforcers && <td>{v.enforcers}</td>}
                            {cols.commission && <td>{money(commission)}</td>}
                            {cols.status && <td><StatusBadge status={status} /></td>}

                            <td className="text-end">
                              <button className="btn btn-sm btn-light rounded-circle me-1"><i className="bi bi-eye" /></button>
                              <button className="btn btn-sm btn-light rounded-circle me-1"><i className="bi bi-printer" /></button>
                              <button className="btn btn-sm btn-light rounded-circle me-1"><i className="bi bi-pencil-square" /></button>
                              <button className="btn btn-sm btn-light rounded-circle"><i className="bi bi-trash" /></button>
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
    </div>
  );
}

function FilterCheck({ label, checked, onChange }) {
  return (
    <div className="form-check mb-2">
      <input
        className="form-check-input"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        id={label}
      />
      <label className="form-check-label" htmlFor={label}>
        {label}
      </label>
    </div>
  );
}

function TaskSection({ title, count, rows, onSeeMore }) {
  return (
    <div className="card rounded-4 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold">{title}</div>
            <span className="badge bg-danger-subtle text-danger-emphasis">{count}</span>
          </div>

          <a href="#!" onClick={(e) => { e.preventDefault(); onSeeMore?.(); }}>
            See More
          </a>
        </div>

        <div className="table-responsive">
          <table className="tfro-table">
            <thead>
              <tr>
                <th>Ticket No.</th>
                <th>Violation</th>
                <th>Violation Date</th>
                <th>Driver’s Name</th>
                <th>Classification</th>
                <th>Total Amount</th>
                <th>Date Paid</th>
                <th>OR number</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.slice(0, 5).map((v) => (
                <tr key={v.ticketNo}>
                  <td>{v.ticketNo}</td>
                  <td>{v.violation}</td>
                  <td>{v.violationDate}</td>
                  <td>{v.driverName}</td>
                  <td>{v.classification}</td>
                  <td className="text-danger fw-semibold">{money(v.totalAmount || 0)}</td>
                  <td className="text-danger">{v.datePaid || "unavailable"}</td>
                  <td className="text-danger">{v.orNumber || "—"}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-light rounded-circle me-1"><i className="bi bi-eye" /></button>
                    <button className="btn btn-sm btn-light rounded-circle me-1"><i className="bi bi-printer" /></button>
                    <button className="btn btn-sm btn-light rounded-circle me-1"><i className="bi bi-pencil-square" /></button>
                    <button className="btn btn-sm btn-light rounded-circle"><i className="bi bi-trash" /></button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
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