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
  downloadExport(res, fallbackName) {
    const header =
      res.headers?.["content-disposition"] ||
      res.headers?.["Content-Disposition"] ||
      "";
    const match = /filename="?([^";]+)"?/i.exec(header);
    const filename = match ? match[1] : fallbackName;
    if (typeof URL.createObjectURL !== "function") {
      return;
    }
    const data = res.data;
    const blob = data instanceof Blob ? data : new Blob([data]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
