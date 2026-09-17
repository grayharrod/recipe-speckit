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
| User recipes are scoped to the session user | `GET /recipeapi/recipes/user/:userId` uses `req.user.id` | Feature 1 |
| Register email must be present and match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `frontend/src/config/validation.js` `emailRules` | Feature 1 |
| Password minimum length is 8 | Client rules + register API | Feature 1 |
| Unauthenticated UI routes redirect to login | `router.beforeEach` | Feature 1 |
| Signed-in users hitting login/register go to home | `router.beforeEach` | Feature 1 |
| Session key in the browser is `localStorage.user` | `Utils.setStore("user", …)` | Feature 1 |
| 401 / unauthorized API responses clear `user` and send the user to login | axios `transformResponse` + interceptor | Feature 1 |
| Feature 1 auth screens (login, register, home) have no MenuBar | `App.vue` | Feature 1 |
| Profile `GET`/`PUT` `/users/:id` only for `req.user.id`; else `404` | `user.controller` | Feature 4 |
| Profile update trims fields; username `trim().toLowerCase()`; optional password bcrypt | `user.controller` update | Feature 4 |
| Edit Profile uses shared `emailRules`; client blocks bad email / short / mismatched password | `MenuBar.vue` | Feature 4 |
| After profile save, refresh `localStorage.user` and dispatch `user-logged-in` | `MenuBar.vue` | Feature 4 |
| Profile dropdown shows full name, username, email; actions **Edit Profile** and **Log out** | `MenuBar.vue` | Feature 4 |
| Logout entry point is the profile dropdown only (no home **Sign out**) | `MenuBar.vue`, `Home.vue` | Feature 4 |
