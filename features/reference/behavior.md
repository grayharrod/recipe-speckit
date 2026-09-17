# Behavior & Rules Reference

**Living snapshot** of product rules currently in force.

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login is username + password (not email-only) | `POST /recipeapi/login`; username normalized `trim().toLowerCase()` | Feature 1 |
| Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hashes never returned | `auth.controller` + User `defaultScope` | Feature 1 |
| Sessions are JWT + `sessions` row; client sends `Authorization: Bearer <token>` | `authentication.js`; 24h `expirationDate` | Feature 1 |
| Login reuses a non-expired session for the same user | `issueOrReuseSession` | Feature 1 |
| New users get role `worker` | `User.create` default | Feature 1 |
| Authenticated requests resolve to `req.user.id` | `authenticate` middleware | Feature 1 |
| Register email must be present and match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `frontend/src/config/validation.js` `emailRules` | Feature 1 |
| Password minimum length is 8 | Client rules + register API | Feature 1 |
| Unauthenticated UI routes redirect to login | `router.beforeEach` | Feature 1 |
| Signed-in users hitting login/register go to home | `router.beforeEach` | Feature 1 |
| Session key in the browser is `localStorage.user` | `Utils.setStore("user", …)` | Feature 1 |
| 401 / unauthorized API responses clear `user` and send the user to login | axios `transformResponse` + interceptor | Feature 1 |
| MenuBar hidden on login and register | `App.vue` | Feature 1 / 2 |
| Recipes and ingredients are private per user; wrong owner → `404` not `403` | `recipeAccess` helpers | Feature 2 |
| Ingredient unit is on the ingredient; quantity is on the recipe-ingredient join | Feature 2 controllers | Feature 2 |
| Duplicate ingredient name per user (case-insensitive) → `400` | Ingredient create/update | Feature 2 / 3 |
| MenuBar **Ingredients** goes to `/ingredients` | `MenuBar.vue` | Feature 3 |
| Catalog empty copy: **"No ingredients yet. Add your first ingredient."** | `IngredientList.vue` | Feature 3 |
| Deleting an ingredient removes its recipe lines, not recipes | Ingredient `delete` | Feature 3 |
| Deleting a recipe removes recipe-ingredient rows, not catalog ingredients | Recipe `delete` + CASCADE | Feature 2 / 3 |
| Recipe-ingredient lists ordered by ingredient name | `findAllForRecipe` / recipe detail include | Feature 3 |
