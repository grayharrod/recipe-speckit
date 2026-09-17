import apiClient from "./services";

export default {
  getUser() {
    return apiClient.get("users");
  },
  getUserById(id) {
    return apiClient.get(`users/${id}`);
  },
  addUser(user) {
    return apiClient.post("users", user);
  },
  updateUser(id, user) {
    return apiClient.put(`users/${id}`, user);
  },
  loginUser(user) {
    const body = user?.value ?? user;
    return apiClient.post("login", {
      username: body.username,
      password: body.password,
    });
  },
  logoutUser() {
    return apiClient.post("logout");
  },
};
