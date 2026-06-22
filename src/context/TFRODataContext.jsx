//context/TFRODataContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";

import { driversMock as seedDrivers } from "../data/driversMock";
import { enforcersMock as seedEnforcers } from "../data/enforcersMock";
import { violations as seedViolations } from "../data/violationsMock";
import { violationsMaster } from "../data/violationsMaster";

const TFRODataContext = createContext(null);

function makeId(prefix = "x") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function TFRODataProvider({ children }) {
  const [drivers, setDrivers] = useState(seedDrivers);
  const [enforcers, setEnforcers] = useState(seedEnforcers);
  const [violations, setViolations] = useState(seedViolations);

  function findViolationMaster(code) {
    return violationsMaster.find(
      (item) => String(item.code) === String(code)
    );
  }

  function addViolation(payload) {
    const violationMaster = findViolationMaster(payload.violationCode);

    const officialPenalty = Number(
      violationMaster?.penalty || payload.officialPenalty || 0
    );

    const declaredPenalty = Number(payload.declaredPenalty || 0);

    const discount = Math.max(
      officialPenalty - declaredPenalty,
      0
    );

    const violationRecord = {
      ...payload,
      officialPenalty,
      declaredPenalty,
      discount,
      payableAmount: declaredPenalty,
    };

    // add to violations page
    setViolations((prev) => [violationRecord, ...prev]);

    // update/create driver profile
    setDrivers((prevDrivers) => {
      const existingDriverIndex = prevDrivers.findIndex(
        (d) =>
          d.name.trim().toLowerCase() ===
          payload.driverName.trim().toLowerCase()
      );

      const driverViolation = {
        date: payload.violationDate,
        violation: payload.violation,
        location: payload.location || "",
        originalFine: officialPenalty,
        declaredFine: declaredPenalty,
        status: payload.status || "New",
        apprehender: payload.enforcers || "",
      };

      // existing driver
      if (existingDriverIndex >= 0) {
        const updatedDrivers = [...prevDrivers];

        const existingDriver = updatedDrivers[existingDriverIndex];

        const updatedVehicles = [...(existingDriver.vehicles || [])];

        if (updatedVehicles.length === 0) {
          updatedVehicles.push({
            motor: "",
            modelMake: "",
            engine: "",
            chassis: "",
            plateNo: "",
            status: payload.classification || "Registered",
            violations: [driverViolation],
          });
        } else {
          updatedVehicles[0] = {
            ...updatedVehicles[0],
            violations: [
              ...(updatedVehicles[0].violations || []),
              driverViolation,
            ],
          };
        }

        updatedDrivers[existingDriverIndex] = {
          ...existingDriver,
          vehicles: updatedVehicles,
        };

        return updatedDrivers;
      }

      // create new driver automatically
      const newDriver = {
        id: makeId("d"),
        role: "Driver",
        type:
          String(payload.classification || "").toUpperCase() === "COLORUM"
            ? "COLORUM"
            : "REGISTERED",
        franchiseNo: "",
        name: payload.driverName,
        operatorName: payload.driverName,
        address: "",
        contact: "",
        toda:
          String(payload.classification || "").toUpperCase() === "COLORUM"
            ? "Unregistered"
            : "",
        photoUrl: "",
        franchises: [],
        vehicles: [
          {
            motor: "",
            modelMake: "",
            engine: "",
            chassis: "",
            plateNo: "",
            status: payload.classification || "Registered",
            violations: [driverViolation],
          },
        ],
        transactions: [],
      };

      return [newDriver, ...prevDrivers];
    });
  }

  const value = useMemo(
    () => ({
      drivers,
      setDrivers,

      enforcers,
      setEnforcers,

      violations,
      setViolations,

      violationsMaster,

      addViolation,
    }),
    [drivers, enforcers, violations]
  );

  return (
    <TFRODataContext.Provider value={value}>
      {children}
    </TFRODataContext.Provider>
  );
}

export function useTFROData() {
  const context = useContext(TFRODataContext);

  if (!context) {
    throw new Error(
      "useTFROData must be used inside TFRODataProvider"
    );
  }

  return context;
}