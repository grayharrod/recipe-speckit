# Data Model Reference

**Status:** Feature 1 user/session schema. Recipe tables remain from the starter app.

## Tables

### `users`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only; excluded from default scope |
| `role` | STRING(20) | Default `worker` |

### `sessions`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING(512) | Required; JWT stored server-side |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required, references `users.id` |

Starter tables `recipes`, `ingredients`, `recipeSteps`, and `recipeIngredients` are unchanged.

## Associations

- `users` 1—* `sessions`
- `users` 1—* `recipes`

## Provenance

| Area | Introduced |
|------|------------|
| `users` / `sessions` Feature 1 columns | Feature 1 |
