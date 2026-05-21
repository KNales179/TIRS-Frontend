import { useMemo, useState } from "react";
import { useTFROData } from "../context/TFRODataContext";

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
    officialPenalty: "",
    declaredPenalty: "",
    discount: "",
    payableAmount: "",
    location: "",
    datePaid: "",
    orNumber: "",
    enforcers: [""],
    commissionRate: 0.2,
    status: "New",
  };
}

export default function Violations() {
  const {
    violations: data,
    setViolations: setData,
    violationsMaster,
    addViolation,
  } = useTFROData();

  const [mode, setMode] = useState("Task");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [violationCodeFilter, setViolationCodeFilter] = useState("All");
  const [violationFilter, setViolationFilter] = useState("All");
  const [violationDateFilter, setViolationDateFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("All");

  const [cols, setCols] = useState({
    ticketNo: true,
    violationCode: true,
    violation: true,
    violationDate: true,
    driverName: true,
    classification: true,
    officialPenalty: true,
    declaredPenalty: true,
    discount: true,
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
  }, [data, violationsMaster]);

  const violationOptions = useMemo(() => {
    const masterNames = violationsMaster.map((item) => item.name);
    const existingNames = data.map((item) => item.violation).filter(Boolean);

    return ["All", ...new Set([...masterNames, ...existingNames])];
  }, [data, violationsMaster]);

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
            v.location,
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
    const officialPenalty =
      v.officialPenalty ?? v.penaltyAmount ?? v.totalAmount ?? 0;
    const declaredPenalty =
      v.declaredPenalty ?? v.payableAmount ?? v.totalAmount ?? 0;

    setFormMode("edit");
    setSelectedRow(v);
    setFormData({
      ...getEmptyViolationForm(),
      ...v,
      officialPenalty,
      declaredPenalty,
      discount: Math.max(Number(officialPenalty) - Number(declaredPenalty), 0),
      payableAmount: declaredPenalty,
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
      alert("Please fill in Ticket No., Violation, Violation Date, and Driver’s Name.");
      return;
    }

    if (!formData.enforcers[0]?.trim()) {
      alert("Please enter at least one enforcer.");
      return;
    }

    const officialPenalty = Number(formData.officialPenalty || 0);
    const declaredPenalty = Number(formData.declaredPenalty || 0);
    const discount = Math.max(officialPenalty - declaredPenalty, 0);

    const payload = {
      ...formData,
      enforcers: formData.enforcers
        .map((name) => name.trim())
        .filter(Boolean)
        .join(", "),
      officialPenalty,
      declaredPenalty,
      discount,
      payableAmount: declaredPenalty,
      penaltyAmount: officialPenalty,
      totalAmount: officialPenalty,
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

      addViolation(payload);
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

  function handlePrint(v) {
    window.print();
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
            + Add Violator
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
            onView={setViewRow}
            onPrint={handlePrint}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <TaskSection
            title="On Process"
            count={grouped["On Process"].length}
            rows={grouped["On Process"]}
            onSeeMore={() => jumpToStatus("On Process")}
            onView={setViewRow}
            onPrint={handlePrint}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <TaskSection
            title="Done"
            count={grouped["Done"].length}
            rows={grouped["Done"]}
            onSeeMore={() => jumpToStatus("Done")}
            onView={setViewRow}
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
                    <FilterSelect
                      label="Status"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={["All", "New", "On Process", "Done"]}
                      width={150}
                    />

                    <FilterSelect
                      label="Code"
                      value={violationCodeFilter}
                      onChange={setViolationCodeFilter}
                      options={violationCodeOptions}
                      width={130}
                    />

                    <FilterSelect
                      label="Violation"
                      value={violationFilter}
                      onChange={setViolationFilter}
                      options={violationOptions}
                      width={240}
                    />

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

                    <FilterSelect
                      label="Classification"
                      value={classificationFilter}
                      onChange={setClassificationFilter}
                      options={classificationOptions}
                      width={160}
                    />

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
                      {Object.keys(cols).map((key) => (
                        <FilterCheck
                          key={key}
                          label={key}
                          checked={cols[key]}
                          onChange={(v) => setCols((c) => ({ ...c, [key]: v }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <ViolationTable
                  rows={rows}
                  cols={cols}
                  onView={setViewRow}
                  onPrint={handlePrint}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
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
        violationsMaster={violationsMaster}
        onClose={handleCloseFormModal}
        onSave={handleSaveForm}
      />

      <ViolationViewModal
        show={!!viewRow}
        row={viewRow}
        onClose={() => setViewRow(null)}
      />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, width }) {
  return (
    <div>
      <span className="text-muted small d-block mb-1">{label}</span>
      <select
        className="form-select form-select-sm"
        style={{ width }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function ViolationTable({ rows, cols, onView, onPrint, onEdit, onDelete }) {
  return (
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
            {cols.officialPenalty && <th>Official Penalty</th>}
            {cols.declaredPenalty && <th>Declared Penalty</th>}
            {cols.discount && <th>Auto Discount</th>}
            {cols.datePaid && <th>Date Paid</th>}
            {cols.orNumber && <th>OR Number</th>}
            {cols.enforcers && <th>Enforcer(s)</th>}
            {cols.commission && <th>Commission</th>}
            {cols.status && <th>Status</th>}
            <th className="text-end">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((v) => {
            const officialPenalty = v.officialPenalty ?? v.penaltyAmount ?? v.totalAmount ?? 0;
            const declaredPenalty = v.declaredPenalty ?? v.payableAmount ?? v.totalAmount ?? 0;
            const discount = Math.max(Number(officialPenalty) - Number(declaredPenalty), 0);
            const commission = Number(declaredPenalty) * Number(v.commissionRate || 0);
            const status = deriveStatus(v);

            return (
              <tr key={v.ticketNo}>
                {cols.ticketNo && <td>{v.ticketNo}</td>}
                {cols.violationCode && <td>{v.violationCode || "—"}</td>}
                {cols.violation && <td>{v.violation}</td>}
                {cols.violationDate && <td>{v.violationDate}</td>}
                {cols.driverName && <td>{v.driverName}</td>}
                {cols.classification && <td>{v.classification}</td>}
                {cols.officialPenalty && (
                  <td className="text-danger fw-semibold">{money(officialPenalty)}</td>
                )}
                {cols.declaredPenalty && (
                  <td className="text-success fw-semibold">{money(declaredPenalty)}</td>
                )}
                {cols.discount && <td>{money(discount)}</td>}
                {cols.datePaid && (
                  <td className="text-danger">{v.datePaid || "unavailable"}</td>
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
                  <ActionButtons
                    row={v}
                    onView={onView}
                    onPrint={onPrint}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
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
  );
}

function TaskSection({ title, count, rows, onSeeMore, onView, onPrint, onEdit, onDelete }) {
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

        <ViolationTable
          rows={rows.slice(0, 5)}
          cols={{
            ticketNo: true,
            violationCode: true,
            violation: true,
            violationDate: true,
            driverName: true,
            classification: true,
            officialPenalty: true,
            declaredPenalty: true,
            discount: true,
            datePaid: true,
            orNumber: true,
            enforcers: false,
            commission: false,
            status: false,
          }}
          onView={onView}
          onPrint={onPrint}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function ViolationFormModal({
  show,
  mode,
  formData,
  setFormData,
  violationsMaster,
  onClose,
  onSave,
}) {
  if (!show) return null;

  const officialPenalty = Number(formData.officialPenalty || 0);
  const declaredPenalty = Number(formData.declaredPenalty || 0);
  const discount = Math.max(officialPenalty - declaredPenalty, 0);

  function setField(key, value) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleViolationChange(code) {
    const selected = violationsMaster.find(
      (item) => String(item.code) === String(code)
    );

    setFormData((prev) => ({
      ...prev,
      violationCode: selected?.code || "",
      violation: selected?.name || "",
      violationGroup: selected?.group || "",
      offenseLevel: selected?.offenseLevel || "",
      officialPenalty: selected?.penalty || "",
      declaredPenalty: selected?.penalty || "",
      discount: 0,
      payableAmount: selected?.penalty || "",
    }));
  }

  function setEnforcer(index, value) {
    setFormData((prev) => {
      const next = [...prev.enforcers];
      next[index] = value;
      return { ...prev, enforcers: next };
    });
  }

  function addEnforcer() {
    setFormData((prev) => ({
      ...prev,
      enforcers: [...prev.enforcers, ""],
    }));
  }

  function removeEnforcer(index) {
    setFormData((prev) => ({
      ...prev,
      enforcers: prev.enforcers.filter((_, i) => i !== index),
    }));
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header border-0 pb-0">
              <div>
                <h5 className="modal-title fw-bold">
                  {mode === "add" ? "Add Violation" : "Edit Violation"}
                </h5>
                <div className="text-muted small">
                  Official penalty is auto-filled from violation master list.
                </div>
              </div>

              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <FormInput
                  label="Ticket No."
                  value={formData.ticketNo}
                  onChange={(v) => setField("ticketNo", v)}
                />

                <div className="col-md-6">
                  <label className="form-label small text-muted">Violation</label>
                  <select
                    className="form-select rounded-4"
                    value={formData.violationCode}
                    onChange={(e) => handleViolationChange(e.target.value)}
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
                  placeholder="MM/DD/YYYY"
                  value={formData.violationDate}
                  onChange={(v) => setField("violationDate", formatDateInput(v))}
                />

                <FormInput
                  label="Driver’s Name"
                  value={formData.driverName}
                  onChange={(v) => setField("driverName", v)}
                />

                <div className="col-md-6">
                  <label className="form-label small text-muted">Classification</label>
                  <select
                    className="form-select rounded-4"
                    value={formData.classification}
                    onChange={(e) => setField("classification", e.target.value)}
                  >
                    <option value="Colorum">Colorum</option>
                    <option value="Registered">Registered</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Special Franchise">Special Franchise</option>
                  </select>
                </div>

                <FormInput
                  label="Location"
                  value={formData.location}
                  onChange={(v) => setField("location", v)}
                />

                <FormInput
                  label="Official Penalty"
                  type="number"
                  value={formData.officialPenalty}
                  onChange={(v) => setField("officialPenalty", v)}
                  disabled
                />

                <FormInput
                  label="Declared Penalty"
                  type="number"
                  value={formData.declaredPenalty}
                  onChange={(v) => {
                    const declared = Number(v || 0);
                    const official = Number(formData.officialPenalty || 0);
                    setFormData((prev) => ({
                      ...prev,
                      declaredPenalty: v,
                      discount: Math.max(official - declared, 0),
                      payableAmount: declared,
                    }));
                  }}
                />

                <FormInput
                  label="Auto Discount"
                  value={money(discount)}
                  onChange={() => {}}
                  disabled
                />

                <FormInput
                  label="Payable Amount"
                  value={money(declaredPenalty)}
                  onChange={() => {}}
                  disabled
                />

                <FormInput
                  label="Date Paid"
                  placeholder="MM/DD/YYYY"
                  value={formData.datePaid || ""}
                  onChange={(v) => setField("datePaid", formatDateInput(v))}
                />

                <FormInput
                  label="OR Number"
                  value={formData.orNumber || ""}
                  onChange={(v) => setField("orNumber", v)}
                />

                <div className="col-md-6">
                  <label className="form-label small text-muted">Status</label>
                  <select
                    className="form-select rounded-4"
                    value={formData.status}
                    onChange={(e) => setField("status", e.target.value)}
                  >
                    <option value="New">New</option>
                    <option value="On Process">On Process</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small text-muted">Enforcer(s)</label>

                  {formData.enforcers.map((name, index) => (
                    <div className="d-flex gap-2 mb-2" key={index}>
                      <input
                        className="form-control rounded-4"
                        value={name}
                        placeholder="Enforcer name"
                        onChange={(e) => setEnforcer(index, e.target.value)}
                      />

                      {formData.enforcers.length > 1 && (
                        <button
                          className="btn btn-outline-danger rounded-4"
                          type="button"
                          onClick={() => removeEnforcer(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    className="btn btn-sm btn-outline-primary rounded-4"
                    type="button"
                    onClick={addEnforcer}
                  >
                    + Add Enforcer
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-4 px-4"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary rounded-4 px-4"
                onClick={onSave}
              >
                Save Violation
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

function ViolationViewModal({ show, row, onClose }) {
  if (!show || !row) return null;

  const officialPenalty = row.officialPenalty ?? row.penaltyAmount ?? row.totalAmount ?? 0;
  const declaredPenalty = row.declaredPenalty ?? row.payableAmount ?? row.totalAmount ?? 0;
  const discount = Math.max(Number(officialPenalty) - Number(declaredPenalty), 0);

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold">Violation Details</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <ViewItem label="Ticket No." value={row.ticketNo} />
                <ViewItem label="Violation Code" value={row.violationCode} />
                <ViewItem label="Violation" value={row.violation} col="col-12" />
                <ViewItem label="Violation Date" value={row.violationDate} />
                <ViewItem label="Driver’s Name" value={row.driverName} />
                <ViewItem label="Classification" value={row.classification} />
                <ViewItem label="Location" value={row.location} />
                <ViewItem label="Official Penalty" value={money(officialPenalty)} />
                <ViewItem label="Declared Penalty" value={money(declaredPenalty)} />
                <ViewItem label="Auto Discount" value={money(discount)} />
                <ViewItem label="Date Paid" value={row.datePaid || "unavailable"} />
                <ViewItem label="OR Number" value={row.orNumber || "—"} />
                <ViewItem label="Enforcer(s)" value={row.enforcers || "—"} col="col-12" />
                <ViewItem label="Status" value={deriveStatus(row)} />
              </div>
            </div>

            <div className="modal-footer border-0">
              <button
                className="btn btn-primary rounded-4 px-4"
                type="button"
                onClick={onClose}
              >
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

function FormInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
}) {
  return (
    <div className="col-md-6">
      <label className="form-label small text-muted">{label}</label>
      <input
        type={type}
        className="form-control rounded-4"
        placeholder={placeholder}
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ViewItem({ label, value, col = "col-md-6" }) {
  return (
    <div className={col}>
      <div className="small text-muted mb-1">{label}</div>
      <div className="bg-light rounded-4 px-3 py-3">{value || "—"}</div>
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
      <label className="form-check-label text-capitalize" htmlFor={safeId}>
        {label.replace(/([A-Z])/g, " $1")}
      </label>
    </div>
  );
}

function ActionButtons({ row, onView, onPrint, onEdit, onDelete }) {
  return (
    <>
      <button
        className="btn btn-sm btn-light rounded-circle me-1"
        onClick={() => onView?.(row)}
        title="View"
        type="button"
      >
        <i className="bi bi-eye" />
      </button>

      <button
        className="btn btn-sm btn-light rounded-circle me-1"
        onClick={() => onPrint?.(row)}
        title="Print"
        type="button"
      >
        <i className="bi bi-printer" />
      </button>

      <button
        className="btn btn-sm btn-light rounded-circle me-1"
        onClick={() => onEdit?.(row)}
        title="Edit"
        type="button"
      >
        <i className="bi bi-pencil-square" />
      </button>

      <button
        className="btn btn-sm btn-light rounded-circle"
        onClick={() => onDelete?.(row)}
        title="Delete"
        type="button"
      >
        <i className="bi bi-trash" />
      </button>
    </>
  );
}