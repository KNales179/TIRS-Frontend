// src/utils/exportExcel.js
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import tfroHeadline from "../assets/TFRO-headline.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "tirs_admin_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

async function apiRequest(path) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

function safe(value) {
  return value === undefined || value === null || value === "" ? "—" : value;
}

function money(value) {
  if (value === undefined || value === null || value === "") return 0;
  const number = Number(value || 0);
  return Number.isNaN(number) ? 0 : number;
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

function getDriverCode(driver) {
  return driver?.driver_code || driver?.driverCode || driver?.id || "—";
}

function getDriverName(driver) {
  return (
    driver?.name ||
    [driver?.first_name, driver?.middle_name, driver?.last_name, driver?.suffix]
      .filter(Boolean)
      .join(" ") ||
    "—"
  );
}

function normalizeDriverType(type) {
  const t = String(type || "").trim().toUpperCase();

  if (
    t === "REGISTERED" ||
    t === "REGULAR" ||
    t === "WITH FRANCHISE" ||
    t === "FRANCHISED" ||
    t === "FOR HAILING"
  ) {
    return "REGULAR";
  }

  if (t === "SPECIAL" || t === "SPECIAL FRANCHISE") return "SPECIAL";
  if (t === "COLORUM") return "COLORUM";
  if (t === "TEMPORARY") return "TEMPORARY";

  return t || "—";
}

function normalizeStatus(status) {
  const s = String(status || "NEW").toUpperCase();

  if (s === "ON_PROCESS") return "ON PROCESS";
  if (s === "PAID") return "PAID";
  if (s === "SETTLED") return "SETTLED";
  if (s === "DONE") return "DONE";
  if (s === "CANCELLED") return "CANCELLED";
  if (s === "DISPUTED") return "DISPUTED";

  return "NEW";
}

function normalizeAction(action) {
  const value = String(action || "").replaceAll("_", " ").toLowerCase();
  if (!value) return "—";
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getVehiclePlate(vehicle) {
  return vehicle?.plateNo || vehicle?.plate_number || "—";
}

function getVehicleMotor(vehicle) {
  return vehicle?.motor || vehicle?.motor_number || vehicle?.engine || "—";
}

function getVehicleModel(vehicle) {
  return vehicle?.modelMake || vehicle?.model_make || "—";
}

function getVehicleChassis(vehicle) {
  return vehicle?.chassis || vehicle?.chassis_number || "—";
}

function getFranchiseForVehicle(driver, vehicle) {
  const franchises = driver?.franchises || [];

  if (!vehicle?.id) return null;

  return (
    franchises.find((f) => Number(f.vehicle_id) === Number(vehicle.id)) ||
    franchises.find((f) => Number(f.vehicleIndex) === Number(vehicle.index)) ||
    null
  );
}

function getFranchiseNumber(driver, vehicle) {
  const franchise = getFranchiseForVehicle(driver, vehicle);
  return franchise?.number || franchise?.franchise_number || driver?.franchiseNo || "—";
}

function getToda(driver, vehicle) {
  const franchise = getFranchiseForVehicle(driver, vehicle);
  return franchise?.toda_name || driver?.toda || "—";
}

function getViolationText(apprehension) {
  const violations = apprehension?.violations || [];

  return (
    violations
      .map((item) => {
        const code = item.violation_code ? `${item.violation_code} - ` : "";
        return `${code}${item.name || item.violation_name || ""}`.trim();
      })
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function getEnforcerText(apprehension) {
  const enforcers = apprehension?.enforcers || [];

  return (
    enforcers
      .map((item) => item.enforcer_name || item.name)
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function getCommissionText(apprehension) {
  const enforcers = apprehension?.enforcers || [];

  if (!enforcers.length) return "—";

  return enforcers
    .map((item) => {
      const name = item.enforcer_name || item.name || "Enforcer";
      const share = money(item.commission_share ?? item.commission ?? 0);
      return `${name}: ₱${share.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    })
    .join(" | ");
}

function getLatestPayment(apprehension) {
  const transactions = apprehension?.transactions || [];

  return (
    transactions.find((item) => item.action_taken === "PAYMENT_RECORDED") ||
    transactions[0] ||
    null
  );
}

function filterApprehensionsByDrivers(apprehensions, drivers) {
  const driverIds = new Set(drivers.map((driver) => Number(driver.id)).filter(Boolean));

  return apprehensions.filter((item) => driverIds.has(Number(item.driver_id)));
}

async function fetchAllApprehensionsSafely() {
  try {
    const response = await apiRequest("/apprehensions");
    return response.data || response.apprehensions || [];
  } catch (error) {
    console.warn("Unable to fetch apprehensions for Excel export:", error.message);
    return [];
  }
}

async function imageUrlToBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getDriverStats(driver, apprehensions) {
  const related = apprehensions.filter((item) => Number(item.driver_id) === Number(driver.id));
  const transactions = related.flatMap((item) => item.transactions || []);

  const totalPaid = transactions.reduce(
    (sum, item) => sum + money(item.amount_paid),
    0
  );

  const pendingCount = related.filter((item) => {
    const status = normalizeStatus(item.status);
    return !["PAID", "SETTLED", "DONE", "CANCELLED"].includes(status);
  }).length;

  return {
    violationCount: related.length,
    transactionCount: transactions.length,
    totalPaid,
    pendingCount,
  };
}

function buildDriverRows(drivers, apprehensions) {
  return drivers.map((driver) => {
    const vehicles = driver.vehicles || [];
    const franchises = driver.franchises || [];
    const stats = getDriverStats(driver, apprehensions);

    return {
      driverCode: getDriverCode(driver),
      driverName: getDriverName(driver),
      operatorName: safe(driver.operatorName || driver.operator_name),
      type: normalizeDriverType(driver.type || driver.classification),
      contact: safe(driver.contact || driver.contact_number),
      address: safe(driver.address),
      vehicleCount: vehicles.length,
      franchiseCount: franchises.length,
      violationCount: stats.violationCount,
      transactionCount: stats.transactionCount,
      totalPaid: stats.totalPaid,
      pendingCount: stats.pendingCount,
    };
  });
}

function buildVehicleRows(drivers, apprehensions) {
  const rows = [];

  drivers.forEach((driver) => {
    const vehicles = driver.vehicles || [];

    vehicles.forEach((vehicle) => {
      const vehicleApprehensions = apprehensions.filter(
        (item) => Number(item.vehicle_id) === Number(vehicle.id)
      );

      rows.push({
        driverCode: getDriverCode(driver),
        driverName: getDriverName(driver),
        operatorName: safe(driver.operatorName || driver.operator_name),
        type: normalizeDriverType(driver.type || driver.classification),
        contact: safe(driver.contact || driver.contact_number),
        address: safe(driver.address),
        toda: safe(getToda(driver, vehicle)),
        franchiseNo: safe(getFranchiseNumber(driver, vehicle)),
        motor: safe(getVehicleMotor(vehicle)),
        modelMake: safe(getVehicleModel(vehicle)),
        engineNo: safe(getVehicleMotor(vehicle)),
        chassisNo: safe(getVehicleChassis(vehicle)),
        plateNo: safe(getVehiclePlate(vehicle)),
        color: safe(vehicle.color),
        vehicleStatus: safe(vehicle.status),
        apprehensionCount: vehicleApprehensions.length,
      });
    });
  });

  return rows;
}

function buildViolationRows(apprehensions) {
  return apprehensions.map((item) => {
    const payment = getLatestPayment(item);

    return {
      violationDate: formatDate(item.apprehension_date),
      ticketNo: safe(item.ticket_number),
      driverId: safe(item.driver_code || item.driver_id),
      name: safe(item.driver_name || item.unregistered_name),
      classification: safe(item.classification || item.violator_type),
      plateNo: safe(item.plate_number),
      violation: safe(getViolationText(item)),
      location: safe(item.location),
      totalAmount: money(item.total_penalty),
      commissionRate: money(item.commission_rate),
      commissionSplit: safe(getCommissionText(item)),
      orNumber: safe(payment?.or_number),
      amountPaid: money(payment?.amount_paid),
      paymentMethod: safe(payment?.payment_method),
      paidDate: formatDate(payment?.paid_at),
      status: safe(normalizeStatus(item.status)),
      apprehendingOfficers: safe(getEnforcerText(item)),
      remarks: safe(item.remarks),
    };
  });
}

function buildTransactionRows(apprehensions) {
  const rows = [];

  apprehensions.forEach((apprehension) => {
    const transactions = apprehension.transactions || [];

    transactions.forEach((transaction) => {
      rows.push({
        date: formatDate(transaction.paid_at || transaction.created_at),
        transactionCode: safe(transaction.transaction_code),
        ticketNo: safe(apprehension.ticket_number),
        driverId: safe(apprehension.driver_code || apprehension.driver_id),
        driverName: safe(apprehension.driver_name || apprehension.unregistered_name),
        action: safe(normalizeAction(transaction.action_taken)),
        violationCase: safe(getViolationText(apprehension)),
        amountPaid: money(transaction.amount_paid),
        paymentMethod: safe(transaction.payment_method),
        orNumber: safe(transaction.or_number),
        status: safe(normalizeStatus(apprehension.status)),
        tfroPersonnel: safe(transaction.created_by),
        remarks: safe(transaction.remarks || apprehension.remarks),
      });
    });
  });

  return rows;
}

function buildEnforcerRows(enforcers) {
  return enforcers.map((enforcer) => ({
    enforcerId: safe(enforcer.enforcer_code || enforcer.idNumber || enforcer.id),
    name: safe(enforcer.name),
    contact: safe(enforcer.contact),
    address: safe(enforcer.address),
    position: safe(enforcer.position),
    status: safe(enforcer.status),
  }));
}

function styleCell(cell, options = {}) {
  cell.font = {
    name: "Calibri",
    size: options.size || 11,
    bold: options.bold || false,
    color: { argb: options.fontColor || "FF111827" },
  };

  cell.alignment = {
    vertical: "middle",
    horizontal: options.horizontal || "left",
    wrapText: true,
  };

  if (options.fill) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: options.fill },
    };
  }

  cell.border = {
    top: { style: "thin", color: { argb: "FFD1D5DB" } },
    left: { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    right: { style: "thin", color: { argb: "FFD1D5DB" } },
  };
}

function statusFill(status) {
  const value = String(status || "").toUpperCase();

  if (["SETTLED", "DONE"].includes(value)) return "FFD1FAE5";
  if (value === "PAID") return "FFDBEAFE";
  if (value === "ON PROCESS") return "FFFEF3C7";
  if (["CANCELLED", "DISPUTED"].includes(value)) return "FFFEE2E2";

  return "FFFFFFFF";
}

function addHeader(workbook, worksheet, title, subtitle, lastColumnLetter, headlineBase64) {
  worksheet.views = [{ state: "frozen", ySplit: 6 }];

  worksheet.mergeCells(`A1:${lastColumnLetter}1`);
  worksheet.mergeCells(`A2:${lastColumnLetter}2`);
  worksheet.mergeCells(`A3:${lastColumnLetter}3`);

  worksheet.getRow(1).height = 32;
  worksheet.getRow(2).height = 22;
  worksheet.getRow(3).height = 22;
  worksheet.getRow(4).height = 8;

  worksheet.getCell("A1").value = title;
  worksheet.getCell("A2").value = subtitle;
  worksheet.getCell("A3").value = `Generated: ${new Date().toLocaleString("en-PH")}`;

  styleCell(worksheet.getCell("A1"), {
    bold: true,
    size: 18,
    fontColor: "FFFFFFFF",
    fill: "FF064E3B",
    horizontal: "center",
  });

  styleCell(worksheet.getCell("A2"), {
    bold: true,
    size: 12,
    fontColor: "FFFFFFFF",
    fill: "FF047857",
    horizontal: "center",
  });

  styleCell(worksheet.getCell("A3"), {
    size: 11,
    fontColor: "FF111827",
    fill: "FFFDE047",
    horizontal: "center",
  });

  if (headlineBase64) {
    try {
      const imageId = workbook.addImage({
        base64: headlineBase64,
        extension: "png",
      });

      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 520, height: 78 },
      });

      worksheet.getRow(1).height = 46;
      worksheet.getRow(2).height = 20;
      worksheet.getCell("A1").value = "";
    } catch {
      // ignore image errors, report still exports
    }
  }
}

function addSummary(worksheet, startRow, summaryItems) {
  const row = worksheet.getRow(startRow);
  row.height = 24;

  let col = 1;

  summaryItems.forEach((item) => {
    const labelCell = row.getCell(col);
    const valueCell = row.getCell(col + 1);

    labelCell.value = item.label;
    valueCell.value = item.value;

    styleCell(labelCell, {
      bold: true,
      fill: "FFE5E7EB",
      horizontal: "center",
    });

    styleCell(valueCell, {
      bold: true,
      fill: "FFF9FAFB",
      horizontal: "center",
    });

    col += 2;
  });
}

function addTable(worksheet, startRow, columns, rows) {
  const headerRow = worksheet.getRow(startRow);
  headerRow.height = 24;

  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;

    styleCell(cell, {
      bold: true,
      fontColor: "FFFFFFFF",
      fill: "FF1D4ED8",
      horizontal: "center",
    });

    worksheet.getColumn(index + 1).width = column.width || 18;
  });

  if (!rows.length) {
    const emptyRow = worksheet.getRow(startRow + 1);
    emptyRow.getCell(1).value = "No records found";
    styleCell(emptyRow.getCell(1), {
      fill: "FFF9FAFB",
      horizontal: "center",
    });

    worksheet.mergeCells(startRow + 1, 1, startRow + 1, columns.length);
    return;
  }

  rows.forEach((rowData, rowIndex) => {
    const row = worksheet.getRow(startRow + 1 + rowIndex);
    row.height = 28;

    columns.forEach((column, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      const value = rowData[column.key];

      cell.value = value;

      const isMoney = column.type === "money";
      const isRate = column.type === "rate";
      const fill =
        column.key === "status"
          ? statusFill(value)
          : rowIndex % 2 === 0
          ? "FFFFFFFF"
          : "FFF9FAFB";

      styleCell(cell, {
        fill,
        horizontal: isMoney || isRate ? "right" : "left",
      });

      if (isMoney) {
        cell.numFmt = '"₱"#,##0.00';
      }

      if (isRate) {
        cell.numFmt = "0.00";
      }
    });
  });

  const lastColumn = columns.length;
  const lastRow = startRow + rows.length;

  worksheet.autoFilter = {
    from: { row: startRow, column: 1 },
    to: { row: lastRow, column: lastColumn },
  };
}

function setupPage(worksheet) {
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.35,
      bottom: 0.35,
      header: 0.1,
      footer: 0.1,
    },
  };
}

function addReportSheet({
  workbook,
  sheetName,
  title,
  subtitle,
  columns,
  rows,
  summaryItems = [],
  headlineBase64,
}) {
  const worksheet = workbook.addWorksheet(sheetName);
  const lastColumnLetter = worksheet.getColumn(columns.length).letter;

  setupPage(worksheet);
  addHeader(workbook, worksheet, title, subtitle, lastColumnLetter, headlineBase64);

  if (summaryItems.length) {
    addSummary(worksheet, 5, summaryItems);
    addTable(worksheet, 7, columns, rows);
  } else {
    addTable(worksheet, 5, columns, rows);
  }

  return worksheet;
}

async function saveWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  );
}

export async function exportProfilesToExcel({
  drivers = [],
  enforcers = [],
  activeTab = "Driver",
}) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "TFRO TIRS";
  workbook.created = new Date();

  const headlineBase64 = await imageUrlToBase64(tfroHeadline);

  if (activeTab === "Enforcer") {
    const enforcerRows = buildEnforcerRows(enforcers);

    addReportSheet({
      workbook,
      sheetName: "Enforcers",
      title: "TFRO ENFORCER PROFILES REPORT",
      subtitle: "Tricycle Franchising and Regulatory Office",
      headlineBase64,
      summaryItems: [
        { label: "Total Enforcers", value: enforcerRows.length },
        { label: "Generated By", value: "TIRS" },
      ],
      columns: [
        { header: "Enforcer ID", key: "enforcerId", width: 18 },
        { header: "Name", key: "name", width: 28 },
        { header: "Contact", key: "contact", width: 18 },
        { header: "Address", key: "address", width: 35 },
        { header: "Position", key: "position", width: 18 },
        { header: "Status", key: "status", width: 15 },
      ],
      rows: enforcerRows,
    });

    await saveWorkbook(workbook, "TFRO_Enforcers_Report.xlsx");
    return;
  }

  const selectedDrivers = drivers || [];
  const allApprehensions = await fetchAllApprehensionsSafely();
  const relatedApprehensions = filterApprehensionsByDrivers(
    allApprehensions,
    selectedDrivers
  );

  const driverRows = buildDriverRows(selectedDrivers, relatedApprehensions);
  const vehicleRows = buildVehicleRows(selectedDrivers, relatedApprehensions);
  const violationRows = buildViolationRows(relatedApprehensions);
  const transactionRows = buildTransactionRows(relatedApprehensions);

  const label = activeTab === "Colorum" ? "COLORUM" : "DRIVER";
  const fileName =
    activeTab === "Colorum"
      ? "TFRO_Colorum_Driver_Report.xlsx"
      : "TFRO_Driver_Profiles_Report.xlsx";

  addReportSheet({
    workbook,
    sheetName: "Driver Profiles",
    title: `TFRO ${label} PROFILES REPORT`,
    subtitle: "One row per driver profile",
    headlineBase64,
    summaryItems: [
      { label: "Total Drivers", value: driverRows.length },
      { label: "Total Vehicles", value: vehicleRows.length },
      { label: "Total Violations", value: violationRows.length },
    ],
    columns: [
      { header: "Driver ID", key: "driverCode", width: 18 },
      { header: "Driver Name", key: "driverName", width: 30 },
      { header: "Operator Name", key: "operatorName", width: 28 },
      { header: "Type", key: "type", width: 15 },
      { header: "Contact", key: "contact", width: 18 },
      { header: "Address", key: "address", width: 38 },
      { header: "Vehicle Count", key: "vehicleCount", width: 15 },
      { header: "Franchise Count", key: "franchiseCount", width: 16 },
      { header: "Violation Count", key: "violationCount", width: 16 },
      { header: "Transaction Count", key: "transactionCount", width: 18 },
      { header: "Total Paid", key: "totalPaid", width: 16, type: "money" },
      { header: "Pending Count", key: "pendingCount", width: 16 },
    ],
    rows: driverRows,
  });

  addReportSheet({
    workbook,
    sheetName: "Vehicle Records",
    title: `TFRO ${label} VEHICLE RECORDS`,
    subtitle: "One row per vehicle",
    headlineBase64,
    summaryItems: [
      { label: "Total Vehicles", value: vehicleRows.length },
      { label: "Total Drivers", value: driverRows.length },
    ],
    columns: [
      { header: "Driver ID", key: "driverCode", width: 18 },
      { header: "Driver Name", key: "driverName", width: 28 },
      { header: "Operator Name", key: "operatorName", width: 25 },
      { header: "Type", key: "type", width: 14 },
      { header: "Contact", key: "contact", width: 18 },
      { header: "Address", key: "address", width: 35 },
      { header: "TODA", key: "toda", width: 22 },
      { header: "Franchise No.", key: "franchiseNo", width: 20 },
      { header: "Motor", key: "motor", width: 18 },
      { header: "Model / Make", key: "modelMake", width: 20 },
      { header: "Engine No.", key: "engineNo", width: 18 },
      { header: "Chassis No.", key: "chassisNo", width: 20 },
      { header: "Plate No.", key: "plateNo", width: 16 },
      { header: "Color", key: "color", width: 14 },
      { header: "Vehicle Status", key: "vehicleStatus", width: 18 },
      { header: "Apprehensions", key: "apprehensionCount", width: 16 },
    ],
    rows: vehicleRows,
  });

  addReportSheet({
    workbook,
    sheetName: "Violations",
    title: `TFRO ${label} APPREHENSION / VIOLATION RECORDS`,
    subtitle: "One row per apprehension",
    headlineBase64,
    summaryItems: [
      { label: "Total Records", value: violationRows.length },
      {
        label: "Total Amount",
        value: violationRows.reduce((sum, item) => sum + money(item.totalAmount), 0),
      },
    ],
    columns: [
      { header: "Violation Date", key: "violationDate", width: 16 },
      { header: "Ticket No.", key: "ticketNo", width: 22 },
      { header: "Driver ID", key: "driverId", width: 16 },
      { header: "Name", key: "name", width: 28 },
      { header: "Classification", key: "classification", width: 18 },
      { header: "Plate No.", key: "plateNo", width: 16 },
      { header: "Violation", key: "violation", width: 45 },
      { header: "Location", key: "location", width: 25 },
      { header: "Total Amount", key: "totalAmount", width: 16, type: "money" },
      { header: "Commission Rate", key: "commissionRate", width: 16, type: "rate" },
      { header: "Commission Split", key: "commissionSplit", width: 45 },
      { header: "OR Number", key: "orNumber", width: 16 },
      { header: "Amount Paid", key: "amountPaid", width: 16, type: "money" },
      { header: "Payment Method", key: "paymentMethod", width: 18 },
      { header: "Paid Date", key: "paidDate", width: 16 },
      { header: "Status", key: "status", width: 16 },
      { header: "Apprehending Officer(s)", key: "apprehendingOfficers", width: 35 },
      { header: "Remarks", key: "remarks", width: 30 },
    ],
    rows: violationRows,
  });

  addReportSheet({
    workbook,
    sheetName: "Transactions",
    title: `TFRO ${label} TRANSACTION RECORDS`,
    subtitle: "One row per transaction",
    headlineBase64,
    summaryItems: [
      { label: "Total Transactions", value: transactionRows.length },
      {
        label: "Total Paid",
        value: transactionRows.reduce((sum, item) => sum + money(item.amountPaid), 0),
      },
    ],
    columns: [
      { header: "Date", key: "date", width: 16 },
      { header: "Transaction Code", key: "transactionCode", width: 22 },
      { header: "Ticket No.", key: "ticketNo", width: 22 },
      { header: "Driver ID", key: "driverId", width: 16 },
      { header: "Driver Name", key: "driverName", width: 28 },
      { header: "Action", key: "action", width: 22 },
      { header: "Violation / Case", key: "violationCase", width: 45 },
      { header: "Amount Paid", key: "amountPaid", width: 16, type: "money" },
      { header: "Payment Method", key: "paymentMethod", width: 18 },
      { header: "OR Number", key: "orNumber", width: 16 },
      { header: "Status", key: "status", width: 16 },
      { header: "TFRO Personnel", key: "tfroPersonnel", width: 25 },
      { header: "Remarks", key: "remarks", width: 30 },
    ],
    rows: transactionRows,
  });

  await saveWorkbook(workbook, fileName);
}

export async function exportSingleDriverToExcel(driver) {
  if (!driver) return;

  await exportProfilesToExcel({
    drivers: [driver],
    enforcers: [],
    activeTab: "Driver",
  });
}