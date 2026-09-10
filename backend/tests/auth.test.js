/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
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

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await db.session.destroy({ where: {} });
    await db.user.destroy({ where: {} });
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const res = await request(app)
        .post("/recipeapi/register")
        .send(registerBody());

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        username: "jdoe",
        email: "jdoe@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "worker",
      });
      expect(res.body.userId).toEqual(expect.any(Number));
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findByPk(res.body.userId);
      expect(stored).not.toBeNull();
      expect(stored.password).not.toBe("password1");
      expect(await bcrypt.compare("password1", stored.password)).toBe(true);
    });

    it("User submits registration with missing email", async () => {
      const res = await request(app)
        .post("/recipeapi/register")
        .send(registerBody({ email: "" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is required." });
    });

    it("User submits registration with password too short", async () => {
      const res = await request(app)
        .post("/recipeapi/register")
        .send(registerBody({ password: "short" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Password must be at least 8 characters.",
      });
    });

    it("User registers with a duplicate username", async () => {
      await request(app).post("/recipeapi/register").send(registerBody());

      const res = await request(app)
        .post("/recipeapi/register")
        .send(registerBody({ email: "other@example.com" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });
    });

    it("User registers with a duplicate email", async () => {
      await request(app).post("/recipeapi/register").send(registerBody());

      const res = await request(app)
        .post("/recipeapi/register")
        .send(
          registerBody({
            username: "other",
            email: "jane@example.com",
          })
        );

      expect(res.status).toBe(201);

      const dup = await request(app)
        .post("/recipeapi/register")
        .send(
          registerBody({
            username: "someone",
            email: "jane@example.com",
          })
        );

      expect(dup.status).toBe(400);
      expect(dup.body).toEqual({ message: "Email is already registered." });
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      await request(app).post("/recipeapi/register").send(registerBody());
      await db.session.destroy({ where: {} });

      const res = await request(app)
        .post("/recipeapi/login")
        .send({ username: "jdoe", password: "password1" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        username: "jdoe",
        role: "worker",
      });
      expect(res.body.userId).toEqual(expect.any(Number));
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.password).toBeUndefined();

      const sessions = await db.session.findAll({
        where: { userId: res.body.userId },
      });
      expect(sessions.length).toBe(1);
      expect(sessions[0].token).toBe(res.body.token);
    });

    it("User signs in with invalid password", async () => {
      await request(app).post("/recipeapi/register").send(registerBody());

      const res = await request(app)
        .post("/recipeapi/login")
        .send({ username: "jdoe", password: "wrongpass" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        message: "Invalid username or password.",
      });
    });

    it("User signs in with missing username", async () => {
      const res = await request(app)
        .post("/recipeapi/login")
        .send({ password: "password1" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is required." });
    });

    it("User signs in with missing password", async () => {
      const res = await request(app)
        .post("/recipeapi/login")
        .send({ username: "jdoe" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password is required." });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const created = await request(app)
        .post("/recipeapi/register")
        .send(registerBody());

      const res = await request(app)
        .post("/recipeapi/logout")
        .set("Authorization", `Bearer ${created.body.token}`);

      expect(res.status).toBe(200);

      const sessions = await db.session.findAll({
        where: { token: created.body.token },
      });
      expect(sessions.length).toBe(0);

      const denied = await request(app)
        .get(`/recipeapi/recipes/user/${created.body.userId}`)
        .set("Authorization", `Bearer ${created.body.token}`);
      expect(denied.status).toBe(401);
    });
  });
});
