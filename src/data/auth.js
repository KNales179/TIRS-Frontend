// src/data/auth.js

import API_BASE_URL from "../api/api";

const TOKEN_KEY = "tirs_admin_token";
const USER_KEY = "tirs_admin_user";

export async function login(username, password, remember = true) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Login failed",
      };
    }

    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);

    const storage = remember ? localStorage : sessionStorage;

    storage.setItem(TOKEN_KEY, data.token);
    storage.setItem(USER_KEY, JSON.stringify(data.user));

    return {
      success: true,
      mustChangePassword: data.must_change_password,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY)
  );
}

export function isAuthed() {
  return !!getToken();
}

export function getUser() {
  const raw =
    localStorage.getItem(USER_KEY) ||
    sessionStorage.getItem(USER_KEY);

  return raw ? JSON.parse(raw) : null;
}

export function hasRole(allowedRoles = []) {
  const user = getUser();

  return user ? allowedRoles.includes(user.role) : false;
}