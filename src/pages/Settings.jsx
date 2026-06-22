// pages/Settings.jsx
import { useEffect, useMemo, useState } from "react";
import { getToken } from "../data/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const lucenaBarangays = [
  "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5",
  "Barangay 6", "Barangay 7", "Barangay 8", "Barangay 9", "Barangay 10",
  "Barangay 11", "Barra", "Bocohan", "Cotta", "Dalahican", "Domoit",
  "Gulang-Gulang", "Ibabang Dupay", "Ibabang Iyam", "Ibabang Talim",
  "Ilayang Dupay", "Ilayang Iyam", "Ilayang Talim", "Isabang", "Market View",
  "Mayao Castillo", "Mayao Crossing", "Mayao Kanluran", "Mayao Parada",
  "Mayao Silangan", "Ransohan", "Salinas", "Talao-Talao",
];

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

function getCurrentUserFromToken() {
  const token = getToken();

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return {
      id: payload.id || payload.admin_id || payload.user_id,
      username: payload.username,
      role: payload.role,
      fullName: payload.full_name || payload.fullName,
    };
  } catch (err) {
    return null;
  }
}

function money(n) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(n || 0));
}

function emptyMembers() {
  return ["", "", "", "", ""];
}

function normalizeViolation(item) {
  return {
    id: item.id,
    code: item.violation_code || item.code || "",
    name: item.name || "",
    group: item.group_name || item.group || "Ungrouped",
    offenseLevel: item.offense_level || item.offenseLevel || 1,
    penalty: item.penalty_amount || item.penalty || 0,
    status: item.status || "ACTIVE",
  };
}

function normalizeToda(item) {
  const officersArray = Array.isArray(item.officers) ? item.officers : [];
  const membersArray = Array.isArray(item.members) ? item.members : [];

  const officers = {
    president: "",
    vicePresident: "",
    secretary: "",
    treasurer: "",
  };

  officersArray.forEach((officer) => {
    const position = String(officer.position || "").toUpperCase();
    if (position === "PRESIDENT") officers.president = officer.full_name || "";
    if (position === "VICE_PRESIDENT") officers.vicePresident = officer.full_name || "";
    if (position === "SECRETARY") officers.secretary = officer.full_name || "";
    if (position === "TREASURER") officers.treasurer = officer.full_name || "";
  });

  return {
    id: item.id,
    todaCode: item.toda_code || "",
    name: item.name || "",
    barangay: item.barangay || "Unassigned",
    status: item.status || "ACTIVE",
    officers,
    members: membersArray.map((member) => ({
      id: member.id,
      fullName: member.full_name || "",
      status: member.status || "ACTIVE",
    })),
  };
}

function buildOfficersPayload(form) {
  return [
    { position: "PRESIDENT", full_name: form.president },
    { position: "VICE_PRESIDENT", full_name: form.vicePresident },
    { position: "SECRETARY", full_name: form.secretary },
    { position: "TREASURER", full_name: form.treasurer },
  ].filter((item) => item.full_name?.trim());
}

function buildMembersPayload(form) {
  return form.members
    .map((member) => String(member || "").trim())
    .filter(Boolean)
    .map((full_name) => ({ full_name }));
}

export default function Settings() {
  const [tab, setTab] = useState("general");
  const currentUser = getCurrentUserFromToken();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState(null);

  const [adminForm, setAdminForm] = useState({
    username: "",
    temporaryPassword: "",
    role: "ADMIN",
  });

  const [violations, setViolations] = useState([]);
  const [todas, setTodas] = useState([]);
  const [commissionRate, setCommissionRate] = useState(0.2);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [violationForm, setViolationForm] = useState({
    code: "",
    name: "",
    group: "",
    offenseLevel: 1,
    penalty: "",
    status: "ACTIVE",
  });

  const [editingViolationId, setEditingViolationId] = useState(null);
  const [editingTodaId, setEditingTodaId] = useState(null);

  const [memberForm, setMemberForm] = useState({
    todaId: null,
    memberName: "",
  });

  const [todaForm, setTodaForm] = useState({
    barangay: lucenaBarangays[0],
    name: "",
    president: "",
    vicePresident: "",
    secretary: "",
    treasurer: "",
    members: emptyMembers(),
    status: "ACTIVE",
  });

  async function fetchSettingsData() {
    try {
      setLoading(true);
      setError("");

      const [violationRes, todaRes, commissionRes] = await Promise.all([
        apiRequest("/violation-types"),
        apiRequest("/todas"),
        apiRequest("/settings/commission-rate"),
      ]);

      setViolations((violationRes.data || []).map(normalizeViolation));
      setTodas((todaRes.data || []).map(normalizeToda));
      setCommissionRate(Number(commissionRes.data?.commission_rate ?? 0.2));
    } catch (err) {
      setError(err.message || "Failed to load settings data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const activeViolations = useMemo(
    () => violations.filter((item) => item.status !== "INACTIVE"),
    [violations]
  );

  const activeTodas = useMemo(
    () => todas.filter((item) => item.status !== "INACTIVE"),
    [todas]
  );

  const barangayToda = useMemo(() => {
    return lucenaBarangays.map((barangay) => ({
      barangay,
      todas: activeTodas.filter((toda) => toda.barangay === barangay),
    }));
  }, [activeTodas]);

  const totalMembers = useMemo(() => {
    return activeTodas.reduce((sum, toda) => {
      const officersCount = Object.values(toda.officers || {}).filter(Boolean).length;
      const membersCount = (toda.members || []).filter((m) => m.status !== "INACTIVE").length;
      return sum + officersCount + membersCount;
    }, 0);
  }, [activeTodas]);

  const groupedViolations = useMemo(() => {
    return activeViolations.reduce((acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    }, {});
  }, [activeViolations]);

  function resetViolationForm() {
    setViolationForm({
      code: "",
      name: "",
      group: "",
      offenseLevel: 1,
      penalty: "",
      status: "ACTIVE",
    });
  }

  function resetTodaForm(barangay = lucenaBarangays[0]) {
    setTodaForm({
      barangay,
      name: "",
      president: "",
      vicePresident: "",
      secretary: "",
      treasurer: "",
      members: emptyMembers(),
      status: "ACTIVE",
    });
  }

  function tabBtn(key, label, icon) {
    return (
      <button
        type="button"
        className={`btn rounded-4 px-3 py-2 ${
          tab === key ? "btn-primary shadow-sm" : "btn-light border"
        }`}
        onClick={() => setTab(key)}
      >
        <i className={`bi ${icon} me-2`} />
        {label}
      </button>
    );
  }

  async function createAdminAccount() {
    try {
      if (!isSuperAdmin) {
        alert("Only SUPER_ADMIN can create admin accounts.");
        return;
      }

      if (!adminForm.username.trim()) {
        alert("Username is required.");
        return;
      }

      if (!adminForm.temporaryPassword.trim()) {
        alert("Temporary password is required.");
        return;
      }

      if (adminForm.temporaryPassword.trim().length < 6) {
        alert("Temporary password must be at least 6 characters.");
        return;
      }

      setSaving(true);
      setError("");
      setCreatedAdmin(null);

      const res = await apiRequest("/admins", {
        method: "POST",
        body: JSON.stringify({
          username: adminForm.username.trim(),
          temporary_password: adminForm.temporaryPassword.trim(),
          role: adminForm.role,
        }),
      });

      setCreatedAdmin(res.data || null);

      setAdminForm({
        username: "",
        temporaryPassword: "",
        role: "ADMIN",
      });

      alert("Account created successfully.");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  async function saveCommissionRate() {
    try {
      setSaving(true);
      setError("");
      await apiRequest("/settings/commission-rate", {
        method: "PUT",
        body: JSON.stringify({ commission_rate: Number(commissionRate || 0) }),
      });
      await fetchSettingsData();
      alert("Incentive rate saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save incentive rate");
    } finally {
      setSaving(false);
    }
  }

  async function addViolation() {
    try {
      if (!violationForm.code || !violationForm.name || !violationForm.group) {
        alert("Please complete code, violation name, and group.");
        return;
      }

      setSaving(true);
      setError("");
      await apiRequest("/violation-types", {
        method: "POST",
        body: JSON.stringify({
          violation_code: violationForm.code,
          name: violationForm.name,
          group_name: violationForm.group,
          offense_level: Number(violationForm.offenseLevel || 1),
          penalty_amount: Number(violationForm.penalty || 0),
          status: violationForm.status || "ACTIVE",
        }),
      });

      resetViolationForm();
      await fetchSettingsData();
      alert("Violation added successfully.");
    } catch (err) {
      setError(err.message || "Failed to add violation");
    } finally {
      setSaving(false);
    }
  }

  function startEditViolation(violation) {
    setEditingViolationId(violation.id);
    setViolationForm({
      code: violation.code,
      name: violation.name,
      group: violation.group,
      offenseLevel: violation.offenseLevel,
      penalty: violation.penalty,
      status: violation.status || "ACTIVE",
    });
  }

  async function saveEditViolation() {
    try {
      setSaving(true);
      setError("");
      await apiRequest(`/violation-types/${editingViolationId}`, {
        method: "PUT",
        body: JSON.stringify({
          violation_code: violationForm.code,
          name: violationForm.name,
          group_name: violationForm.group,
          offense_level: Number(violationForm.offenseLevel || 1),
          penalty_amount: Number(violationForm.penalty || 0),
          status: violationForm.status || "ACTIVE",
        }),
      });

      setEditingViolationId(null);
      resetViolationForm();
      await fetchSettingsData();
      alert("Violation updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update violation");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditViolation() {
    setEditingViolationId(null);
    resetViolationForm();
  }

  async function deleteViolation(id) {
    if (!confirm("Mark this violation as inactive?")) return;

    try {
      setSaving(true);
      setError("");
      await apiRequest(`/violation-types/${id}`, { method: "DELETE" });
      await fetchSettingsData();
      alert("Violation marked as inactive.");
    } catch (err) {
      setError(err.message || "Failed to delete violation");
    } finally {
      setSaving(false);
    }
  }

  async function addToda() {
    try {
      if (!todaForm.barangay || !todaForm.name) {
        alert("Please select barangay and enter TODA name.");
        return;
      }

      setSaving(true);
      setError("");
      await apiRequest("/todas", {
        method: "POST",
        body: JSON.stringify({
          name: todaForm.name,
          barangay: todaForm.barangay,
          status: todaForm.status || "ACTIVE",
          officers: buildOfficersPayload(todaForm),
          members: buildMembersPayload(todaForm),
        }),
      });

      resetTodaForm(todaForm.barangay);
      await fetchSettingsData();
      alert("TODA added successfully.");
    } catch (err) {
      setError(err.message || "Failed to add TODA");
    } finally {
      setSaving(false);
    }
  }

  function startEditToda(toda) {
    const existingMembers = (toda.members || [])
      .filter((member) => member.status !== "INACTIVE")
      .map((member) => member.fullName);

    setEditingTodaId(toda.id);
    setTodaForm({
      barangay: toda.barangay,
      name: toda.name || "",
      president: toda.officers?.president || "",
      vicePresident: toda.officers?.vicePresident || "",
      secretary: toda.officers?.secretary || "",
      treasurer: toda.officers?.treasurer || "",
      members: [
        ...existingMembers,
        ...Array(Math.max(5, existingMembers.length) - existingMembers.length).fill(""),
      ],
      status: toda.status || "ACTIVE",
    });
  }

  async function saveEditToda() {
    try {
      setSaving(true);
      setError("");
      await apiRequest(`/todas/${editingTodaId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: todaForm.name,
          barangay: todaForm.barangay,
          status: todaForm.status || "ACTIVE",
          officers: buildOfficersPayload(todaForm),
          members: buildMembersPayload(todaForm),
        }),
      });

      const currentBarangay = todaForm.barangay;
      setEditingTodaId(null);
      resetTodaForm(currentBarangay);
      await fetchSettingsData();
      alert("TODA updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update TODA");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditToda() {
    const currentBarangay = todaForm.barangay;
    setEditingTodaId(null);
    resetTodaForm(currentBarangay);
  }

  async function addMemberToToda(todaId) {
    try {
      if (!memberForm.memberName.trim()) return;

      setSaving(true);
      setError("");
      await apiRequest(`/todas/${todaId}/members`, {
        method: "POST",
        body: JSON.stringify({ full_name: memberForm.memberName.trim() }),
      });

      setMemberForm({ todaId: null, memberName: "" });
      await fetchSettingsData();
      alert("Member added successfully.");
    } catch (err) {
      setError(err.message || "Failed to add member");
    } finally {
      setSaving(false);
    }
  }

  async function deleteToda(id) {
    if (!confirm("Mark this TODA as inactive?")) return;

    try {
      setSaving(true);
      setError("");
      await apiRequest(`/todas/${id}`, { method: "DELETE" });
      await fetchSettingsData();
      alert("TODA marked as inactive.");
    } catch (err) {
      setError(err.message || "Failed to delete TODA");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTodaMember(memberId) {
    if (!confirm("Remove this member from TODA?")) return;

    try {
      setSaving(true);
      setError("");
      await apiRequest(`/todas/members/${memberId}`, { method: "DELETE" });
      await fetchSettingsData();
      alert("Member removed successfully.");
    } catch (err) {
      setError(err.message || "Failed to remove member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">System Configuration</h1>
          <div className="text-muted">
            Manage TIRS configuration, violations, penalties, barangays, and TODA records.
          </div>
        </div>

        <button
          className="btn btn-light border rounded-4 px-3"
          type="button"
          onClick={fetchSettingsData}
          disabled={loading || saving}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger rounded-4 py-2">{error}</div>}
      {loading && <div className="alert alert-info rounded-4 py-2">Loading settings...</div>}

      <div className="row g-3 mb-4">
        <SummaryCard label="Violations" value={activeViolations.length} />
        <SummaryCard label="Barangays" value={lucenaBarangays.length} />
        <SummaryCard label="TODAs" value={activeTodas.length} />
        <SummaryCard label="Officers / Members" value={totalMembers} />
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {tabBtn("general", "General", "bi-sliders")}
        {tabBtn("violations", "Violations & Penalties", "bi-exclamation-triangle")}
        {tabBtn("toda", "Barangay & TODA", "bi-diagram-3")}
      </div>

      {tab === "general" && (
        <div className="row g-3">
          <div className="col-12 col-xl-5">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">General Settings</h5>
                <div className="text-muted mb-4">
                  Basic system-wide configuration and account tools.
                </div>

                {isSuperAdmin ? (
                  <>
                    <div className="d-flex justify-content-between align-items-center gap-3 p-3 border rounded-4 bg-light">
                      <div>
                        <div className="fw-semibold">Admin/User Account Creation</div>
                        <div className="text-muted small">
                          Create temporary login credentials for authorized system users.
                        </div>
                      </div>

                      <button
                        className="btn btn-primary rounded-4 px-3"
                        type="button"
                        onClick={() => setShowCreateAdmin((prev) => !prev)}
                        disabled={saving}
                      >
                        {showCreateAdmin ? "Close" : "+ Create Account"}
                      </button>
                    </div>

                    {showCreateAdmin && (
                      <div className="border rounded-4 p-3 mt-3">
                        <h6 className="fw-bold mb-3">Create Admin/User Account</h6>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Username</label>
                          <input
                            className="form-control rounded-3"
                            value={adminForm.username}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                username: e.target.value,
                              })
                            }
                            placeholder="Example: admin.juan"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Temporary Password
                          </label>
                          <input
                            className="form-control rounded-3"
                            value={adminForm.temporaryPassword}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                temporaryPassword: e.target.value,
                              })
                            }
                            placeholder="Example: TIRS-123456"
                          />
                          <div className="form-text">
                            User will be required to complete setup on first login.
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Role</label>
                          <select
                            className="form-select rounded-3"
                            value={adminForm.role}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                role: e.target.value,
                              })
                            }
                          >
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="ADMIN">Admin</option>
                            <option value="STAFF">Staff</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        </div>

                        <button
                          className="btn btn-primary rounded-3 w-100"
                          type="button"
                          onClick={createAdminAccount}
                          disabled={saving}
                        >
                          {saving ? "Creating..." : "Create Account"}
                        </button>
                      </div>
                    )}

                    {createdAdmin && (
                      <div className="alert alert-success rounded-4 mt-3 mb-0">
                        <div className="fw-bold mb-2">Account Created</div>

                        <div className="small">
                          <strong>Admin Code:</strong>{" "}
                          {createdAdmin.admin_code || "—"}
                        </div>

                        <div className="small">
                          <strong>Username:</strong> {createdAdmin.username || "—"}
                        </div>

                        <div className="small">
                          <strong>Temporary Password:</strong>{" "}
                          {createdAdmin.temporary_password || "—"}
                        </div>

                        <div className="small">
                          <strong>Role:</strong> {createdAdmin.role || "—"}
                        </div>

                        <div className="text-muted small mt-2">
                          Copy these credentials before leaving this page.
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="alert alert-light border rounded-4 mb-0">
                    <div className="fw-semibold">General Settings</div>
                    <div className="text-muted small">
                      No general settings configured for your role yet.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-7">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Preferences</h5>
                <div className="text-muted mb-4">
                  Display and system preferences can be added here later.
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="border rounded-4 p-3 h-100 bg-light">
                      <div className="fw-semibold mb-1">Dark Mode</div>
                      <div className="text-muted small mb-3">
                        Planned UI preference for light/dark display.
                      </div>
                      <button className="btn btn-light border rounded-3" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="border rounded-4 p-3 h-100 bg-light">
                      <div className="fw-semibold mb-1">Default Table Size</div>
                      <div className="text-muted small mb-3">
                        Planned setting for default rows shown in tables.
                      </div>
                      <button className="btn btn-light border rounded-3" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="border rounded-4 p-3 h-100 bg-light">
                      <div className="fw-semibold mb-1">Print Layout</div>
                      <div className="text-muted small mb-3">
                        Planned default print format setting.
                      </div>
                      <button className="btn btn-light border rounded-3" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="border rounded-4 p-3 h-100 bg-light">
                      <div className="fw-semibold mb-1">System Labels</div>
                      <div className="text-muted small mb-3">
                        Planned office/system naming settings.
                      </div>
                      <button className="btn btn-light border rounded-3" disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "violations" && (
        <div className="row g-3">
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">{editingViolationId ? "Edit Violation" : "Add Violation"}</h5>
                <div className="text-muted mb-4">Create or update a violation type with penalty amount.</div>

                <FormInput label="Code" value={violationForm.code} onChange={(value) => setViolationForm({ ...violationForm, code: value })} placeholder="Example: 5028" />
                <FormInput label="Violation Name" value={violationForm.name} onChange={(value) => setViolationForm({ ...violationForm, name: value })} placeholder="Example: Illegal Parking – 1st Offense" />
                <FormInput label="Group" value={violationForm.group} onChange={(value) => setViolationForm({ ...violationForm, group: value })} placeholder="Example: Illegal Parking" />

                <div className="row g-2">
                  <div className="col-6">
                    <FormInput label="Offense Level" type="number" value={violationForm.offenseLevel} onChange={(value) => setViolationForm({ ...violationForm, offenseLevel: value })} />
                  </div>
                  <div className="col-6">
                    <FormInput label="Penalty" type="number" value={violationForm.penalty} onChange={(value) => setViolationForm({ ...violationForm, penalty: value })} placeholder="₱" />
                  </div>
                </div>

                {editingViolationId ? (
                  <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-primary rounded-3 w-100" onClick={saveEditViolation} disabled={saving}>Save Edit</button>
                    <button className="btn btn-light border rounded-3 w-100" onClick={cancelEditViolation} disabled={saving}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-primary rounded-3 w-100 mt-4" onClick={addViolation} disabled={saving}>
                    <i className="bi bi-plus-circle me-2" />
                    Add Violation
                  </button>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Incentive Rate</h5>
                <div className="text-muted mb-4">Default commission rate used for apprehension enforcer incentives.</div>

                <label className="form-label fw-semibold">Incentive Rate (%)</label>
                <input
                  type="number"
                  className="form-control rounded-3"
                  value={Number(commissionRate || 0) * 100}
                  onChange={(e) => setCommissionRate(Number(e.target.value || 0) / 100)}
                  min="0"
                  max="100"
                  step="0.01"
                />

                <button className="btn btn-primary rounded-3 w-100 mt-4" onClick={saveCommissionRate} disabled={saving} type="button">
                  Save Incentive Rate
                </button>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Violations & Penalties</h5>
                <div className="text-muted mb-4">Grouped by violation type and offense level.</div>

                {Object.entries(groupedViolations).length === 0 ? (
                  <div className="text-muted py-4">No violations found.</div>
                ) : (
                  Object.entries(groupedViolations).map(([group, rows]) => (
                    <div key={group} className="mb-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis px-3 py-2">{group}</span>
                        <div className="flex-grow-1 border-top" />
                      </div>

                      <div className="table-responsive">
                        <table className="table table-hover align-middle" style={{ tableLayout: "fixed", minWidth: 850 }}>
                          <colgroup>
                            <col style={{ width: "100px" }} />
                            <col style={{ width: "390px" }} />
                            <col style={{ width: "100px" }} />
                            <col style={{ width: "130px" }} />
                            <col style={{ width: "130px" }} />
                          </colgroup>
                          <thead className="table-light">
                            <tr>
                              <th>Code</th>
                              <th>Violation</th>
                              <th className="text-center">Offense</th>
                              <th className="text-end">Penalty</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((v) => (
                              <tr key={v.id || v.code}>
                                <td className="fw-semibold">{v.code}</td>
                                <td title={v.name} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</td>
                                <td className="text-center">{v.offenseLevel}</td>
                                <td className="text-end fw-semibold">{money(v.penalty)}</td>
                                <td className="text-end">
                                  <div className="d-flex justify-content-end gap-2">
                                    <button className="btn btn-sm btn-light" onClick={() => startEditViolation(v)} disabled={saving}>Edit</button>
                                    <button className="btn btn-sm btn-light text-danger" onClick={() => deleteViolation(v.id)} disabled={saving}>Delete</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "toda" && (
        <div className="row g-3">
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">{editingTodaId ? "Edit TODA" : "Add TODA"}</h5>
                <div className="text-muted mb-4">Assign TODA organization under a Lucena barangay.</div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Barangay</label>
                  <select className="form-select rounded-3" value={todaForm.barangay} onChange={(e) => setTodaForm({ ...todaForm, barangay: e.target.value })}>
                    {lucenaBarangays.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <FormInput label="TODA Name" value={todaForm.name} onChange={(value) => setTodaForm({ ...todaForm, name: value })} placeholder="Example: Gulang-Gulang TODA" />

                <div className="row g-2">
                  <div className="col-12 col-md-6"><FormInput label="President" value={todaForm.president} onChange={(value) => setTodaForm({ ...todaForm, president: value })} /></div>
                  <div className="col-12 col-md-6"><FormInput label="Vice President" value={todaForm.vicePresident} onChange={(value) => setTodaForm({ ...todaForm, vicePresident: value })} /></div>
                  <div className="col-12 col-md-6"><FormInput label="Secretary" value={todaForm.secretary} onChange={(value) => setTodaForm({ ...todaForm, secretary: value })} /></div>
                  <div className="col-12 col-md-6"><FormInput label="Treasurer" value={todaForm.treasurer} onChange={(value) => setTodaForm({ ...todaForm, treasurer: value })} /></div>
                </div>

                <div className="mt-3">
                  <label className="form-label fw-semibold">Other Members</label>
                  {todaForm.members.map((member, index) => (
                    <input
                      key={index}
                      className="form-control rounded-3 mb-2"
                      value={member}
                      onChange={(e) => {
                        const updatedMembers = [...todaForm.members];
                        updatedMembers[index] = e.target.value;
                        setTodaForm({ ...todaForm, members: updatedMembers });
                      }}
                      placeholder={`Member ${index + 1}`}
                    />
                  ))}
                </div>

                {editingTodaId ? (
                  <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-primary rounded-3 w-100" onClick={saveEditToda} disabled={saving}>Save Edit</button>
                    <button className="btn btn-light border rounded-3 w-100" onClick={cancelEditToda} disabled={saving}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-primary rounded-3 w-100 mt-4" onClick={addToda} disabled={saving}>
                    <i className="bi bi-plus-circle me-2" />
                    Add TODA
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Barangay & TODA Directory</h5>
                <div className="text-muted mb-4">Barangays are separated by dividers. TODA officers and members are listed under each barangay.</div>

                <div className="accordion" id="barangayAccordion">
                  {barangayToda.map((b, index) => (
                    <div className="accordion-item border rounded-4 mb-2 overflow-hidden" key={b.barangay}>
                      <h2 className="accordion-header">
                        <button className={`accordion-button ${index !== 0 ? "collapsed" : ""}`} type="button" data-bs-toggle="collapse" data-bs-target={`#barangay-${index}`}>
                          <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                            <span className="fw-semibold">{b.barangay}</span>
                            <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">{b.todas.length} TODA</span>
                          </div>
                        </button>
                      </h2>

                      <div id={`barangay-${index}`} className={`accordion-collapse collapse ${index === 0 ? "show" : ""}`} data-bs-parent="#barangayAccordion">
                        <div className="accordion-body">
                          {b.todas.length === 0 ? (
                            <div className="text-muted small py-2">No TODA added under this barangay yet.</div>
                          ) : (
                            b.todas.map((toda) => (
                              <div className="border rounded-4 p-3 mb-3" key={toda.id}>
                                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                  <div>
                                    <div className="fw-bold">{toda.name}</div>
                                    <div className="text-muted small">{toda.todaCode || "No code"} • {b.barangay}</div>
                                  </div>

                                  <div className="d-flex gap-2">
                                    <button className="btn btn-sm btn-light" onClick={() => startEditToda(toda)} disabled={saving}>Edit</button>
                                    <button className="btn btn-sm btn-light text-danger" onClick={() => deleteToda(toda.id)} disabled={saving}>Delete</button>
                                  </div>
                                </div>

                                <div className="row g-2 mb-3">
                                  <OfficerView label="President" value={toda.officers.president} />
                                  <OfficerView label="Vice President" value={toda.officers.vicePresident} />
                                  <OfficerView label="Secretary" value={toda.officers.secretary} />
                                  <OfficerView label="Treasurer" value={toda.officers.treasurer} />
                                </div>

                                <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                                  <div className="small text-muted">Members</div>
                                  <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => setMemberForm({ todaId: toda.id, memberName: "" })} disabled={saving}>+ Add Member</button>
                                </div>

                                {memberForm.todaId === toda.id && (
                                  <div className="d-flex gap-2 mb-3">
                                    <input className="form-control form-control-sm rounded-3" placeholder="Member name" value={memberForm.memberName} onChange={(e) => setMemberForm({ ...memberForm, memberName: e.target.value })} />
                                    <button className="btn btn-sm btn-primary rounded-3" onClick={() => addMemberToToda(toda.id)} disabled={saving}>Save</button>
                                    <button className="btn btn-sm btn-light border rounded-3" onClick={() => setMemberForm({ todaId: null, memberName: "" })} disabled={saving}>Cancel</button>
                                  </div>
                                )}

                                {toda.members.filter((m) => m.status !== "INACTIVE").length === 0 ? (
                                  <div className="text-muted small">No members listed.</div>
                                ) : (
                                  <div className="d-flex flex-wrap gap-2">
                                    {toda.members.filter((m) => m.status !== "INACTIVE").map((m) => (
                                      <span key={m.id} className="badge bg-light text-dark border rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2">
                                        {m.fullName}
                                        <button className="btn btn-sm p-0 text-danger border-0 bg-transparent" type="button" onClick={() => deleteTodaMember(m.id)} title="Remove member" disabled={saving}>
                                          <i className="bi bi-x-circle" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="col-12 col-md-3">
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body">
          <div className="text-muted small">{label}</div>
          <div className="h4 fw-bold mb-0">{value}</div>
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <input
        type={type}
        className="form-control rounded-3"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function OfficerView({ label, value }) {
  return (
    <div className="col-12 col-md-6">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value || "—"}</div>
    </div>
  );
}
