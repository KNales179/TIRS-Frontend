import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getToken } from "../data/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function TruncatedText({ value, maxWidth = 260 }) {
  return (
    <span
      title={value || "—"}
      style={{
        display: "block",
        width: "100%",
        maxWidth,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      {value || "—"}
    </span>
  );
}

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

function money(n) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(n || 0));
}

function todayDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function displayStatus(status) {
  const s = String(status || "NEW").toUpperCase();

  if (s === "ON_PROCESS") return "On Process";
  if (s === "DONE") return "Done";
  if (s === "PAID") return "Paid";
  if (s === "SETTLED") return "Settled";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "DISPUTED") return "Disputed";

  return "New";
}

function fullName(person) {
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
    ...driver,
    name: fullName(driver),
    vehicles: driver.vehicles || [],
  };
}

function normalizeEnforcer(enforcer) {
  return {
    ...enforcer,
    name: fullName(enforcer),
  };
}

function hasVehicleFranchise(vehicle) {
  return Boolean(
    vehicle?.franchise_id ||
      vehicle?.franchiseId ||
      vehicle?.franchise?.id ||
      vehicle?.franchise_number ||
      vehicle?.franchiseNo ||
      vehicle?.franchise
  );
}

function normalizeRow(item) {
  const violations = item.violations || [];
  const enforcers = item.enforcers || [];
  const processors = item.processors || [];
  const transactions = item.transactions || [];

  const latestPayment =
    transactions.find((t) => t.action_taken === "PAYMENT_RECORDED") ||
    transactions[0] ||
    null;

  return {
    id: item.id,
    ticketNo: item.ticket_number || item.ticketNo || "—",
    violationCode:
      violations.map((v) => v.violation_code).filter(Boolean).join(", ") ||
      item.violation_code ||
      "—",
    violation:
      violations.map((v) => v.name).filter(Boolean).join(", ") ||
      item.violation ||
      "—",
    violationDate: item.apprehension_date
      ? String(item.apprehension_date).slice(0, 10)
      : "—",
    driverName:
      item.driver_name || item.unregistered_name || item.driverName || "—",
    classification:
      item.classification || item.violator_type || item.classification || "—",
    officialPenalty: item.total_penalty || item.penaltyAmount || 0,
    datePaid:
      latestPayment?.paid_at || item.datePaid || item.paid_at || null,
    orNumber:
      latestPayment?.or_number || item.orNumber || item.or_number || null,
    enforcers:
      enforcers.map((e) => e.enforcer_name || e.name).filter(Boolean).join(", ") ||
      item.enforcers ||
      "—",
    processors:
      processors.map((p) => p.admin_name).filter(Boolean).join(", ") || "None",
    commissionRate: Number(item.commission_rate || 0),
    status: displayStatus(item.status),
    location: item.location || "",
    raw: item,
  };
}

function getEmptyApprehensionForm() {
  return {
    violator_type: "REGISTERED_DRIVER",
    driver_id: "",
    vehicle_id: "",
    unregistered_name: "",
    unregistered_contact: "",
    unregistered_address: "",
    apprehension_date: "",
    location: "",
    violation_type_ids: [],
    enforcer_ids: [],
    commission_rate: 0.2,
    remarks: "",
  };
}

function getEmptyPaymentForm(total = 0) {
  return {
    or_number: "",
    amount_paid: total,
    payment_method: "CASH",
    paid_at: todayDateTimeLocal(),
    remarks: "",
  };
}

export default function Violations() {
  const location = useLocation();
  const openedFromDashboardRef = useRef(false);
  const [apprehensions, setApprehensions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [enforcers, setEnforcers] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classificationFilter, setClassificationFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(getEmptyApprehensionForm());
  const [editingRow, setEditingRow] = useState(null);

  const [viewRow, setViewRow] = useState(null);

  const [paymentRow, setPaymentRow] = useState(null);
  const [paymentForm, setPaymentForm] = useState(getEmptyPaymentForm());

  const [reasonModal, setReasonModal] = useState(null);
  const [reasonText, setReasonText] = useState("");

  const isEditing = !!editingRow;

  async function fetchPageData() {
    try {
      setLoading(true);
      setError("");

      const [apprehensionRes, driverRes, enforcerRes, violationTypeRes] =
        await Promise.all([
          apiRequest("/apprehensions"),
          apiRequest("/drivers"),
          apiRequest("/enforcers"),
          apiRequest("/violation-types"),
        ]);

      setApprehensions((apprehensionRes.data || []).map(normalizeRow));
      setDrivers((driverRes.data || driverRes.drivers || []).map(normalizeDriver));
      setEnforcers(
        (enforcerRes.data || enforcerRes.enforcers || []).map(normalizeEnforcer)
      );
      setViolationTypes(violationTypeRes.data || []);
    } catch (err) {
      setError(err.message || "Failed to load violations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPageData();
  }, []);

  useEffect(() => {
    const requestedId = location.state?.viewApprehensionId;

    if (!requestedId || openedFromDashboardRef.current || apprehensions.length === 0) {
      return;
    }

    const matchedRow = apprehensions.find((row) => {
      return (
        String(row.id) === String(requestedId) ||
        String(row.ticketNo) === String(requestedId) ||
        String(row.raw?.apprehension_code || "") === String(requestedId) ||
        String(row.raw?.ticket_number || "") === String(requestedId)
      );
    });

    if (matchedRow) {
      openedFromDashboardRef.current = true;
      setViewRow(matchedRow);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, apprehensions]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = apprehensions.filter((v) => {
      if (!q) return true;

      return [
        v.ticketNo,
        v.violationCode,
        v.violation,
        v.driverName,
        v.classification,
        v.orNumber,
        v.enforcers,
        v.processors,
        v.location,
        v.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    if (statusFilter !== "All") {
      list = list.filter((v) => v.status === statusFilter);
    }

    if (classificationFilter !== "All") {
      list = list.filter((v) => v.classification === classificationFilter);
    }

    const sorted = [...list];

    sorted.sort((a, b) => {
      const dateA = new Date(a.raw?.apprehension_date || a.violationDate || 0).getTime();
      const dateB = new Date(b.raw?.apprehension_date || b.violationDate || 0).getTime();

      if (sortBy === "Oldest") return dateA - dateB;
      if (sortBy === "Penalty High-Low") {
        return Number(b.officialPenalty || 0) - Number(a.officialPenalty || 0);
      }
      if (sortBy === "Penalty Low-High") {
        return Number(a.officialPenalty || 0) - Number(b.officialPenalty || 0);
      }
      if (sortBy === "Ticket Number") {
        return String(a.ticketNo || "").localeCompare(String(b.ticketNo || ""));
      }

      return dateB - dateA;
    });

    return sorted;
  }, [apprehensions, query, statusFilter, classificationFilter, sortBy]);

  const grouped = useMemo(() => {
    const g = {
      New: [],
      "On Process": [],
      Paid: [],
      Settled: [],
      Cancelled: [],
      Disputed: [],
      Done: [],
    };

    apprehensions.forEach((v) => {
      if (g[v.status]) g[v.status].push(v);
    });

    return g;
  }, [apprehensions]);

  const classificationOptions = useMemo(() => {
    return [
      "All",
      ...new Set(apprehensions.map((v) => v.classification).filter(Boolean)),
    ];
  }, [apprehensions]);

  const statusCards = useMemo(() => {
    return [
      { label: "All", value: "All", count: apprehensions.length },
      { label: "New", value: "New", count: grouped.New.length },
      {
        label: "On Process",
        value: "On Process",
        count: grouped["On Process"].length,
      },
      { label: "Paid", value: "Paid", count: grouped.Paid.length },
      { label: "Settled", value: "Settled", count: grouped.Settled.length },
      { label: "Cancelled", value: "Cancelled", count: grouped.Cancelled.length },
      { label: "Disputed", value: "Disputed", count: grouped.Disputed.length },
    ];
  }, [apprehensions.length, grouped]);

  const myProcessingRows = useMemo(() => {
    return apprehensions.filter((row) => {
      const processors = row.raw?.processors || [];
      return processors.length > 0 && ["On Process", "Paid"].includes(row.status);
    });
  }, [apprehensions]);

  function clearAllFilters() {
    setStatusFilter("All");
    setClassificationFilter("All");
    setSortBy("Newest");
  }

  function handleOpenAddModal() {
    setEditingRow(null);
    setFormData(getEmptyApprehensionForm());
    setShowFormModal(true);
  }

  function handleOpenEditModal(row) {
    const raw = row.raw || row;

    setEditingRow(row);

    setFormData({
      violator_type: raw.violator_type || "REGISTERED_DRIVER",
      driver_id: raw.driver_id || "",
      vehicle_id: raw.vehicle_id || "",
      unregistered_name: raw.unregistered_name || "",
      unregistered_contact: raw.unregistered_contact || "",
      unregistered_address: raw.unregistered_address || "",
      apprehension_date: raw.apprehension_date
        ? String(raw.apprehension_date).slice(0, 16)
        : "",
      location: raw.location || "",
      violation_type_ids: (raw.violations || []).map(
        (v) => v.violation_type_id || v.id
      ),
      enforcer_ids: (raw.enforcers || []).map((e) => e.enforcer_id || e.id),
      commission_rate: raw.commission_rate || 0.2,
      remarks: raw.remarks || "",
    });

    setShowFormModal(true);
  }

  function handleCloseFormModal() {
    setShowFormModal(false);
    setEditingRow(null);
    setFormData(getEmptyApprehensionForm());
  }

  function buildPayload() {
    const selectedDriver = drivers.find(
      (driver) => Number(driver.id) === Number(formData.driver_id)
    );

    const selectedVehicle = selectedDriver?.vehicles?.find(
      (vehicle) => Number(vehicle.id) === Number(formData.vehicle_id)
    );

    const resolvedViolatorType =
      formData.violator_type === "UNREGISTERED_PERSON"
        ? "UNREGISTERED_PERSON"
        : selectedVehicle
        ? hasVehicleFranchise(selectedVehicle)
          ? "REGISTERED_DRIVER"
          : "COLORUM"
        : formData.violator_type;

    return {
      violator_type: resolvedViolatorType,
      driver_id:
        formData.violator_type === "UNREGISTERED_PERSON"
          ? null
          : Number(formData.driver_id),
      vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null,

      unregistered_name:
        formData.violator_type === "UNREGISTERED_PERSON"
          ? formData.unregistered_name
          : null,
      unregistered_contact:
        formData.violator_type === "UNREGISTERED_PERSON"
          ? formData.unregistered_contact
          : null,
      unregistered_address:
        formData.violator_type === "UNREGISTERED_PERSON"
          ? formData.unregistered_address
          : null,

      apprehension_date: formData.apprehension_date,
      location: formData.location,
      violation_type_ids: formData.violation_type_ids.map(Number),
      enforcer_ids: formData.enforcer_ids.map(Number),
      commission_rate: Number(formData.commission_rate || 0),
      remarks: formData.remarks || null,
    };
  }

  function validateForm() {
    if (!formData.apprehension_date) {
      alert("Please select apprehension date.");
      return false;
    }

    if (!formData.location.trim()) {
      alert("Please enter location.");
      return false;
    }

    if (formData.violator_type === "UNREGISTERED_PERSON") {
      if (!formData.unregistered_name.trim()) {
        alert("Please enter unregistered violator name.");
        return false;
      }
    } else if (!formData.driver_id) {
      alert("Please select driver/colorum profile.");
      return false;
    }

    if (!formData.violation_type_ids.length) {
      alert("Please select at least one violation.");
      return false;
    }

    if (!formData.enforcer_ids.length) {
      alert("Please select at least one enforcer.");
      return false;
    }

    return true;
  }

  async function handleSaveApprehension() {
    try {
      setSaving(true);
      setError("");

      if (!validateForm()) return;

      const payload = buildPayload();

      const endpoint = isEditing
        ? `/apprehensions/${editingRow.id}`
        : "/apprehensions";

      await apiRequest(endpoint, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      await fetchPageData();
      handleCloseFormModal();
      alert(isEditing ? "Apprehension updated successfully." : "Apprehension saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save apprehension");
    } finally {
      setSaving(false);
    }
  }

  async function handleStartProcessing(row) {
    try {
      setSaving(true);
      setError("");

      const res = await apiRequest(`/apprehensions/${row.id}/start-processing`, {
        method: "PUT",
        body: JSON.stringify({
          notes: "Started processing from Violations page.",
        }),
      });

      await fetchPageData();
      setViewRow(normalizeRow(res.data));
      alert("Processing started.");
    } catch (err) {
      setError(err.message || "Failed to start processing");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenPayment(row) {
    setPaymentRow(row);
    setPaymentForm(getEmptyPaymentForm(row.officialPenalty));
  }

  function handleClosePayment() {
    setPaymentRow(null);
    setPaymentForm(getEmptyPaymentForm());
  }

  async function handleRecordPayment() {
    try {
      setSaving(true);
      setError("");

      if (!paymentForm.or_number.trim()) {
        alert("OR Number is required.");
        return;
      }

      if (Number(paymentForm.amount_paid || 0) <= 0) {
        alert("Amount paid must be greater than 0.");
        return;
      }

      await apiRequest(`/apprehensions/${paymentRow.id}/payment`, {
        method: "POST",
        body: JSON.stringify({
          ...paymentForm,
          amount_paid: Number(paymentForm.amount_paid || 0),
        }),
      });

      await fetchPageData();
      handleClosePayment();
      setViewRow(null);
      alert("Payment recorded successfully.");
    } catch (err) {
      setError(err.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  }

  async function handleSettle(row) {
    if (!confirm("Settle this apprehension?")) return;

    try {
      setSaving(true);
      setError("");

      await apiRequest(`/apprehensions/${row.id}/settle`, {
        method: "PUT",
        body: JSON.stringify({
          release_vehicle: true,
          remarks: "Settled from Violations page.",
        }),
      });

      await fetchPageData();
      setViewRow(null);
      alert("Apprehension settled successfully.");
    } catch (err) {
      setError(err.message || "Failed to settle apprehension");
    } finally {
      setSaving(false);
    }
  }

  async function handleImpound(row) {
    if (!confirm("Mark connected vehicle as impounded?")) return;

    try {
      setSaving(true);
      setError("");

      await apiRequest(`/apprehensions/${row.id}/impound`, {
        method: "PUT",
        body: JSON.stringify({
          remarks: "Marked impounded from Violations page.",
        }),
      });

      await fetchPageData();
      alert("Vehicle marked as impounded.");
    } catch (err) {
      setError(err.message || "Failed to impound vehicle");
    } finally {
      setSaving(false);
    }
  }

  function openReasonModal(type, row) {
    setReasonModal({ type, row });
    setReasonText("");
  }

  function closeReasonModal() {
    setReasonModal(null);
    setReasonText("");
  }

  async function handleSubmitReasonAction() {
    try {
      setSaving(true);
      setError("");

      if (!reasonText.trim()) {
        alert("Reason is required.");
        return;
      }

      const endpoint =
        reasonModal.type === "cancel"
          ? `/apprehensions/${reasonModal.row.id}/cancel`
          : `/apprehensions/${reasonModal.row.id}/dispute`;

      await apiRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify({
          reason: reasonText,
        }),
      });

      await fetchPageData();
      closeReasonModal();
      setViewRow(null);
      alert(
        reasonModal.type === "cancel"
          ? "Apprehension cancelled."
          : "Apprehension marked as disputed."
      );
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setSaving(false);
    }
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
            onClick={handleOpenAddModal}
            type="button"
          >
            + Add Violator
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger rounded-4 py-2">{error}</div>}
      {loading && (
        <div className="alert alert-info rounded-4 py-2">
          Loading violations...
        </div>
      )}

      <div className="row g-3 mb-4">
        {statusCards.map((card) => (
          <StatusSummaryCard
            key={card.value}
            label={card.label}
            count={card.count}
            active={statusFilter === card.value}
            onClick={() => setStatusFilter(card.value)}
          />
        ))}
      </div>

      <div className="card rounded-4 shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div>
              <h2 className="h6 fw-bold mb-1">My Processing Records</h2>
              <div className="text-muted small">
                Apprehensions currently assigned for processing.
              </div>
            </div>

            <span className="badge bg-info-subtle text-info-emphasis rounded-pill px-3 py-2">
              {myProcessingRows.length} active
            </span>
          </div>

          <ViolationTable
            rows={myProcessingRows}
            onView={setViewRow}
            onEdit={handleOpenEditModal}
          />
        </div>
      </div>

      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div>
              <h2 className="h6 fw-bold mb-1">All Apprehensions</h2>
              <div className="text-muted small">
                Search, filter, and sort all apprehension records.
              </div>
            </div>

            {(statusFilter !== "All" ||
              classificationFilter !== "All" ||
              sortBy !== "Newest") && (
              <button
                className="btn btn-sm btn-light rounded-4 px-3"
                type="button"
                onClick={clearAllFilters}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                "All",
                "New",
                "On Process",
                "Paid",
                "Settled",
                "Cancelled",
                "Disputed",
              ]}
              width={150}
            />

            <FilterSelect
              label="Classification"
              value={classificationFilter}
              onChange={setClassificationFilter}
              options={classificationOptions}
              width={190}
            />

            <FilterSelect
              label="Sort"
              value={sortBy}
              onChange={setSortBy}
              options={[
                "Newest",
                "Oldest",
                "Penalty High-Low",
                "Penalty Low-High",
                "Ticket Number",
              ]}
              width={190}
            />
          </div>

          <ViolationTable
            rows={rows}
            onView={setViewRow}
            onEdit={handleOpenEditModal}
          />
        </div>
      </div>

      <ApprehensionFormModal
        show={showFormModal}
        isEditing={isEditing}
        formData={formData}
        setFormData={setFormData}
        drivers={drivers}
        enforcers={enforcers}
        violationTypes={violationTypes}
        onClose={handleCloseFormModal}
        onSave={handleSaveApprehension}
        saving={saving}
      />

      <ViolationViewModal
        show={!!viewRow}
        row={viewRow}
        saving={saving}
        onClose={() => setViewRow(null)}
        onEdit={handleOpenEditModal}
        onStartProcessing={handleStartProcessing}
        onOpenPayment={handleOpenPayment}
        onSettle={handleSettle}
        onImpound={handleImpound}
        onCancel={(row) => openReasonModal("cancel", row)}
        onDispute={(row) => openReasonModal("dispute", row)}
      />

      <PaymentModal
        show={!!paymentRow}
        row={paymentRow}
        form={paymentForm}
        setForm={setPaymentForm}
        saving={saving}
        onClose={handleClosePayment}
        onSave={handleRecordPayment}
      />

      <ReasonModal
        show={!!reasonModal}
        type={reasonModal?.type}
        row={reasonModal?.row}
        value={reasonText}
        onChange={setReasonText}
        saving={saving}
        onClose={closeReasonModal}
        onSubmit={handleSubmitReasonAction}
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

function StatusSummaryCard({ label, count, active, onClick }) {
  return (
    <div className="col-6 col-md-4 col-xl">
      <button
        type="button"
        className={`card w-100 text-start rounded-4 border-0 shadow-sm ${
          active ? "bg-primary text-white" : "bg-white"
        }`}
        onClick={onClick}
        style={{ minHeight: 92 }}
      >
        <div className="card-body py-3">
          <div className={`small mb-1 ${active ? "text-white-50" : "text-muted"}`}>
            {label}
          </div>
          <div className="h4 fw-bold mb-0">{count}</div>
        </div>
      </button>
    </div>
  );
}


function ViolationTable({ rows, onView, onEdit }) {
  return (
    <div className="table-responsive">
      <table
        className="tfro-table"
        style={{
          tableLayout: "fixed",
          width: "100%",
          minWidth: 1580,
        }}
      >
        <colgroup>
          <col style={{ width: "135px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "250px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "150px" }} />
          <col style={{ width: "135px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "90px" }} />
          <col style={{ width: "135px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "90px" }} />
        </colgroup>

        <thead>
          <tr className="text-muted small">
            <th>Ticket No.</th>
            <th>Code</th>
            <th>Violation</th>
            <th>Violation Date</th>
            <th>Driver’s Name</th>
            <th>Classification</th>
            <th>Official Penalty</th>
            <th>Date Paid</th>
            <th>OR Number</th>
            <th>Enforcer(s)</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((v) => (
            <tr key={v.id || v.ticketNo}>
              <td>
                <TruncatedText value={v.ticketNo} maxWidth={115} />
              </td>

              <td>
                <TruncatedText value={v.violationCode} maxWidth={115} />
              </td>

              <td>
                <TruncatedText value={v.violation} maxWidth={260} />
              </td>

              <td>
                <TruncatedText value={v.violationDate} maxWidth={115} />
              </td>

              <td>
                <TruncatedText value={v.driverName} maxWidth={130} />
              </td>

              <td>
                <TruncatedText value={v.classification} maxWidth={115} />
              </td>

              <td className="text-danger fw-semibold">
                <TruncatedText value={money(v.officialPenalty)} maxWidth={115} />
              </td>

              <td className="text-danger">
                <TruncatedText
                  value={v.datePaid ? String(v.datePaid).slice(0, 10) : "unavailable"}
                  maxWidth={115}
                />
              </td>

              <td className="text-danger">
                <TruncatedText value={v.orNumber || "—"} maxWidth={115} />
              </td>

              <td>
                <TruncatedText value={v.enforcers} maxWidth={130} />
              </td>

              <td>
                <StatusBadge status={v.status} />
              </td>

              <td className="text-end">
                <button
                  className="btn btn-sm btn-light rounded-circle"
                  onClick={() => onView?.(v)}
                  title="View"
                  type="button"
                >
                  <i className="bi bi-eye" />
                </button>

                <button
                  className="btn btn-sm btn-light rounded-circle ms-1"
                  onClick={() => onEdit?.(v)}
                  title="Edit"
                  type="button"
                  disabled={["Paid", "Settled", "Cancelled"].includes(v.status)}
                >
                  <i className="bi bi-pencil" />
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={12} className="text-center text-muted py-5">
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ApprehensionFormModal({
  show,
  isEditing,
  formData,
  setFormData,
  drivers,
  enforcers,
  violationTypes,
  onClose,
  onSave,
  saving,
}) {
  const [driverSearch, setDriverSearch] = useState("");
  const [enforcerSearch, setEnforcerSearch] = useState("");
  const [violationSearch, setViolationSearch] = useState("");

  if (!show) return null;

  const selectedDriver = drivers.find(
    (driver) => Number(driver.id) === Number(formData.driver_id)
  );

  const availableVehicles = selectedDriver?.vehicles || [];

  const selectedVehicle = availableVehicles.find(
    (vehicle) => Number(vehicle.id) === Number(formData.vehicle_id)
  );

  const selectedViolationTypes = violationTypes.filter((item) =>
    formData.violation_type_ids.map(Number).includes(Number(item.id))
  );

  const totalPenalty = selectedViolationTypes.reduce(
    (sum, item) => sum + Number(item.penalty_amount || 0),
    0
  );

  const systemClassification =
    formData.violator_type === "UNREGISTERED_PERSON"
      ? "UNREGISTERED_PERSON"
      : selectedVehicle
      ? hasVehicleFranchise(selectedVehicle)
        ? "REGISTERED"
        : "COLORUM"
      : "Select vehicle to classify";

  const driverResults = drivers.filter((driver) => {
    const q = driverSearch.trim().toLowerCase();

    if (!q) return true;

    return [
      driver.name,
      driver.driver_code,
      driver.classification,
      driver.contact_number,
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const enforcerResults = enforcers.filter((enforcer) => {
    const q = enforcerSearch.trim().toLowerCase();

    if (!q) return true;

    return [enforcer.name, enforcer.enforcer_code, enforcer.contact_number]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const violationResults = violationTypes.filter((item) => {
    const q = violationSearch.trim().toLowerCase();

    if (!q) return true;

    return [item.violation_code, item.name, item.group_name]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  function setField(key, value) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function toggleArrayValue(key, id) {
    setFormData((prev) => {
      const current = prev[key].map(Number);
      const numericId = Number(id);

      const next = current.includes(numericId)
        ? current.filter((item) => item !== numericId)
        : [...current, numericId];

      return {
        ...prev,
        [key]: next,
      };
    });
  }

  function handleViolatorTypeChange(value) {
    setFormData((prev) => ({
      ...prev,
      violator_type: value,
      driver_id: "",
      vehicle_id: "",
      unregistered_name: "",
      unregistered_contact: "",
      unregistered_address: "",
    }));
  }

  function handleDriverChange(driverId) {
    setFormData((prev) => ({
      ...prev,
      driver_id: driverId,
      vehicle_id: "",
    }));
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div
            className="modal-content border-0 rounded-4 shadow-lg"
            style={{ overflow: "hidden" }}
          >
            <div
              className="modal-header border-0 pb-3"
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
              }}
            >
              <div>
                <h5 className="modal-title fw-bold">
                  {isEditing ? "Edit Apprehension" : "Add Apprehension"}
                </h5>
                <div className="text-muted small">
                  Ticket number, penalties, and status are handled by the backend workflow.
                </div>
              </div>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={saving}
              />
            </div>

            <div className="modal-body" style={{ background: "#f8fafc" }}>
              <div className="row g-4">
                <div className="col-12">
                  <SectionBox title="Violator">
                    <div className="d-flex flex-wrap gap-3 mb-3">
                      <RadioOption
                        label="Registered Driver"
                        value="REGISTERED_DRIVER"
                        checked={formData.violator_type === "REGISTERED_DRIVER"}
                        onChange={handleViolatorTypeChange}
                      />

                      <RadioOption
                        label="Colorum"
                        value="COLORUM"
                        checked={formData.violator_type === "COLORUM"}
                        onChange={handleViolatorTypeChange}
                      />

                      <RadioOption
                        label="Unregistered Person"
                        value="UNREGISTERED_PERSON"
                        checked={formData.violator_type === "UNREGISTERED_PERSON"}
                        onChange={handleViolatorTypeChange}
                      />
                    </div>

                    {formData.violator_type === "UNREGISTERED_PERSON" ? (
                      <div className="row g-3">
                        <FormInput
                          label="Unregistered Name"
                          value={formData.unregistered_name}
                          onChange={(v) => setField("unregistered_name", v)}
                        />

                        <FormInput
                          label="Contact"
                          value={formData.unregistered_contact}
                          onChange={(v) => setField("unregistered_contact", v)}
                        />

                        <FormInput
                          label="Address"
                          value={formData.unregistered_address}
                          onChange={(v) => setField("unregistered_address", v)}
                          col="col-12"
                        />
                      </div>
                    ) : (
                      <>
                        <FormInput
                          label="Search Driver / Colorum"
                          value={driverSearch}
                          onChange={setDriverSearch}
                          placeholder="Search by name, code, contact..."
                          col="col-12"
                        />

                        <div
                          className="border rounded-4 p-2 bg-white mt-2"
                          style={{ maxHeight: 190, overflowY: "auto" }}
                        >
                          {driverResults.map((driver) => {
                            const selected =
                              Number(formData.driver_id) === Number(driver.id);

                            return (
                              <button
                                key={driver.id}
                                type="button"
                                className={`btn w-100 text-start rounded-4 mb-2 p-3 border ${
                                  selected
                                    ? "btn-primary border-primary shadow-sm"
                                    : "border-light"
                                }`}
                                style={{
                                  background: selected ? undefined : "#ffffff",
                                }}
                                onClick={() => handleDriverChange(driver.id)}
                              >
                                <div className="fw-semibold">
                                  {driver.name || "Unnamed"}
                                </div>
                                <div className="small">
                                  {driver.driver_code || "No code"} •{" "}
                                  {driver.classification || "—"}
                                </div>
                              </button>
                            );
                          })}

                          {driverResults.length === 0 && (
                            <div className="text-muted text-center py-3">
                              No driver found.
                            </div>
                          )}
                        </div>

                        <div className="mt-3">
                          <label className="form-label small text-muted">
                            Vehicle
                          </label>
                          <select
                            className="form-select rounded-4 bg-white"
                            value={formData.vehicle_id}
                            onChange={(e) =>
                              setField("vehicle_id", e.target.value)
                            }
                            disabled={!selectedDriver}
                          >
                            <option value="">No vehicle / Select vehicle</option>
                            {availableVehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.plateNo ||
                                  vehicle.plate_number ||
                                  "No Plate"}{" "}
                                -{" "}
                                {vehicle.modelMake ||
                                  vehicle.model_make ||
                                  vehicle.motor ||
                                  "Vehicle"}
                              </option>
                            ))}
                          </select>

                          <div className="mt-2 small">
                            System classification:{" "}
                            <span
                              className={`badge rounded-pill px-3 py-2 ${
                                systemClassification === "REGISTERED"
                                  ? "bg-success-subtle text-success-emphasis"
                                  : systemClassification === "COLORUM"
                                  ? "bg-warning-subtle text-warning-emphasis"
                                  : "bg-secondary-subtle text-secondary-emphasis"
                              }`}
                            >
                              {systemClassification}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </SectionBox>
                </div>

                <div className="col-md-6">
                  <SectionBox title="Violation Type(s)">
                    <FormInput
                      label="Search Violation"
                      value={violationSearch}
                      onChange={setViolationSearch}
                      placeholder="Search violation code/name..."
                      col="col-12"
                    />

                    <div
                      className="border rounded-4 p-2 mt-2 bg-white"
                      style={{ maxHeight: 270, overflowY: "auto" }}
                    >
                      {violationResults.map((item) => {
                        const checked = formData.violation_type_ids
                          .map(Number)
                          .includes(Number(item.id));

                        return (
                          <label
                            key={item.id}
                            className={`d-flex align-items-start gap-3 p-3 rounded-4 mb-2 border ${
                              checked
                                ? "border-primary bg-primary-subtle"
                                : "border-light bg-white"
                            }`}
                            style={{
                              cursor: "pointer",
                              boxShadow: checked
                                ? "0 4px 12px rgba(13,110,253,0.12)"
                                : "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input mt-1 border border-2 border-primary"
                              style={{
                                width: 20,
                                height: 20,
                                cursor: "pointer",
                              }}
                              checked={checked}
                              onChange={() =>
                                toggleArrayValue("violation_type_ids", item.id)
                              }
                            />

                            <span>
                              <span className="fw-semibold text-dark">
                                {item.violation_code} - {item.name}
                              </span>
                              <br />
                              <span className="small text-muted">
                                {item.group_name || "No group"} •{" "}
                                {money(item.penalty_amount)}
                              </span>
                            </span>
                          </label>
                        );
                      })}

                      {violationResults.length === 0 && (
                        <div className="text-center text-muted py-3">
                          No violations found.
                        </div>
                      )}
                    </div>

                    <div className="small text-muted mt-2">
                      Total official penalty:{" "}
                      <span className="fw-bold text-danger">
                        {money(totalPenalty)}
                      </span>
                    </div>
                  </SectionBox>
                </div>

                <div className="col-md-6">
                  <SectionBox title="Enforcer(s)">
                    <FormInput
                      label="Search Enforcer"
                      value={enforcerSearch}
                      onChange={setEnforcerSearch}
                      placeholder="Search enforcer name/code..."
                      col="col-12"
                    />

                    <div
                      className="border rounded-4 p-2 mt-2 bg-white"
                      style={{ maxHeight: 270, overflowY: "auto" }}
                    >
                      {enforcerResults.map((enforcer) => {
                        const checked = formData.enforcer_ids
                          .map(Number)
                          .includes(Number(enforcer.id));

                        return (
                          <label
                            key={enforcer.id}
                            className={`d-flex align-items-start gap-3 p-3 rounded-4 mb-2 border ${
                              checked
                                ? "border-primary bg-primary-subtle"
                                : "border-light bg-white"
                            }`}
                            style={{
                              cursor: "pointer",
                              boxShadow: checked
                                ? "0 4px 12px rgba(13,110,253,0.12)"
                                : "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input mt-1 border border-2 border-primary"
                              style={{
                                width: 20,
                                height: 20,
                                cursor: "pointer",
                              }}
                              checked={checked}
                              onChange={() =>
                                toggleArrayValue("enforcer_ids", enforcer.id)
                              }
                            />

                            <span>
                              <span className="fw-semibold text-dark">
                                {enforcer.name || "Unnamed"}
                              </span>
                              <br />
                              <span className="small text-muted">
                                {enforcer.enforcer_code || "No code"}
                              </span>
                            </span>
                          </label>
                        );
                      })}

                      {enforcerResults.length === 0 && (
                        <div className="text-center text-muted py-3">
                          No enforcers found.
                        </div>
                      )}
                    </div>
                  </SectionBox>
                </div>

                <div className="col-12">
                  <SectionBox title="Apprehension Details">
                    <div className="row g-3">
                      <FormInput
                        label="Apprehension Date"
                        type="datetime-local"
                        value={formData.apprehension_date}
                        onChange={(v) => setField("apprehension_date", v)}
                      />

                      <FormInput
                        label="Location"
                        value={formData.location}
                        onChange={(v) => setField("location", v)}
                      />

                      <FormInput
                        label="Commission Rate"
                        type="number"
                        value={formData.commission_rate}
                        onChange={(v) => setField("commission_rate", v)}
                      />

                      <FormInput
                        label="Remarks"
                        value={formData.remarks}
                        onChange={(v) => setField("remarks", v)}
                        col="col-md-6"
                      />
                    </div>
                  </SectionBox>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-3 bg-white">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-4 px-4"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary rounded-4 px-4"
                onClick={onSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Save Apprehension"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

function SectionBox({ title, children }) {
  return (
    <div
      className="bg-white border shadow-sm rounded-4 p-3 h-100"
      style={{ borderColor: "#e5e7eb" }}
    >
      <div className="fw-bold mb-3 text-dark">{title}</div>
      {children}
    </div>
  );
}

function ViolationViewModal({
  show,
  row,
  saving,
  onClose,
  onEdit,
  onStartProcessing,
  onOpenPayment,
  onSettle,
  onImpound,
  onCancel,
  onDispute,
}) {
  if (!show || !row) return null;

  const raw = row.raw || {};
  const processors = raw.processors || [];
  const transactions = raw.transactions || [];

  const canStart = row.status === "New";
  const canRecordPayment = ["New", "On Process", "Disputed"].includes(row.status);
  const canSettle = row.status === "Paid";
  const canEdit = !["Paid", "Settled", "Cancelled"].includes(row.status);
  const canCancel = ["New", "On Process", "Disputed"].includes(row.status);
  const canDispute = ["New", "On Process"].includes(row.status);
  const canImpound = Boolean(raw.vehicle_id) && !["Settled", "Cancelled"].includes(row.status);

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header border-0">
              <div>
                <h5 className="modal-title fw-bold">Apprehension Details</h5>
                <div className="text-muted small">
                  View workflow status, assigned processors, payment, and actions.
                </div>
              </div>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <ViewItem label="Ticket No." value={row.ticketNo} />
                <ViewItem label="Status" value={<StatusBadge status={row.status} />} />
                <ViewItem label="Violation Code" value={row.violationCode} />
                <ViewItem label="Violation Date" value={row.violationDate} />
                <ViewItem label="Violation" value={row.violation} col="col-12" />
                <ViewItem label="Driver’s Name" value={row.driverName} />
                <ViewItem label="Classification" value={row.classification} />
                <ViewItem label="Location" value={row.location} />
                <ViewItem
                  label="Official Penalty"
                  value={money(row.officialPenalty)}
                />
                <ViewItem
                  label="Date Paid"
                  value={row.datePaid ? String(row.datePaid).slice(0, 10) : "unavailable"}
                />
                <ViewItem label="OR Number" value={row.orNumber || "—"} />
                <ViewItem
                  label="Enforcer(s)"
                  value={row.enforcers || "—"}
                  col="col-12"
                />

                <div className="col-md-6">
                  <div className="small text-muted mb-1">Processors</div>
                  <div className="bg-light rounded-4 px-3 py-3">
                    {processors.length ? (
                      processors.map((p) => (
                        <div key={p.id}>
                          <strong>{p.admin_name || "Admin"}</strong>
                          <div className="small text-muted">
                            {p.assigned_at ? String(p.assigned_at).slice(0, 16) : ""}
                            {p.notes ? ` • ${p.notes}` : ""}
                          </div>
                        </div>
                      ))
                    ) : (
                      "No processor yet"
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="small text-muted mb-1">Transactions</div>
                  <div className="bg-light rounded-4 px-3 py-3">
                    {transactions.length ? (
                      transactions.map((t) => (
                        <div key={t.id} className="mb-2">
                          <strong>{t.or_number || t.transaction_code}</strong>
                          <div className="small text-muted">
                            {money(t.amount_paid)} • {t.payment_method || "CASH"} •{" "}
                            {t.paid_at ? String(t.paid_at).slice(0, 10) : "No date"}
                          </div>
                        </div>
                      ))
                    ) : (
                      "No payment recorded"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 d-flex flex-wrap gap-2">
              {canStart && (
                <button
                  className="btn btn-info rounded-4 px-4"
                  type="button"
                  onClick={() => onStartProcessing(row)}
                  disabled={saving}
                >
                  Start Processing
                </button>
              )}

              {canRecordPayment && (
                <button
                  className="btn btn-success rounded-4 px-4"
                  type="button"
                  onClick={() => onOpenPayment(row)}
                  disabled={saving}
                >
                  Record Payment
                </button>
              )}

              {canSettle && (
                <button
                  className="btn btn-primary rounded-4 px-4"
                  type="button"
                  onClick={() => onSettle(row)}
                  disabled={saving}
                >
                  Settle / Release
                </button>
              )}

              {canImpound && (
                <button
                  className="btn btn-warning rounded-4 px-4"
                  type="button"
                  onClick={() => onImpound(row)}
                  disabled={saving}
                >
                  Impound Vehicle
                </button>
              )}

              {canEdit && (
                <button
                  className="btn btn-outline-primary rounded-4 px-4"
                  type="button"
                  onClick={() => onEdit(row)}
                  disabled={saving}
                >
                  Edit
                </button>
              )}

              {canDispute && (
                <button
                  className="btn btn-outline-danger rounded-4 px-4"
                  type="button"
                  onClick={() => onDispute(row)}
                  disabled={saving}
                >
                  Dispute
                </button>
              )}

              {canCancel && (
                <button
                  className="btn btn-danger rounded-4 px-4"
                  type="button"
                  onClick={() => onCancel(row)}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

              <button
                className="btn btn-light rounded-4 px-4"
                type="button"
                onClick={onClose}
                disabled={saving}
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

function PaymentModal({ show, row, form, setForm, saving, onClose, onSave }) {
  if (!show || !row) return null;

  function setField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header border-0">
              <div>
                <h5 className="modal-title fw-bold">Record Payment</h5>
                <div className="text-muted small">
                  {row.ticketNo} • {money(row.officialPenalty)}
                </div>
              </div>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <FormInput
                  label="OR Number"
                  value={form.or_number}
                  onChange={(v) => setField("or_number", v)}
                  col="col-12"
                />

                <FormInput
                  label="Amount Paid"
                  type="number"
                  value={form.amount_paid}
                  onChange={(v) => setField("amount_paid", v)}
                  col="col-12"
                />

                <div className="col-12">
                  <label className="form-label small text-muted">
                    Payment Method
                  </label>
                  <select
                    className="form-select rounded-4 bg-white"
                    value={form.payment_method}
                    onChange={(e) => setField("payment_method", e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="GCASH">GCash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <FormInput
                  label="Date Paid"
                  type="datetime-local"
                  value={form.paid_at}
                  onChange={(v) => setField("paid_at", v)}
                  col="col-12"
                />

                <FormInput
                  label="Remarks"
                  value={form.remarks}
                  onChange={(v) => setField("remarks", v)}
                  col="col-12"
                />
              </div>
            </div>

            <div className="modal-footer border-0">
              <button
                className="btn btn-outline-secondary rounded-4 px-4"
                type="button"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="btn btn-success rounded-4 px-4"
                type="button"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

function ReasonModal({
  show,
  type,
  row,
  value,
  onChange,
  saving,
  onClose,
  onSubmit,
}) {
  if (!show || !row) return null;

  const title = type === "cancel" ? "Cancel Apprehension" : "Dispute Apprehension";

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header border-0">
              <div>
                <h5 className="modal-title fw-bold">{title}</h5>
                <div className="text-muted small">{row.ticketNo}</div>
              </div>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <label className="form-label small text-muted">Reason</label>
              <textarea
                className="form-control rounded-4 bg-white"
                rows={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>

            <div className="modal-footer border-0">
              <button
                className="btn btn-outline-secondary rounded-4 px-4"
                type="button"
                onClick={onClose}
                disabled={saving}
              >
                Close
              </button>

              <button
                className={`btn rounded-4 px-4 ${
                  type === "cancel" ? "btn-danger" : "btn-warning"
                }`}
                type="button"
                onClick={onSubmit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Submit"}
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
  col = "col-md-6",
}) {
  return (
    <div className={col}>
      <label className="form-label small text-muted">{label}</label>
      <input
        type={type}
        className="form-control rounded-4 bg-white"
        placeholder={placeholder}
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RadioOption({ label, value, checked, onChange }) {
  return (
    <label className="form-check d-flex align-items-center gap-2">
      <input
        className="form-check-input border border-2 border-primary"
        style={{
          width: 18,
          height: 18,
          cursor: "pointer",
        }}
        type="radio"
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span className="form-check-label fw-medium text-dark">{label}</span>
    </label>
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
    Paid: "bg-success-subtle text-success-emphasis",
    Settled: "bg-success-subtle text-success-emphasis",
    Cancelled: "bg-danger-subtle text-danger-emphasis",
    Disputed: "bg-danger-subtle text-danger-emphasis",
  };

  return (
    <span className={`badge rounded-pill ${map[status] || "bg-secondary"}`}>
      {status}
    </span>
  );
}