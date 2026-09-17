# API Reference

**Status:** Features 1–4 on this branch. Mount path `/recipeapi`. Authenticated routes require `Authorization: Bearer <token>`. Flat JSON (no envelope). Errors `{ "message": "..." }`. Not owned: `404`. Unauthenticated: `401`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/recipeapi/register` | No | Create a user and return a session payload |
| `POST` | `/recipeapi/login` | No | Authenticate with username + password |
| `POST` | `/recipeapi/logout` | Yes | Invalidate the current session token |
| `GET` | `/recipeapi/users/:id` | Yes | Own profile only (`:id` must match `req.user.id`) |
| `PUT` | `/recipeapi/users/:id` | Yes | Update own profile (`:id` must match `req.user.id`) |
| `GET` | `/recipeapi/recipes` | Yes | List the signed-in user's recipes |
| `POST` | `/recipeapi/recipes` | Yes | Create a recipe owned by the session user |
| `GET` | `/recipeapi/recipes/:id` | Yes | Owned recipe detail (nested steps + ingredients) |
| `PUT` | `/recipeapi/recipes/:id` | Yes | Update an owned recipe |
| `DELETE` | `/recipeapi/recipes/:id` | Yes | Delete an owned recipe (cascade nested rows + photo) |
| `POST` | `/recipeapi/recipes/:id/image` | Yes | Upload/replace recipe photo |
| `GET` | `/recipeapi/ingredients` | Yes | List the signed-in user's private ingredients (name ASC) |
| `POST` | `/recipeapi/ingredients` | Yes | Create a private ingredient `{ name, unit }` |
| `PUT` | `/recipeapi/ingredients/:id` | Yes | Update name and/or unit |
| `DELETE` | `/recipeapi/ingredients/:id` | Yes | Delete ingredient and its recipe-ingredient rows |
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients` | Yes | Lines for an owned recipe (nested ingredient, name ASC) |
| `POST` | `/recipeapi/recipes/:recipeId/recipeIngredients` | Yes | Attach owned ingredient with `quantity` |
| `PUT` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Yes | Update quantity |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Yes | Remove line from recipe (catalog row remains) |
| `GET` | `/recipeapi/recipes/:recipeId/recipeSteps` | Yes | Steps for an owned recipe |
| `POST` | `/recipeapi/recipes/:recipeId/recipeSteps` | Yes | Add a step |
| `PUT` | `/recipeapi/recipes/:recipeId/recipeSteps/:id` | Yes | Update a step |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeSteps/:id` | Yes | Remove a step |

`GET /recipeapi/recipes/user/:userId` still exists; clients use `GET /recipeapi/recipes`.

### Ingredient create/update body

```json
{ "name": "Flour", "unit": "cup" }
```

Create `201`: `{ "id", "name", "unit", "userId" }`.

### Attach / update recipe ingredient

Attach: `{ "ingredientId": 3, "quantity": 2 }` (`recipeId` from the path). Update: `{ "quantity": 3 }`.

### Representative errors

| Status | Message |
|--------|---------|
| `400` | `"Ingredient name is required."` / `"Ingredient name is already in your list."` / `"Unit is required."` / `"Unit is not valid."` / `"Quantity is required."` |
| `404` | `"Ingredient with id={id} not found."` / `"Recipe with id={id} not found."` |

## Auth success payload

Login (`200`) and register (`201`) return flat JSON (no envelope):

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

Password hashes are never returned.

## Profile payload

`GET` / `PUT` `/recipeapi/users/:id` success (`200`):

```json
{
  "id": 1,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "role": "worker"
}
```

`PUT` body: `fName`, `lName`, `email`, `username` required; `password` optional (min 8 when provided). Cross-user `:id` → `404` `{ "message": "User with id=<id> not found." }`.

## Provenance

| Area | Introduced |
|------|------------|
| Register / login / logout | Feature 1 |
| Recipe CRUD, photos, steps, attach ingredient | Feature 2 |
| Ingredient PUT/DELETE; catalog list order; recipe-ingredient quantity update | Feature 3 |
| Owned `GET` / `PUT` `/users/:id` | Feature 4 |
