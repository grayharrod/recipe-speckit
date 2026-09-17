/**
 * Feature 5 — Export Recipes
 * Spec: features/feature-5-export-recipes.md
 */

const zlib = require("zlib");
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

const getBinary = (path, token) => {
  const req = request(app).get(path).buffer(true).parse((res, cb) => {
    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => cb(null, Buffer.concat(chunks)));
  });
  if (token) {
    req.set(authHeader(token));
  }
  return req;
};

const pdfText = (buffer) => buffer.toString("latin1");

const unzipLocalEntries = (buf) => {
  const entries = {};
  let offset = 0;
  while (offset + 30 <= buf.length) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) {
      break;
    }
    const flags = buf.readUInt16LE(offset + 6);
    const method = buf.readUInt16LE(offset + 8);
    let compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.slice(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
    if (flags & 0x8) {
      break;
    }
    const compressed = buf.slice(dataStart, dataStart + compSize);
    if (method === 0) {
      entries[name] = compressed;
    } else if (method === 8) {
      entries[name] = zlib.inflateRawSync(compressed);
    }
    offset = dataStart + compSize;
  }
  return entries;
};

const xlsxXml = (buffer) =>
  Object.values(unzipLocalEntries(buffer))
    .map((part) => part.toString("utf8"))
    .join("\n");

const contentType = (res) =>
  String(res.headers["content-type"] || res.headers["Content-Type"] || "");

const contentDisposition = (res) =>
  String(
    res.headers["content-disposition"] ||
      res.headers["Content-Disposition"] ||
      ""
  );

const isExcelType = (res) =>
  contentType(res).includes(
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

const parseJsonBody = (res) => {
  const raw = Buffer.isBuffer(res.body) ? res.body.toString("utf8") : res.body;
  if (typeof raw === "object") {
    return raw;
  }
  return JSON.parse(raw);
};

const seedPancakes = async (token, extras = true) => {
  const recipe = await request(app)
    .post("/recipeapi/recipes")
    .set(authHeader(token))
    .send({
      name: "Pancakes",
      servings: extras ? 4 : undefined,
      time: extras ? 20 : undefined,
      category: extras ? "Breakfast" : undefined,
    });
  await request(app)
    .put(`/recipeapi/recipes/${recipe.body.id}`)
    .set(authHeader(token))
    .send({
      name: "Pancakes",
      description: extras ? "Weekend breakfast." : "",
      servings: extras ? 4 : null,
      time: extras ? 20 : null,
      category: extras ? "Breakfast" : null,
    });
  if (extras) {
    const flour = await request(app)
      .post("/recipeapi/ingredients")
      .set(authHeader(token))
      .send({ name: "Flour", unit: "cup" });
    await request(app)
      .post(`/recipeapi/recipes/${recipe.body.id}/recipeIngredients`)
      .set(authHeader(token))
      .send({ ingredientId: flour.body.id, quantity: 2 });
    await request(app)
      .post(`/recipeapi/recipes/${recipe.body.id}/recipeSteps`)
      .set(authHeader(token))
      .send({ instruction: "Whisk the dry ingredients." });
  }
  return recipe.body;
};

describe("Feature 5 — Export Recipes", () => {
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

  describe("US-5.1 — Export a recipe as PDF", () => {
    it("User exports an owned recipe as PDF", async () => {
      const user = await register();
      const recipe = await seedPancakes(user.body.token, true);

      const res = await getBinary(
        `/recipeapi/recipes/${recipe.id}/export?format=pdf`,
        user.body.token
      );

      expect(res.status).toBe(200);
      expect(contentType(res)).toMatch(/application\/pdf/);
      expect(contentDisposition(res)).toContain("Pancakes.pdf");
      const text = pdfText(res.body);
      expect(text).toContain("Pancakes");
      expect(text).toContain("Weekend breakfast.");
      expect(text).toContain("2 cup Flour");
      expect(text).toContain("Whisk the dry ingredients.");
    });

    it("User exports a recipe with empty description, ingredients, and steps as PDF", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const res = await getBinary(
        `/recipeapi/recipes/${recipe.body.id}/export?format=pdf`,
        user.body.token
      );

      expect(res.status).toBe(200);
      expect(contentType(res)).toMatch(/application\/pdf/);
      expect(pdfText(res.body)).toContain("Pancakes");
    });

    it("User exports a recipe whose name is only punctuation as PDF", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "!!!" });

      const res = await getBinary(
        `/recipeapi/recipes/${recipe.body.id}/export?format=pdf`,
        user.body.token
      );

      expect(res.status).toBe(200);
      expect(contentDisposition(res)).toContain("recipe.pdf");
    });
  });

  describe("US-5.2 — Export a recipe as Excel", () => {
    it("User exports an owned recipe as Excel", async () => {
      const user = await register();
      const recipe = await seedPancakes(user.body.token, true);

      const res = await getBinary(
        `/recipeapi/recipes/${recipe.id}/export?format=xlsx`,
        user.body.token
      );

      expect(res.status).toBe(200);
      expect(isExcelType(res)).toBe(true);
      expect(contentDisposition(res)).toContain("Pancakes.xlsx");
      const xml = xlsxXml(res.body);
      expect(xml).toMatch(/name="Recipe"/);
      expect(xml).toMatch(/name="Ingredients"/);
      expect(xml).toMatch(/name="Steps"/);
      expect(xml).toContain("Pancakes");
      expect(xml).toContain("Weekend breakfast.");
      expect(xml).toContain("Breakfast");
      expect(xml).toContain("Flour");
      expect(xml).toContain("cup");
      expect(xml).toContain("Whisk the dry ingredients.");
    });

    it("User exports a recipe with no ingredients or steps as Excel", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const res = await getBinary(
        `/recipeapi/recipes/${recipe.body.id}/export?format=xlsx`,
        user.body.token
      );

      expect(res.status).toBe(200);
      const xml = xlsxXml(res.body);
      expect(xml).toMatch(/name="Ingredients"/);
      expect(xml).toMatch(/name="Steps"/);
      expect(xml).not.toContain("Flour");
      expect(xml).not.toContain("Whisk the dry ingredients.");
    });

    it("Single-recipe export rejects a missing format", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const res = await getBinary(
        `/recipeapi/recipes/${recipe.body.id}/export`,
        user.body.token
      );

      expect(res.status).toBe(400);
      expect(parseJsonBody(res)).toEqual({
        message: "Export format is not valid.",
      });
    });

    it("Single-recipe export rejects an invalid format", async () => {
      const user = await register();
      const recipe = await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(user.body.token))
        .send({ name: "Pancakes" });

      const res = await getBinary(
        `/recipeapi/recipes/${recipe.body.id}/export?format=csv`,
        user.body.token
      );

      expect(res.status).toBe(400);
      expect(parseJsonBody(res)).toEqual({
        message: "Export format is not valid.",
      });
    });
  });

  describe("US-5.3 — Export all my recipes as Excel", () => {
    it("User exports all owned recipes as Excel from the list", async () => {
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
        .send({ name: "Chili" });
      await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userA.body.token))
        .send({ name: "Pancakes" });
      await request(app)
        .post("/recipeapi/recipes")
        .set(authHeader(userB.body.token))
        .send({ name: "Secret Stew" });

      const res = await getBinary(
        "/recipeapi/recipes/export?format=xlsx",
        userA.body.token
      );

      expect(res.status).toBe(200);
      expect(isExcelType(res)).toBe(true);
      expect(contentDisposition(res)).toContain("my-recipes.xlsx");
      const xml = xlsxXml(res.body);
      expect(xml).toMatch(/name="Recipes"/);
      expect(xml).toContain("Chili");
      expect(xml).toContain("Pancakes");
      expect(xml).not.toContain("Secret Stew");
    });

    it("User with no recipes exports an empty workbook", async () => {
      const user = await register();

      const res = await getBinary(
        "/recipeapi/recipes/export?format=xlsx",
        user.body.token
      );

      expect(res.status).toBe(200);
      const xml = xlsxXml(res.body);
      expect(xml).toMatch(/name="Recipes"/);
      expect(xml).not.toContain("Pancakes");
    });

    it("Collection export rejects PDF format", async () => {
      const user = await register();

      const res = await getBinary(
        "/recipeapi/recipes/export?format=pdf",
        user.body.token
      );

      expect(res.status).toBe(400);
      expect(parseJsonBody(res)).toEqual({
        message: "Export format is not valid.",
      });
    });
  });

  describe("US-5.4 — Keep exports private", () => {
    it("User cannot export another user's recipe as PDF", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });
      await db.recipe.create({
        id: 12,
        name: "Secret Stew",
        userId: userB.body.userId,
      });

      const res = await getBinary(
        "/recipeapi/recipes/12/export?format=pdf",
        userA.body.token
      );

      expect(res.status).toBe(404);
      expect(parseJsonBody(res)).toEqual({
        message: "Recipe with id=12 not found.",
      });
      expect(contentType(res)).not.toMatch(/application\/pdf/);
      if (Buffer.isBuffer(res.body) && res.body.length >= 4) {
        expect(res.body.slice(0, 4).toString("latin1")).not.toBe("%PDF");
      }
    });

    it("User cannot export another user's recipe as Excel", async () => {
      const userA = await register();
      const userB = await register({
        email: "bob@example.com",
        username: "bsmith",
        fName: "Bob",
        lName: "Smith",
      });
      await db.recipe.create({
        id: 12,
        name: "Secret Stew",
        userId: userB.body.userId,
      });

      const res = await getBinary(
        "/recipeapi/recipes/12/export?format=xlsx",
        userA.body.token
      );

      expect(res.status).toBe(404);
      expect(parseJsonBody(res)).toEqual({
        message: "Recipe with id=12 not found.",
      });
    });

    it("Unauthenticated recipe export is rejected", async () => {
      const res = await getBinary("/recipeapi/recipes/1/export?format=pdf");
      expect(res.status).toBe(401);
    });

    it("Unauthenticated collection export is rejected", async () => {
      const res = await getBinary("/recipeapi/recipes/export?format=xlsx");
      expect(res.status).toBe(401);
    });
  });
});
