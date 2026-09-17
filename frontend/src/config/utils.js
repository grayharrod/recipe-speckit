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
  /** Resolve stored recipe imagePath to a browser-loadable URL. */
  recipeImageUrl(imagePath) {
    if (!imagePath) {
      return null;
    }
    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }
    if (import.meta.env.DEV) {
      return `http://localhost:3200${imagePath}`;
    }
    return imagePath;
  },
};
