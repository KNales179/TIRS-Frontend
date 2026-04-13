import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const rangeOptions = ["Today", "This Week", "This Month", "Custom"];
  const [activeRange, setActiveRange] = useState("This Week");

  const dashboardData = {
    Today: {
      stats: [
        {
          title: "Registered Drivers",
          value: "178",
          subtitle: "Active and verified records",
          icon: "bi-person-badge-fill",
          bg: "#eef4ff",
          iconColor: "#4f8df7",
        },
        {
          title: "Colorum Cases",
          value: "6",
          subtitle: "Detected today",
          icon: "bi-exclamation-triangle-fill",
          bg: "#fff4dc",
          iconColor: "#f1b52e",
        },
        {
          title: "Temporary Drivers",
          value: "24",
          subtitle: "Pending compliance review",
          icon: "bi-person-fill-lock",
          bg: "#ffe9e4",
          iconColor: "#f58b68",
        },
        {
          title: "Violations Today",
          value: "12",
          subtitle: "Recorded apprehensions",
          icon: "bi-clipboard-data-fill",
          bg: "#f1ecff",
          iconColor: "#7b6df6",
        },
      ],
      trendData: [
        { time: "10AM", value: 2 },
        { time: "11AM", value: 3 },
        { time: "12PM", value: 4 },
        { time: "01PM", value: 3 },
        { time: "02PM", value: 5 },
        { time: "03PM", value: 4 },
        { time: "04PM", value: 2 },
        { time: "05PM", value: 3 },
        { time: "06PM", value: 4 },
        { time: "07PM", value: 5 },
      ],
      processedPercent: 80,
      statusBreakdown: [
        { label: "Resolved", color: "#5b8def", value: 58 },
        { label: "Pending", color: "#f2c94c", value: 22 },
        { label: "Under Review", color: "#f58b68", value: 20 },
      ],
      recentViolations: [
        {
          id: "#876364",
          violator: "Juan Dela Cruz",
          violation: "No Helmet",
          amount: "₱178",
          count: "12",
          total: "₱2,136",
          status: "Pending",
        },
        {
          id: "#876368",
          violator: "Pedro Santos",
          violation: "Colorum",
          amount: "₱314",
          count: "4",
          total: "₱1,256",
          status: "Resolved",
        },
        {
          id: "#876412",
          violator: "Maria Cruz",
          violation: "Overloading",
          amount: "₱221",
          count: "3",
          total: "₱663",
          status: "Under Review",
        },
        {
          id: "#876621",
          violator: "Jose Reyes",
          violation: "No Franchise",
          amount: "₱332",
          count: "2",
          total: "₱664",
          status: "Pending",
        },
      ],
      commonViolations: [
        { label: "No Helmet", percent: 78, color: "#5b8def" },
        { label: "Colorum", percent: 61, color: "#f58b68" },
        { label: "Overloading", percent: 44, color: "#f2c94c" },
        { label: "No Franchise", percent: 29, color: "#8b5cf6" },
      ],
    },

    "This Week": {
      stats: [
        {
          title: "Registered Drivers",
          value: "178",
          subtitle: "Active and verified records",
          icon: "bi-person-badge-fill",
          bg: "#eef4ff",
          iconColor: "#4f8df7",
        },
        {
          title: "Colorum Cases",
          value: "20",
          subtitle: "Detected this week",
          icon: "bi-exclamation-triangle-fill",
          bg: "#fff4dc",
          iconColor: "#f1b52e",
        },
        {
          title: "Temporary Drivers",
          value: "190",
          subtitle: "Pending compliance review",
          icon: "bi-person-fill-lock",
          bg: "#ffe9e4",
          iconColor: "#f58b68",
        },
        {
          title: "Violations This Week",
          value: "79",
          subtitle: "Recorded apprehensions",
          icon: "bi-clipboard-data-fill",
          bg: "#f1ecff",
          iconColor: "#7b6df6",
        },
      ],
      trendData: [
        { time: "Mon", value: 12 },
        { time: "Tue", value: 9 },
        { time: "Wed", value: 15 },
        { time: "Thu", value: 11 },
        { time: "Fri", value: 18 },
        { time: "Sat", value: 8 },
        { time: "Sun", value: 6 },
      ],
      processedPercent: 80,
      statusBreakdown: [
        { label: "Resolved", color: "#5b8def", value: 57 },
        { label: "Pending", color: "#f2c94c", value: 21 },
        { label: "Under Review", color: "#f58b68", value: 22 },
      ],
      recentViolations: [
        {
          id: "#876364",
          violator: "Juan Dela Cruz",
          violation: "No Helmet",
          amount: "₱178",
          count: "325",
          total: "₱14,660",
          status: "Pending",
        },
        {
          id: "#876368",
          violator: "Pedro Santos",
          violation: "Colorum",
          amount: "₱314",
          count: "53",
          total: "₱46,660",
          status: "Resolved",
        },
        {
          id: "#876412",
          violator: "Maria Cruz",
          violation: "Overloading",
          amount: "₱221",
          count: "78",
          total: "₱34,676",
          status: "Pending",
        },
        {
          id: "#876621",
          violator: "Jose Reyes",
          violation: "No Franchise",
          amount: "₱332",
          count: "98",
          total: "₱36,981",
          status: "Under Review",
        },
      ],
      commonViolations: [
        { label: "No Helmet", percent: 78, color: "#5b8def" },
        { label: "Colorum", percent: 62, color: "#f58b68" },
        { label: "Overloading", percent: 49, color: "#f2c94c" },
        { label: "No Franchise", percent: 35, color: "#8b5cf6" },
      ],
    },

    "This Month": {
      stats: [
        {
          title: "Registered Drivers",
          value: "183",
          subtitle: "Active and verified records",
          icon: "bi-person-badge-fill",
          bg: "#eef4ff",
          iconColor: "#4f8df7",
        },
        {
          title: "Colorum Cases",
          value: "47",
          subtitle: "Detected this month",
          icon: "bi-exclamation-triangle-fill",
          bg: "#fff4dc",
          iconColor: "#f1b52e",
        },
        {
          title: "Temporary Drivers",
          value: "204",
          subtitle: "Pending compliance review",
          icon: "bi-person-fill-lock",
          bg: "#ffe9e4",
          iconColor: "#f58b68",
        },
        {
          title: "Violations This Month",
          value: "142",
          subtitle: "Recorded apprehensions",
          icon: "bi-clipboard-data-fill",
          bg: "#f1ecff",
          iconColor: "#7b6df6",
        },
      ],
      trendData: [
        { time: "Week 1", value: 42 },
        { time: "Week 2", value: 38 },
        { time: "Week 3", value: 47 },
        { time: "Week 4", value: 35 },
      ],
      processedPercent: 74,
      statusBreakdown: [
        { label: "Resolved", color: "#5b8def", value: 50 },
        { label: "Pending", color: "#f2c94c", value: 24 },
        { label: "Under Review", color: "#f58b68", value: 26 },
      ],
      recentViolations: [
        {
          id: "#876902",
          violator: "Leo Ramos",
          violation: "Colorum",
          amount: "₱314",
          count: "114",
          total: "₱35,796",
          status: "Under Review",
        },
        {
          id: "#876945",
          violator: "Ana Villanueva",
          violation: "No Helmet",
          amount: "₱178",
          count: "136",
          total: "₱24,208",
          status: "Resolved",
        },
        {
          id: "#876978",
          violator: "Mark Reyes",
          violation: "Overloading",
          amount: "₱221",
          count: "89",
          total: "₱19,669",
          status: "Pending",
        },
        {
          id: "#877001",
          violator: "Carlo Dizon",
          violation: "No Franchise",
          amount: "₱332",
          count: "64",
          total: "₱21,248",
          status: "Pending",
        },
      ],
      commonViolations: [
        { label: "No Helmet", percent: 72, color: "#5b8def" },
        { label: "Colorum", percent: 68, color: "#f58b68" },
        { label: "Overloading", percent: 51, color: "#f2c94c" },
        { label: "No Franchise", percent: 39, color: "#8b5cf6" },
      ],
    },

    Custom: {
      stats: [
        {
          title: "Registered Drivers",
          value: "171",
          subtitle: "Active and verified records",
          icon: "bi-person-badge-fill",
          bg: "#eef4ff",
          iconColor: "#4f8df7",
        },
        {
          title: "Colorum Cases",
          value: "14",
          subtitle: "Filtered custom range",
          icon: "bi-exclamation-triangle-fill",
          bg: "#fff4dc",
          iconColor: "#f1b52e",
        },
        {
          title: "Temporary Drivers",
          value: "88",
          subtitle: "Pending compliance review",
          icon: "bi-person-fill-lock",
          bg: "#ffe9e4",
          iconColor: "#f58b68",
        },
        {
          title: "Violations in Range",
          value: "41",
          subtitle: "Recorded apprehensions",
          icon: "bi-clipboard-data-fill",
          bg: "#f1ecff",
          iconColor: "#7b6df6",
        },
      ],
      trendData: [
        { time: "Range 1", value: 7 },
        { time: "Range 2", value: 11 },
        { time: "Range 3", value: 9 },
        { time: "Range 4", value: 13 },
      ],
      processedPercent: 69,
      statusBreakdown: [
        { label: "Resolved", color: "#5b8def", value: 44 },
        { label: "Pending", color: "#f2c94c", value: 25 },
        { label: "Under Review", color: "#f58b68", value: 31 },
      ],
      recentViolations: [
        {
          id: "#877111",
          violator: "Rico Flores",
          violation: "No Helmet",
          amount: "₱178",
          count: "18",
          total: "₱3,204",
          status: "Resolved",
        },
        {
          id: "#877120",
          violator: "Ben Cruz",
          violation: "Colorum",
          amount: "₱314",
          count: "9",
          total: "₱2,826",
          status: "Under Review",
        },
        {
          id: "#877133",
          violator: "Paolo Santos",
          violation: "No Franchise",
          amount: "₱332",
          count: "7",
          total: "₱2,324",
          status: "Pending",
        },
        {
          id: "#877140",
          violator: "Mia Lopez",
          violation: "Overloading",
          amount: "₱221",
          count: "11",
          total: "₱2,431",
          status: "Pending",
        },
      ],
      commonViolations: [
        { label: "No Helmet", percent: 66, color: "#5b8def" },
        { label: "Colorum", percent: 58, color: "#f58b68" },
        { label: "Overloading", percent: 42, color: "#f2c94c" },
        { label: "No Franchise", percent: 33, color: "#8b5cf6" },
      ],
    },
  };

  const currentData = useMemo(() => {
    return dashboardData[activeRange];
  }, [activeRange]);

  const stats = currentData.stats;
  const trendData = currentData.trendData;
  const processedPercent = currentData.processedPercent;
  const statusBreakdown = currentData.statusBreakdown;
  const recentViolations = currentData.recentViolations;
  const commonViolations = currentData.commonViolations;

  const donutStyle = useMemo(() => {
    const [resolved, pending, review] = statusBreakdown;
    const resolvedEnd = resolved.value * 3.6;
    const pendingEnd = resolvedEnd + pending.value * 3.6;

    return {
      background: `conic-gradient(
        ${resolved.color} 0deg ${resolvedEnd}deg,
        ${pending.color} ${resolvedEnd}deg ${pendingEnd}deg,
        ${review.color} ${pendingEnd}deg 360deg
      )`,
    };
  }, [statusBreakdown]);

  return (
    <div className="container-fluid py-3 py-md-4 px-2 px-md-3 px-xl-4">
      <div className="mx-auto" style={{ maxWidth: "1400px" }}>
        <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between mb-4 gap-3">
          <div>
            <h1 className="dashboard-title fw-bold mb-1">Dashboard Overview</h1>
            <div className="dashboard-subtitle">
              Monitor driver records, violation trends, and compliance activity.
            </div>
          </div>

          <div className="dashboard-filter-wrap">
            <div className="dashboard-filter-label">Date Range</div>

            <div className="dashboard-range-pills">
              {rangeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setActiveRange(option)}
                  className={`dashboard-range-pill ${
                    activeRange === option ? "active" : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="row g-3 g-md-4 mb-4">
          {stats.map((item) => (
            <div className="col-12 col-sm-6 col-xxl-3" key={item.title}>
              <div className="card border-0 shadow-sm h-100 dashboard-stat-card">
                <div className="card-body d-flex align-items-center gap-3 p-3 p-md-4">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle dashboard-stat-icon"
                    style={{
                      backgroundColor: item.bg,
                      color: item.iconColor,
                    }}
                  >
                    <i className={`bi ${item.icon}`} />
                  </div>

                  <div className="min-w-0">
                    <div className="dashboard-stat-label">{item.title}</div>
                    <div className="dashboard-stat-value">{item.value}</div>
                    <div className="dashboard-stat-subtitle">{item.subtitle}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-3 g-md-4 mb-4 align-items-stretch">
          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm h-100 dashboard-panel">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h5 className="fw-semibold mb-1 dashboard-section-title">
                      Violation Trend
                    </h5>
                    <div className="dashboard-section-subtitle">
                      Showing violation data for: <strong>{activeRange}</strong>
                    </div>
                  </div>
                  <button className="btn btn-sm border-0 text-secondary dashboard-icon-button">
                    <i className="bi bi-three-dots" />
                  </button>
                </div>

                <div className="dashboard-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#9aa1b2" }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0b1033",
                          border: "none",
                          borderRadius: 12,
                          color: "#fff",
                          fontSize: 12,
                          boxShadow: "0 10px 25px rgba(11,16,51,0.18)",
                        }}
                        labelStyle={{ color: "#c7cbe3" }}
                        cursor={{ stroke: "#dfe3f0", strokeWidth: 1 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#5b63ff"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: "#5b63ff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm h-100 dashboard-panel">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h5 className="fw-semibold mb-1 dashboard-section-title">
                      Case Status Breakdown
                    </h5>
                    <div className="dashboard-section-subtitle">
                      Overview of current violation processing
                    </div>
                  </div>
                  <button className="btn btn-sm border-0 text-secondary dashboard-icon-button">
                    <i className="bi bi-three-dots" />
                  </button>
                </div>

                <div className="d-flex flex-column align-items-center justify-content-start h-100">
                  <div
                    className="position-relative d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: "min(220px, 70vw)",
                      height: "min(220px, 70vw)",
                      borderRadius: "50%",
                      ...donutStyle,
                    }}
                  >
                    <div className="bg-white rounded-circle d-flex flex-column align-items-center justify-content-center dashboard-donut-inner">
                      <div
                        className="fw-bold"
                        style={{ fontSize: 24, color: "#111827" }}
                      >
                        {processedPercent}%
                      </div>
                      <div className="text-muted small">Processed Cases</div>
                    </div>
                  </div>

                  <div
                    className="d-flex justify-content-center flex-wrap"
                    style={{ gap: "12px 24px" }}
                  >
                    {statusBreakdown.map((item) => (
                      <div
                        className="d-flex align-items-center gap-2"
                        key={item.label}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: item.color,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        <span className="text-secondary">
                          {item.label} ({item.value}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 g-md-4 align-items-stretch">
          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm h-100 dashboard-panel">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h5 className="fw-semibold mb-1 dashboard-section-title">
                      Recent Violations
                    </h5>
                    <div className="dashboard-section-subtitle">
                      Latest apprehension and penalty records for{" "}
                      <strong>{activeRange}</strong>
                    </div>
                  </div>
                  <button className="btn btn-sm border-0 text-secondary dashboard-icon-button">
                    <i className="bi bi-three-dots" />
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle mb-0 dashboard-table">
                    <thead>
                      <tr>
                        <th className="border-0">Violation ID</th>
                        <th className="border-0">Violator</th>
                        <th className="border-0">Violation</th>
                        <th className="border-0">Penalty</th>
                        <th className="border-0">Count</th>
                        <th className="border-0">Total Amount</th>
                        <th className="border-0">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentViolations.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-semibold">{item.id}</td>
                          <td>{item.violator}</td>
                          <td>{item.violation}</td>
                          <td>{item.amount}</td>
                          <td>
                            <span className="dashboard-count-badge">
                              {item.count}
                            </span>
                          </td>
                          <td className="fw-semibold">{item.total}</td>
                          <td>
                            <span
                              className={`dashboard-status-badge ${
                                item.status === "Resolved"
                                  ? "resolved"
                                  : item.status === "Pending"
                                  ? "pending"
                                  : "review"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm h-100 dashboard-panel">
              <div className="card-body p-3 p-md-4">
                <div className="mb-4">
                  <h5 className="fw-semibold mb-1 dashboard-section-title">
                    Most Common Violations
                  </h5>
                  <div className="dashboard-section-subtitle">
                    Most frequent offenses for <strong>{activeRange}</strong>
                  </div>
                </div>

                <div className="d-flex flex-column gap-4">
                  {commonViolations.map((item, index) => (
                    <div key={item.label}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="dashboard-rank-badge">
                            {index + 1}
                          </span>
                          <span className="fw-medium">{item.label}</span>
                        </div>
                        <span className="text-muted small">
                          {item.percent}%
                        </span>
                      </div>
                      <div className="dashboard-progress-track">
                        <div
                          className="dashboard-progress-fill"
                          style={{
                            width: `${item.percent}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}