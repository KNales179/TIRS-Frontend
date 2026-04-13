import { useState } from "react";

export default function Settings() {
  const [tab, setTab] = useState("general");

  const [incentive, setIncentive] = useState(10);

  const [violations, setViolations] = useState([
    "Obstruction",
    "Overcharging",
    "No Franchise",
  ]);

  const [todas, setTodas] = useState([
    { name: "TODA A", brgy: "Brgy 1" },
    { name: "TODA B", brgy: "Brgy 2" },
  ]);

  const [barangays, setBarangays] = useState(["Brgy 1", "Brgy 2"]);

  const tabBtn = (key, label) => (
    <button
      className={`btn ${tab === key ? "btn-primary" : "btn-outline-primary"} rounded-3 px-3`}
      onClick={() => setTab(key)}
    >
      {label}
    </button>
  );

  return (
    <div className="container-fluid">
      <h1 className="h4 fw-bold mb-3">Settings</h1>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        {tabBtn("general", "General")}
        {tabBtn("violations", "Violations")}
        {tabBtn("toda", "TODA")}
        {tabBtn("barangay", "Barangay")}
      </div>

      <div className="card rounded-4 shadow-sm border-0">
        <div className="card-body">

          {/* GENERAL */}
          {tab === "general" && (
            <div>
              <h6 className="fw-bold mb-3">Incentive Rate (%)</h6>

              <div className="d-flex align-items-center gap-2">
                <input
                  type="number"
                  className="form-control"
                  style={{ maxWidth: 120 }}
                  value={incentive}
                  onChange={(e) => setIncentive(e.target.value)}
                />

                <button className="btn btn-primary">Save</button>
              </div>
            </div>
          )}

          {/* VIOLATIONS */}
          {tab === "violations" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Violation Types</h6>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const name = prompt("Enter violation");
                    if (name) setViolations([...violations, name]);
                  }}
                >
                  + Add
                </button>
              </div>

              {violations.map((v, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center mb-2">
                  <span>{v}</span>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => {
                        const updated = prompt("Edit violation", v);
                        if (updated) {
                          const copy = [...violations];
                          copy[i] = updated;
                          setViolations(copy);
                        }
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-light text-danger"
                      onClick={() =>
                        setViolations(violations.filter((_, idx) => idx !== i))
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TODA */}
          {tab === "toda" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">TODA List</h6>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const name = prompt("TODA Name");
                    const brgy = prompt("Barangay");
                    if (name && brgy) {
                      setTodas([...todas, { name, brgy }]);
                    }
                  }}
                >
                  + Add
                </button>
              </div>

              {todas.map((t, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center mb-2">
                  <span>{t.name} - {t.brgy}</span>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => {
                        const name = prompt("Edit TODA", t.name);
                        const brgy = prompt("Edit Barangay", t.brgy);
                        if (name && brgy) {
                          const copy = [...todas];
                          copy[i] = { name, brgy };
                          setTodas(copy);
                        }
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-light text-danger"
                      onClick={() =>
                        setTodas(todas.filter((_, idx) => idx !== i))
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BARANGAY */}
          {tab === "barangay" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Barangay List</h6>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const name = prompt("Barangay name");
                    if (name) setBarangays([...barangays, name]);
                  }}
                >
                  + Add
                </button>
              </div>

              {barangays.map((b, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center mb-2">
                  <span>{b}</span>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => {
                        const updated = prompt("Edit barangay", b);
                        if (updated) {
                          const copy = [...barangays];
                          copy[i] = updated;
                          setBarangays(copy);
                        }
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-light text-danger"
                      onClick={() =>
                        setBarangays(barangays.filter((_, idx) => idx !== i))
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}