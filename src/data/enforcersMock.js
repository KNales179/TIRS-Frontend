// src/data/enforcersMock.js

export const enforcersMock = [
  {
    id: "e1", // internal id for routing
    idNumber: "TFRO-ENF-001",
    name: "Mike Vargas",
    contact: "09123456789",
    address: "Brgy. 1, Lucena City",
    photoUrl: "",

    apprehensionRecord: [
      {
        date: "2025-02-10",
        personApprehended: "Juan Dela Cruz",
        violationCommitted: "Colorum",
        location: "Brgy. 6",
        commission: 300,
        totalApprehension: "unavailable",
      },
      {
        date: "2025-02-15",
        personApprehended: "Pedro Santos",
        violationCommitted: "Registered - No Helmet",
        location: "Brgy. 3",
        commission: 300,
        totalApprehension: "unavailable",
      },
    ],
  },
  {
    id: "e2",
    idNumber: "TFRO-ENF-002",
    name: "Ana Reyes",
    contact: "09987654321",
    address: "Brgy. 2, Lucena City",
    photoUrl: "",
    apprehensionRecord: [
      {
        date: "2025-01-20",
        personApprehended: "Mark Ruffalo",
        violationCommitted: "Overloading",
        location: "Brgy. 5",
        commission: 300,
        totalApprehension: "unavailable",
      },
    ],
  },
];

export function findEnforcerById(id) {
  return enforcersMock.find((x) => x.id === id);
}

export function computeTotalApprehended(enforcer) {
  return (enforcer?.apprehensionRecord || []).length;
}