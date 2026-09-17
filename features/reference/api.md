# API Reference

**Status:** Feature 1 auth + Feature 4 profile on this branch. Recipe resource routes remain from the starter app.

API mount path is `/recipeapi` (see `backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| `POST` | `/recipeapi/register` | No | Create a user and return a session payload |
| `POST` | `/recipeapi/login` | No | Authenticate with username + password |
| `POST` | `/recipeapi/logout` | Yes | Invalidate the current session token |
| `GET` | `/recipeapi/users/:id` | Yes | Own profile only (`:id` must match `req.user.id`) |
| `PUT` | `/recipeapi/users/:id` | Yes | Update own profile (`:id` must match `req.user.id`) |
| `GET` | `/recipeapi/recipes/user/:userId` | Yes | Recipes for the authenticated user (`req.user.id`; URL id is ignored) |

Starter recipe/ingredient/step routes are unchanged except that `GET /recipeapi/recipes/user/:userId` is scoped to the session user.

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

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Duplicate username: `400` `{ "message": "Username is already taken." }`
- Duplicate email: `400` `{ "message": "Email is already registered." }`
- Invalid login: `401` `{ "message": "Invalid username or password." }`
- Missing/expired token: `401` with an unauthorized message.

## Provenance

| Area | Introduced |
|------|------------|
| Register / login / logout | Feature 1 |
| User-scoped `GET /recipes/user/:userId` | Feature 1 (ownership via `req.user.id`) |
| Owned `GET` / `PUT` `/users/:id` | Feature 4 |
