import axios from "axios";
import Router from "../router.js";
import Utils from "../config/utils.js";

var baseurl = "";
if (import.meta.env.DEV) {
  baseurl = "http://localhost:3200/recipeapi/";
} else {
  baseurl = "/recipeapi/";
}

const apiClient = axios.create({
  baseURL: baseurl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  transformRequest: (data, headers) => {
    const user = Utils.getStore("user");
    const token = user?.token;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (data === undefined || data === null) {
      return data;
    }
    return JSON.stringify(data);
  },
  transformResponse: function (data) {
    if (!data) {
      return data;
    }
    try {
      data = JSON.parse(data);
    } catch {
      return data;
    }
    const message = data?.message;
    if (
      typeof message === "string" &&
      /unauthorized|expired token|invalid session/i.test(message)
    ) {
      Utils.removeItem("user");
      Router.push({ name: "login" });
    }
    return data;
  },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Utils.removeItem("user");
      Router.push({ name: "login" });
    }
    return Promise.reject(err);
  }
);

export default apiClient;
