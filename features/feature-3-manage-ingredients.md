# Feature: Manage Ingredients

**Feature ID:** 3
**Branch pattern:** `feature/3-manage-ingredients`
**Status:** Ready
**Created:** 2026-09-15
**Input:** Feature 2 already attaches private ingredients (name + unit, quantity on the recipe) from the edit-recipe form. Feature 3 adds the dedicated Ingredients catalog page Feature 2 deferred — list, create, edit, and delete those same private ingredients — and completes update/remove of recipe attachments.
**Depends on:** [Feature 1 — User Authentication & Session Management](./feature-1-user-auth.md), [Feature 2 — Recipe Management](./feature-2-recipe-management.md)
**Related:** [ADR-0002 — Security architecture](../docs/adr/0002-security-architecture.md), [Feature 2 — Delivered to Feature 3](./feature-2-recipe-management.md#delivered-to-feature-3)

---

## User Stories

### US-3.1: View and create ingredients on the catalog page

**As a** signed-in user  
**I want to** open a dedicated Ingredients page and add name + unit  
**So that** my private list is available on every Feature 2 recipe dropdown without creating items only from a recipe form

**Priority:** P1  
**Independent test:** MenuBar **Ingredients** → create `"Flour"` / `"cup"`; it appears on the catalog page and in the edit-recipe dropdown  
**Acceptance scenarios:** see ### US-3.1 under Acceptance Criteria

### US-3.2: Edit a private ingredient

**As a** signed-in user  
**I want to** change an ingredient's name or unit on the catalog page  
**So that** recipes that use it show the updated name and unit

**Priority:** P1  
**Independent test:** Edit `"Flour"` unit from `"cup"` to `"gram"`; catalog and recipe display use `"gram"`  
**Acceptance scenarios:** see ### US-3.2 under Acceptance Criteria

### US-3.3: Delete a private ingredient

**As a** signed-in user  
**I want to** delete an ingredient from my catalog after confirming  
**So that** I can remove pantry items I no longer use

**Priority:** P1  
**Independent test:** Confirm delete of `"Flour"`; it leaves the catalog and any recipe-ingredient rows for it; recipes themselves remain  
**Acceptance scenarios:** see ### US-3.3 under Acceptance Criteria

### US-3.4: Attach, update, and remove ingredients on a Feature 2 recipe

**As a** signed-in user  
**I want to** pick catalog ingredients on the Feature 2 edit-recipe form, change quantity, and remove a line  
**So that** each recipe lists what I need without a second attach UI on the recipe list

**Priority:** P1  
**Independent test:** On edit `"Pancakes"`, add `"2"` `"Flour"`, change to `"3"`, remove the row; catalog `"Flour"` remains  
**Acceptance scenarios:** see ### US-3.4 under Acceptance Criteria

### US-3.5: Keep the ingredient catalog private

**As the** application  
**I want to** scope catalog list/create/update/delete to the signed-in user  
**So that** one user cannot read or change another user's ingredients

**Priority:** P1  
**Independent test:** Another user's ingredient id → `404`; `GET /ingredients` omits other users' names; unauthenticated → `401`  
**Acceptance scenarios:** see ### US-3.5 under Acceptance Criteria

---

## Requirements

### Functional Requirements

Delta on Feature 2. Private `userId` ingredients, unit on the ingredient, quantity on `recipeIngredients` (Feature 2 **FR-016**–**FR-021**, **FR-031**) stay in force. Do not introduce a global shared catalog.

- **FR-001**: Protected screens MUST show MenuBar **Ingredients** navigating to route `ingredients` (`/ingredients`). Login and register MUST NOT show that item.
- **FR-002**: `GET /recipeapi/ingredients` MUST return only the signed-in user's ingredients, ordered by `name` ASC (case-insensitive).
- **FR-003**: Users MUST be able to create a private ingredient from the catalog page with required **name** (trimmed, non-empty) and **unit** (Feature 2 unit list). `userId` MUST come from `req.user.id`.
- **FR-004**: Duplicate name for the same user (case-insensitive, trimmed) → `400` with **"Ingredient name is already in your list."** Empty name → `400` **"Ingredient name is required."** Missing/invalid unit → `400` **"Unit is required."** / **"Unit is not valid."**
- **FR-005**: Users MUST be able to **update** an owned ingredient's name and unit (`PUT /recipeapi/ingredients/:id`). Same uniqueness and unit rules as create. Wrong-owner or missing id → `404` with `"Ingredient with id={id} not found."`
- **FR-006**: Users MUST confirm **delete** of an owned ingredient. **Cancel** MUST leave it unchanged. Confirm MUST `DELETE /recipeapi/ingredients/:id`.
- **FR-007**: Deleting an ingredient MUST remove that ingredient row and its `recipeIngredients` mappings. It MUST NOT delete recipes or other users' ingredients.
- **FR-008**: The Feature 2 edit-recipe ingredient dropdown MUST list ingredients created on the catalog page (same `GET /ingredients`). Attach still requires **quantity** > 0; **unit** still comes from the ingredient record (Feature 2 **FR-020**).
- **FR-009**: Users MUST be able to **update quantity** on an owned recipe-ingredient (`PUT .../recipeIngredients/:id`) and **remove** it from the recipe (`DELETE .../recipeIngredients/:id`) on the Feature 2 edit form. Remove MUST NOT delete the catalog ingredient.
- **FR-010**: Recipe-ingredient list for a recipe MUST include nested `ingredient` `name` and `unit`, ordered by ingredient name ASC.
- **FR-011**: All Feature 3 ingredient and recipe-ingredient endpoints MUST require a valid session (`401` if missing/invalid). Cross-user ingredient, recipe, or recipe-ingredient → **`404`** (not `403`).
- **FR-012**: Feature 3 MUST NOT add unscoped delete-all ingredients, a public catalog, `pricePerUnit` UI, or `recipeStepId` linking.
- **FR-013**: When the user has zero ingredients, the catalog page MUST show **"No ingredients yet. Add your first ingredient."**

---

## Assumptions

- Feature 1 session handling and Feature 2 recipe list / detail / edit / delete are already implemented.
- Feature 2 already creates private ingredients from the recipe form and attaches them with quantity. This feature **adds the catalog page** and **completes catalog edit/delete plus recipe-line update/remove AC**.
- Unit lives on `ingredients`; quantity lives on `recipeIngredients` — do not add unit on the join.
- Cooking **steps** stay Feature 2; attaching an ingredient to a step stays deferred (Feature 2 out of scope).
- Recipe delete already cascades `recipeIngredients` (Feature 2 **FR-012**). Feature 3 only asserts that **private ingredients remain** after a recipe is deleted.

---

## Edge Cases

- Empty or whitespace-only ingredient name → **"Ingredient name is required."** (client and/or `400`).
- Duplicate name (any casing) for the same user → `400` **"Ingredient name is already in your list."**
- Invalid unit → `400` **"Unit is not valid."**
- Attach or update recipe line with missing / non-positive quantity → **"Quantity is required."** / `400`.
- Cancel on ingredient delete dialog → no `DELETE`.
- Cross-user ingredient or recipe-ingredient id → `404`.
- Unauthenticated catalog or recipe-ingredient API → `401`.

---

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A signed-in user can create, edit, and delete ingredients on `/ingredients`, then attach / change quantity / remove a line on Feature 2 edit recipe, in one manual pass.
- **SC-003**: `npm test` passes with this feature's Test Coverage Map files.
- **SC-004**: Automated tests prove another user's ingredients are omitted and wrong-owner writes return `404`.

---

## Data Ownership & Isolation

Same isolation as Feature 2: each user owns their **ingredients** and **recipes**. Catalog is not global.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /ingredients` only `userId = req.user.id`. Recipe-ingredient GETs only for an owned recipe. |
| **Write scope** | PUT/DELETE ingredient only when `userId` matches. Recipe-ingredient PUT/DELETE only when the parent recipe is owned. |
| **Create scope** | New ingredients: `userId` from `req.user.id`. Attach: `recipeId` from the path; `ingredientId` must be owned by the same user. |
| **Cross-user access** | Another user's ingredient, recipe, or recipe-ingredient → `404` (not `403`) |
| **UI scope** | Catalog page and recipe dropdowns show only the signed-in user's ingredients |
| **Implementation** | Reuse `app/authorization/` helpers from Feature 2 (`recipeAccess` / ingredient accessors) |

---

## Key Entities

Unchanged from Feature 2; Feature 3 does not add tables.

- **User**: owns recipes and private ingredients (Feature 1 / 2).
- **Ingredient**: private pantry item (`name` + `unit` + `userId`). Feature 3's catalog is a full list UI for this entity.
- **RecipeIngredient**: join of an owned recipe to an owned ingredient, with **quantity** only.
- **Recipe**: Feature 2 parent; not redefined here.

---

## API Requirements

Mount `/recipeapi`. Flat JSON. Errors `{ "message": "…" }`. `404` not owned. `401` unauthenticated. Follow [api-conventions.mdc](../.cursor/rules/api-conventions.mdc) and [security.mdc](../.cursor/rules/security.mdc).

Feature 2 already defined list/create ingredients and recipe-ingredient attach. Feature 3 **adds** update/delete on ingredients and requires quantity update/delete on recipe-ingredients (paths already in Feature 2).

| Method | Endpoint | Auth | Purpose | Notes |
|--------|----------|------|---------|--------|
| `GET` | `/recipeapi/ingredients` | Yes | List signed-in user's ingredients | Feature 2; Feature 3 requires name ASC |
| `POST` | `/recipeapi/ingredients` | Yes | Create private ingredient | Feature 2 body `{ name, unit }` |
| `PUT` | `/recipeapi/ingredients/:id` | Yes | Update name and/or unit | **Feature 3** |
| `DELETE` | `/recipeapi/ingredients/:id` | Yes | Delete ingredient + its recipe-ingredient rows | **Feature 3** |
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients` | Yes | Lines for an owned recipe | Feature 2; Feature 3 requires name ASC + nested unit |
| `POST` | `/recipeapi/recipes/:recipeId/recipeIngredients` | Yes | Attach owned ingredient + quantity | Feature 2; no `unit` in body |
| `PUT` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Yes | Update quantity | Feature 2 path; Feature 3 AC |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Yes | Remove line from recipe | Feature 2 path; Feature 3 AC |

Do not take `recipeId` or `userId` from the body. Do not require `recipeStepId` or `pricePerUnit`.

### Create / update ingredient — request

```json
{ "name": "Flour", "unit": "cup" }
```

Create success `201`: `{ "id", "name", "unit", "userId" }`. Update success `200`: same fields after change.

### Attach / update recipe ingredient — request

```json
{ "ingredientId": 3, "quantity": 2 }
```

Attach: `ingredientId` + `quantity` (`quantity` > 0). Update: `{ "quantity": 3 }` (no unit field).

### Representative errors

| Status | Message |
|--------|---------|
| `400` | `"Ingredient name is required."` |
| `400` | `"Ingredient name is already in your list."` |
| `400` | `"Unit is required."` |
| `400` | `"Unit is not valid."` |
| `400` | `"Quantity is required."` |
| `401` | unauthorized (Feature 1) |
| `404` | `"Ingredient with id={id} not found."` |
| `404` | `"Recipe with id={id} not found."` |

---

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc). Do **not** add an Ingredients icon/dialog on the Feature 2 home list — attach/view stays on Feature 2 **recipe** / **editRecipe**.

### App chrome — `MenuBar`

- Add **Ingredients** (signed-in only) → `{ name: "ingredients" }`.
- Keep Feature 2 **Recipes** → `home` and avatar **Logout**.

### [View: Ingredients] — route name `ingredients` (path `/ingredients`)

- Heading: **Ingredients**
- Primary action: **+ Add Ingredient** (`oc-cta`) opens add dialog
- Table columns: **Name**, **Unit**, actions
- Icon actions: **Edit ingredient**, **Delete ingredient** (`aria-label`s)
- **Empty state:** **"No ingredients yet. Add your first ingredient."**
- **Loading:** progress while `GET /ingredients` is in flight
- **Error:** `<v-alert type="error">` with **"Unable to load ingredients."**

**Add / Edit dialog**

- Fields: **Name** (required), **Unit** (`v-select` of Feature 2 **FR-031** units, required)
- Add: **Cancel**; **Add Ingredient** (`oc-cta`)
- Edit: **Cancel**; **Save Ingredient** (`oc-cta`)
- Client messages match FR-004 strings. Server errors in dialog `<v-alert type="error">`.

**Delete confirmation**

- Copy: **"Delete this ingredient?"**
- **Cancel** (no request); **Delete** performs `DELETE`.

### [View: Edit Recipe] — Feature 2 `editRecipe` (delta)

- Dropdown still Feature 2 user's ingredients (now also items created on the catalog page).
- Quantity number field; **Add** attaches (`201`).
- Display: `{quantity} {unit} {name}` (unit from ingredient).
- Change quantity on an existing line and persist (`PUT`).
- **Remove ingredient** (`aria-label`) deletes the join only.

### [View: Recipe Detail] — Feature 2 `recipe`

- Unchanged empty copy **"No ingredients yet."**
- Lines still `{quantity} {unit} {name}`.

---

## Data Model Requirements

No new tables. Use Feature 2 schema.

### `ingredients` (unchanged)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required; unique per `userId` (case-insensitive, trimmed) |
| `unit` | STRING | Required; Feature 2 unit list |
| `pricePerUnit` | DECIMAL(10,2) | Nullable; unused |
| `userId` | INTEGER FK | Required; session user |

### `recipeIngredients` (unchanged)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `quantity` | FLOAT | Required; > 0 |
| `recipeId` | INTEGER FK | Cascade when recipe deleted (Feature 2) |
| `ingredientId` | INTEGER FK | Must be owned by the recipe owner; Feature 3 ingredient delete cascades these rows |
| `recipeStepId` | INTEGER FK | Nullable; unused |

---

## Acceptance Criteria (Gherkin)

### US-3.1 — View and create ingredients on the catalog page

#### Scenario: User opens the Ingredients catalog from MenuBar

- **Given** I am signed in
- **When** I click **Ingredients** in the MenuBar
- **Then** I am on the Ingredients page
- **And** I see the heading **Ingredients**

#### Scenario: Signed-in user with no ingredients sees the empty state

- **Given** I am signed in
- **And** I own no ingredients
- **When** I view the Ingredients page
- **Then** I see **"No ingredients yet. Add your first ingredient."**

#### Scenario: User creates an ingredient on the catalog page

- **Given** I am signed in on the Ingredients page
- **When** I click **+ Add Ingredient**
- **And** I enter name `"Flour"` and unit `"cup"`
- **And** I click **Add Ingredient**
- **Then** the API returns `201` with `name` `"Flour"`, `unit` `"cup"`, and my `userId`
- **And** `"Flour"` appears on the catalog page
- **And** `"Flour"` is selectable in the Feature 2 recipe ingredient dropdown

#### Scenario: User creates an ingredient with an empty name

- **Given** I am signed in on the Ingredients page
- **When** I click **+ Add Ingredient**
- **And** I leave the name empty
- **And** I click **Add Ingredient**
- **Then** inline validation blocks the request
- **And** I see **"Ingredient name is required."**
- **And** no API request is sent

#### Scenario: User cannot add a duplicate ingredient name from the catalog

- **Given** I am signed in
- **And** I already own an ingredient named `"Flour"`
- **When** I create an ingredient with name `"flour"` and unit `"cup"`
- **Then** the API returns `400` with `{ "message": "Ingredient name is already in your list." }`

### US-3.2 — Edit a private ingredient

#### Scenario: User updates an ingredient name and unit

- **Given** I am signed in on the Ingredients page
- **And** I own ingredient `"Flour"` with unit `"cup"`
- **When** I click **Edit ingredient** for `"Flour"`
- **And** I change the name to `"All-purpose flour"` and unit to `"gram"`
- **And** I click **Save Ingredient**
- **Then** the API returns `200`
- **And** the catalog shows `"All-purpose flour"` and `"gram"`
- **And** recipes that listed that ingredient show the new name and unit

### US-3.3 — Delete a private ingredient

#### Scenario: User confirms deleting an ingredient

- **Given** I am signed in on the Ingredients page
- **And** I own ingredient `"Flour"`
- **And** recipe `"Pancakes"` uses `"Flour"`
- **When** I click **Delete ingredient** for `"Flour"`
- **And** I click **Delete** on **"Delete this ingredient?"**
- **Then** the API returns `200`
- **And** `"Flour"` is gone from the catalog
- **And** `"Pancakes"` no longer lists `"Flour"`
- **And** recipe `"Pancakes"` still exists

#### Scenario: User cancels deleting an ingredient

- **Given** I am signed in on the Ingredients page
- **And** I own ingredient `"Flour"`
- **When** I click **Delete ingredient** for `"Flour"`
- **And** I click **Cancel**
- **Then** no delete request is sent
- **And** `"Flour"` remains on the catalog

### US-3.4 — Attach, update, and remove ingredients on a Feature 2 recipe

#### Scenario: User adds a catalog ingredient to a recipe with a quantity

- **Given** I am signed in on the edit recipe view for `"Pancakes"`
- **And** I own a private ingredient `"Flour"` with unit `"cup"`
- **When** I select `"Flour"` from the ingredient dropdown
- **And** I enter quantity `2`
- **And** I add it to the recipe
- **Then** the API returns `201`
- **And** the recipe lists `"2 cup Flour"`

#### Scenario: User cannot attach an ingredient without a quantity

- **Given** I am signed in on the edit recipe view
- **And** I own a private ingredient `"Flour"`
- **When** I select `"Flour"` and leave quantity empty
- **And** I try to add it to the recipe
- **Then** inline validation blocks the request
- **And** I see **"Quantity is required."**
- **And** no attach request is sent

#### Scenario: User updates a recipe ingredient quantity

- **Given** I am signed in on the edit recipe view for `"Pancakes"`
- **And** the recipe lists `"2 cup Flour"`
- **When** I change that line's quantity to `3`
- **And** I save the line
- **Then** the API returns `200`
- **And** the recipe lists `"3 cup Flour"`

#### Scenario: User removes an ingredient from a recipe

- **Given** I am signed in on the edit recipe view for `"Pancakes"`
- **And** the recipe lists `"2 cup Flour"`
- **When** I click **Remove ingredient** for that line
- **Then** the API returns `200`
- **And** `"Flour"` is not listed on `"Pancakes"`
- **And** `"Flour"` remains on the Ingredients catalog

#### Scenario: Recipe detail shows only that recipe's ingredients

- **Given** I am signed in
- **And** I own recipe `"Pancakes"` with `"2 cup Flour"`
- **And** I own recipe `"Omelet"` with `"3 piece Eggs"`
- **When** I open `"Pancakes"`
- **Then** I see `"2 cup Flour"`
- **And** I do not see `"Eggs"` on that recipe

#### Scenario: Deleting a recipe does not delete private ingredients

- **Given** I am signed in
- **And** I own recipe `"Pancakes"` with attached `"Flour"`
- **When** I delete recipe `"Pancakes"` (Feature 2 delete)
- **Then** the recipe-ingredient rows for that recipe are gone
- **And** catalog ingredient `"Flour"` still exists

### US-3.5 — Keep the ingredient catalog private

#### Scenario: Ingredients list returns only the signed-in user's ingredients

- **Given** I am signed in as user A
- **And** user A owns ingredient `"Flour"`
- **And** user B owns ingredient `"Saffron"`
- **When** I send `GET /recipeapi/ingredients`
- **Then** the API returns `200`
- **And** the array includes `"Flour"`
- **And** the array does not include `"Saffron"`

#### Scenario: User cannot update another user's ingredient

- **Given** I am signed in as user A
- **And** user B owns ingredient id `9`
- **When** I send `PUT /recipeapi/ingredients/9` with a new name
- **Then** the API returns `404` with `{ "message": "Ingredient with id=9 not found." }`
- **And** user B's ingredient is unchanged

#### Scenario: User cannot delete another user's ingredient

- **Given** I am signed in as user A
- **And** user B owns ingredient id `9`
- **When** I send `DELETE /recipeapi/ingredients/9`
- **Then** the API returns `404` with `{ "message": "Ingredient with id=9 not found." }`
- **And** user B's ingredient still exists

#### Scenario: User cannot read another user's recipe ingredients

- **Given** I am signed in as user A
- **And** user B owns recipe id `12` with attached ingredients
- **When** I send `GET /recipeapi/recipes/12/recipeIngredients`
- **Then** the API returns `404` with `{ "message": "Recipe with id=12 not found." }`

#### Scenario: Unauthenticated ingredient API call

- **Given** I have no session
- **When** I send `GET /recipeapi/ingredients`
- **Then** the API returns `401`
- **And** navigating to `/ingredients` redirects me to login

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-3.1 | User opens the Ingredients catalog from MenuBar | `frontend/tests/IngredientList.test.js` | `User opens the Ingredients catalog from MenuBar` |
| US-3.1 | Signed-in user with no ingredients sees the empty state | `frontend/tests/IngredientList.test.js` | `Signed-in user with no ingredients sees the empty state` |
| US-3.1 | User creates an ingredient on the catalog page | `backend/tests/ingredients.test.js`, `frontend/tests/IngredientList.test.js` | `User creates an ingredient on the catalog page` |
| US-3.1 | User creates an ingredient with an empty name | `frontend/tests/IngredientList.test.js` | `User creates an ingredient with an empty name` |
| US-3.1 | User cannot add a duplicate ingredient name from the catalog | `backend/tests/ingredients.test.js` | `User cannot add a duplicate ingredient name from the catalog` |
| US-3.2 | User updates an ingredient name and unit | `backend/tests/ingredients.test.js`, `frontend/tests/IngredientList.test.js` | `User updates an ingredient name and unit` |
| US-3.3 | User confirms deleting an ingredient | `backend/tests/ingredients.test.js`, `frontend/tests/IngredientList.test.js` | `User confirms deleting an ingredient` |
| US-3.3 | User cancels deleting an ingredient | `frontend/tests/IngredientList.test.js` | `User cancels deleting an ingredient` |
| US-3.4 | User adds a catalog ingredient to a recipe with a quantity | `backend/tests/recipes.test.js`, `frontend/tests/EditRecipe.test.js` | `User adds a catalog ingredient to a recipe with a quantity` |
| US-3.4 | User cannot attach an ingredient without a quantity | `frontend/tests/EditRecipe.test.js` | `User cannot attach an ingredient without a quantity` |
| US-3.4 | User updates a recipe ingredient quantity | `backend/tests/recipes.test.js`, `frontend/tests/EditRecipe.test.js` | `User updates a recipe ingredient quantity` |
| US-3.4 | User removes an ingredient from a recipe | `backend/tests/recipes.test.js`, `frontend/tests/EditRecipe.test.js` | `User removes an ingredient from a recipe` |
| US-3.4 | Recipe detail shows only that recipe's ingredients | `frontend/tests/RecipeDetail.test.js` | `Recipe detail shows only that recipe's ingredients` |
| US-3.4 | Deleting a recipe does not delete private ingredients | `backend/tests/ingredients.test.js` | `Deleting a recipe does not delete private ingredients` |
| US-3.5 | Ingredients list returns only the signed-in user's ingredients | `backend/tests/ingredients.test.js` | `Ingredients list returns only the signed-in user's ingredients` |
| US-3.5 | User cannot update another user's ingredient | `backend/tests/ingredients.test.js` | `User cannot update another user's ingredient` |
| US-3.5 | User cannot delete another user's ingredient | `backend/tests/ingredients.test.js` | `User cannot delete another user's ingredient` |
| US-3.5 | User cannot read another user's recipe ingredients | `backend/tests/recipes.test.js` | `User cannot read another user's recipe ingredients` |
| US-3.5 | Unauthenticated ingredient API call | `backend/tests/ingredients.test.js`, `frontend/tests/router.test.js` | `Unauthenticated ingredient API call` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 3 from @features/feature-3-manage-ingredients.md on branch `feature/3-manage-ingredients`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
Do not reimplement Feature 2 recipe CRUD or cooking steps.
Reuse Feature 2 private ingredients (userId, unit on ingredient, quantity on the join).
Add the dedicated Ingredients catalog page (list/create/edit/delete) and MenuBar link, plus recipe-line quantity update/remove on the existing edit-recipe view.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## Definition of Done

*   [x] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [x] **Success Criteria (SC-00N)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/data-model.md` updated (if schema changed)
*   [x] `features/reference/api.md` updated (if API changed)
*   [x] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

*   Recipe create / list / search / detail chrome / steps / photos (Feature 2)
*   Global (not per-user) ingredient catalog
*   `pricePerUnit` and costing
*   Linking a recipe ingredient to a step (`recipeStepId`)
*   Publishing, PDF export, nutrition, unit conversion
*   Unscoped delete-all ingredients
