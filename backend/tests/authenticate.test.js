/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
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

const seedRecipe = (userId, name) =>
  db.recipe.create({
    name,
    description: `${name} description`,
    servings: 2,
    time: 15,
    isPublished: false,
    userId,
  });

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await db.recipe.destroy({ where: {} });
    await db.session.destroy({ where: {} });
    await db.user.destroy({ where: {} });
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const created = await request(app)
        .post("/recipeapi/register")
        .send(registerBody());

      const res = await request(app)
        .get(`/recipeapi/recipes/user/${created.body.userId}`)
        .set("Authorization", `Bearer ${created.body.token}`);

      expect(res.status).toBe(200);
    });

    it("Protected API request succeeds with a valid session", async () => {
      const userA = await request(app)
        .post("/recipeapi/register")
        .send(registerBody());
      const userB = await request(app)
        .post("/recipeapi/register")
        .send({
          fName: "Bob",
          lName: "Smith",
          email: "bob@example.com",
          username: "bsmith",
          password: "password1",
        });

      await seedRecipe(userA.body.userId, "A's recipe");
      await seedRecipe(userB.body.userId, "B's recipe");

      const res = await request(app)
        .get(`/recipeapi/recipes/user/${userB.body.userId}`)
        .set("Authorization", `Bearer ${userA.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.map((row) => row.name)).toEqual(["A's recipe"]);
      expect(res.body.every((row) => row.userId === userA.body.userId)).toBe(
        true
      );
    });

    it("Expired or invalid session token", async () => {
      const created = await request(app)
        .post("/recipeapi/register")
        .send(registerBody());

      await db.session.update(
        { expirationDate: new Date(Date.now() - 1000) },
        { where: { token: created.body.token } }
      );

      const expired = await request(app)
        .get(`/recipeapi/recipes/user/${created.body.userId}`)
        .set("Authorization", `Bearer ${created.body.token}`);

      expect(expired.status).toBe(401);
      expect(expired.body.message).toMatch(/unauthorized/i);

      const invalid = await request(app)
        .get(`/recipeapi/recipes/user/${created.body.userId}`)
        .set("Authorization", "Bearer not-a-real-token");

      expect(invalid.status).toBe(401);
      expect(invalid.body.message).toMatch(/unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const res = await request(app).get("/recipeapi/recipes/user/1");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });
});
