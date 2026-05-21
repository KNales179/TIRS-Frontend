const KEY = "tfro_admin_auth";
const USER_KEY = "tfro_admin_user";

const USERS = [
  {
    username: "admin",
    password: "admin123",
    name: "Kuya Ogie",
    role: "Admin",
  },
  {
    username: "staff",
    password: "staff123",
    name: "TFRO Staff",
    role: "Staff",
  },
  {
    username: "enforcer",
    password: "enforcer123",
    name: "Traffic Enforcer",
    role: "Enforcer",
  },
];

export function login(username, password, remember = true) {
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return false;

  const safeUser = {
    username: user.username,
    name: user.name,
    role: user.role,
  };

  if (remember) {
    localStorage.setItem(KEY, "1");
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  } else {
    sessionStorage.setItem(KEY, "1");
    sessionStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  }

  return true;
}

export function logout() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function isAuthed() {
  return (
    localStorage.getItem(KEY) === "1" ||
    sessionStorage.getItem(KEY) === "1"
  );
}

export function getUser() {
  const raw =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

  return raw ? JSON.parse(raw) : null;
}

export function hasRole(allowedRoles = []) {
  const user = getUser();
  return user ? allowedRoles.includes(user.role) : false;
}