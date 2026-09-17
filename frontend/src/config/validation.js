export const emailRules = [
  (v) => !!String(v ?? "").trim() || "Email is required.",
  (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "").trim()) ||
    "Enter a valid email address.",
];
