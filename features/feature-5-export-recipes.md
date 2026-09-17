# Feature: Export Recipes

**Feature ID:** 5
**Branch pattern:** `feature/5-export-recipes`
**Status:** Ready
**Created:** 2026-09-17
**Input:** Signed-in users need to download a recipe they own as a PDF (for printing or sharing offline) and as an Excel file (for editing or combining in a spreadsheet).
**Depends on:** [Feature 1 — User Authentication & Session Management](./feature-1-user-auth.md), [Feature 2 — Recipe Management](./feature-2-recipe-management.md)
**Related:** [ADR-0002 — Security architecture](../docs/adr/0002-security-architecture.md), [features/reference/](./reference/README.md)

---

## User Stories

### US-5.1: Export a recipe as PDF

**As a** signed-in user  
**I want to** download a recipe I own as a PDF  
**So that** I can print it or keep an offline copy of the dish

**Priority:** P1  
**Independent test:** Open an owned recipe with name, description, ingredients, and steps; click **Export PDF**; receive `application/pdf` whose body includes that name, description, ingredient lines, and numbered steps  
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Export a recipe as Excel

**As a** signed-in user  
**I want to** download a recipe I own as an Excel workbook  
**So that** I can open the dish in a spreadsheet with separate sheets for details, ingredients, and steps

**Priority:** P1  
**Independent test:** Open an owned recipe; click **Export Excel**; receive an `.xlsx` file with Recipe, Ingredients, and Steps sheets matching stored data  
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: Export all my recipes as Excel

**As a** signed-in user  
**I want to** download all of my recipes as one Excel workbook  
**So that** I can review every dish I own in a spreadsheet without opening each recipe

**Priority:** P1  
**Independent test:** Sign in as a user who owns two recipes (and another user who owns a third); from My Recipes click **Export all as Excel**; receive an `.xlsx` that includes only the signed-in user's two recipes  
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Keep exports private

**As the** application  
**I want to** generate files only from the signed-in user's recipes  
**So that** one user cannot download another user's recipes as PDF or Excel

**Priority:** P1  
**Independent test:** Authenticated export of another user's recipe id returns `404`; unauthenticated export returns `401`; collection Excel never includes another user's rows  
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Users MUST be able to export a recipe they own as a **PDF** from the recipe detail view.
- **FR-002**: Users MUST be able to export a recipe they own as an **Excel** workbook (`.xlsx`) from the recipe detail view.
- **FR-003**: Users MUST be able to export **all** of the signed-in user's recipes as one Excel workbook from the My Recipes list.
- **FR-004**: Single-recipe PDF and Excel MUST include the recipe **name**, **description** (empty string when none), optional **servings**, **time** (minutes), and **category** when set.
- **FR-005**: Single-recipe PDF and Excel MUST include every recipe ingredient as **quantity**, **unit**, and **name**, in the same order as recipe detail.
- **FR-006**: Single-recipe PDF and Excel MUST include every cooking step as **stepNumber** and **instruction**, ordered by `stepNumber` ascending.
- **FR-007**: Recipe **photos** MUST NOT appear in PDF or Excel exports.
- **FR-008**: The server MUST generate export files. The client MUST NOT build PDF or Excel locally from JSON (browser print-to-PDF is not a substitute).
- **FR-009**: Single-recipe export MUST use `GET /recipeapi/recipes/:id/export?format=pdf` or `format=xlsx`. `format` is required and MUST be exactly `pdf` or `xlsx` (case-sensitive).
- **FR-010**: Collection Excel MUST use `GET /recipeapi/recipes/export?format=xlsx`. `format` is required and MUST be `xlsx`. PDF collection export is not in this feature.
- **FR-011**: Invalid or missing `format` MUST return `400` with **"Export format is not valid."**
- **FR-012**: Successful PDF MUST return status `200`, `Content-Type: application/pdf`, and `Content-Disposition: attachment` with filename `{sanitized-name}.pdf`.
- **FR-013**: Successful single-recipe Excel MUST return status `200`, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, and `Content-Disposition: attachment` with filename `{sanitized-name}.xlsx`.
- **FR-014**: Successful collection Excel MUST use the same Excel `Content-Type` as FR-013 and filename **`my-recipes.xlsx`**.
- **FR-015**: Sanitized filename MUST use the trimmed recipe **name**, replace characters other than letters, digits, space, hyphen, and underscore with `_`, collapse consecutive `_` and spaces to a single hyphen, trim leading/trailing hyphens, and fall back to **`recipe`** if the result is empty.
- **FR-016**: Single-recipe Excel MUST contain three worksheets named **Recipe**, **Ingredients**, and **Steps** with the column headers specified in API Requirements.
- **FR-017**: Collection Excel MUST contain three worksheets named **Recipes**, **Ingredients**, and **Steps**. Each ingredient and step row MUST include the parent recipe **name**. Another user's recipes MUST NOT appear.
- **FR-018**: A recipe with no ingredients or no steps MUST still export successfully. Ingredient and step sheets MUST still include header rows; data rows MAY be empty.
- **FR-019**: When the signed-in user has zero recipes, collection Excel MUST still return `200` with header-only **Recipes**, **Ingredients**, and **Steps** sheets.
- **FR-020**: All export endpoints MUST require a valid session. Missing/invalid token → `401`.
- **FR-021**: Single-recipe export for a missing or other-user recipe id MUST return **`404`** with **"Recipe with id={id} not found."** (same message shape as Feature 2) and MUST NOT return a file body.
- **FR-022**: Export MUST read live stored recipe data (not a cached snapshot table).
- **FR-023**: After a successful export response, the SPA MUST trigger a file download using the `Content-Disposition` filename (or the FR-012/013/014 default if the header is absent in tests).
- **FR-024**: While an export request is in flight, the corresponding export button MUST show loading (`:loading`) and MUST NOT send a second request until the first finishes.
- **FR-025**: Export API errors MUST show in a `<v-alert type="error">`. Single-recipe failure copy: **"Unable to export recipe."** Collection failure copy: **"Unable to export recipes."**
- **FR-026**: Feature 2 create/edit/delete and Feature 3 ingredient catalog behavior MUST remain unchanged except for the export controls this spec adds.

## Assumptions

- Features 1 and 2 authentication, recipe CRUD, nested steps, and recipe-ingredients are already on `dev`.
- Feature 3 is not required to export; collection export uses Feature 2 recipe data only.
- Filename sanitizing is for `Content-Disposition` only; it does not rename the recipe in the database.
- Empty description is exported as an empty field / blank PDF section, not the UI string **"No description yet."**
- Excel means Office Open XML `.xlsx`, not CSV or `.xls`.
- No new database tables or export-history log.

## Edge Cases

- Missing or invalid `format` → `400` **"Export format is not valid."**
- `format=pdf` on the collection path → `400` **"Export format is not valid."**
- Cross-user or unknown recipe id → `404` **"Recipe with id={id} not found."**
- Unauthenticated export → `401`
- Recipe with empty description, no ingredients, and no steps → `200` file still generated
- User with zero recipes → collection Excel `200` with headers only
- Recipe name that is only punctuation → filename **`recipe.pdf`** / **`recipe.xlsx`**
- Export request fails on the client → alert copy in FR-025; user stays on the same screen

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A signed-in user can download one owned recipe as PDF and as Excel, and download all owned recipes as Excel, in one manual pass.
- **SC-003**: `npm test` passes with the Test Coverage Map files for this feature.
- **SC-004**: Automated tests prove another user's recipe cannot be exported and is omitted from collection Excel.

---

## Data Ownership & Isolation

Exports inherit Feature 2 recipe ownership. Files are generated for the HTTP response only (in memory or a temp file deleted after send); they are not stored as shared objects and are not a new table.

| Rule | Requirement |
|------|-------------|
| **Read scope** | Single-recipe export succeeds only when the recipe's `userId = req.user.id`. Collection Excel includes only those rows. Nested `recipeStep` and `recipeIngredient` (with `ingredient`) are included only for those owned recipes. |
| **Write scope** | This feature does not create, update, or delete recipe, step, or ingredient rows |
| **Create scope** | Generated PDF/`.xlsx` bytes are not persisted as catalog records |
| **Cross-user access** | Another user's recipe id → `404` (not `403`) with Feature 2's `"Recipe with id={id} not found."`; collection Excel MUST omit other users' recipes |
| **UI scope** | SPA export actions live on `home` and `recipe`, which already load only the signed-in user's data. The client MUST NOT pass a `userId` to export URLs. |
| **Implementation** | Reuse `getAccessibleRecipeOrNull` in `backend/app/authorization/recipeAccess.js` (same helper as Feature 2 recipe controllers). Collection export filters with `userId: req.user.id` like `GET /recipeapi/recipes`. Protect routes with existing `authenticateRoute`. |

---

## Key Entities

- **User**: registered account (Feature 1); owns recipes that may be exported.
- **Recipe**: Feature 2 dish; source of name, description, servings, time, category for exports.
- **RecipeIngredient**: quantity plus owned ingredient name/unit included in export sheets/PDF.
- **RecipeStep**: numbered instruction included in export sheets/PDF.
- **Export file**: ephemeral PDF or `.xlsx` response; not a stored entity.

---

## API Requirements

Delta on existing Feature 2 recipe routes in `backend/app/routes/recipe.routes.js`. Mount path remains `/recipeapi`. Authenticated routes use `authenticateRoute` and `Authorization: Bearer <token>`. JSON errors stay `{ "message": "Human-readable explanation." }` (no `{ success, data }` envelope). Successful exports are **binary**, not JSON. No request body.

Existing `GET/POST/PUT/DELETE /recipeapi/recipes…` contracts are unchanged (**FR-026**).

Register **`GET /recipes/export` before `GET /recipes/:id` and `GET /recipes/:id/export`** so the literal path `export` is never parsed as a recipe id.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipeapi/recipes/:id/export?format=pdf` | Yes (`authenticateRoute`) | PDF for one owned recipe |
| `GET` | `/recipeapi/recipes/:id/export?format=xlsx` | Yes (`authenticateRoute`) | Excel for one owned recipe |
| `GET` | `/recipeapi/recipes/export?format=xlsx` | Yes (`authenticateRoute`) | Excel for all recipes owned by the session user |

Load single-recipe export data the same way as `GET /recipeapi/recipes/:id`: associations `recipeStep` and `recipeIngredient` (nested `ingredient`), steps by `stepNumber` ASC, ingredients by ingredient `name` ASC (**FR-005** / **FR-006**). Do not include `imagePath` content in the file (**FR-007**).

### Single-recipe PDF (`200`)

- Body: PDF bytes.
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="<sanitized-name>.pdf"`
- Visible text in the PDF MUST include recipe name, description when non-empty, servings/time/category when set, each ingredient as `{quantity} {unit} {name}`, and each step as `{stepNumber}. {instruction}`.

### Single-recipe Excel (`200`)

- Body: `.xlsx` bytes.
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="<sanitized-name>.xlsx"`

**Sheet Recipe** (header row then one data row):

| name | description | servings | time | category |
|------|-------------|----------|------|----------|

Empty optional fields are blank cells, not the string `null`.

**Sheet Ingredients** (header row then one row per recipe-ingredient):

| quantity | unit | name |
|----------|------|------|

**Sheet Steps** (header row then one row per step, `stepNumber` ascending):

| stepNumber | instruction |
|------------|-------------|

### Collection Excel (`200`)

- Filename: `my-recipes.xlsx`
- Same `Content-Type` as single-recipe Excel.

**Sheet Recipes**:

| id | name | description | servings | time | category |
|----|------|-------------|----------|------|----------|

One row per owned recipe. Order: `name` ascending, then `id` ascending for ties.

**Sheet Ingredients**:

| recipeName | quantity | unit | name |
|------------|----------|------|------|

**Sheet Steps**:

| recipeName | stepNumber | instruction |
|------------|------------|-------------|

Ingredient and step rows MUST use the parent recipe's current **name**. Order: recipe name ascending, then stepNumber / ingredient name ascending.

### Representative errors

| Status | Message |
|--------|---------|
| `400` | `"Export format is not valid."` |
| `401` | unauthorized message (Feature 1) |
| `404` | `"Recipe with id={id} not found."` |

---

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc): `oc-cta` on primary labeled CTAs; no labeled buttons inside `v-card-title`; errors in `<v-alert type="error">`. **No new router names or paths** — use existing `home`, `recipe`, and `editRecipe` in `frontend/src/router.js`. HTTP calls go through `frontend/src/services/RecipeServices.js` (not axios in the view). Add `exportRecipe(id, format)` for `GET …/recipes/:id/export?format=` and `exportAllRecipes()` for `GET …/recipes/export?format=xlsx`. Both MUST use `responseType: "blob"` so the binary body is not parsed as JSON.

MenuBar, Ingredients nav, Edit Profile, and login/register are unchanged.

### [View: Recipe Detail] — route name `recipe` (path `/recipe/:id`) — `RecipeDetail.vue`

- Keep **Back to My Recipes**, heading (`recipe.name`), photo, description / empty copy, servings, time, category, ingredients, steps, and **Edit recipe** as Feature 2.
- **Edit recipe** remains the primary `oc-cta` in the existing heading row (`d-flex` next to the `h1`, not in `v-card-title`).
- Add secondary buttons in that same heading row: **Export PDF** and **Export Excel** (`color="secondary"` or outlined; not `oc-cta`).
- **Export PDF** → `GET /recipeapi/recipes/:id/export?format=pdf` → browser download (**FR-023**).
- **Export Excel** → `GET /recipeapi/recipes/:id/export?format=xlsx` → browser download.
- Each export button uses `:loading` while its request is in flight and MUST NOT fire a second request until that call finishes (**FR-024**).
- Reuse the existing page `<v-alert type="error">`. Export failure copy: **"Unable to export recipe."** Loaded detail stays visible (do not clear `recipe`).
- Hide export buttons when there is no loaded recipe (load failure / missing id). Load failure copy remains **"Unable to load recipe."**

### [View: My Recipes] — route name `home` (path `/home`) — `RecipeList.vue`

- Keep heading **My Recipes**, search, list rows, **+ Add Recipe**, add/delete dialogs, empty and search-empty copy from Feature 2.
- **+ Add Recipe** remains the primary `oc-cta` in the heading row.
- Add **Export all as Excel** in that same heading row (secondary / outlined; not `oc-cta`), to the left of **+ Add Recipe**.
- Show **Export all as Excel** after the list request finishes, including when the list is empty (**FR-019**). Hide it while the list `v-progress-linear` is showing (same `loading` as the list fetch).
- Reuse the existing list `<v-alert type="error">`. Collection export failure copy: **"Unable to export recipes."** Do not replace Feature 2's **"Unable to load recipes."** for list-fetch failures.
- `:loading` on **Export all as Excel** while that request is in flight (**FR-024**).

### [View: Edit Recipe] — route name `editRecipe` (path `/recipe/:id/edit`) — `EditRecipe.vue`

- No export controls on the edit form (detail + list only).

---

## Data Model Requirements

No new tables, columns, or associations. Exports read existing Feature 2 rows:

- `recipes` (`id`, `name`, `description`, `servings`, `time`, `category`, `userId`) — `imagePath` and `isPublished` are unused in files
- `recipeIngredients` + nested `ingredients` (`quantity`, `unit`, `name`)
- `recipeSteps` (`stepNumber`, `instruction`)

---

## Acceptance Criteria (Gherkin)

### US-5.1 — Export a recipe as PDF

#### Scenario: User exports an owned recipe as PDF

- **Given** I am signed in on the recipe detail view
- **And** I own recipe `"Pancakes"` with description `"Weekend breakfast."`, ingredient `"2 cup Flour"`, and step `1` `"Whisk the dry ingredients."`
- **When** I click **Export PDF**
- **Then** the API returns `200` with `Content-Type` `application/pdf`
- **And** `Content-Disposition` includes filename `"Pancakes.pdf"`
- **And** the PDF text includes `"Pancakes"`, `"Weekend breakfast."`, `"2 cup Flour"`, and `"Whisk the dry ingredients."`

#### Scenario: User exports a recipe with empty description, ingredients, and steps as PDF

- **Given** I am signed in
- **And** I own recipe `"Pancakes"` with an empty description and no ingredients or steps
- **When** I send `GET /recipeapi/recipes/{id}/export?format=pdf`
- **Then** the API returns `200` with `Content-Type` `application/pdf`
- **And** the PDF text includes `"Pancakes"`

#### Scenario: User exports a recipe whose name is only punctuation as PDF

- **Given** I am signed in
- **And** I own a recipe named `"!!!"`
- **When** I send `GET /recipeapi/recipes/{id}/export?format=pdf`
- **Then** the API returns `200`
- **And** `Content-Disposition` includes filename `"recipe.pdf"`

#### Scenario: Recipe export PDF fails on the client

- **Given** I am signed in on the recipe detail view for an owned recipe
- **When** I click **Export PDF**
- **And** the export request fails
- **Then** I see a `<v-alert type="error">` with **"Unable to export recipe."**
- **And** I remain on the recipe detail view

---

### US-5.2 — Export a recipe as Excel

#### Scenario: User exports an owned recipe as Excel

- **Given** I am signed in on the recipe detail view
- **And** I own recipe `"Pancakes"` with description `"Weekend breakfast."`, servings `4`, time `20`, category `"Breakfast"`, ingredient `"2 cup Flour"`, and step `1` `"Whisk the dry ingredients."`
- **When** I click **Export Excel**
- **Then** the API returns `200` with Excel `Content-Type`
- **And** `Content-Disposition` includes filename `"Pancakes.xlsx"`
- **And** sheet **Recipe** has name `"Pancakes"`, that description, servings `4`, time `20`, and category `"Breakfast"`
- **And** sheet **Ingredients** has quantity `2`, unit `"cup"`, name `"Flour"`
- **And** sheet **Steps** has stepNumber `1` and instruction `"Whisk the dry ingredients."`

#### Scenario: User exports a recipe with no ingredients or steps as Excel

- **Given** I am signed in
- **And** I own recipe `"Pancakes"` with no ingredients or steps
- **When** I send `GET /recipeapi/recipes/{id}/export?format=xlsx`
- **Then** the API returns `200`
- **And** sheet **Ingredients** has only the header row
- **And** sheet **Steps** has only the header row

#### Scenario: Single-recipe export rejects a missing format

- **Given** I am signed in
- **And** I own a recipe
- **When** I send `GET /recipeapi/recipes/{id}/export`
- **Then** the API returns `400` with `{ "message": "Export format is not valid." }`

#### Scenario: Single-recipe export rejects an invalid format

- **Given** I am signed in
- **And** I own a recipe
- **When** I send `GET /recipeapi/recipes/{id}/export?format=csv`
- **Then** the API returns `400` with `{ "message": "Export format is not valid." }`

#### Scenario: Recipe export Excel fails on the client

- **Given** I am signed in on the recipe detail view for an owned recipe
- **When** I click **Export Excel**
- **And** the export request fails
- **Then** I see a `<v-alert type="error">` with **"Unable to export recipe."**

---

### US-5.3 — Export all my recipes as Excel

#### Scenario: User exports all owned recipes as Excel from the list

- **Given** I am signed in on the home page as user A
- **And** user A owns recipes named `"Chili"` and `"Pancakes"`
- **And** user B owns a recipe named `"Secret Stew"`
- **When** I click **Export all as Excel**
- **Then** the API returns `200` with Excel `Content-Type`
- **And** `Content-Disposition` includes filename `"my-recipes.xlsx"`
- **And** sheet **Recipes** includes `"Chili"` and `"Pancakes"`
- **And** sheet **Recipes** does not include `"Secret Stew"`

#### Scenario: User with no recipes exports an empty workbook

- **Given** I am signed in as a user who owns no recipes
- **When** I send `GET /recipeapi/recipes/export?format=xlsx`
- **Then** the API returns `200`
- **And** sheet **Recipes** has only the header row

#### Scenario: Collection export rejects PDF format

- **Given** I am signed in
- **When** I send `GET /recipeapi/recipes/export?format=pdf`
- **Then** the API returns `400` with `{ "message": "Export format is not valid." }`

#### Scenario: Collection recipe export fails on the client

- **Given** I am signed in on the home page
- **When** I click **Export all as Excel**
- **And** the export request fails
- **Then** I see a `<v-alert type="error">` with **"Unable to export recipes."**

---

### US-5.4 — Keep exports private

#### Scenario: User cannot export another user's recipe as PDF

- **Given** I am signed in as user A
- **And** user B owns a recipe with id `12`
- **When** I send `GET /recipeapi/recipes/12/export?format=pdf`
- **Then** the API returns `404` with `{ "message": "Recipe with id=12 not found." }`
- **And** the body is not a PDF

#### Scenario: User cannot export another user's recipe as Excel

- **Given** I am signed in as user A
- **And** user B owns a recipe with id `12`
- **When** I send `GET /recipeapi/recipes/12/export?format=xlsx`
- **Then** the API returns `404` with `{ "message": "Recipe with id=12 not found." }`

#### Scenario: Unauthenticated recipe export is rejected

- **Given** I have no session
- **When** I send `GET /recipeapi/recipes/1/export?format=pdf`
- **Then** the API returns `401`

#### Scenario: Unauthenticated collection export is rejected

- **Given** I have no session
- **When** I send `GET /recipeapi/recipes/export?format=xlsx`
- **Then** the API returns `401`

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-5.1 | User exports an owned recipe as PDF | `backend/tests/recipeExport.test.js`, `frontend/tests/RecipeDetail.test.js` | `User exports an owned recipe as PDF` |
| US-5.1 | User exports a recipe with empty description, ingredients, and steps as PDF | `backend/tests/recipeExport.test.js` | `User exports a recipe with empty description, ingredients, and steps as PDF` |
| US-5.1 | User exports a recipe whose name is only punctuation as PDF | `backend/tests/recipeExport.test.js` | `User exports a recipe whose name is only punctuation as PDF` |
| US-5.1 | Recipe export PDF fails on the client | `frontend/tests/RecipeDetail.test.js` | `Recipe export PDF fails on the client` |
| US-5.2 | User exports an owned recipe as Excel | `backend/tests/recipeExport.test.js`, `frontend/tests/RecipeDetail.test.js` | `User exports an owned recipe as Excel` |
| US-5.2 | User exports a recipe with no ingredients or steps as Excel | `backend/tests/recipeExport.test.js` | `User exports a recipe with no ingredients or steps as Excel` |
| US-5.2 | Single-recipe export rejects a missing format | `backend/tests/recipeExport.test.js` | `Single-recipe export rejects a missing format` |
| US-5.2 | Single-recipe export rejects an invalid format | `backend/tests/recipeExport.test.js` | `Single-recipe export rejects an invalid format` |
| US-5.2 | Recipe export Excel fails on the client | `frontend/tests/RecipeDetail.test.js` | `Recipe export Excel fails on the client` |
| US-5.3 | User exports all owned recipes as Excel from the list | `backend/tests/recipeExport.test.js`, `frontend/tests/RecipeList.test.js` | `User exports all owned recipes as Excel from the list` |
| US-5.3 | User with no recipes exports an empty workbook | `backend/tests/recipeExport.test.js` | `User with no recipes exports an empty workbook` |
| US-5.3 | Collection export rejects PDF format | `backend/tests/recipeExport.test.js` | `Collection export rejects PDF format` |
| US-5.3 | Collection recipe export fails on the client | `frontend/tests/RecipeList.test.js` | `Collection recipe export fails on the client` |
| US-5.4 | User cannot export another user's recipe as PDF | `backend/tests/recipeExport.test.js` | `User cannot export another user's recipe as PDF` |
| US-5.4 | User cannot export another user's recipe as Excel | `backend/tests/recipeExport.test.js` | `User cannot export another user's recipe as Excel` |
| US-5.4 | Unauthenticated recipe export is rejected | `backend/tests/recipeExport.test.js` | `Unauthenticated recipe export is rejected` |
| US-5.4 | Unauthenticated collection export is rejected | `backend/tests/recipeExport.test.js` | `Unauthenticated collection export is rejected` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-export-recipes.md on branch `feature/5-export-recipes`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md` (the three export GETs, binary Content-Type / Content-Disposition, `400` format message), `features/reference/behavior.md` (ownership, filenames, sheet names/columns, detail and list export buttons). Schema unchanged — do not add tables to `features/reference/data-model.md`.

---

## Definition of Done

*   [x] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [x] **Success Criteria (SC-00N)** met
*   [ ] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/data-model.md` updated (if schema changed)
*   [x] `features/reference/api.md` updated (if API changed)
*   [x] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

*   Recipe create / list / search / detail chrome / steps / photos ([Feature 2](./feature-2-recipe-management.md))
*   Ingredient catalog CRUD ([Feature 3](./feature-3-manage-ingredients.md))
*   Profile view/edit and logout placement ([Feature 4](./feature-4-user-profile-management.md))
*   Photos inside exported files (**FR-007**)
*   Exporting all recipes as a single PDF / cookbook
*   CSV, `.xls`, Google Sheets, or email delivery
*   Public / published recipe export (`isPublished`)
*   Storing generated files on disk as a user-visible library
*   Printing via the browser print dialog as the PDF implementation (**FR-008**)
