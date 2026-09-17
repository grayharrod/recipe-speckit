# Feature: Recipe Management

**Feature ID:** 2
**Branch pattern:** `feature/2-recipe-management`
**Status:** Ready
**Created:** 2026-09-16
**Input:** After sign-in, each user needs a private recipe list they can add to, open, edit, and delete — with description, ingredients from a dropdown, and numbered cooking instructions — similar to a todo list.
**Depends on:** [Feature 1 — User Authentication & Session Management](./feature-1-user-auth.md)
**Related:** [ADR-0002 — Security architecture](../docs/adr/0002-security-architecture.md), [features/reference/](./reference/README.md)

---

## User Stories

### US-2.1: View my recipes

**As a** signed-in user  
**I want to** see a list of my recipes after I sign in  
**So that** I can find and open the recipes I have saved

**Priority:** P1  
**Independent test:** Sign in as a user who owns recipes and land on home showing only that user's recipe names, with search and empty-state copy when the list is empty  
**Acceptance scenarios:** see ### US-2.1 under Acceptance Criteria

### US-2.2: Create a recipe

**As a** signed-in user  
**I want to** add a new recipe from the list  
**So that** I can start capturing a dish I want to cook

**Priority:** P1  
**Independent test:** Open the add dialog, submit a valid name, and see the new recipe on the list and in the database owned by the signed-in user  
**Acceptance scenarios:** see ### US-2.2 under Acceptance Criteria

### US-2.3: View a recipe

**As a** signed-in user  
**I want to** click into a recipe  
**So that** I can read its description, ingredients, and cooking steps

**Priority:** P1  
**Independent test:** From the list, open an owned recipe and see description, ingredients, numbered steps, servings, time, category, and photo when present  
**Acceptance scenarios:** see ### US-2.3 under Acceptance Criteria

### US-2.4: Edit a recipe

**As a** signed-in user  
**I want to** edit a recipe I own  
**So that** I can update its details, ingredients, and cooking steps

**Priority:** P1  
**Independent test:** From the list, edit an owned recipe (name, description, ingredients from my dropdown, numbered steps) and persist the changes  
**Acceptance scenarios:** see ### US-2.4 under Acceptance Criteria

### US-2.5: Delete a recipe

**As a** signed-in user  
**I want to** delete a recipe after confirming  
**So that** I can remove recipes I no longer need

**Priority:** P1  
**Independent test:** Confirm delete on an owned recipe; it disappears from the list and the database (including nested steps and recipe ingredients)  
**Acceptance scenarios:** see ### US-2.5 under Acceptance Criteria

### US-2.6: Keep recipes and ingredients private

**As the** application  
**I want to** scope recipes and ingredients to the signed-in user  
**So that** one user cannot read or change another user's data

**Priority:** P1  
**Independent test:** Authenticated requests for another user's recipe or ingredient return `404`; unauthenticated recipe API calls return `401`  
**Acceptance scenarios:** see ### US-2.6 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: After a successful sign-in, the home screen MUST be the signed-in user's recipe list (replacing Feature 1's placeholder home).
- **FR-002**: `GET` recipe list and recipe detail MUST return only rows where `userId = req.user.id`.
- **FR-003**: Users MUST be able to create a recipe with a required **name** (trimmed, non-empty).
- **FR-004**: On create, `userId` MUST be set from `req.user.id` and MUST NOT be taken from the request body.
- **FR-005**: Create MUST accept optional **servings** (integer ≥ 1), **time** in minutes (integer ≥ 1), **category**, and **photo**.
- **FR-006**: If **category** is set, it MUST be one of: `Breakfast`, `Lunch`, `Dinner`, `Dessert`, `Snack`, `Other`.
- **FR-007**: Create MUST allow an empty **description**; saving the edit form MUST require a non-empty trimmed description.
- **FR-008**: Users MUST be able to open a recipe they own from the list into a read-only detail view.
- **FR-009**: Users MUST be able to edit a recipe they own: name, description, servings, time, category, photo, ingredients, and numbered steps.
- **FR-010**: Each list row MUST offer **Edit recipe** and **Delete recipe** actions (`aria-label`s) in addition to opening the recipe by clicking its name.
- **FR-011**: Users MUST confirm delete in a dialog before the recipe is removed; **Cancel** MUST leave the recipe unchanged.
- **FR-012**: Deleting a recipe MUST remove its `recipeSteps` and `recipeIngredients` and MUST delete the stored photo file when `imagePath` is set.
- **FR-013**: When the user has zero recipes, the list MUST show **"No recipes yet. Create your first recipe."**
- **FR-014**: Users MUST be able to filter the already-loaded recipe list by name (case-insensitive substring). No extra search API is required.
- **FR-015**: When the filter matches no names, the list MUST show **"No recipes match your search."**
- **FR-016**: Ingredients MUST belong to one user (`userId`). Ingredient list and create MUST be scoped to `req.user.id`.
- **FR-017**: The recipe-form ingredient dropdown MUST list only the signed-in user's ingredients.
- **FR-018**: Users MUST be able to create a private ingredient (**name** + **unit**) from the recipe edit form so the dropdown is usable without a catalog page.
- **FR-019**: Ingredient **name** MUST be unique per user, compared case-insensitively after trim. Duplicate → `400` with **"Ingredient name is already in your list."**
- **FR-020**: Attaching an ingredient to a recipe MUST require **quantity** > 0. **Unit** comes from the ingredient record (not a separate field on the join).
- **FR-021**: Users MUST NOT attach an ingredient they do not own. Wrong-owner or missing ingredient → `404`.
- **FR-022**: Users MUST be able to add, update, and remove numbered cooking steps on a recipe they own.
- **FR-023**: New steps MUST receive `stepNumber` equal to `max(existing) + 1` (or `1` if none). The UI MUST display steps ordered by `stepNumber` ascending.
- **FR-024**: Recipe photo is optional. When present it MUST be JPEG or PNG and MUST be ≤ **2 MB**. Stored on the local server; `recipes.imagePath` holds a URL path the client can use as an image `src`.
- **FR-025**: Invalid photo type → `400` with **"Image must be a JPEG or PNG."** Oversized photo → `400` with **"Image must be 2 MB or smaller."**
- **FR-026**: All Feature 2 recipe, ingredient, step, recipe-ingredient, and image endpoints MUST require a valid session. Missing/invalid token → `401`.
- **FR-027**: Cross-user access to a recipe, step, recipe-ingredient, or ingredient MUST return **`404`** (not `403`) and MUST NOT confirm that the other user's resource exists.
- **FR-028**: `isPublished` MUST default to `false` and MUST NOT appear in Feature 2 UI. Create MUST NOT require it.
- **FR-029**: Protected recipe screens MUST show **MenuBar**; login and register MUST NOT. **Sign out** lives in the MenuBar avatar menu (no standalone Sign out on home).
- **FR-030**: The system MUST NOT expose unscoped "delete all recipes" or "delete all ingredients" operations.
- **FR-031**: Ingredient **unit** MUST be one of: `cup`, `gallon`, `gram`, `kilogram`, `liter`, `milliliter`, `ounce`, `pint`, `piece`, `pound`, `quart`, `tablespoon`, `teaspoon`, `unit`. Invalid unit → `400` with **"Unit is not valid."**

## Assumptions

- Feature 1 authentication and session handling are already on `dev`.
- Feature 1's dashboard placeholder and page-level Sign out are replaced by this feature's recipe list and MenuBar.
- Quantity is required when attaching an ingredient; unit lives on the private ingredient.
- The ingredient dropdown is empty until the user creates ingredients; Feature 2 therefore includes **Add ingredient** on the recipe form (name + unit). A dedicated Ingredients catalog page is Feature 3.
- Search filters the already-fetched list in the browser.
- Category is a single optional dropdown on the recipe, not a tags table.
- Photos are stored on the local server (no cloud object storage).
- Starter fields `pricePerUnit`, public/published browsing, PDF export, and linking an ingredient to a specific step are unused in this feature.

## Edge Cases

- Empty or whitespace-only recipe name → client blocks submit with **"Recipe name is required."**; API `400` if reached.
- Empty description on edit save → **"Description is required."**
- Servings or time provided but < 1 → **"Servings must be at least 1."** / **"Cook time must be at least 1 minute."**
- Invalid category value on API → `400` with **"Category is not valid."**
- Duplicate ingredient name for the same user → `400` **"Ingredient name is already in your list."**
- Attach ingredient with missing or non-positive quantity → **"Quantity is required."** / API `400`.
- Photo that is not JPEG/PNG or is larger than 2 MB → `400` with the FR-025 messages.
- Cross-user recipe or ingredient id → `404`.
- Unauthenticated recipe/ingredient API → `401`.
- Cancel on the delete dialog → no delete request.

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A signed-in user can create a recipe, open it, edit description/ingredients/steps, search the list, and delete with confirmation in one manual pass.
- **SC-003**: `npm test` passes with the Test Coverage Map files for this feature.
- **SC-004**: Automated tests prove another user's recipe and ingredients are not returned and wrong-owner writes return `404`.

---

## Data Ownership & Isolation

Each user owns their recipes and ingredients exclusively. Recipe steps and recipe-ingredients inherit ownership from the parent recipe.

| Rule | Requirement |
|------|-------------|
| **Read scope** | List/detail/ingredients return only rows where `userId = req.user.id` (nested steps and recipe-ingredients only for owned recipes) |
| **Write scope** | Update/delete only when the row's `userId` matches `req.user.id` (or the parent recipe is owned) |
| **Create scope** | New recipes and ingredients are owned by `req.user.id`; never from the client body |
| **Cross-user access** | Another user's recipe, ingredient, step, or recipe-ingredient → `404` (not `403`) |
| **UI scope** | The SPA shows only data returned for the signed-in user |
| **Implementation** | Shared helpers in `app/authorization/` (e.g. get accessible recipe/ingredient or null) — do not duplicate scope in every controller |

---

## Key Entities

- **User**: registered account (Feature 1); owns recipes and private ingredients.
- **Recipe**: a dish the user is saving; belongs to one user; has description, optional servings, cook time, category, and photo.
- **Ingredient**: a private pantry item (name + unit) belonging to one user; used in the recipe dropdown.
- **RecipeIngredient**: join of a recipe to one of the owner's ingredients, with a quantity.
- **RecipeStep**: one numbered cooking instruction belonging to a recipe.

---

## API Requirements

API mount path is `/recipeapi`. Authenticated routes require `Authorization: Bearer <token>`. Flat JSON (no envelope). Errors: `{ "message": "Human-readable explanation." }`. Not found / not owned: `404`. Unauthenticated: `401`.

`GET /recipeapi/recipes/user/:userId` from Feature 1 is **superseded** by `GET /recipeapi/recipes`. If the old path remains, it MUST still ignore the URL `userId` and return only `req.user.id` rows — Feature 2 clients MUST use `GET /recipeapi/recipes`.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipeapi/recipes` | Yes | List the signed-in user's recipes |
| `POST` | `/recipeapi/recipes` | Yes | Create a recipe owned by the signed-in user |
| `GET` | `/recipeapi/recipes/:id` | Yes | Recipe detail with nested steps and ingredients |
| `PUT` | `/recipeapi/recipes/:id` | Yes | Update an owned recipe's fields |
| `DELETE` | `/recipeapi/recipes/:id` | Yes | Delete an owned recipe (cascade nested rows + photo file) |
| `POST` | `/recipeapi/recipes/:id/image` | Yes | Upload or replace the recipe photo (`multipart/form-data`, field `image`) |
| `GET` | `/recipeapi/ingredients` | Yes | List the signed-in user's private ingredients |
| `POST` | `/recipeapi/ingredients` | Yes | Create a private ingredient for the signed-in user |
| `GET` | `/recipeapi/recipes/:recipeId/recipeSteps` | Yes | Steps for an owned recipe, ordered by `stepNumber` |
| `POST` | `/recipeapi/recipes/:recipeId/recipeSteps` | Yes | Add a step (server assigns `stepNumber`) |
| `PUT` | `/recipeapi/recipes/:recipeId/recipeSteps/:id` | Yes | Update an owned recipe's step |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeSteps/:id` | Yes | Remove an owned recipe's step |
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients` | Yes | Recipe ingredients (include ingredient name/unit) for an owned recipe |
| `POST` | `/recipeapi/recipes/:recipeId/recipeIngredients` | Yes | Attach an owned ingredient with quantity |
| `PUT` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Yes | Update quantity on an owned recipe-ingredient |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Yes | Remove an ingredient from an owned recipe |

### Create recipe — request

```json
{
  "name": "Pancakes",
  "description": "",
  "servings": 4,
  "time": 20,
  "category": "Breakfast"
}
```

`description`, `servings`, `time`, and `category` are optional. Omit `userId` and `isPublished`.

### Create recipe — success (`201`)

```json
{
  "id": 1,
  "name": "Pancakes",
  "description": "",
  "servings": 4,
  "time": 20,
  "category": "Breakfast",
  "imagePath": null,
  "userId": 42
}
```

### Update recipe — request (`PUT`)

Same fields as create. `name` required (non-empty). `description` required (non-empty trimmed).

### Recipe detail — success (`200`)

Recipe fields plus:

- `recipeStep`: array ordered by `stepNumber` (`id`, `stepNumber`, `instruction`)
- `recipeIngredient`: array including nested `ingredient` (`id`, `name`, `unit`) and `quantity`

### Create ingredient — request

```json
{
  "name": "Flour",
  "unit": "cup"
}
```

Success `201`: `{ "id", "name", "unit", "userId" }`. Do not require `pricePerUnit`.

### Attach recipe ingredient — request

```json
{
  "ingredientId": 3,
  "quantity": 2
}
```

Do not take `recipeId` from the body (use the path). Do not require `recipeStepId`.

### Add step — request

```json
{
  "instruction": "Whisk the dry ingredients."
}
```

Server sets `stepNumber`. Success `201` includes `id`, `stepNumber`, `instruction`, `recipeId`.

### Photo upload

`POST /recipeapi/recipes/:id/image` with `multipart/form-data` field **`image`**. Success `200` returns the recipe including updated `imagePath` (URL path under `/recipeapi/uploads/recipes/…`). Replacing a photo MUST delete the previous file when one exists.

### Representative errors

| Status | Message |
|--------|---------|
| `400` | `"Recipe name is required."` |
| `400` | `"Description is required."` |
| `400` | `"Servings must be at least 1."` |
| `400` | `"Cook time must be at least 1 minute."` |
| `400` | `"Category is not valid."` |
| `400` | `"Ingredient name is required."` |
| `400` | `"Ingredient name is already in your list."` |
| `400` | `"Unit is required."` |
| `400` | `"Unit is not valid."` |
| `400` | `"Quantity is required."` |
| `400` | `"Instruction is required."` |
| `400` | `"Image must be a JPEG or PNG."` |
| `400` | `"Image must be 2 MB or smaller."` |
| `401` | unauthorized message (Feature 1) |
| `404` | `"Recipe with id={id} not found."` |
| `404` | `"Ingredient with id={id} not found."` |

---

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc): `oc-cta` on primary labeled CTAs; icon-only row actions use `aria-label`; errors in `<v-alert type="error">`; loading, empty, and error states on data views. Hide MenuBar on `login` and `register` only.

### App chrome — `MenuBar`

- Visible on `home`, `recipe`, and `editRecipe`.
- Title / **Recipes** navigates to `home`.
- Avatar menu includes **Logout** (Feature 1 sign-out behavior).
- No **Ingredients** nav item in this feature.

### [View: My Recipes] — route name `home` (path `/home`)

- Heading: **My Recipes**.
- Search field; placeholder **"Search recipes"**. Filters the loaded list by name (FR-014 / FR-015).
- Primary action: **+ Add Recipe** (`oc-cta`) opens the add dialog. Not inside `v-card-title`.
- Each row: recipe **name**; category chip when set; optional thumbnail when `imagePath` is set.
- Clicking the recipe name navigates to `recipe`.
- Icon actions: **Edit recipe** (`aria-label`) → `editRecipe`; **Delete recipe** (`aria-label`) → confirm dialog.
- **Empty state:** **"No recipes yet. Create your first recipe."**
- **Search empty:** **"No recipes match your search."**
- **Loading:** progress/spinner while the list request is in flight.
- **Error:** `<v-alert type="error">` with **"Unable to load recipes."**

### Add recipe dialog

- Fields: **Name** (required), **Servings** (optional integer), **Time (minutes)** (optional integer), **Category** (`v-select` of allowed values, optional), **Photo** (optional file).
- Actions: **Cancel** (secondary); **Add Recipe** (`oc-cta`, `:loading` while requests are in flight).
- Client validation before API call; server errors in a dialog `<v-alert type="error">`.
- On success: close dialog, refresh list.

### Delete confirmation dialog

- Copy: **"Delete this recipe?"**
- Actions: **Cancel** (no request); **Delete** (`oc-cta` or error-colored confirm) performs `DELETE`.

### [View: Recipe Detail] — route name `recipe` (path `/recipe/:id`)

- Read-only. `props: true`.
- Shows name, photo (if any), description, servings, time, category, ingredient list (`quantity` + unit + name), numbered steps.
- **Empty description:** **"No description yet."**
- **Empty ingredients:** **"No ingredients yet."**
- **Empty steps:** **"No steps yet."**
- Action: **Edit recipe** navigates to `editRecipe`.
- Unknown / not owned id: `"Unable to load recipe."` in `<v-alert type="error">` (API `404`).

### [View: Edit Recipe] — route name `editRecipe` (path `/recipe/:id/edit`)

- Same sections as detail, editable.
- Recipe fields: name, description (textarea, required on save), servings, time, category, photo (file replace).
- Primary save: **Save Recipe** (`oc-cta`).
- **Ingredients:** `v-select` of the user's ingredients; quantity number field; **Add** attaches to the recipe. Display: `{quantity} {unit} {name}`.
- **Add ingredient:** name + unit (`v-select` of FR-031 units) + **Add ingredient**. Creates a private ingredient and may then be selected/attached.
- Remove a recipe-ingredient with a trash/icon action (`aria-label`: **Remove ingredient**).
- **Steps:** instruction field; **Add Step** appends (server numbering). Existing steps editable; remove with `aria-label` **Remove step**.
- Client validation messages match the FR/Gherkin strings. Server errors in `<v-alert type="error">`.

---

## Data Model Requirements

Delta from Feature 1 / starter tables. `users` and `sessions` are unchanged.

### `recipes` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required; trimmed non-empty |
| `description` | STRING | Optional on create (empty string allowed); required non-empty on edit save |
| `servings` | INTEGER | Optional; if set, ≥ 1 |
| `time` | INTEGER | Optional; minutes; if set, ≥ 1 |
| `category` | STRING | Optional; one of the FR-006 values |
| `imagePath` | STRING | Optional; URL path to stored JPEG/PNG |
| `isPublished` | BOOLEAN | Default `false`; not used in Feature 2 UI |
| `userId` | INTEGER FK | Required; references `users.id`; set from session |

### `ingredients` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required; unique per `userId` (case-insensitive, trimmed) |
| `unit` | STRING | Required; one of the FR-031 values |
| `pricePerUnit` | DECIMAL(10,2) | Nullable; unused in Feature 2 |
| `userId` | INTEGER FK | Required; references `users.id`; set from session |

### `recipeSteps` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `stepNumber` | INTEGER | Required; assigned by server on create |
| `instruction` | STRING(5000) | Required; trimmed non-empty |
| `recipeId` | INTEGER FK | Required; references `recipes.id`; cascade delete |

### `recipeIngredients` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `quantity` | FLOAT | Required; must be > 0 |
| `recipeId` | INTEGER FK | Required; references `recipes.id`; cascade delete |
| `ingredientId` | INTEGER FK | Required; references `ingredients.id`; must be owned by the same user as the recipe |
| `recipeStepId` | INTEGER FK | Optional / nullable; unused in Feature 2 |

### Associations

- `User` 1—* `Recipe` (`userId` NOT NULL, `onDelete: CASCADE`)
- `User` 1—* `Ingredient` (`userId` NOT NULL, `onDelete: CASCADE`)
- `Recipe` 1—* `RecipeStep`
- `Recipe` 1—* `RecipeIngredient`
- `Ingredient` 1—* `RecipeIngredient`
- `RecipeStep` 1—* `RecipeIngredient` optional (nullable `recipeStepId`)

---

## Acceptance Criteria (Gherkin)

### US-2.1 — View my recipes

#### Scenario: Signed-in user sees their recipes after sign-in

- **Given** I am signed in as user A
- **And** user A owns recipes named `"Pancakes"` and `"Chili"`
- **And** user B owns a recipe named `"Secret Stew"`
- **When** I land on the home page
- **Then** I see **My Recipes**
- **And** I see `"Pancakes"` and `"Chili"`
- **And** I do not see `"Secret Stew"`

#### Scenario: Signed-in user with no recipes sees the empty state

- **Given** I am signed in
- **And** I own no recipes
- **When** I view the home page
- **Then** I see **"No recipes yet. Create your first recipe."**

#### Scenario: Recipe list omits another user's recipes

- **Given** I am signed in as user A
- **And** user B owns a recipe
- **When** I send `GET /recipeapi/recipes`
- **Then** the API returns `200` with an array that does not include user B's recipe

#### Scenario: User filters recipes by name

- **Given** I am signed in on the home page
- **And** I own recipes named `"Pancakes"` and `"Chili"`
- **When** I type `"pan"` in the search field
- **Then** I see `"Pancakes"`
- **And** I do not see `"Chili"`

#### Scenario: User filters recipes with no matching name

- **Given** I am signed in on the home page
- **And** I own a recipe named `"Pancakes"`
- **When** I type `"zzz"` in the search field
- **Then** I see **"No recipes match your search."**

#### Scenario: Recipe list fails to load

- **Given** I am signed in on the home page
- **And** the recipe list request fails
- **Then** I see a `<v-alert type="error">` with **"Unable to load recipes."**

#### Scenario: Signed-in user sees MenuBar on the recipe list

- **Given** I am signed in
- **When** I view the home page
- **Then** I see the MenuBar
- **And** I do not see a page-level **Sign out** button

---

### US-2.2 — Create a recipe

#### Scenario: User creates a recipe with a valid name

- **Given** I am signed in on the home page
- **When** I click **+ Add Recipe**
- **And** I enter name `"Pancakes"`
- **And** I click **Add Recipe**
- **Then** the API returns `201` with a recipe whose `name` is `"Pancakes"` and `userId` is my id
- **And** `"Pancakes"` appears on the recipe list

#### Scenario: User creates a recipe with an empty name

- **Given** I am signed in on the home page
- **When** I click **+ Add Recipe**
- **And** I leave the name field empty
- **And** I click **Add Recipe**
- **Then** inline validation blocks the request
- **And** I see **"Recipe name is required."**
- **And** no API request is sent

#### Scenario: User creates a recipe with a whitespace-only name

- **Given** I am signed in
- **When** I submit a new recipe with name `"   "`
- **Then** the API returns `400` with `{ "message": "Recipe name is required." }`
- **And** no recipe row is stored

#### Scenario: User creates a recipe with servings, time, and category

- **Given** I am signed in
- **When** I create a recipe with name `"Pancakes"`, servings `4`, time `20`, and category `"Breakfast"`
- **Then** the API returns `201`
- **And** the stored recipe has those servings, time, and category values

#### Scenario: User creates a recipe with servings less than 1

- **Given** I am signed in
- **When** I submit a new recipe with name `"Pancakes"` and servings `0`
- **Then** the API returns `400` with `{ "message": "Servings must be at least 1." }`

#### Scenario: User creates a recipe with an invalid category

- **Given** I am signed in
- **When** I submit a new recipe with name `"Pancakes"` and category `"Brunch"`
- **Then** the API returns `400` with `{ "message": "Category is not valid." }`

#### Scenario: User creates a recipe with a photo

- **Given** I am signed in
- **And** I have created a recipe named `"Pancakes"`
- **When** I upload a JPEG under 2 MB as the recipe photo
- **Then** the API returns `200`
- **And** the recipe `imagePath` is a non-empty URL path
- **And** the file is stored on the server

---

### US-2.3 — View a recipe

#### Scenario: User opens a recipe from the list

- **Given** I am signed in on the home page
- **And** I own a recipe named `"Pancakes"`
- **When** I click the name `"Pancakes"`
- **Then** I am on the recipe detail view
- **And** I see the heading `"Pancakes"`

#### Scenario: Recipe detail shows description, ingredients, and numbered steps

- **Given** I am signed in
- **And** I own recipe `"Pancakes"` with description `"Weekend breakfast."`, one ingredient `"2 cup Flour"`, and step `1` `"Whisk the dry ingredients."`
- **When** I open that recipe
- **Then** I see `"Weekend breakfast."`
- **And** I see `"2 cup Flour"`
- **And** I see step `1` `"Whisk the dry ingredients."`

#### Scenario: Recipe detail with no ingredients or steps shows empty section copy

- **Given** I am signed in
- **And** I own recipe `"Pancakes"` with an empty description and no ingredients or steps
- **When** I open that recipe
- **Then** I see **"No description yet."**
- **And** I see **"No ingredients yet."**
- **And** I see **"No steps yet."**

#### Scenario: User opens a recipe that does not exist

- **Given** I am signed in
- **When** I send `GET /recipeapi/recipes/99999`
- **Then** the API returns `404` with `{ "message": "Recipe with id=99999 not found." }`

---

### US-2.4 — Edit a recipe

#### Scenario: User updates a recipe's name and description

- **Given** I am signed in
- **And** I own recipe `"Pancakes"`
- **When** I open **Edit recipe**
- **And** I change the name to `"Buttermilk Pancakes"` and the description to `"Fluffy weekend pancakes."`
- **And** I click **Save Recipe**
- **Then** the API returns `200`
- **And** the stored recipe has name `"Buttermilk Pancakes"` and that description

#### Scenario: User cannot save an empty description on edit

- **Given** I am signed in on the edit recipe view
- **When** I clear the description field
- **And** I click **Save Recipe**
- **Then** inline validation blocks the request
- **And** I see **"Description is required."**
- **And** no API request is sent

#### Scenario: User adds an ingredient from the dropdown with a quantity

- **Given** I am signed in on the edit recipe view for `"Pancakes"`
- **And** I own a private ingredient `"Flour"` with unit `"cup"`
- **When** I select `"Flour"` from the ingredient dropdown
- **And** I enter quantity `2`
- **And** I add it to the recipe
- **Then** the API returns `201`
- **And** the recipe lists `"2 cup Flour"`

#### Scenario: User adds a new private ingredient from the recipe form

- **Given** I am signed in on the edit recipe view
- **And** I do not own an ingredient named `"Eggs"`
- **When** I enter ingredient name `"Eggs"` and unit `"piece"`
- **And** I click **Add ingredient**
- **Then** the API returns `201` with `name` `"Eggs"`, `unit` `"piece"`, and my `userId`
- **And** `"Eggs"` appears in the ingredient dropdown

#### Scenario: User cannot attach an ingredient without a quantity

- **Given** I am signed in on the edit recipe view
- **And** I own a private ingredient `"Flour"`
- **When** I select `"Flour"` and leave quantity empty
- **And** I try to add it to the recipe
- **Then** inline validation blocks the request
- **And** I see **"Quantity is required."**
- **And** no attach request is sent

#### Scenario: User cannot add a duplicate ingredient name

- **Given** I am signed in
- **And** I already own an ingredient named `"Flour"`
- **When** I create an ingredient with name `"flour"` and unit `"cup"`
- **Then** the API returns `400` with `{ "message": "Ingredient name is already in your list." }`

#### Scenario: User adds a numbered cooking step

- **Given** I am signed in on the edit recipe view for a recipe with no steps
- **When** I enter instruction `"Whisk the dry ingredients."`
- **And** I click **Add Step**
- **Then** the API returns `201` with `stepNumber` `1` and that instruction
- **And** I see step `1` on the form

#### Scenario: User updates a cooking step

- **Given** I am signed in
- **And** I own a recipe with step `1` `"Mix."`
- **When** I change that step's instruction to `"Whisk the dry ingredients."`
- **And** I save the step
- **Then** the API returns `200`
- **And** the stored instruction is `"Whisk the dry ingredients."`

#### Scenario: User removes a cooking step

- **Given** I am signed in on the edit recipe view
- **And** the recipe has step `1` `"Whisk the dry ingredients."`
- **When** I click **Remove step** for that step
- **Then** the API deletes the step
- **And** I no longer see that instruction on the form

#### Scenario: User replaces a recipe photo

- **Given** I am signed in
- **And** I own a recipe that already has a photo
- **When** I upload a different PNG under 2 MB
- **Then** the API returns `200`
- **And** `imagePath` points to the new file
- **And** the previous photo file is removed

#### Scenario: User uploads a photo that is not JPEG or PNG

- **Given** I am signed in
- **And** I own a recipe
- **When** I upload a file that is not a JPEG or PNG
- **Then** the API returns `400` with `{ "message": "Image must be a JPEG or PNG." }`

---

### US-2.5 — Delete a recipe

#### Scenario: User confirms deleting a recipe

- **Given** I am signed in on the home page
- **And** I own a recipe named `"Pancakes"`
- **When** I click **Delete recipe** for `"Pancakes"`
- **And** I click **Delete** on **"Delete this recipe?"**
- **Then** the API returns `200`
- **And** `"Pancakes"` is no longer on the list
- **And** the recipe row is gone from the database

#### Scenario: User cancels deleting a recipe

- **Given** I am signed in on the home page
- **And** I own a recipe named `"Pancakes"`
- **When** I click **Delete recipe** for `"Pancakes"`
- **And** I click **Cancel**
- **Then** no delete request is sent
- **And** `"Pancakes"` remains on the list

#### Scenario: Deleting a recipe removes its steps and recipe ingredients

- **Given** I am signed in
- **And** I own recipe `"Pancakes"` with at least one step and one recipe ingredient
- **When** I delete that recipe
- **Then** the API returns `200`
- **And** those step and recipe-ingredient rows are gone from the database

---

### US-2.6 — Keep recipes and ingredients private

#### Scenario: User cannot read another user's recipe

- **Given** I am signed in as user A
- **And** user B owns a recipe with id `12`
- **When** I send `GET /recipeapi/recipes/12`
- **Then** the API returns `404` with `{ "message": "Recipe with id=12 not found." }`

#### Scenario: User cannot update another user's recipe

- **Given** I am signed in as user A
- **And** user B owns a recipe with id `12`
- **When** I send `PUT /recipeapi/recipes/12` with a new name
- **Then** the API returns `404` with `{ "message": "Recipe with id=12 not found." }`
- **And** user B's recipe is unchanged

#### Scenario: User cannot delete another user's recipe

- **Given** I am signed in as user A
- **And** user B owns a recipe with id `12`
- **When** I send `DELETE /recipeapi/recipes/12`
- **Then** the API returns `404` with `{ "message": "Recipe with id=12 not found." }`
- **And** user B's recipe still exists

#### Scenario: Ingredients list returns only the signed-in user's ingredients

- **Given** I am signed in as user A
- **And** user A owns ingredient `"Flour"`
- **And** user B owns ingredient `"Saffron"`
- **When** I send `GET /recipeapi/ingredients`
- **Then** the API returns `200`
- **And** the array includes `"Flour"`
- **And** the array does not include `"Saffron"`

#### Scenario: User cannot attach another user's ingredient to a recipe

- **Given** I am signed in as user A
- **And** I own a recipe
- **And** user B owns ingredient id `9`
- **When** I send `POST /recipeapi/recipes/{myRecipeId}/recipeIngredients` with `ingredientId` `9` and quantity `1`
- **Then** the API returns `404` with `{ "message": "Ingredient with id=9 not found." }`

#### Scenario: Unauthenticated request to recipes is rejected

- **Given** I have no session
- **When** I send `GET /recipeapi/recipes`
- **Then** the API returns `401`
- **And** navigating to the home page redirects me to login

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-2.1 | Signed-in user sees their recipes after sign-in | `backend/tests/recipes.test.js`, `frontend/tests/RecipeList.test.js` | `Signed-in user sees their recipes after sign-in` |
| US-2.1 | Signed-in user with no recipes sees the empty state | `frontend/tests/RecipeList.test.js` | `Signed-in user with no recipes sees the empty state` |
| US-2.1 | Recipe list omits another user's recipes | `backend/tests/recipes.test.js` | `Recipe list omits another user's recipes` |
| US-2.1 | User filters recipes by name | `frontend/tests/RecipeList.test.js` | `User filters recipes by name` |
| US-2.1 | User filters recipes with no matching name | `frontend/tests/RecipeList.test.js` | `User filters recipes with no matching name` |
| US-2.1 | Recipe list fails to load | `frontend/tests/RecipeList.test.js` | `Recipe list fails to load` |
| US-2.1 | Signed-in user sees MenuBar on the recipe list | `frontend/tests/RecipeList.test.js` | `Signed-in user sees MenuBar on the recipe list` |
| US-2.2 | User creates a recipe with a valid name | `backend/tests/recipes.test.js`, `frontend/tests/RecipeList.test.js` | `User creates a recipe with a valid name` |
| US-2.2 | User creates a recipe with an empty name | `frontend/tests/RecipeList.test.js` | `User creates a recipe with an empty name` |
| US-2.2 | User creates a recipe with a whitespace-only name | `backend/tests/recipes.test.js` | `User creates a recipe with a whitespace-only name` |
| US-2.2 | User creates a recipe with servings, time, and category | `backend/tests/recipes.test.js` | `User creates a recipe with servings, time, and category` |
| US-2.2 | User creates a recipe with servings less than 1 | `backend/tests/recipes.test.js` | `User creates a recipe with servings less than 1` |
| US-2.2 | User creates a recipe with an invalid category | `backend/tests/recipes.test.js` | `User creates a recipe with an invalid category` |
| US-2.2 | User creates a recipe with a photo | `backend/tests/recipes.test.js` | `User creates a recipe with a photo` |
| US-2.3 | User opens a recipe from the list | `frontend/tests/RecipeList.test.js`, `frontend/tests/RecipeDetail.test.js` | `User opens a recipe from the list` |
| US-2.3 | Recipe detail shows description, ingredients, and numbered steps | `backend/tests/recipes.test.js`, `frontend/tests/RecipeDetail.test.js` | `Recipe detail shows description, ingredients, and numbered steps` |
| US-2.3 | Recipe detail with no ingredients or steps shows empty section copy | `frontend/tests/RecipeDetail.test.js` | `Recipe detail with no ingredients or steps shows empty section copy` |
| US-2.3 | User opens a recipe that does not exist | `backend/tests/recipes.test.js` | `User opens a recipe that does not exist` |
| US-2.4 | User updates a recipe's name and description | `backend/tests/recipes.test.js`, `frontend/tests/EditRecipe.test.js` | `User updates a recipe's name and description` |
| US-2.4 | User cannot save an empty description on edit | `frontend/tests/EditRecipe.test.js` | `User cannot save an empty description on edit` |
| US-2.4 | User adds an ingredient from the dropdown with a quantity | `backend/tests/recipes.test.js`, `frontend/tests/EditRecipe.test.js` | `User adds an ingredient from the dropdown with a quantity` |
| US-2.4 | User adds a new private ingredient from the recipe form | `backend/tests/ingredients.test.js`, `frontend/tests/EditRecipe.test.js` | `User adds a new private ingredient from the recipe form` |
| US-2.4 | User cannot attach an ingredient without a quantity | `frontend/tests/EditRecipe.test.js` | `User cannot attach an ingredient without a quantity` |
| US-2.4 | User cannot add a duplicate ingredient name | `backend/tests/ingredients.test.js` | `User cannot add a duplicate ingredient name` |
| US-2.4 | User adds a numbered cooking step | `backend/tests/recipes.test.js`, `frontend/tests/EditRecipe.test.js` | `User adds a numbered cooking step` |
| US-2.4 | User updates a cooking step | `backend/tests/recipes.test.js` | `User updates a cooking step` |
| US-2.4 | User removes a cooking step | `backend/tests/recipes.test.js`, `frontend/tests/EditRecipe.test.js` | `User removes a cooking step` |
| US-2.4 | User replaces a recipe photo | `backend/tests/recipes.test.js` | `User replaces a recipe photo` |
| US-2.4 | User uploads a photo that is not JPEG or PNG | `backend/tests/recipes.test.js` | `User uploads a photo that is not JPEG or PNG` |
| US-2.5 | User confirms deleting a recipe | `backend/tests/recipes.test.js`, `frontend/tests/RecipeList.test.js` | `User confirms deleting a recipe` |
| US-2.5 | User cancels deleting a recipe | `frontend/tests/RecipeList.test.js` | `User cancels deleting a recipe` |
| US-2.5 | Deleting a recipe removes its steps and recipe ingredients | `backend/tests/recipes.test.js` | `Deleting a recipe removes its steps and recipe ingredients` |
| US-2.6 | User cannot read another user's recipe | `backend/tests/recipes.test.js` | `User cannot read another user's recipe` |
| US-2.6 | User cannot update another user's recipe | `backend/tests/recipes.test.js` | `User cannot update another user's recipe` |
| US-2.6 | User cannot delete another user's recipe | `backend/tests/recipes.test.js` | `User cannot delete another user's recipe` |
| US-2.6 | Ingredients list returns only the signed-in user's ingredients | `backend/tests/ingredients.test.js` | `Ingredients list returns only the signed-in user's ingredients` |
| US-2.6 | User cannot attach another user's ingredient to a recipe | `backend/tests/recipes.test.js` | `User cannot attach another user's ingredient to a recipe` |
| US-2.6 | Unauthenticated request to recipes is rejected | `backend/tests/recipes.test.js`, `frontend/tests/router.test.js` | `Unauthenticated request to recipes is rejected` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 2 from @features/feature-2-recipe-management.md on branch `feature/2-recipe-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

- [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
- [ ] **Success Criteria (SC-00N)** met
- [ ] All mapped tests pass (`npm test`)
- [ ] Test Coverage Map complete
- [ ] `features/reference/data-model.md` updated (if schema changed)
- [ ] `features/reference/api.md` updated (if API changed)
- [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- Dedicated Ingredients catalog page (add/edit/delete list) — later feature (Feature 3)
- Publishing or sharing recipes (`isPublished` UI, public recipe browsing)
- Recipe PDF export
- Ingredient `pricePerUnit` and costing
- Linking a recipe ingredient to a specific step (`recipeStepId`)
- Recipe duplication, tags (beyond the single category dropdown), or nutrition
- Reordering steps other than display by `stepNumber`
- Cloud image hosting

---

## Delivered to Feature 3

- Private ingredients can be created from the recipe edit form so the dropdown is usable; the dedicated Ingredients catalog page (add/edit/delete list) belongs to Feature 3.
