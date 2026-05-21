import * as XLSX from "xlsx";

function safe(value) {
  return value === undefined || value === null || value === "" ? "—" : value;
}

export function exportProfilesToExcel({ drivers = [], enforcers = [], activeTab = "Driver" }) {
  const workbook = XLSX.utils.book_new();

  const driverRows = [];
  const vehicleRows = [];
  const violationRows = [];
  const transactionRows = [];
  const enforcerRows = [];

  drivers.forEach((driver) => {
    const vehicles = driver.vehicles || [];
    const franchises = driver.franchises || [];

    if (vehicles.length === 0) {
      driverRows.push({
        "Driver ID": safe(driver.id),
        "Driver Name": safe(driver.name),
        "Operator Name": safe(driver.operatorName),
        "Type": safe(driver.type),
        "Contact": safe(driver.contact),
        "Address": safe(driver.address),
        "TODA": safe(driver.toda),
        "Franchise No.": safe(driver.franchiseNo),
        "Plate No.": "—",
        "Vehicle Status": "—",
      });
    }

    vehicles.forEach((vehicle, index) => {
      const franchise =
        franchises.find((f) => Number(f.vehicleIndex) === Number(index)) || null;

      const franchiseNo = franchise?.number || driver.franchiseNo || "—";

      driverRows.push({
        "Driver ID": safe(driver.id),
        "Driver Name": safe(driver.name),
        "Operator Name": safe(driver.operatorName),
        "Type": safe(driver.type),
        "Contact": safe(driver.contact),
        "Address": safe(driver.address),
        "TODA": safe(driver.toda),
        "Franchise No.": safe(franchiseNo),
        "Plate No.": safe(vehicle.plateNo),
        "Vehicle Status": safe(vehicle.status),
      });

      vehicleRows.push({
        "Driver ID": safe(driver.id),
        "Driver Name": safe(driver.name),
        "Operator Name": safe(driver.operatorName),
        "Type": safe(driver.type),
        "TODA": safe(driver.toda),
        "Franchise No.": safe(franchiseNo),
        "Motor": safe(vehicle.motor),
        "Model / Make": safe(vehicle.modelMake),
        "Engine No.": safe(vehicle.engine),
        "Chassis No.": safe(vehicle.chassis),
        "Plate No.": safe(vehicle.plateNo),
        "Status": safe(vehicle.status),
      });

      (vehicle.violations || []).forEach((violation) => {
        violationRows.push({
          "Driver ID": safe(driver.id),
          "Driver Name": safe(driver.name),
          "Operator Name": safe(driver.operatorName),
          "Type": safe(driver.type),
          "TODA": safe(driver.toda),
          "Franchise No.": safe(franchiseNo),
          "Plate No.": safe(vehicle.plateNo),
          "Date": safe(violation.date),
          "Violation": safe(violation.violation),
          "Location": safe(violation.location),
          "Original Fine": safe(violation.originalFine),
          "Declared Fine": safe(violation.declaredFine),
          "Status": safe(violation.status),
          "Apprehender": safe(violation.apprehender),
        });
      });
    });

    (driver.transactions || []).forEach((transaction) => {
      transactionRows.push({
        "Driver ID": safe(driver.id),
        "Driver Name": safe(driver.name),
        "Operator Name": safe(driver.operatorName),
        "Type": safe(driver.type),
        "TODA": safe(driver.toda),
        "Date": safe(transaction.date),
        "Transaction": safe(transaction.transaction),
        "TFRO Personnel": safe(transaction.tfroPersonnel),
      });
    });
  });

  enforcers.forEach((enforcer) => {
    enforcerRows.push({
      "Enforcer ID": safe(enforcer.id),
      "Name": safe(enforcer.name),
      "ID Number": safe(enforcer.idNumber),
      "Contact": safe(enforcer.contact),
      "Address": safe(enforcer.address),
      "Position": safe(enforcer.position),
      "Status": safe(enforcer.status),
    });
  });

  const addSheet = (sheetName, rows) => {
    const data = rows.length ? rows : [{ "No Records": "No records found" }];
    const worksheet = XLSX.utils.json_to_sheet(data);

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    worksheet["!cols"] = [];

    for (let col = range.s.c; col <= range.e.c; col++) {
      worksheet["!cols"].push({ wch: 22 });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  };

  if (activeTab === "Enforcer") {
    addSheet("Enforcers", enforcerRows);
  } else {
    addSheet("Driver Profiles", driverRows);
    addSheet("Vehicle Info", vehicleRows);
    addSheet("Violations", violationRows);
    addSheet("Transactions", transactionRows);
  }

  const fileName =
    activeTab === "Enforcer"
      ? "TFRO_Enforcers_Report.xlsx"
      : activeTab === "Colorum"
      ? "TFRO_Colorum_Driver_Report.xlsx"
      : "TFRO_Driver_Profiles_Report.xlsx";

  XLSX.writeFile(workbook, fileName);
}
export function exportSingleDriverToExcel(driver) {
  if (!driver) return;

  const workbook = XLSX.utils.book_new();

  const safe = (value) =>
    value === undefined || value === null || value === "" ? "—" : value;

  const profileRows = [
    {
      "Driver ID": safe(driver.id),
      "Driver Name": safe(driver.name),
      "Operator Name": safe(driver.operatorName),
      Type: safe(driver.type),
      Contact: safe(driver.contact),
      Address: safe(driver.address),
      TODA: safe(driver.toda),
      "Main Franchise No.": safe(driver.franchiseNo),
    },
  ];

  const vehicleRows = [];
  const violationRows = [];
  const transactionRows = [];

  const vehicles = driver.vehicles || [];
  const franchises = driver.franchises || [];

  vehicles.forEach((vehicle, index) => {
    const franchise =
      franchises.find((f) => Number(f.vehicleIndex) === Number(index)) || null;

    const franchiseNo = franchise?.number || driver.franchiseNo || "—";

    vehicleRows.push({
      "Franchise No.": safe(franchiseNo),
      Motor: safe(vehicle.motor),
      "Model / Make": safe(vehicle.modelMake),
      "Engine No.": safe(vehicle.engine),
      "Chassis No.": safe(vehicle.chassis),
      "Plate No.": safe(vehicle.plateNo),
      Status: safe(vehicle.status),
    });

    (vehicle.violations || []).forEach((violation) => {
      violationRows.push({
        "Franchise No.": safe(franchiseNo),
        "Plate No.": safe(vehicle.plateNo),
        Date: safe(violation.date),
        Violation: safe(violation.violation),
        Location: safe(violation.location),
        "Original Fine": safe(violation.originalFine),
        "Declared Fine": safe(violation.declaredFine),
        Status: safe(violation.status),
        Apprehender: safe(violation.apprehender),
      });
    });
  });

  (driver.transactions || []).forEach((transaction) => {
    transactionRows.push({
      Date: safe(transaction.date),
      Transaction: safe(transaction.transaction),
      "TFRO Personnel": safe(transaction.tfroPersonnel),
    });
  });

  const addSheet = (sheetName, rows) => {
    const data = rows.length ? rows : [{ "No Records": "No records found" }];
    const worksheet = XLSX.utils.json_to_sheet(data);

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    worksheet["!cols"] = [];

    for (let col = range.s.c; col <= range.e.c; col++) {
      worksheet["!cols"].push({ wch: 22 });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  };

  addSheet("Driver Profile", profileRows);
  addSheet("Vehicle Info", vehicleRows);
  addSheet("Violations", violationRows);
  addSheet("Transactions", transactionRows);

  const cleanName = String(driver.name || "Driver")
    .replace(/[^a-z0-9]/gi, "_")
    .toUpperCase();

  XLSX.writeFile(workbook, `TFRO_${cleanName}_RECORD.xlsx`);
}