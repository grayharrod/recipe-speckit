/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

const request = require("supertest");
const app = require("../server");
const db = require("../app/models");

const registerBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  password: "password1",
  ...overrides,
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

async function register(overrides = {}) {
  const res = await request(app)
    .post("/recipeapi/register")
    .send(registerBody(overrides));
  expect(res.status).toBe(201);
  return res.body;
}

describe("Feature 4 — User Profile Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await db.session.destroy({ where: {} });
    await db.user.destroy({ where: {} });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const user = await register();

      const res = await request(app)
        .put(`/recipeapi/users/${user.userId}`)
        .set(authHeader(user.token))
        .send({
          fName: "Janet",
          lName: "Smith",
          email: "janet@example.com",
          username: "jsmith",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.userId,
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });
      expect(res.body.password).toBeUndefined();
      expect(res.body.salt).toBeUndefined();

      const stored = await db.user.findByPk(user.userId);
      expect(stored.fName).toBe("Janet");
      expect(stored.username).toBe("jsmith");
    });

    it("User fetches their own profile", async () => {
      const user = await register();

      const res = await request(app)
        .get(`/recipeapi/users/${user.userId}`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.userId,
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
      });
      expect(res.body.password).toBeUndefined();
      expect(res.body.salt).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userA = await register();
      const userB = await register({
        username: "userb",
        email: "b@example.com",
      });

      const res = await request(app)
        .get(`/recipeapi/users/${userB.userId}`)
        .set(authHeader(userA.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `User with id=${userB.userId} not found.`,
      });
    });

    it("User attempts to update another user's profile", async () => {
      const userA = await register();
      const userB = await register({
        username: "userb",
        email: "b@example.com",
        fName: "Bob",
      });

      const res = await request(app)
        .put(`/recipeapi/users/${userB.userId}`)
        .set(authHeader(userA.token))
        .send({
          fName: "Hacked",
          lName: "Doe",
          email: "b@example.com",
          username: "userb",
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `User with id=${userB.userId} not found.`,
      });

      const stored = await db.user.findByPk(userB.userId);
      expect(stored.fName).toBe("Bob");
    });

    it("Unauthenticated profile API request", async () => {
      const res = await request(app).get("/recipeapi/users/1");

      expect(res.status).toBe(401);
      expect(res.body.message).toEqual(expect.any(String));
    });

    it("Profile update rejects a password that is too short", async () => {
      const user = await register();

      const res = await request(app)
        .put(`/recipeapi/users/${user.userId}`)
        .set(authHeader(user.token))
        .send({ password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Password must be at least 8 characters.",
      });
    });

    it("Profile update rejects missing required fields", async () => {
      const user = await register();

      const res = await request(app)
        .put(`/recipeapi/users/${user.userId}`)
        .set(authHeader(user.token))
        .send({
          fName: "",
          lName: "Doe",
          email: "jdoe@example.com",
          username: "jdoe",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "First name is required." });

      const stored = await db.user.findByPk(user.userId);
      expect(stored.fName).toBe("Jane");
    });

    it("Profile update rejects a duplicate username", async () => {
      const userA = await register();
      await register({
        username: "userb",
        email: "b@example.com",
      });

      const res = await request(app)
        .put(`/recipeapi/users/${userA.userId}`)
        .set(authHeader(userA.token))
        .send({
          fName: "Jane",
          lName: "Doe",
          email: "jdoe@example.com",
          username: "userb",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });

      const storedB = await db.user.findOne({ where: { username: "userb" } });
      expect(storedB).not.toBeNull();
      expect(storedB.email).toBe("b@example.com");
    });

    it("Profile update rejects a duplicate email", async () => {
      const userA = await register();
      await register({
        username: "userb",
        email: "b@example.com",
      });

      const res = await request(app)
        .put(`/recipeapi/users/${userA.userId}`)
        .set(authHeader(userA.token))
        .send({
          fName: "Jane",
          lName: "Doe",
          email: "b@example.com",
          username: "jdoe",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });

      const storedB = await db.user.findOne({ where: { email: "b@example.com" } });
      expect(storedB).not.toBeNull();
      expect(storedB.username).toBe("userb");
    });

    it("Unauthenticated profile update API request", async () => {
      const res = await request(app)
        .put("/recipeapi/users/1")
        .send({
          fName: "Jane",
          lName: "Doe",
          email: "jdoe@example.com",
          username: "jdoe",
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toEqual(expect.any(String));
    });
  });
});
