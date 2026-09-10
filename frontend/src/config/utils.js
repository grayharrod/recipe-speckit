export default {
  setStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  getStore(key) {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === "") {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  removeItem(key) {
    localStorage.removeItem(key);
  },
};
