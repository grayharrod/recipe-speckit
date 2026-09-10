import apiClient from "./services";

export default {
  getUser() {
    return apiClient.get("users");
  },
  addUser(user) {
    return apiClient.post("users", user);
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
