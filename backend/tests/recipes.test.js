/**
 * Feature 2 — Recipe Management
 * Spec: features/feature-2-recipe-management.md
 */

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../server");
const db = require("../app/models");
const { UPLOAD_DIR } = require("../app/middleware/recipeUpload");

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

const tinyJpeg = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wAAAAD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAf/2Q==",
  "base64"
);

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const clearUploads = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    return;
  }
  for (const file of fs.readdirSync(UPLOAD_DIR)) {
    if (file === ".gitkeep") {
      continue;
    }
    fs.unlinkSync(path.join(UPLOAD_DIR, file));
  }
};

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
    clearUploads();
  });

  afterAll(async () => {
    clearUploads();
  });

  describe("US-2.1 — View my recipes", () => {
    it("Signed-in user sees their recipes after sign-in", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });

      await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userA.body.token))
        .send({ name: "Pancakes" });
      await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userA.body.token))
        .send({ name: "Chili" });
      await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userB.body.token))
        .send({ name: "Secret Stew" });

      const res = await request(app)
        .get("/recipeapi/recipes")
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((row) => row.name).sort()).toEqual([
        "Chili",
        "Pancakes",
      ]);
      expect(res.body.some((row) => row.name === "Secret Stew")).toBe(false);
    });

    it("Recipe list omits another user's recipes", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });

      await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userB.body.token))
        .send({ name: "Secret Stew" });

      const res = await request(app)
        .get("/recipeapi/recipes")
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("US-2.2 — Create a recipe", () => {
    it("User creates a recipe with a valid name", async () => {
      const user = await register();

      const res = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Pancakes");
      expect(res.body.userId).toBe(user.body.userId);

      const stored = await db.recipe.findByPk(res.body.id);
      expect(stored).not.toBeNull();
      expect(stored.userId).toBe(user.body.userId);
    });

    it("User creates a recipe with a whitespace-only name", async () => {
      const user = await register();

      const res = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "   " });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Recipe name is required." });
      expect(await db.recipe.count()).toBe(0);
    });

    it("User creates a recipe with servings, time, and category", async () => {
      const user = await register();

      const res = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({
          name: "Pancakes",
          servings: 4,
          time: 20,
          category: "Breakfast",
        });

      expect(res.status).toBe(201);
      const stored = await db.recipe.findByPk(res.body.id);
      expect(stored.servings).toBe(4);
      expect(stored.time).toBe(20);
      expect(stored.category).toBe("Breakfast");
    });

    it("User creates a recipe with servings less than 1", async () => {
      const user = await register();

      const res = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes", servings: 0 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Servings must be at least 1." });
    });

    it("User creates a recipe with an invalid category", async () => {
      const user = await register();

      const res = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes", category: "Brunch" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Category is not valid." });
    });

    it("User creates a recipe with a photo", async () => {
      const user = await register();
      const created = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const res = await request(app)
        .post(`/recipeapi/recipes/${created.body.id}/image`)
        .set(authHeader(user.body.token))
        .attach("image", tinyJpeg, { filename: "photo.jpg", contentType: "image/jpeg" });

      expect(res.status).toBe(200);
      expect(res.body.imagePath).toEqual(expect.any(String));
      expect(res.body.imagePath.length).toBeGreaterThan(0);
      const filename = path.basename(res.body.imagePath);
      expect(fs.existsSync(path.join(UPLOAD_DIR, filename))).toBe(true);
    });
  });

  describe("US-2.3 — View a recipe", () => {
    it("Recipe detail shows description, ingredients, and numbered steps", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      await request(app)
        .put(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(user.body.token))
        .send({
          name: "Pancakes",
          description: "Weekend breakfast.",
        });

      const flour = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });

      await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(user.body.token))
        .send({ ingredientId: flour.body.id, quantity: 2 });

      await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeSteps`)
        .set(authHeader(user.body.token))
        .send({ instruction: "Whisk the dry ingredients." });

      const res = await request(app)
        .get(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(res.body.description).toBe("Weekend breakfast.");
      expect(res.body.recipeIngredient[0].quantity).toBe(2);
      expect(res.body.recipeIngredient[0].ingredient.name).toBe("Flour");
      expect(res.body.recipeIngredient[0].ingredient.unit).toBe("cup");
      expect(res.body.recipeStep[0]).toMatchObject({
        stepNumber: 1,
        instruction: "Whisk the dry ingredients.",
      });
    });

    it("User opens a recipe that does not exist", async () => {
      const user = await register();

      const res = await request(app)
        .get("/recipeapi/recipes/99999")
        .set(authHeader(user.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: "Recipe with id=99999 not found.",
      });
    });
  });

  describe("US-2.4 — Edit a recipe", () => {
    it("User updates a recipe's name and description", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const res = await request(app)
        .put(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(user.body.token))
        .send({
          name: "Buttermilk Pancakes",
          description: "Fluffy weekend pancakes.",
        });

      expect(res.status).toBe(200);
      const stored = await db.recipe.findByPk(recipe.body.id);
      expect(stored.name).toBe("Buttermilk Pancakes");
      expect(stored.description).toBe("Fluffy weekend pancakes.");
    });

    it("User adds an ingredient from the dropdown with a quantity", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      const flour = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(user.body.token))
        .send({ ingredientId: flour.body.id, quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.quantity).toBe(2);
      expect(res.body.ingredient.name).toBe("Flour");
    });

    it("User adds a numbered cooking step", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeSteps`)
        .set(authHeader(user.body.token))
        .send({ instruction: "Whisk the dry ingredients." });

      expect(res.status).toBe(201);
      expect(res.body.stepNumber).toBe(1);
      expect(res.body.instruction).toBe("Whisk the dry ingredients.");
    });

    it("User updates a cooking step", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      const step = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeSteps`)
        .set(authHeader(user.body.token))
        .send({ instruction: "Mix." });

      const res = await request(app)
        .put(
          `/recipeapi/recipes/${recipe.body.id}/recipeSteps/${step.body.id}`
        )
        .set(authHeader(user.body.token))
        .send({ instruction: "Whisk the dry ingredients." });

      expect(res.status).toBe(200);
      const stored = await db.recipeStep.findByPk(step.body.id);
      expect(stored.instruction).toBe("Whisk the dry ingredients.");
    });

    it("User removes a cooking step", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      const step = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeSteps`)
        .set(authHeader(user.body.token))
        .send({ instruction: "Whisk the dry ingredients." });

      const res = await request(app)
        .delete(
          `/recipeapi/recipes/${recipe.body.id}/recipeSteps/${step.body.id}`
        )
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(await db.recipeStep.findByPk(step.body.id)).toBeNull();
    });

    it("User replaces a recipe photo", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const first = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/image`)
        .set(authHeader(user.body.token))
        .attach("image", tinyJpeg, {
          filename: "first.jpg",
          contentType: "image/jpeg",
        });
      const oldFile = path.basename(first.body.imagePath);

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/image`)
        .set(authHeader(user.body.token))
        .attach("image", tinyPng, {
          filename: "second.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(200);
      expect(res.body.imagePath).not.toBe(first.body.imagePath);
      expect(fs.existsSync(path.join(UPLOAD_DIR, oldFile))).toBe(false);
      expect(
        fs.existsSync(path.join(UPLOAD_DIR, path.basename(res.body.imagePath)))
      ).toBe(true);
    });

    it("User uploads a photo that is not JPEG or PNG", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/image`)
        .set(authHeader(user.body.token))
        .attach("image", Buffer.from("not an image"), {
          filename: "notes.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Image must be a JPEG or PNG.",
      });
    });
  });

  describe("US-2.5 — Delete a recipe", () => {
    it("User confirms deleting a recipe", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const res = await request(app)
        .delete(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(await db.recipe.findByPk(recipe.body.id)).toBeNull();
    });

    it("Deleting a recipe removes its steps and recipe ingredients", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      const flour = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });
      const step = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeSteps`)
        .set(authHeader(user.body.token))
        .send({ instruction: "Mix." });
      const join = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(user.body.token))
        .send({ ingredientId: flour.body.id, quantity: 1 });

      const res = await request(app)
        .delete(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(await db.recipeStep.findByPk(step.body.id)).toBeNull();
      expect(await db.recipeIngredient.findByPk(join.body.id)).toBeNull();
    });
  });

  describe("US-2.6 — Keep recipes and ingredients private", () => {
    it("User cannot read another user's recipe", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userB.body.token))
        .send({ name: "Secret Stew" });

      const res = await request(app)
        .get(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Recipe with id=${recipe.body.id} not found.`,
      });
    });

    it("User cannot update another user's recipe", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userB.body.token))
        .send({ name: "Secret Stew" });

      const res = await request(app)
        .put(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ name: "Hijacked", description: "Nope." });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Recipe with id=${recipe.body.id} not found.`,
      });
      const stored = await db.recipe.findByPk(recipe.body.id);
      expect(stored.name).toBe("Secret Stew");
    });

    it("User cannot delete another user's recipe", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userB.body.token))
        .send({ name: "Secret Stew" });

      const res = await request(app)
        .delete(`/recipeapi/recipes/${recipe.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Recipe with id=${recipe.body.id} not found.`,
      });
      expect(await db.recipe.findByPk(recipe.body.id)).not.toBeNull();
    });

    it("User cannot attach another user's ingredient to a recipe", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userA.body.token))
        .send({ name: "Pancakes" });
      const otherIngredient = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(userB.body.token))
        .send({ name: "Saffron", unit: "gram" });

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(userA.body.token))
        .send({ ingredientId: otherIngredient.body.id, quantity: 1 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Ingredient with id=${otherIngredient.body.id} not found.`,
      });
    });

    it("Unauthenticated request to recipes is rejected", async () => {
      const res = await request(app).get("/recipeapi/recipes");
      expect(res.status).toBe(401);
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
    clearUploads();
  });

  describe("US-3.4 — Attach, update, and remove ingredients on a Feature 2 recipe", () => {
    it("User adds a catalog ingredient to a recipe with a quantity", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      const flour = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(user.body.token))
        .send({ ingredientId: flour.body.id, quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.quantity).toBe(2);
      expect(res.body.ingredient.name).toBe("Flour");
      expect(res.body.ingredient.unit).toBe("cup");
    });

    it("User updates a recipe ingredient quantity", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      const flour = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });
      const line = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(user.body.token))
        .send({ ingredientId: flour.body.id, quantity: 2 });

      const res = await request(app)
        .put(
          `/recipeapi/recipes/${recipe.body.id}/recipeIngredients/${line.body.id}`
        )
        .set(authHeader(user.body.token))
        .send({ quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(3);
    });

    it("User removes an ingredient from a recipe", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });
      const flour = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(user.body.token))
        .send({ name: "Flour", unit: "cup" });
      const line = await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(user.body.token))
        .send({ ingredientId: flour.body.id, quantity: 2 });

      const res = await request(app)
        .delete(
          `/recipeapi/recipes/${recipe.body.id}/recipeIngredients/${line.body.id}`
        )
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(
        await db.recipeIngredient.findByPk(line.body.id)
      ).toBeNull();
      expect(await db.ingredient.findByPk(flour.body.id)).not.toBeNull();
    });
  });

  describe("US-3.5 — Keep the ingredient catalog private", () => {
    it("User cannot read another user's recipe ingredients", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userB.body.token))
        .send({ name: "Stew" });
      const saffron = await request(app)
        .post("/recipeapi/ingredients")
        .set(authHeader(userB.body.token))
        .send({ name: "Saffron", unit: "gram" });
      await request(app)
        .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(userB.body.token))
        .send({ ingredientId: saffron.body.id, quantity: 1 });

      const res = await request(app)
        .get(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Recipe with id=${recipe.body.id} not found.`,
      });
    });
  });
});
