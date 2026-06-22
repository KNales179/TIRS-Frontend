// pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

const rangeOptions = ["Today", "This Week", "This Month", "Custom"];

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;



function unwrapArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.drivers)) return data.drivers;
  if (Array.isArray(data?.enforcers)) return data.enforcers;
  if (Array.isArray(data?.apprehensions)) return data.apprehensions;
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getRangeBounds(activeRange, customStart, customEnd) {
  if (activeRange === "Today") {
    return { start: startOfToday(), end: endOfToday() };
  }

  if (activeRange === "This Week") {
    return { start: startOfWeek(), end: endOfToday() };
  }

  if (activeRange === "This Month") {
    return { start: startOfMonth(), end: endOfToday() };
  }

  if (activeRange === "Custom" && customStart && customEnd) {
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);

    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  return { start: null, end: null };
}

function isWithinRange(dateValue, start, end) {
  const date = toDate(dateValue);
  if (!date) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function getApprehensionDate(item) {
  return (
    item.apprehension_date ||
    item.date ||
    item.created_at ||
    item.createdAt ||
    item.updated_at
  );
}

function getViolatorName(item) {
  return (
    item.driver_name ||
    item.violator_name ||
    item.unregistered_name ||
    item.name ||
    item.driver?.name ||
    item.driver?.full_name ||
    "Unknown Violator"
  );
}

function getViolationNames(item) {
  const violations =
    item.violations ||
    item.violation_list ||
    item.apprehension_violations ||
    item.violationTypes ||
    [];

  if (Array.isArray(violations) && violations.length > 0) {
    return violations
      .map(
        (v) =>
          v.violation_name ||
          v.name ||
          v.offense_name ||
          v.violation_type ||
          v.title
      )
      .filter(Boolean);
  }

  return [
    item.violation_name,
    item.violation,
    item.offense_name,
    item.offense,
  ].filter(Boolean);
}

function getPenalty(item) {
  return Number(
    item.total_penalty ||
      item.totalPenalty ||
      item.penalty ||
      item.amount ||
      item.fine ||
      0
  );
}

function normalizeStatus(status) {
  const s = String(status || "NEW").toUpperCase();

  if (s === "SETTLED" || s === "PAID") return "Resolved";
  if (s === "ON_PROCESS") return "Under Review";
  if (s === "DISPUTED") return "Under Review";
  if (s === "CANCELLED") return "Cancelled";

  return "Pending";
}

function buildTrendData(apprehensions, activeRange, start, end) {
  if (activeRange === "Today") {
    const hours = Array.from({ length: 10 }, (_, i) => {
      const hour = i + 8;
      const label = new Date(2026, 0, 1, hour).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        hour12: true,
      });

      return { time: label, value: 0, hour };
    });

    apprehensions.forEach((item) => {
      const d = toDate(getApprehensionDate(item));
      if (!d) return;

      const found = hours.find((h) => h.hour === d.getHours());
      if (found) found.value += 1;
    });

    return hours.map(({ hour, ...rest }) => rest);
  }

  if (activeRange === "This Week") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const data = labels.map((label) => ({ time: label, value: 0 }));

    apprehensions.forEach((item) => {
      const d = toDate(getApprehensionDate(item));
      if (!d) return;

      const index = d.getDay() === 0 ? 6 : d.getDay() - 1;
      data[index].value += 1;
    });

    return data;
  }

  if (activeRange === "This Month") {
    const data = [
      { time: "Week 1", value: 0 },
      { time: "Week 2", value: 0 },
      { time: "Week 3", value: 0 },
      { time: "Week 4", value: 0 },
      { time: "Week 5", value: 0 },
    ];

    apprehensions.forEach((item) => {
      const d = toDate(getApprehensionDate(item));
      if (!d) return;

      const weekIndex = Math.min(Math.floor((d.getDate() - 1) / 7), 4);
      data[weekIndex].value += 1;
    });

    return data;
  }

  const safeStart = start || startOfMonth();
  const safeEnd = end || endOfToday();
  const totalDays = Math.max(
    1,
    Math.ceil((safeEnd - safeStart) / (1000 * 60 * 60 * 24)) + 1
  );

  const chunks = 4;
  const data = Array.from({ length: chunks }, (_, i) => ({
    time: `Range ${i + 1}`,
    value: 0,
  }));

  apprehensions.forEach((item) => {
    const d = toDate(getApprehensionDate(item));
    if (!d) return;

    const dayOffset = Math.floor((d - safeStart) / (1000 * 60 * 60 * 24));
    const index = Math.min(
      chunks - 1,
      Math.max(0, Math.floor((dayOffset / totalDays) * chunks))
    );

    data[index].value += 1;
  });

  return data;
}

export default function Dashboard() {
  const [activeRange, setActiveRange] = useState("This Week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [drivers, setDrivers] = useState([]);
  const [enforcers, setEnforcers] = useState([]);
  const [apprehensions, setApprehensions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [driversRes, enforcersRes, apprehensionsRes] = await Promise.all([
        apiRequest("/drivers"),
        apiRequest("/enforcers"),
        apiRequest("/apprehensions"),
      ]);

      setDrivers(unwrapArray(driversRes));
      setEnforcers(unwrapArray(enforcersRes));
      setApprehensions(unwrapArray(apprehensionsRes));
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const currentData = useMemo(() => {
    const { start, end } = getRangeBounds(activeRange, customStart, customEnd);

    const filteredApprehensions = apprehensions.filter((item) =>
      isWithinRange(getApprehensionDate(item), start, end)
    );

    const activeDrivers = drivers.filter((driver) => {
      const status = String(driver.status || driver.driver_status || "")
        .toUpperCase()
        .trim();

      return !status || status === "ACTIVE" || status === "VERIFIED";
    });

    const temporaryDrivers = drivers.filter((driver) => {
      const type = String(
        driver.driver_type ||
          driver.classification ||
          driver.type ||
          driver.category ||
          ""
      )
        .toUpperCase()
        .trim();

      return type.includes("TEMPORARY") || type.includes("SPECIAL");
    });

    const colorumCases = filteredApprehensions.filter((item) => {
      const type = String(
        item.violator_type || item.classification || item.type || ""
      ).toUpperCase();

      const violationText = getViolationNames(item).join(" ").toUpperCase();

      return type.includes("COLORUM") || violationText.includes("COLORUM");
    });

    const processedCount = filteredApprehensions.filter((item) =>
      ["PAID", "SETTLED"].includes(String(item.status || "").toUpperCase())
    ).length;

    const processedPercent =
      filteredApprehensions.length > 0
        ? Math.round((processedCount / filteredApprehensions.length) * 100)
        : 0;

    const statusCounts = {
      Resolved: 0,
      Pending: 0,
      "Under Review": 0,
    };

    filteredApprehensions.forEach((item) => {
      const label = normalizeStatus(item.status);

      if (label === "Resolved") statusCounts.Resolved += 1;
      else if (label === "Under Review") statusCounts["Under Review"] += 1;
      else statusCounts.Pending += 1;
    });

    const totalStatus =
      statusCounts.Resolved + statusCounts.Pending + statusCounts["Under Review"];

    const percentOf = (count) =>
      totalStatus > 0 ? Math.round((count / totalStatus) * 100) : 0;

    const commonMap = new Map();

    filteredApprehensions.forEach((item) => {
      const names = getViolationNames(item);
      const finalNames = names.length ? names : ["Unspecified Violation"];

      finalNames.forEach((name) => {
        commonMap.set(name, (commonMap.get(name) || 0) + 1);
      });
    });

    const maxCommon = Math.max(1, ...Array.from(commonMap.values()));

    const commonViolations = Array.from(commonMap.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: Math.round((count / maxCommon) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((item, index) => ({
        ...item,
        color: ["#5b8def", "#f58b68", "#f2c94c", "#8b5cf6"][index],
      }));

    const recentViolations = [...filteredApprehensions]
      .sort((a, b) => {
        const da = toDate(getApprehensionDate(a))?.getTime() || 0;
        const db = toDate(getApprehensionDate(b))?.getTime() || 0;
        return db - da;
      })
      .slice(0, 5)
      .map((item) => {
        const violations = getViolationNames(item);
        const penalty = getPenalty(item);

        return {
          id:
            item.apprehension_code ||
            item.ticket_number ||
            item.id ||
            item.apprehension_id ||
            "N/A",
          violator: getViolatorName(item),
          violation: violations.length
            ? violations.join(", ")
            : "Unspecified Violation",
          amount: money(penalty),
          count: violations.length || 1,
          total: money(penalty),
          status: normalizeStatus(item.status),
        };
      });

    return {
      stats: [
        {
          title: "Registered Drivers",
          value: activeDrivers.length.toLocaleString(),
          subtitle: "Active and verified records",
          icon: "bi-person-badge-fill",
          bg: "#eef4ff",
          iconColor: "#4f8df7",
        },
        {
          title: "Colorum Cases",
          value: colorumCases.length.toLocaleString(),
          subtitle:
            activeRange === "Today"
              ? "Detected today"
              : `Detected in ${activeRange.toLowerCase()}`,
          icon: "bi-exclamation-triangle-fill",
          bg: "#fff4dc",
          iconColor: "#f1b52e",
        },
        {
          title: "Temporary Drivers",
          value: temporaryDrivers.length.toLocaleString(),
          subtitle: "Pending compliance review",
          icon: "bi-person-fill-lock",
          bg: "#ffe9e4",
          iconColor: "#f58b68",
        },
        {
          title:
            activeRange === "Today"
              ? "Violations Today"
              : activeRange === "This Week"
              ? "Violations This Week"
              : activeRange === "This Month"
              ? "Violations This Month"
              : "Violations in Range",
          value: filteredApprehensions.length.toLocaleString(),
          subtitle: "Recorded apprehensions",
          icon: "bi-clipboard-data-fill",
          bg: "#f1ecff",
          iconColor: "#7b6df6",
        },
      ],
      trendData: buildTrendData(filteredApprehensions, activeRange, start, end),
      processedPercent,
      statusBreakdown: [
        {
          label: "Resolved",
          color: "#5b8def",
          value: percentOf(statusCounts.Resolved),
        },
        {
          label: "Pending",
          color: "#f2c94c",
          value: percentOf(statusCounts.Pending),
        },
        {
          label: "Under Review",
          color: "#f58b68",
          value: percentOf(statusCounts["Under Review"]),
        },
      ],
      recentViolations,
      commonViolations,
      enforcerCount: enforcers.length,
    };
  }, [activeRange, customStart, customEnd, drivers, enforcers, apprehensions]);

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

            {error && (
              <div className="alert alert-danger py-2 px-3 mt-3 mb-0">
                {error}
              </div>
            )}
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

            {activeRange === "Custom" && (
              <div className="d-flex gap-2 mt-2">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 text-center text-muted">
              Loading dashboard data...
            </div>
          </div>
        ) : (
          <>
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
                        <div className="dashboard-stat-subtitle">
                          {item.subtitle}
                        </div>
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
                          Showing violation data for:{" "}
                          <strong>{activeRange}</strong>
                        </div>
                      </div>
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
                            activeDot={{
                              r: 6,
                              strokeWidth: 0,
                              fill: "#5b63ff",
                            }}
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
                    <div className="mb-4">
                      <h5 className="fw-semibold mb-1 dashboard-section-title">
                        Case Status Breakdown
                      </h5>
                      <div className="dashboard-section-subtitle">
                        Overview of current violation processing
                      </div>
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
                          <div className="text-muted small">
                            Processed Cases
                          </div>
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
                    </div>

                    <div className="table-responsive">
                      <table
                        className="table align-middle mb-0 dashboard-table"
                        style={{
                          tableLayout: "fixed",
                          width: "100%",
                          minWidth: 800,
                        }}
                      >
                        <colgroup>
                          <col style={{ width: "160px" }} />
                          <col style={{ width: "140px" }} />
                          <col style={{ width: "200px" }} />
                          <col style={{ width: "80px" }} />
                          <col style={{ width: "60px" }} />
                          <col style={{ width: "80px" }} />
                        </colgroup>

                        <thead>
                          <tr>
                            <th className="border-0">Violation ID</th>
                            <th className="border-0">Violator</th>
                            <th className="border-0">Violation</th>
                            <th className="border-0">Penalty</th>
                            <th className="border-0 text-center">Count</th>
                            <th className="border-0">Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {recentViolations.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center text-muted py-4">
                                No violation records found for this range.
                              </td>
                            </tr>
                          ) : (
                            recentViolations.map((item) => (
                              <tr key={item.id}>
                                <td className="fw-semibold">
                                  <TruncatedText value={item.id} maxWidth={170} />
                                </td>

                                <td>
                                  <TruncatedText value={item.violator} maxWidth={150} />
                                </td>

                                <td>
                                  <TruncatedText value={item.violation} maxWidth={240} />
                                </td>

                                <td>
                                  <TruncatedText value={item.amount} maxWidth={110} />
                                </td>

                                <td className="text-center">
                                  <span className="dashboard-count-badge">{item.count}</span>
                                </td>

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
                            ))
                          )}
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
                        Most frequent offenses for{" "}
                        <strong>{activeRange}</strong>
                      </div>
                    </div>

                    <div className="d-flex flex-column gap-4">
                      {commonViolations.length === 0 ? (
                        <div className="text-muted">
                          No violation data available.
                        </div>
                      ) : (
                        commonViolations.map((item, index) => (
                          <div key={item.label}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <span className="dashboard-rank-badge">
                                  {index + 1}
                                </span>
                                <span className="fw-medium">{item.label}</span>
                              </div>
                              <span className="text-muted small">
                                {item.count} case{item.count > 1 ? "s" : ""}
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
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}