// Mocked user store with roles, persisted to localStorage.

const USERS_KEY = "LEARN_SPHERE_USERS";

// --- Utilities ---
function normalize(email = "") {
  return email.toLowerCase();
}

function mapFromObject(obj) {
  const m = new Map();
  Object.entries(obj || {}).forEach(([k, v]) => m.set(k, v));
  return m;
}

function objectFromMap(m) {
  const obj = {};
  m.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
}

function readUsersFromStorage() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return mapFromObject(parsed);
  } catch {
    return null;
  }
}

function writeUsersToStorage(map) {
  try {
    const obj = objectFromMap(map);
    localStorage.setItem(USERS_KEY, JSON.stringify(obj));
  } catch {
    // swallow for mock
  }
}

// --- In-memory map + hydration ---
const seededUsers = new Map();

// Initial seed (email normalized to lowercase)
seededUsers.set("student@example.com", {
  name: "Student",
  email: "student@example.com",
  role: "student",
});
seededUsers.set("test@school.edu", {
  name: "Test User",
  email: "test@school.edu",
  role: "student",
});
seededUsers.set("rohit@gmail.com", {
  name: "Rohit",
  email: "rohit@gmail.com",
  role: "student",
});
seededUsers.set("instructor@example.com", {
  name: "Instructor",
  email: "instructor@example.com",
  role: "admin",
  password: "Instructor@123",
});

// Hydrate from localStorage if present; otherwise persist the seed once
(function hydrate() {
  const stored = readUsersFromStorage();
  if (stored && stored.size > 0) {
    // Replace in-memory map with stored values
    seededUsers.clear();
    stored.forEach((v, k) => seededUsers.set(k, v));
  } else {
    // First run — persist the seed
    writeUsersToStorage(seededUsers);
  }
})();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// --- Public API ---

export const checkDuplicateEmail = async (email) => {
  const normalized = normalize(email);
  await delay(100);
  return seededUsers.has(normalized);
};

export const getUserByEmail = async (email) => {
  const normalized = normalize(email);
  await delay(100);
  return seededUsers.get(normalized) || null;
};

export const registerUser = async ({
  name,
  email,
  password,
  role = "student",
}) => {
  const normalized = normalize(email);
  await delay(150);

  // Optional: prevent duplicates
  if (seededUsers.has(normalized)) {
    throw new Error("Email already registered");
  }

  const user = { name, email: normalized, role, password };
  seededUsers.set(normalized, user);
  writeUsersToStorage(seededUsers);
  return { ok: true, name, email: normalized, role };
};

export const updateUser = async (email, updates = {}) => {
  const normalized = normalize(email);
  await delay(120);
  const existing = seededUsers.get(normalized);
  if (!existing) return null;
  const merged = { ...existing, ...updates, email: normalized };
  seededUsers.set(normalized, merged);
  writeUsersToStorage(seededUsers);
  return merged;
};

// (Optional) helper for tests/dev tools
export const clearAllUsers = () => {
  localStorage.removeItem(USERS_KEY);
  seededUsers.clear();
  // Re-seed defaults after clear if you want:
  seededUsers.set("student@example.com", {
    name: "Student",
    email: "student@example.com",
    role: "student",
  });
  seededUsers.set("test@school.edu", {
    name: "Test User",
    email: "test@school.edu",
    role: "student",
  });
  seededUsers.set("rohit@gmail.com", {
    name: "Rohit",
    email: "rohit@gmail.com",
    role: "student",
  });
  seededUsers.set("instructor@example.com", {
    name: "Instructor",
    email: "instructor@example.com",
    role: "admin",
    password: "Instructor@123",
  });
  writeUsersToStorage(seededUsers);
};