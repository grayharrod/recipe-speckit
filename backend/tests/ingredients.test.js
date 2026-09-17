/**
 * Feature 2 — Recipe Management
 * Feature 3 — Manage Ingredients
 * Spec: features/feature-2-recipe-management.md
 * Spec: features/feature-3-manage-ingredients.md
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

describe("Feature 3 — Manage Ingredients", () => {
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

  describe("US-3.1 — View and create ingredients on the catalog page", () => {
    it("User creates an ingredient on the catalog page", async () => {
      const user = await register();

      const res = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: "Flour",
        unit: "cup",
        userId: user.body.userId,
      });
    });

    it("User cannot add a duplicate ingredient name from the catalog", async () => {
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

  describe("US-3.2 — Edit a private ingredient", () => {
    it("User updates an ingredient name and unit", async () => {
      const user = await register();
      const created = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(user.body.token))
        .send({ ingredientId: created.body.id, quantity: 2 });

      const res = await request(app)
        .put(`/recipeapi/ingredients/${created.body.id}`)
        .set(authHeader(user.body.token))
        .send({ name: "All-purpose flour", unit: "gram" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        name: "All-purpose flour",
        unit: "gram",
      });

      const detail = await request(app)
        .get(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(user.body.token));
      expect(detail.body.recipeIngredient[0].ingredient.name).toBe(
        "All-purpose flour"
      );
      expect(detail.body.recipeIngredient[0].ingredient.unit).toBe("gram");
    });
  });

  describe("US-3.3 — Delete a private ingredient", () => {
    it("User confirms deleting an ingredient", async () => {
      const user = await register();
      const flour = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(user.body.token))
        .send({ ingredientId: flour.body.id, quantity: 2 });

      const res = await request(app)
        .delete(`/recipeapi/ingredients/${flour.body.id}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(await db.ingredient.findByPk(flour.body.id)).toBeNull();
      expect(
        await db.recipeIngredient.count({
          where: { recipeId: recipe.body.id },
        })
      ).toBe(0);
      expect(await db.recipe.findByPk(recipe.body.id)).not.toBeNull();
    });
  });

  describe("US-3.4 — Attach, update, and remove ingredients on a Feature 2 recipe", () => {
    it("Deleting a recipe does not delete private ingredients", async () => {
      const user = await register();
      const flour = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(user.body.token))
        .send({ ingredientId: flour.body.id, quantity: 2 });

      const res = await request(app)
        .delete(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(
        await db.recipeIngredient.count({
          where: { recipeId: recipe.body.id },
        })
      ).toBe(0);
      expect(await db.ingredient.findByPk(flour.body.id)).not.toBeNull();
    });
  });

  describe("US-3.5 — Keep the ingredient catalog private", () => {
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

    it("User cannot update another user's ingredient", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });
      const other = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(userB.body.token))
        .send({ name: "Saffron", unit: "gram" });

      const res = await request(app)
        .put(`/recipeapi/ingredients/${other.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ name: "Stolen" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Ingredient with id=${other.body.id} not found.`,
      });
      const stored = await db.ingredient.findByPk(other.body.id);
      expect(stored.name).toBe("Saffron");
    });

    it("User cannot delete another user's ingredient", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });
      const other = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(userB.body.token))
        .send({ name: "Saffron", unit: "gram" });

      const res = await request(app)
        .delete(`/recipeapi/ingredients/${other.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Ingredient with id=${other.body.id} not found.`,
      });
      expect(await db.ingredient.findByPk(other.body.id)).not.toBeNull();
    });

    it("Unauthenticated ingredient API call", async () => {
      const res = await request(app).get("/recipeapi/ingredients");
      expect(res.status).toBe(401);
    });
  });
});
