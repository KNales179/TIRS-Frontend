import { useMemo, useState } from "react";

const violationsMaster = [
  { code: "5001", name: "Colorum Tricycle – 1st Offense", group: "Colorum Tricycle", offenseLevel: 1, penalty: 3000 },
  { code: "5002", name: "Colorum Tricycle – 2nd and succeeding offense", group: "Colorum Tricycle", offenseLevel: 2, penalty: 5000 },
  { code: "5003", name: "Without ID Plate – 1st Offense", group: "Without ID Plate", offenseLevel: 1, penalty: 200 },
  { code: "5004", name: "Without ID Plate – 2nd Offense", group: "Without ID Plate", offenseLevel: 2, penalty: 400 },
  { code: "5005", name: "Removal/Tampering of ID Card – 1st Offense", group: "Removal/Tampering of ID Card", offenseLevel: 1, penalty: 200 },
  { code: "5006", name: "Removal/Tampering of ID Card – 2nd Offense", group: "Removal/Tampering of ID Card", offenseLevel: 2, penalty: 400 },
  { code: "5007", name: "Without Serial No. on windshield &/or Plate – 1st Offense", group: "Without Serial No. on windshield &/or Plate", offenseLevel: 1, penalty: 200 },
  { code: "5008", name: "Without Serial No. on windshield &/or Plate – 2nd Offense", group: "Without Serial No. on windshield &/or Plate", offenseLevel: 2, penalty: 400 },
  { code: "5009", name: "Using Improvised ID No. Plate without Permit – 1st Offense", group: "Using Improvised ID No. Plate without Permit", offenseLevel: 1, penalty: 200 },
  { code: "5010", name: "Using Improvised ID No. Plate without Permit – 2nd Offense", group: "Using Improvised ID No. Plate without Permit", offenseLevel: 2, penalty: 400 },
  { code: "5011", name: "Operating on Banned Days – 1st Offense", group: "Operating on Banned Days", offenseLevel: 1, penalty: 200 },
  { code: "5012", name: "Operating on Banned Days – 2nd Offense", group: "Operating on Banned Days", offenseLevel: 2, penalty: 400 },
  { code: "5013", name: "No garbage receptacle – 1st Offense", group: "No garbage receptacle", offenseLevel: 1, penalty: 200 },
  { code: "5014", name: "No garbage receptacle – 2nd Offense", group: "No garbage receptacle", offenseLevel: 2, penalty: 400 },
  { code: "5015", name: "Wearing Slipper, sando or short – 1st Offense", group: "Wearing Slipper, sando or short", offenseLevel: 1, penalty: 200 },
  { code: "5016", name: "Wearing Slipper, sando or short – 2nd Offense", group: "Wearing Slipper, sando or short", offenseLevel: 2, penalty: 500 },
  { code: "5017", name: "Wearing Slipper, sando or short – 3rd Offense", group: "Wearing Slipper, sando or short", offenseLevel: 3, penalty: 1000 },
  { code: "5018", name: "Overcharging – 1st Offense", group: "Overcharging", offenseLevel: 1, penalty: 200 },
  { code: "5019", name: "Overcharging – 2nd Offense", group: "Overcharging", offenseLevel: 2, penalty: 500 },
  { code: "5020", name: "Overcharging – 3rd Offense", group: "Overcharging", offenseLevel: 3, penalty: 1000 },
  { code: "5024", name: "Refusal to Convey Passenger – 1st Offense", group: "Refusal to Convey Passenger", offenseLevel: 1, penalty: 200 },
  { code: "5025", name: "Refusal to Convey Passenger – 2nd Offense", group: "Refusal to Convey Passenger", offenseLevel: 2, penalty: 500 },
  { code: "5026", name: "Refusal to Convey Passenger – 3rd Offense", group: "Refusal to Convey Passenger", offenseLevel: 3, penalty: 1000 },
  { code: "5027", name: "Selling of MTOP/Franchise Line", group: "Selling of MTOP/Franchise Line", offenseLevel: 1, penalty: 5000 },
];

const lucenaBarangays = [
  "Barangay 1",
  "Barangay 2",
  "Barangay 3",
  "Barangay 4",
  "Barangay 5",
  "Barangay 6",
  "Barangay 7",
  "Barangay 8",
  "Barangay 9",
  "Barangay 10",
  "Barangay 11",
  "Barra",
  "Bocohan",
  "Cotta",
  "Dalahican",
  "Domoit",
  "Gulang-Gulang",
  "Ibabang Dupay",
  "Ibabang Iyam",
  "Ibabang Talim",
  "Ilayang Dupay",
  "Ilayang Iyam",
  "Ilayang Talim",
  "Isabang",
  "Market View",
  "Mayao Castillo",
  "Mayao Crossing",
  "Mayao Kanluran",
  "Mayao Parada",
  "Mayao Silangan",
  "Ransohan",
  "Salinas",
  "Talao-Talao",
];

function money(n) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(n || 0));
}

export default function Settings() {
  const [tab, setTab] = useState("general");
  const [incentive, setIncentive] = useState(10);
  const [violations, setViolations] = useState(violationsMaster);

  const [barangayToda, setBarangayToda] = useState(
    lucenaBarangays.map((barangay) => ({
      barangay,
      todas: [],
    }))
  );

  const [violationForm, setViolationForm] = useState({
    code: "",
    name: "",
    group: "",
    offenseLevel: 1,
    penalty: "",
  });

  const [editingViolationCode, setEditingViolationCode] = useState(null);

  const [editingToda, setEditingToda] = useState(null);

  const [memberForm, setMemberForm] = useState({
    barangay: "",
    todaName: "",
    memberName: "",
  });

  const [todaForm, setTodaForm] = useState({
    barangay: lucenaBarangays[0],
    name: "",
    president: "",
    vicePresident: "",
    secretary: "",
    treasurer: "",
    memberName: "",
  });

  const totalTodas = useMemo(
    () => barangayToda.reduce((sum, b) => sum + b.todas.length, 0),
    [barangayToda]
  );

  const totalMembers = useMemo(
    () =>
      barangayToda.reduce(
        (sum, b) =>
          sum +
          b.todas.reduce((todaSum, t) => todaSum + (t.members?.length || 0), 0),
        0
      ),
    [barangayToda]
  );

  const groupedViolations = useMemo(() => {
    return violations.reduce((acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    }, {});
  }, [violations]);

  const tabBtn = (key, label, icon) => (
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

  const addViolation = () => {
    if (!violationForm.code || !violationForm.name || !violationForm.group) return;

    setViolations([
      ...violations,
      {
        ...violationForm,
        offenseLevel: Number(violationForm.offenseLevel || 1),
        penalty: Number(violationForm.penalty || 0),
      },
    ]);

    setViolationForm({
      code: "",
      name: "",
      group: "",
      offenseLevel: 1,
      penalty: "",
    });
  };

  const startEditViolation = (violation) => {
    setEditingViolationCode(violation.code);
    setViolationForm({
      code: violation.code,
      name: violation.name,
      group: violation.group,
      offenseLevel: violation.offenseLevel,
      penalty: violation.penalty,
    });
  };

  const saveEditViolation = () => {
    setViolations((prev) =>
      prev.map((v) =>
        v.code === editingViolationCode
          ? {
              ...violationForm,
              offenseLevel: Number(violationForm.offenseLevel || 1),
              penalty: Number(violationForm.penalty || 0),
            }
          : v
      )
    );

    setEditingViolationCode(null);
    setViolationForm({
      code: "",
      name: "",
      group: "",
      offenseLevel: 1,
      penalty: "",
    });
  };

  const cancelEditViolation = () => {
    setEditingViolationCode(null);
    setViolationForm({
      code: "",
      name: "",
      group: "",
      offenseLevel: 1,
      penalty: "",
    });
  };

  const deleteViolation = (code) => {
    setViolations(violations.filter((v) => v.code !== code));
  };

  const addToda = () => {
    if (!todaForm.barangay || !todaForm.name) return;

    setBarangayToda((prev) =>
      prev.map((b) =>
        b.barangay === todaForm.barangay
          ? {
              ...b,
              todas: [
                ...b.todas,
                {
                  name: todaForm.name,
                  officers: {
                    president: todaForm.president,
                    vicePresident: todaForm.vicePresident,
                    secretary: todaForm.secretary,
                    treasurer: todaForm.treasurer,
                  },
                  members: todaForm.memberName ? [todaForm.memberName] : [],
                },
              ],
            }
          : b
      )
    );

    setTodaForm({
      barangay: todaForm.barangay,
      name: "",
      president: "",
      vicePresident: "",
      secretary: "",
      treasurer: "",
      memberName: "",
    });
  };
  const startEditToda = (barangay, toda) => {
    setEditingToda({ barangay, todaName: toda.name });

    setTodaForm({
      barangay,
      name: toda.name,
      president: toda.officers.president || "",
      vicePresident: toda.officers.vicePresident || "",
      secretary: toda.officers.secretary || "",
      treasurer: toda.officers.treasurer || "",
      memberName: "",
    });
  };

  const saveEditToda = () => {
    setBarangayToda((prev) =>
      prev.map((b) =>
        b.barangay === editingToda.barangay
          ? {
              ...b,
              todas: b.todas.map((t) =>
                t.name === editingToda.todaName
                  ? {
                      ...t,
                      name: todaForm.name,
                      officers: {
                        president: todaForm.president,
                        vicePresident: todaForm.vicePresident,
                        secretary: todaForm.secretary,
                        treasurer: todaForm.treasurer,
                      },
                    }
                  : t
              ),
            }
          : b
      )
    );

    setEditingToda(null);
    setTodaForm({
      barangay: todaForm.barangay,
      name: "",
      president: "",
      vicePresident: "",
      secretary: "",
      treasurer: "",
      memberName: "",
    });
  };

  const cancelEditToda = () => {
    setEditingToda(null);
    setTodaForm({
      barangay: todaForm.barangay,
      name: "",
      president: "",
      vicePresident: "",
      secretary: "",
      treasurer: "",
      memberName: "",
    });
  };

  const addMemberToToda = (barangay, todaName) => {
    if (!memberForm.memberName.trim()) return;

    setBarangayToda((prev) =>
      prev.map((b) =>
        b.barangay === barangay
          ? {
              ...b,
              todas: b.todas.map((t) =>
                t.name === todaName
                  ? {
                      ...t,
                      members: [...(t.members || []), memberForm.memberName.trim()],
                    }
                  : t
              ),
            }
          : b
      )
    );

    setMemberForm({
      barangay: "",
      todaName: "",
      memberName: "",
    });
  };

  const deleteMemberFromToda = (barangay, todaName, memberName) => {
    setBarangayToda((prev) =>
      prev.map((b) =>
        b.barangay === barangay
          ? {
              ...b,
              todas: b.todas.map((t) =>
                t.name === todaName
                  ? {
                      ...t,
                      members: t.members.filter((m) => m !== memberName),
                    }
                  : t
              ),
            }
          : b
      )
    );
  };

  const deleteToda = (barangay, todaName) => {
    setBarangayToda((prev) =>
      prev.map((b) =>
        b.barangay === barangay
          ? {
              ...b,
              todas: b.todas.filter((t) => t.name !== todaName),
            }
          : b
      )
    );
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Settings</h1>
          <div className="text-muted">
            Manage TIRS configuration, violations, penalties, barangays, and TODA records.
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <div className="text-muted small">Violations</div>
              <div className="h4 fw-bold mb-0">{violations.length}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <div className="text-muted small">Barangays</div>
              <div className="h4 fw-bold mb-0">{barangayToda.length}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <div className="text-muted small">TODAs</div>
              <div className="h4 fw-bold mb-0">{totalTodas}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <div className="text-muted small">Members</div>
              <div className="h4 fw-bold mb-0">{totalMembers}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {tabBtn("general", "General", "bi-sliders")}
        {tabBtn("violations", "Violations & Penalties", "bi-exclamation-triangle")}
        {tabBtn("toda", "Barangay & TODA", "bi-diagram-3")}
      </div>

      {tab === "general" && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">General Settings</h5>
            <div className="text-muted mb-4">Basic system-wide configuration.</div>

            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Incentive Rate (%)</label>
                <input
                  type="number"
                  className="form-control rounded-3"
                  value={incentive}
                  onChange={(e) => setIncentive(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-auto">
                <button className="btn btn-primary rounded-3 px-4">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "violations" && (
        <div className="row g-3">
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Add Violation</h5>
                <div className="text-muted mb-4">Create a violation type with penalty amount.</div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Code</label>
                  <input
                    className="form-control rounded-3"
                    value={violationForm.code}
                    onChange={(e) =>
                      setViolationForm({ ...violationForm, code: e.target.value })
                    }
                    placeholder="Example: 5028"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Violation Name</label>
                  <input
                    className="form-control rounded-3"
                    value={violationForm.name}
                    onChange={(e) =>
                      setViolationForm({ ...violationForm, name: e.target.value })
                    }
                    placeholder="Example: Illegal Parking – 1st Offense"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Group</label>
                  <input
                    className="form-control rounded-3"
                    value={violationForm.group}
                    onChange={(e) =>
                      setViolationForm({ ...violationForm, group: e.target.value })
                    }
                    placeholder="Example: Illegal Parking"
                  />
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label fw-semibold">Offense Level</label>
                    <input
                      type="number"
                      className="form-control rounded-3"
                      value={violationForm.offenseLevel}
                      onChange={(e) =>
                        setViolationForm({
                          ...violationForm,
                          offenseLevel: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label fw-semibold">Penalty</label>
                    <input
                      type="number"
                      className="form-control rounded-3"
                      value={violationForm.penalty}
                      onChange={(e) =>
                        setViolationForm({ ...violationForm, penalty: e.target.value })
                      }
                      placeholder="₱"
                    />
                  </div>
                </div>

                {editingViolationCode ? (
                  <div className="d-flex gap-2 mt-4">
                    <button
                      className="btn btn-primary rounded-3 w-100"
                      onClick={saveEditViolation}
                    >
                      Save Edit
                    </button>

                    <button
                      className="btn btn-light border rounded-3 w-100"
                      onClick={cancelEditViolation}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary rounded-3 w-100 mt-4"
                    onClick={addViolation}
                  >
                    <i className="bi bi-plus-circle me-2" />
                    Add Violation
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Violations & Penalties</h5>
                <div className="text-muted mb-4">
                  Grouped by violation type and offense level.
                </div>

                {Object.entries(groupedViolations).map(([group, rows]) => (
                  <div key={group} className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis px-3 py-2">
                        {group}
                      </span>
                      <div className="flex-grow-1 border-top" />
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
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
                            <tr key={v.code}>
                              <td className="fw-semibold">{v.code}</td>
                              <td>{v.name}</td>
                              <td className="text-center">{v.offenseLevel}</td>
                              <td className="text-end fw-semibold">{money(v.penalty)}</td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-sm btn-light"
                                  onClick={() => startEditViolation(v)}
                                >
                                  Edit
                                </button>

                                <button
                                  className="btn btn-sm btn-light text-danger"
                                  onClick={() => deleteViolation(v.code)}
                                >
                                  Delete
                                </button>
                              </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
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
                <h5 className="fw-bold mb-1">Add TODA</h5>
                <div className="text-muted mb-4">
                  Assign TODA organization under a Lucena barangay.
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Barangay</label>
                  <select
                    className="form-select rounded-3"
                    value={todaForm.barangay}
                    onChange={(e) =>
                      setTodaForm({ ...todaForm, barangay: e.target.value })
                    }
                  >
                    {lucenaBarangays.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">TODA Name</label>
                  <input
                    className="form-control rounded-3"
                    value={todaForm.name}
                    onChange={(e) =>
                      setTodaForm({ ...todaForm, name: e.target.value })
                    }
                    placeholder="Example: Gulang-Gulang TODA"
                  />
                </div>

                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">President</label>
                    <input
                      className="form-control rounded-3"
                      value={todaForm.president}
                      onChange={(e) =>
                        setTodaForm({ ...todaForm, president: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Vice President</label>
                    <input
                      className="form-control rounded-3"
                      value={todaForm.vicePresident}
                      onChange={(e) =>
                        setTodaForm({ ...todaForm, vicePresident: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Secretary</label>
                    <input
                      className="form-control rounded-3"
                      value={todaForm.secretary}
                      onChange={(e) =>
                        setTodaForm({ ...todaForm, secretary: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Treasurer</label>
                    <input
                      className="form-control rounded-3"
                      value={todaForm.treasurer}
                      onChange={(e) =>
                        setTodaForm({ ...todaForm, treasurer: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="form-label fw-semibold">Initial Member</label>
                  <input
                    className="form-control rounded-3"
                    value={todaForm.memberName}
                    onChange={(e) =>
                      setTodaForm({ ...todaForm, memberName: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                    {editingToda ? (
                      <div className="d-flex gap-2 mt-4">
                        <button className="btn btn-primary rounded-3 w-100" onClick={saveEditToda}>
                          Save Edit
                        </button>

                        <button className="btn btn-light border rounded-3 w-100" onClick={cancelEditToda}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary rounded-3 w-100 mt-4" onClick={addToda}>
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
                <div className="text-muted mb-4">
                  Barangays are separated by dividers. TODA officers and members are listed under each barangay.
                </div>

                <div className="accordion" id="barangayAccordion">
                  {barangayToda.map((b, index) => (
                    <div className="accordion-item border rounded-4 mb-2 overflow-hidden" key={b.barangay}>
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${index !== 0 ? "collapsed" : ""}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#barangay-${index}`}
                        >
                          <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                            <span className="fw-semibold">{b.barangay}</span>
                            <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">
                              {b.todas.length} TODA
                            </span>
                          </div>
                        </button>
                      </h2>

                      <div
                        id={`barangay-${index}`}
                        className={`accordion-collapse collapse ${index === 0 ? "show" : ""}`}
                        data-bs-parent="#barangayAccordion"
                      >
                        <div className="accordion-body">
                          {b.todas.length === 0 ? (
                            <div className="text-muted small py-2">
                              No TODA added under this barangay yet.
                            </div>
                          ) : (
                            b.todas.map((toda) => (
                              <div className="border rounded-4 p-3 mb-3" key={toda.name}>
                                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                  <div>
                                    <div className="fw-bold">{toda.name}</div>
                                    <div className="text-muted small">{b.barangay}</div>
                                  </div>

                                  <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-light"
                                    onClick={() => startEditToda(b.barangay, toda)}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="btn btn-sm btn-light text-danger"
                                    onClick={() => deleteToda(b.barangay, toda.name)}
                                  >
                                    Delete
                                  </button>
                                </div>
                                </div>

                                <div className="row g-2 mb-3">
                                  <div className="col-12 col-md-6">
                                    <div className="small text-muted">President</div>
                                    <div className="fw-semibold">{toda.officers.president || "—"}</div>
                                  </div>

                                  <div className="col-12 col-md-6">
                                    <div className="small text-muted">Vice President</div>
                                    <div className="fw-semibold">{toda.officers.vicePresident || "—"}</div>
                                  </div>

                                  <div className="col-12 col-md-6">
                                    <div className="small text-muted">Secretary</div>
                                    <div className="fw-semibold">{toda.officers.secretary || "—"}</div>
                                  </div>

                                  <div className="col-12 col-md-6">
                                    <div className="small text-muted">Treasurer</div>
                                    <div className="fw-semibold">{toda.officers.treasurer || "—"}</div>
                                  </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                                <div className="small text-muted">Members</div>

                                <button
                                  className="btn btn-sm btn-outline-primary rounded-pill"
                                  onClick={() =>
                                    setMemberForm({
                                      barangay: b.barangay,
                                      todaName: toda.name,
                                      memberName: "",
                                    })
                                  }
                                >
                                  + Add Member
                                </button>
                              </div>

                              {memberForm.barangay === b.barangay &&
                                memberForm.todaName === toda.name && (
                                  <div className="d-flex gap-2 mb-3">
                                    <input
                                      className="form-control form-control-sm rounded-3"
                                      placeholder="Member name"
                                      value={memberForm.memberName}
                                      onChange={(e) =>
                                        setMemberForm({
                                          ...memberForm,
                                          memberName: e.target.value,
                                        })
                                      }
                                    />

                                    <button
                                      className="btn btn-sm btn-primary rounded-3"
                                      onClick={() => addMemberToToda(b.barangay, toda.name)}
                                    >
                                      Save
                                    </button>

                                    <button
                                      className="btn btn-sm btn-light border rounded-3"
                                      onClick={() =>
                                        setMemberForm({
                                          barangay: "",
                                          todaName: "",
                                          memberName: "",
                                        })
                                      }
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}

                              {toda.members.length === 0 ? (
                                <div className="text-muted small">No members listed.</div>
                              ) : (
                                <div className="d-flex flex-wrap gap-2">
                                  {toda.members.map((m) => (
                                    <span
                                      key={m}
                                      className="badge bg-light text-dark border rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2"
                                    >
                                      {m}

                                      <button
                                        type="button"
                                        className="btn-close"
                                        style={{ fontSize: 8 }}
                                        onClick={() => deleteMemberFromToda(b.barangay, toda.name, m)}
                                      />
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