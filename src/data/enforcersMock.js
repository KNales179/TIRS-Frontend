// src/data/enforcersMock.js
import { driversMock } from "./driversMock";

const enforcersBase = [
  {
    id: "e1",
    idNumber: "TFRO-ENF-001",
    name: "Mike Vargas",
    contact: "09123456789",
    address: "Brgy. 1, Lucena City",
    photoUrl: "",
  },
  {
    id: "e2",
    idNumber: "TFRO-ENF-002",
    name: "Ana Reyes",
    contact: "09987654321",
    address: "Brgy. 2, Lucena City",
    photoUrl: "",
  },
  {
    id: "e3",
    idNumber: "TFRO-ENF-003",
    name: "Rico Mendoza",
    contact: "09181234567",
    address: "Brgy. 3, Lucena City",
    photoUrl: "",
  },
  {
    id: "e4",
    idNumber: "TFRO-ENF-004",
    name: "Crisanto Villanueva",
    contact: "09214567890",
    address: "Brgy. 4, Lucena City",
    photoUrl: "",
  },
];

function buildApprehensionRecords(drivers) {
  const records = [];

  drivers.forEach((driver) => {
    (driver.vehicles || []).forEach((vehicle) => {
      (vehicle.violations || []).forEach((violation) => {
        records.push({
          apprehender: violation.apprehender || "Unknown",
          date: violation.date,
          personApprehended: driver.name,
          violationCommitted: violation.violation,
          location: violation.location,
          commission: 300,
          totalApprehension: "unavailable",
          driverId: driver.id,
          plateNo: vehicle.plateNo || "",
          vehicleStatus: vehicle.status || "",
          franchiseId: violation.franchiseId || null,
        });
      });
    });
  });

  return records;
}

const allApprehensions = buildApprehensionRecords(driversMock);

export const enforcersMock = enforcersBase.map((enforcer) => ({
  ...enforcer,
  apprehensionRecord: allApprehensions.filter(
    (record) => record.apprehender === enforcer.name
  ),
}));

export function findEnforcerById(id) {
  return enforcersMock.find((x) => x.id === id);
}

export function computeTotalApprehended(enforcer) {
  return (enforcer?.apprehensionRecord || []).length;
}