const KEY = "tfro_admin_auth";

export function login(username, password, remember = true) {
  const ok = username === "admin" && password === "admin123";
  if (!ok) return false;

  if (remember) localStorage.setItem(KEY, "1");
  else sessionStorage.setItem(KEY, "1");

  return true;
}

export function logout() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}

export function isAuthed() {
  return localStorage.getItem(KEY) === "1" || sessionStorage.getItem(KEY) === "1";
}