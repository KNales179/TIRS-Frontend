// pages/DriverInfo.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getToken } from "../data/auth";
import AddVehicleModal from "../components/driverInfo/addVehicle";
import ViewVehicleCard from "../components/driverInfo/viewVehicleCard";

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

  if (!res.ok) throw new Error(data?.message || "Request failed");

  return data;
}

async function uploadFileRequest(file, payload) {
  const token = getToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", payload.category);
  formData.append("related_type", payload.related_type);
  formData.append("related_id", payload.related_id);

  const res = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Upload failed");
  }

  return data;
}

function normalizeDriverType(type) {
  const t = String(type || "").trim().toUpperCase();

  if (
    t === "REGISTERED" ||
    t === "REGULAR" ||
    t === "WITH FRANCHISE" ||
    t === "FRANCHISED" ||
    t === "FOR HAILING"
  ) return "WITH FRANCHISE";

  if (t === "SPECIAL" || t === "SPECIAL FRANCHISE") return "SPECIAL FRANCHISE";
  if (t === "COLORUM") return "COLORUM";
  if (t === "TEMPORARY") return "TEMPORARY";

  return t || "—";
}

function getFullName(driver) {
  return [
    driver?.first_name,
    driver?.middle_name,
    driver?.last_name,
    driver?.suffix,
  ].filter(Boolean).join(" ");
}

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { first_name: "", middle_name: null, last_name: "", suffix: null };
  }

  if (parts.length === 1) {
    return {
      first_name: parts[0],
      middle_name: null,
      last_name: parts[0],
      suffix: null,
    };
  }

  return {
    first_name: parts[0],
    middle_name: parts.length > 2 ? parts.slice(1, -1).join(" ") : null,
    last_name: parts[parts.length - 1],
    suffix: null,
  };
}

function normalizeBackendVehicle(vehicle) {
  return {
    id: vehicle.id || vehicle._id,
    plateNo: vehicle.plateNo || vehicle.plate_number || "",
    motor: vehicle.motor || vehicle.motor_number || "",
    chassis: vehicle.chassis || vehicle.chassis_number || "",
    modelMake: vehicle.modelMake || vehicle.model_make || "",
    color: vehicle.color || "",
    status: vehicle.status || "ACTIVE",
    raw: vehicle,
  };
}

function getFranchiseVehicleRef(franchise) {
  const ref =
    franchise.vehicle_id ||
    franchise.vehicleId ||
    franchise.vehicle ||
    franchise.vehicle_id_ref;

  if (ref && typeof ref === "object") {
    return ref.id || ref._id;
  }

  return ref || "";
}

function normalizeBackendFranchise(franchise, vehicles = []) {
  const vehicleRef = getFranchiseVehicleRef(franchise);

  const vehicleIndex = vehicles.findIndex(
    (vehicle) => String(vehicle.id) === String(vehicleRef)
  );

  return {
    id: franchise.id || franchise._id,
    vehicle_id: vehicleRef,
    vehicleIndex: vehicleIndex >= 0 ? vehicleIndex : undefined,

    number: franchise.number || franchise.franchise_number || "",
    franchise_type: franchise.franchise_type || franchise.type || "",
    toda_name: franchise.toda_name || franchise.todaName || "",
    route_area: franchise.route_area || franchise.routeArea || "",

    registration_date: franchise.registration_date
      ? String(franchise.registration_date).slice(0, 10)
      : franchise.registrationDate
      ? String(franchise.registrationDate).slice(0, 10)
      : "",

    expiry_date: franchise.expiry_date
      ? String(franchise.expiry_date).slice(0, 10)
      : franchise.expiryDate
      ? String(franchise.expiryDate).slice(0, 10)
      : "",

    status: franchise.status || "ACTIVE",
    raw: franchise,
  };
}

function normalizeBackendDriver(driver) {
  const vehicles = (driver.vehicles || []).map(normalizeBackendVehicle);

  const franchises = (driver.franchises || []).map((franchise) =>
    normalizeBackendFranchise(franchise, vehicles)
  );

  return {
    id: driver.id || driver._id,
    driver_code: driver.driver_code,
    type: driver.classification,
    classification: driver.classification,

    name: getFullName(driver),
    operatorName: driver.operator_name || "",
    contact: driver.contact_number || "",
    address: driver.address || "",
    photoUrl: driver.photo_url || "",

    birth_date: driver.birth_date || "",
    gender: driver.gender || "",
    license_number: driver.license_number || "",
    license_expiry: driver.license_expiry || "",

    vehicles,
    franchises,
    transactions: driver.transactions || [],
  };
}

function getDriverTypeBadge(type) {
  const normalized = normalizeDriverType(type);

  const map = {
    "WITH FRANCHISE": "bg-success-subtle text-success-emphasis",
    "SPECIAL FRANCHISE": "bg-primary-subtle text-primary-emphasis",
    COLORUM: "bg-warning-subtle text-warning-emphasis",
    TEMPORARY: "bg-info-subtle text-info-emphasis",
  };

  return (
    <span
      className={`badge rounded-pill px-3 py-2 ${
        map[normalized] || "bg-secondary-subtle text-secondary-emphasis"
      }`}
    >
      {normalized}
    </span>
  );
}

function getVehicleStatusBadge(status) {
  const s = String(status || "").toLowerCase();

  if (["unavailable", "impounded", "colorum", "unregistered"].includes(s)) {
    return (
      <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">
        {status || "—"}
      </span>
    );
  }

  if (s === "inactive") {
    return (
      <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis">
        {status || "—"}
      </span>
    );
  }

  return (
    <span className="badge rounded-pill bg-success-subtle text-success-emphasis">
      {status || "—"}
    </span>
  );
}

function getViolationStatusBadge(status) {
  const s = String(status || "").toLowerCase();

  if (["done", "paid", "settled"].includes(s)) {
    return (
      <span className="badge rounded-pill bg-success-subtle text-success-emphasis">
        {status}
      </span>
    );
  }

  if (s === "on process") {
    return (
      <span className="badge rounded-pill bg-info-subtle text-info-emphasis">
        {status}
      </span>
    );
  }

  return (
    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">
      {status || "—"}
    </span>
  );
}

function formatMoney(value) {
  if (value == null || value === "") return "—";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value || 0));
}

function displayStatus(status) {
  const s = String(status || "NEW").toUpperCase();

  if (s === "ON_PROCESS") return "On Process";
  if (s === "PAID") return "Paid";
  if (s === "SETTLED") return "Settled";
  if (s === "DONE") return "Done";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "DISPUTED") return "Disputed";

  return "New";
}

function normalizeApprehension(item) {
  const violations = item.violations || [];
  const enforcers = item.enforcers || [];
  const transactions = item.transactions || [];

  const latestPayment =
    transactions.find((t) => t.action_taken === "PAYMENT_RECORDED") ||
    transactions[0] ||
    null;

  return {
    id: item.id,
    ticketNo: item.ticket_number || item.ticketNo || "—",
    date: item.apprehension_date ? String(item.apprehension_date).slice(0, 10) : "—",
    violation:
      violations.map((v) => v.name || v.violation_name).filter(Boolean).join(", ") ||
      item.violation ||
      item.violation_name ||
      "—",
    location: item.location || "—",
    officialFine: item.total_penalty || item.penalty_amount || 0,
    status: displayStatus(item.status),
    enforcers:
      enforcers.map((e) => e.enforcer_name || e.name).filter(Boolean).join(", ") ||
      item.enforcer_name ||
      item.enforcers ||
      "—",
    plateNumber: item.plate_number || item.plateNo || "—",
    vehicleId: item.vehicle_id || null,
    orNumber: latestPayment?.or_number || item.or_number || null,
    datePaid: latestPayment?.paid_at || item.paid_at || null,
    raw: item,
  };
}

function computeVehicleApprehensionSummary(vehicle, apprehensions) {
  const vehicleId = vehicle?.id;
  const related = vehicleId
    ? apprehensions.filter((item) => Number(item.vehicleId) === Number(vehicleId))
    : [];

  const total = related.length;
  const unresolved = related.filter((item) => {
    const s = String(item.status || "").toLowerCase();
    return !["done", "paid", "settled", "cancelled"].includes(s);
  }).length;

  return { total, unresolved };
}

function InfoInput({ label, value, isEdit, onChange, col = "col-md-6" }) {
  return (
    <div className={col}>
      <div className="text-muted small mb-1">{label}</div>
      {isEdit ? (
        <input
          className="form-control bg-light border-0 rounded-4 px-3 py-3"
          value={value || ""}
          onChange={onChange}
        />
      ) : (
        <div className="bg-light border-0 rounded-4 px-3 py-3">
          {value || "—"}
        </div>
      )}
    </div>
  );
}

export default function DriverInfo() {
  const { id } = useParams();
  const nav = useNavigate();

  const [driver, setDriver] = useState(null);
  const [draft, setDraft] = useState(null);
  const [apprehensions, setApprehensions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [isEdit, setIsEdit] = useState(false);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState(null);
  const [showAddFranchiseModal, setShowAddFranchiseModal] = useState(false);

  const [newFranchise, setNewFranchise] = useState({
    franchise_number: "",
    franchise_type: "REGULAR",
    toda_name: "",
    route_area: "",
    registration_date: "",
    expiry_date: "",
  });

  const [newVehicle, setNewVehicle] = useState({
    motor: "",
    modelMake: "",
    chassis: "",
    plateNo: "",
    color: "",
  });


  async function fetchDriver() {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest(`/drivers/${id}`);
      const rawDriver = response.data || response.driver || response.user;

      if (!rawDriver) throw new Error("Driver not found");

      const normalized = normalizeBackendDriver(rawDriver);
      const apprehensionResponse = await apiRequest(`/apprehensions/driver/${id}`);
      const apprehensionList = apprehensionResponse.data || apprehensionResponse.apprehensions || [];

      setDriver(normalized);
      setDraft(normalized);
      setApprehensions(apprehensionList.map(normalizeApprehension));
      setSelectedVehicleIndex(0);
      setSelectedFranchiseId(normalized.franchises?.[0]?.id || "");
      setIsEdit(false);
    } catch (err) {
      setError(err.message || "Failed to load driver");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDriver();
  }, [id]);

  if (loading) {
    return (
      <div className="alert alert-info rounded-4">
        Loading driver information...
      </div>
    );
  }

  if (error || !driver || !draft) {
    return (
      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">
          <div className="fw-bold">{error || "Driver not found."}</div>
          <button className="btn btn-primary mt-3 rounded-4" onClick={() => nav(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const driverType = normalizeDriverType(draft.type);
  const isColorum = driverType === "COLORUM";

  const vehicles = draft.vehicles || [];
  const franchises = draft.franchises || [];
  const hasMultipleFranchises = !isColorum && franchises.length >= 2;

  const selectedFranchise = !isColorum
    ? franchises.find((f) => String(f.id) === String(selectedFranchiseId)) ||
      franchises[0] ||
      null
    : null;

  const resolvedVehicleIndex = !isColorum
    ? selectedFranchise?.vehicleIndex ?? 0
    : selectedVehicleIndex;

  const selectedVehicle = vehicles[resolvedVehicleIndex] || null;

  // Show ALL apprehensions connected to this driver/profile.
  // The vehicle table already shows per-vehicle counts, but the history table
  // should not hide records just because another vehicle row/franchise is selected.
  const visibleApprehensions = apprehensions;

  function getFranchiseByVehicleIndex(index) {
    const vehicle = vehicles[index];

    if (!vehicle?.id) return null;

    return (
      franchises.find(
        (franchise) =>
          String(franchise.vehicle_id) === String(vehicle.id) ||
          Number(franchise.vehicleIndex) === Number(index)
      ) || null
    );
  }

  function setField(key) {
    return (e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");

      const nameParts = splitName(draft.name);

      const payload = {
        classification: draft.classification || "REGULAR",
        operator_name: draft.operatorName || null,
        first_name: nameParts.first_name,
        middle_name: nameParts.middle_name,
        last_name: nameParts.last_name,
        suffix: nameParts.suffix,
        contact_number: draft.contact || null,
        address: draft.address || null,
        birth_date: draft.birth_date || null,
        gender: draft.gender || null,
        license_number: draft.license_number || null,
        license_expiry: draft.license_expiry || null,
        photo_url: draft.photoUrl || null,
        status: "ACTIVE",
      };

      await apiRequest(`/drivers/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await fetchDriver();
      setIsEdit(false);
      alert("Driver information saved.");
    } catch (err) {
      setError(err.message || "Failed to save driver");
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      setError("");

      const uploadResponse = await uploadFileRequest(file, {
        category: "PROFILE_PHOTO",
        related_type: "DRIVER",
        related_id: id,
      });

      const photoUrl =
        uploadResponse?.data?.secure_url ||
        uploadResponse?.data?.file_url ||
        "";

      if (!photoUrl) {
        throw new Error("Upload succeeded but no photo URL was returned.");
      }

      const nameParts = splitName(draft.name);

      await apiRequest(`/drivers/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          classification: draft.classification || "REGULAR",
          operator_name: draft.operatorName || null,
          first_name: nameParts.first_name,
          middle_name: nameParts.middle_name,
          last_name: nameParts.last_name,
          suffix: nameParts.suffix,
          contact_number: draft.contact || null,
          address: draft.address || null,
          birth_date: draft.birth_date || null,
          gender: draft.gender || null,
          license_number: draft.license_number || null,
          license_expiry: draft.license_expiry || null,
          photo_url: photoUrl,
          status: "ACTIVE",
        }),
      });

      setDraft((prev) => ({
        ...prev,
        photoUrl,
      }));

      setDriver((prev) => ({
        ...prev,
        photoUrl,
      }));

      alert("Profile photo uploaded successfully.");
    } catch (err) {
      setError(err.message || "Failed to upload profile photo");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  }

  function handleFranchiseChange(e) {
    setSelectedFranchiseId(e.target.value);
  }

  function handleVehicleSelect(index) {
    setSelectedVehicleIndex(index);
  }

  function handleNewVehicleChange(key, value) {
    setNewVehicle((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetNewVehicleForm() {
    setNewVehicle({
      motor: "",
      modelMake: "",
      chassis: "",
      plateNo: "",
      color: "",
    });
  }

  function handleCloseAddVehicleModal() {
    setShowAddVehicleModal(false);
    resetNewVehicleForm();
  }

  async function handleAddVehicle(e) {
    e.preventDefault();

    if (!newVehicle.motor || !newVehicle.modelMake || !newVehicle.plateNo) {
      alert("Please complete Motor, Model/Make, and Plate Number.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        plate_number: newVehicle.plateNo || null,
        motor_number: newVehicle.motor || null,
        chassis_number: newVehicle.chassis || null,
        model_make: newVehicle.modelMake || null,
        color: newVehicle.color || null,
      };

      await apiRequest(`/drivers/${id}/vehicles`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await fetchDriver();
      setShowAddVehicleModal(false);
      resetNewVehicleForm();
    } catch (err) {
      setError(err.message || "Failed to add vehicle");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenVehicleDetails(vehicle, index) {
    const franchise = getFranchiseByVehicleIndex(index);

    setSelectedVehicleDetails({
      vehicle,
      vehicleIndex: index,
      franchise,
    });
  }

  function handleCloseVehicleDetails() {
    setSelectedVehicleDetails(null);
  }

  function handleAddFranchiseFromDetails() {
    if (!selectedVehicleDetails?.vehicle?.id) {
      alert("Vehicle ID missing. Please reload the page.");
      return;
    }

    setShowAddFranchiseModal(true);
  }

  function handleNewFranchiseChange(key, value) {
    setNewFranchise((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetNewFranchiseForm() {
    setNewFranchise({
      franchise_number: "",
      franchise_type: "REGULAR",
      toda_name: "",
      route_area: "",
      registration_date: "",
      expiry_date: "",
    });
  }

  async function handleSubmitAddFranchise(e) {
    e.preventDefault();

    if (!selectedVehicleDetails?.vehicle?.id) {
      alert("Vehicle ID missing. Please reload the page.");
      return;
    }

    if (!newFranchise.franchise_number) {
      alert("Franchise number is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiRequest(
        `/drivers/${id}/vehicles/${selectedVehicleDetails.vehicle.id}/franchise`,
        {
          method: "POST",
          body: JSON.stringify({
            franchise_number: newFranchise.franchise_number || null,
            franchise_type: newFranchise.franchise_type || "REGULAR",
            toda_name: newFranchise.toda_name || null,
            route_area: newFranchise.route_area || null,
            registration_date: newFranchise.registration_date || null,
            expiry_date: newFranchise.expiry_date || null,
          }),
        }
      );

      await fetchDriver();

      setShowAddFranchiseModal(false);
      setSelectedVehicleDetails(null);
      resetNewFranchiseForm();

      alert("Franchise added successfully.");
    } catch (err) {
      setError(err.message || "Failed to add franchise");
    } finally {
      setSaving(false);
    }
  }

  function handleCloseAddFranchiseModal() {
    setShowAddFranchiseModal(false);
    resetNewFranchiseForm();
  }

  async function handleSaveVehicleEdit(vehicle) {
    if (!vehicle?.id) {
      alert("Vehicle ID missing. Please reload the page.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        plate_number: vehicle.plateNo || null,
        motor_number: vehicle.motor || null,
        chassis_number: vehicle.chassis || null,
        model_make: vehicle.modelMake || null,
        color: vehicle.color || null,
        status: vehicle.status || "UNREGISTERED",
      };

      await apiRequest(`/drivers/${id}/vehicles/${vehicle.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await fetchDriver();
      setSelectedVehicleDetails(null);
      alert("Vehicle updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update vehicle");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkVehicleStatus(vehicle, status) {
    if (!vehicle?.id) {
      alert("Vehicle ID missing. Please reload the page.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        plate_number: vehicle.plateNo || null,
        motor_number: vehicle.motor || null,
        chassis_number: vehicle.chassis || null,
        model_make: vehicle.modelMake || null,
        color: vehicle.color || null,
        status,
      };

      await apiRequest(`/drivers/${id}/vehicles/${vehicle.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await fetchDriver();
      setSelectedVehicleDetails(null);
      alert(`Vehicle marked as ${status}.`);
    } catch (err) {
      setError(err.message || `Failed to mark vehicle as ${status}`);
    } finally {
      setSaving(false);
    }
  }

  function handleOpenAddApprehension() {
    nav("/violations", {
      state: {
        driverId: driver.id,
        vehicleId: selectedVehicle?.id || null,
      },
    });
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 no-print">
        <h1 className="h4 fw-bold mb-0">Driver’s Information</h1>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary rounded-4" onClick={handlePrint} type="button" title="Print">
            <i className="bi bi-printer" />
          </button>

          <button className="btn btn-outline-primary rounded-4" onClick={() => nav(-1)} type="button" title="Back">
            <i className="bi bi-arrow-left" />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger rounded-4 py-2">{error}</div>}

      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body" id="print-driver-info">
          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <div className="row g-3">
                <InfoInput label="Driver’s Name" value={draft.name} isEdit={isEdit} onChange={setField("name")} />
                <InfoInput label="Operator’s Name" value={draft.operatorName} isEdit={isEdit} onChange={setField("operatorName")} />
                <InfoInput label="Contact Number" value={draft.contact} isEdit={isEdit} onChange={setField("contact")} />

                {!isColorum && (
                  <InfoInput label="TODA" value={selectedFranchise?.toda_name || ""} isEdit={false} onChange={() => {}} />
                )}

                {!isColorum && !hasMultipleFranchises && (
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">Franchise Number</div>
                    <div className="bg-light border-0 rounded-4 px-3 py-3">
                      {selectedFranchise?.number || "—"}
                    </div>
                  </div>
                )}

                {hasMultipleFranchises && (
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">Select Franchise</div>
                    <select
                      className="form-select bg-light border-0 rounded-4 px-3 py-3"
                      value={selectedFranchise?.id || ""}
                      onChange={handleFranchiseChange}
                    >
                      {franchises.map((franchise) => (
                        <option key={franchise.id} value={franchise.id}>
                          {franchise.number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <InfoInput label="Address" value={draft.address} isEdit={isEdit} onChange={setField("address")} col="col-12" />

              </div>
            </div>

            <div className="col-lg-4 d-flex justify-content-center">
              <div className="text-center">
                <div className="position-relative mx-auto" style={{ width: 220, height: 220 }}>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                    style={{ width: "100%", height: "100%", background: "#e5e7eb" }}
                  >
                    {draft.photoUrl ? (
                      <img src={draft.photoUrl} alt="Driver" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="bi bi-person-fill" style={{ fontSize: 90, color: "#9ca3af" }} />
                    )}
                  </div>

                  <label
                    className="position-absolute no-print d-flex align-items-center justify-content-center"
                    style={{
                      bottom: 6,
                      right: 6,
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "#9ca3af",
                      color: "#fff",
                      cursor: "pointer",
                      border: "4px solid #fff",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    }}
                    title="Upload Photo"
                  >
                    <i className="bi bi-plus-lg" style={{ fontSize: 20 }} />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={saving}
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>

                <div className="mt-3">{getDriverTypeBadge(driverType)}</div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-3">
                <div className="col-12 mt-2">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <div className="fw-semibold mb-0">
                        {isColorum ? "Vehicle Records" : "Franchise / Vehicle Records"}
                      </div>
                      {vehicles.length === 0 && (
                        <div className="small text-muted no-print">
                          No vehicle yet. Add a vehicle record below.
                        </div>
                      )}
                    </div>

                    <button
                      className="btn btn-sm btn-primary rounded-4 px-3 no-print"
                      type="button"
                      onClick={() => setShowAddVehicleModal(true)}
                    >
                      + Add Vehicle
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="tfro-table">
                      <thead>
                        <tr className="text-white" style={{ background: "#000000" }}>
                          {!isColorum && <th className="text-white">Franchise No.</th>}
                          <th className="text-white">Motor</th>
                          <th className="text-white">Model/Make</th>
                          <th className="text-white">Chassis</th>
                          <th className="text-white">Plate Number</th>
                          <th className="text-white">Color</th>
                          <th className="text-white">Status</th>
                          <th className="text-white">Apprehensions</th>
                          <th className="text-white no-print">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {vehicles.length === 0 ? (
                          <tr>
                            <td colSpan={isColorum ? 8 : 9} className="text-center text-muted">
                              No vehicle records found.
                            </td>
                          </tr>
                        ) : isColorum ? (
                          vehicles.map((veh, index) => {
                            const summary = computeVehicleApprehensionSummary(veh, apprehensions);

                            return (
                              <tr
                                key={`${veh.plateNo || "vehicle"}-${index}`}
                                onClick={() => handleVehicleSelect(index)}
                                style={{
                                  background: index === selectedVehicleIndex ? "#eef2ff" : "",
                                  cursor: "pointer",
                                }}
                              >
                                <VehicleCells veh={veh} summary={summary} onView={() => handleOpenVehicleDetails(veh, index)} />
                              </tr>
                            );
                          })
                        ) : (
                          vehicles.map((veh, originalIndex) => {
                            const franchise = getFranchiseByVehicleIndex(originalIndex);
                            const summary = computeVehicleApprehensionSummary(veh, apprehensions);

                            return (
                              <tr key={`${veh.plateNo || "vehicle"}-${originalIndex}`}>
                                <td>{franchise?.number || "—"}</td>
                                <VehicleCells veh={veh} summary={summary} onView={() => handleOpenVehicleDetails(veh, originalIndex)} />
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-12 mt-2">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <div className="fw-semibold mb-0">Apprehension History</div>
                      <div className="small text-muted no-print">
                        Showing real apprehension records connected to this driver/profile.
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="tfro-table">
                      <thead>
                        <tr className="text-white" style={{ background: "#000000" }}>
                          <th className="text-white">Ticket No.</th>
                          <th className="text-white">Date</th>
                          <th className="text-white">Violation</th>
                          <th className="text-white">Location</th>
                          <th className="text-white">Plate No.</th>
                          <th className="text-white">Official Fine</th>
                          <th className="text-white">OR Number</th>
                          <th className="text-white">Date Paid</th>
                          <th className="text-white">Status</th>
                          <th className="text-white">Enforcer(s)</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleApprehensions.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="text-center text-muted">
                              No apprehension history found.
                            </td>
                          </tr>
                        ) : (
                          visibleApprehensions.map((item) => (
                            <tr key={item.id || item.ticketNo}>
                              <td>{item.ticketNo}</td>
                              <td>{item.date}</td>
                              <td>{item.violation}</td>
                              <td>{item.location}</td>
                              <td>{item.plateNumber}</td>
                              <td>{formatMoney(item.officialFine)}</td>
                              <td>{item.orNumber || "—"}</td>
                              <td>{item.datePaid ? String(item.datePaid).slice(0, 10) : "—"}</td>
                              <td>{getViolationStatusBadge(item.status)}</td>
                              <td>{item.enforcers}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 no-print">
                    <Link to={`/profiles/${driver.id}/transactions`} className="link-primary">
                      View Transaction Details
                    </Link>
                  </div>
                </div>
          </div>
        </div>

        <div className="d-flex justify-content-end align-items-center p-4 no-print">
          <div className="d-flex gap-3">
            <button className="btn btn-primary rounded-4 px-5" type="button" onClick={() => setIsEdit(true)} disabled={isEdit || saving}>
              Edit
            </button>

            <button className="btn btn-primary rounded-4 px-5" type="button" onClick={handleSave} disabled={!isEdit || saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {showAddVehicleModal && (
        <AddVehicleModal
          newVehicle={newVehicle}
          onChange={handleNewVehicleChange}
          onClose={handleCloseAddVehicleModal}
          onSubmit={handleAddVehicle}
          saving={saving}
        />
      )}

      {selectedVehicleDetails && (
        <ViewVehicleCard
          details={selectedVehicleDetails}
          onClose={handleCloseVehicleDetails}
          onSaveVehicle={handleSaveVehicleEdit}
          onAddFranchise={handleAddFranchiseFromDetails}
          onMarkStatus={handleMarkVehicleStatus}
          saving={saving}
        />
      )}

      {showAddFranchiseModal && (
        <AddFranchiseModal
          newFranchise={newFranchise}
          onChange={handleNewFranchiseChange}
          onClose={handleCloseAddFranchiseModal}
          onSubmit={handleSubmitAddFranchise}
          saving={saving}
        />
      )}
    </div>
  );
}

function VehicleCells({ veh, summary, onView }) {
  return (
    <>
      <td>{veh.motor || "—"}</td>
      <td>{veh.modelMake || "—"}</td>
      <td>{veh.chassis || "—"}</td>
      <td>{veh.plateNo || "—"}</td>
      <td>{veh.color || "—"}</td>
      <td>{getVehicleStatusBadge(veh.status)}</td>

      <td>
        <div className="d-flex flex-column align-items-start gap-1">
          <span className="badge rounded-pill bg-light text-dark border">
            {summary.total} total
          </span>

          {summary.unresolved > 0 && (
            <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">
              {summary.unresolved} pending
            </span>
          )}
        </div>
      </td>

      <td className="no-print">
        <button
          className="btn btn-sm btn-outline-primary rounded-4 px-3"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          View
        </button>
      </td>
    </>
  );
}

function AddFranchiseModal({
  newFranchise,
  onChange,
  onClose,
  onSubmit,
  saving,
}) {
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow">
            <form onSubmit={onSubmit}>
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold">Add Franchise</h5>
                  <div className="small text-muted">
                    Attach one franchise record to this vehicle.
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  disabled={saving}
                />
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  <FormInput
                    label="Franchise Number"
                    value={newFranchise.franchise_number}
                    onChange={(v) => onChange("franchise_number", v)}
                    placeholder="Example: FR-2026-001"
                  />

                  <div className="col-md-6">
                    <label className="form-label small text-muted">
                      Franchise Type
                    </label>
                    <select
                      className="form-select rounded-4"
                      value={newFranchise.franchise_type}
                      onChange={(e) =>
                        onChange("franchise_type", e.target.value)
                      }
                    >
                      <option value="REGULAR">REGULAR</option>
                      <option value="SPECIAL">SPECIAL</option>
                    </select>
                  </div>

                  <FormInput
                    label="TODA Name"
                    value={newFranchise.toda_name}
                    onChange={(v) => onChange("toda_name", v)}
                    placeholder="Example: Ibabang Dupay TODA"
                  />

                  <FormInput
                    label="Route Area"
                    value={newFranchise.route_area}
                    onChange={(v) => onChange("route_area", v)}
                    placeholder="Example: Lucena City"
                  />

                  <FormInput
                    label="Registration Date"
                    type="date"
                    value={newFranchise.registration_date}
                    onChange={(v) => onChange("registration_date", v)}
                  />

                  <FormInput
                    label="Expiry Date"
                    type="date"
                    value={newFranchise.expiry_date}
                    onChange={(v) => onChange("expiry_date", v)}
                  />
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-4 px-4"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary rounded-4 px-4"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Add Franchise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

function FormInput({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <div className="col-md-6">
      <label className="form-label small text-muted">{label}</label>
      <input
        type={type}
        className="form-control rounded-4"
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}