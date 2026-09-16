/**
 * Feature 2 — Recipe Management
 * Spec: features/feature-2-recipe-management.md
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

const register = (overrides) =>
  request(app).post("/recipeapi/register").send(registerBody(overrides));

describe("Feature 2 — Recipe Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await db.recipeIngredient.destroy({ where: {} });
    await db.recipeStep.destroy({ where: {} });
    await db.ingredient.destroy({ where: {} });
    await db.recipe.destroy({ where: {} });
    await db.session.destroy({ where: {} });
    await db.user.destroy({ where: {} });
  });

  describe("US-2.4 — Edit a recipe", () => {
    it("User adds a new private ingredient from the recipe form", async () => {
      const user = await register();

      const res = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Eggs", unit: "piece" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: "Eggs",
        unit: "piece",
        userId: user.body.userId,
      });
    });

    it("User cannot add a duplicate ingredient name", async () => {
      const user = await register();
      await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });

      const res = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "flour", unit: "cup" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Ingredient name is already in your list.",
      });
    });
  });

  describe("US-2.6 — Keep recipes and ingredients private", () => {
    it("Ingredients list returns only the signed-in user's ingredients", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });

      await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(userA.body.token))
        .send({ name: "Flour", unit: "cup" });
      await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(userB.body.token))
        .send({ name: "Saffron", unit: "gram" });

      const res = await request(app)
        .get("/recipeapi/ingredients")
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((row) => row.name)).toContain("Flour");
      expect(res.body.map((row) => row.name)).not.toContain("Saffron");
    });
  });
});
