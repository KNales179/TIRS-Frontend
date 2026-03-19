export default function Dashboard() {
  return (
    <div className="container-xl">
      <h1 className="h4 fw-bold mb-3">Dashboard</h1>
      <div className="row g-3">
        {["Total Violations", "Total Collected", "Total Unpaid", "Total Incentives"].map((t) => (
          <div className="col-12 col-md-6 col-xl-3" key={t}>
            <div className="card rounded-4 shadow-sm">
              <div className="card-body">
                <div className="text-muted small">{t}</div>
                <div className="h3 fw-bold mb-0">—</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}