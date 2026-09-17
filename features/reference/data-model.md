# Data Model Reference

**Status:** Features 1–3 schema on this branch.

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

### `recipes`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required |
| `description` | STRING | Optional on create |
| `servings` | INTEGER | Optional; ≥ 1 if set |
| `time` | INTEGER | Optional; minutes |
| `category` | STRING | Optional; Breakfast/Lunch/Dinner/Dessert/Snack/Other |
| `imagePath` | STRING | Optional |
| `isPublished` | BOOLEAN | Default `false` |
| `userId` | INTEGER FK | Session user |

### `ingredients`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required; unique per `userId` (case-insensitive) |
| `unit` | STRING | Required; allowed unit list |
| `pricePerUnit` | DECIMAL(10,2) | Nullable; unused |
| `userId` | INTEGER FK | Session user |

### `recipeSteps`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `stepNumber` | INTEGER | Server-assigned |
| `instruction` | STRING | Required |
| `recipeId` | INTEGER FK | Cascade on recipe delete |

### `recipeIngredients`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `quantity` | FLOAT | Required; > 0 |
| `recipeId` | INTEGER FK | Cascade on recipe delete |
| `ingredientId` | INTEGER FK | Cascade on ingredient delete |
| `recipeStepId` | INTEGER FK | Nullable; unused |

## Associations

- `users` 1—* `sessions`
- `users` 1—* `recipes`
- `users` 1—* `ingredients`
- `recipes` 1—* `recipeSteps`
- `recipes` 1—* `recipeIngredients`
- `ingredients` 1—* `recipeIngredients`

## Provenance

| Area | Introduced |
|------|------------|
| `users` / `sessions` | Feature 1 |
| Private `recipes`, `ingredients.userId`, steps, recipe-ingredients | Feature 2 |
| Ingredient delete removes `recipeIngredients` | Feature 3 |
