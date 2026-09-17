# Feature: User Profile Management

**Feature ID:** 4
**Branch pattern:** `feature/4-user-profile-management`
**Status:** Ready
**Created:** 2026-09-15
**Input:** Signed-in users view and edit their profile from a menu-bar dropdown; logout moves to profile menu
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Recipe Management](feature-2-pecipe-management.md), [Feature 3 — Ingredent Management](feature-3-ingredent-management.md)
**Related:** `features/reference/api.md`, `features/reference/behavior.md`, [Feature 1](feature-1-user-auth.md)

## User Stories

### US-4.1: View profile from the menu bar
**As a** signed-in user  
**I want to** open a profile dropdown from a user icon on the menu bar  
**So that** I can see my name, username, and email at a glance

**Priority:** P1  
**Independent test:** Open profile dropdown; name, username, and email are visible  
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: Edit profile
**As a** signed-in user  
**I want to** edit my profile  
**So that** I can change my name, username, email, and password

**Priority:** P1  
**Independent test:** Save valid profile changes; API and `localStorage` reflect updates  
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: Log out from profile
**As a** signed-in user  
**I want to** see a **Log out** action in the profile dropdown  
**So that** I can end my session

**Priority:** P2  
**Independent test:** Log out from dropdown clears session and redirects to login  
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: Single logout entry point
**As a** signed-in user  
**I want** the menu bar **Sign out** button removed  
**So that** logout lives in one consistent place (the profile dropdown)

**Priority:** P2  
**Independent test:** Menu bar has no standalone **Sign out** button  
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria
## Requirements

### Functional Requirements

- **FR-001**: All profile endpoints MUST require a valid session (`authenticate` middleware).
- **FR-002**: A user MAY read and update only their own profile row (`id` MUST match `req.user.id`).
- **FR-003**: Cross-user profile access MUST return `404` — never `403`.
- **FR-004**: Profile fields MUST be trimmed before save; empty required strings MUST be rejected.
- **FR-005**: Password updates MUST be optional on `PUT`; when provided, enforce minimum 8 characters and bcrypt hash before save.
- **FR-006**: Username MUST be normalized on save: `trim().toLowerCase()`.
- **FR-007**: Responses MUST never include the password hash.
- **FR-008**: After successful profile update, the frontend MUST refresh `localStorage` key `user` and dispatch `user-logged-in` so `MenuBar` reflects the new display name.
- **FR-009**: Edit Profile MUST use shared `emailRules` from `frontend/src/config/validation.js` (same as registration).
- **FR-010**: Dashboard list and recipe behavior MUST remain unchanged (Features 2–3).

---

## Assumptions

- Features 1–3 MUST be merged to `dev` before implementing this feature.
- No new database tables — profile uses existing `users` from Feature 1.
- Role is read-only; no admin user management.

## Edge Cases

- Fetch or update another user's profile → `404`.
- Duplicate username or email on update → `400`.
- Optional password omitted on update → existing password unchanged.
- Invalid email format or short password → client block and/or `400`.
- Unauthenticated profile API → `401`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: User can view profile, edit fields, and log out from the profile dropdown only.
- **SC-003**: `npm test` passes for `users.test.js` and `MenuBar.test.js`.

## Data Ownership & Isolation

Each user owns only their own `users` row for profile read/update. This feature does not introduce new resource tables.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /recipe/users/:id` succeeds only when `:id` equals `req.user.id` |
| **Write scope** | `PUT /recipe/users/:id` succeeds only when `:id` equals `req.user.id` |
| **Create scope** | Not in this feature — account creation remains Feature 1 `POST /recipe/register` |
| **Cross-user access** | Another user’s `:id` → `404` with `{ "message": "User with id=<id> not found." }` (never `403`) |
| **UI scope** | Profile dropdown and Edit Profile dialog show only the signed-in user’s data from `localStorage` key `user` (and own-profile API responses) |
| **Implementation** | Enforce ownership in the user controller (or a shared helper under `app/authorization/`) using `req.user.id` from `authenticate`; do not trust client-supplied identity beyond the path `:id` match |

---

## Key Entities

- **User**: same entity as Feature 1; profile fields editable via API (no new tables).

---

## API Requirements

This feature hardens the starter `GET` / `PUT` `/recipe/users/:id` contract (mounted in code under `/recipeapi`; feature specs use the `/recipe/…` prefix consistent with Feature 1). List-all, delete, and unauthenticated create via `/users` are **not** part of this feature’s product surface (see Out of Scope).

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipe/users/:id` | Yes (`authenticate`) | Return the signed-in user’s profile when `:id` matches `req.user.id` |
| `PUT` | `/recipe/users/:id` | Yes (`authenticate`) | Update the signed-in user’s profile when `:id` matches `req.user.id` |

**Update request body** (password optional):

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "optionalNewPassword"
}
```

**GET / PUT success response** (`200`) — flat user object, **no** password hash (and no `salt`):

```json
{
  "id": 1,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker"
}
```

After a successful `PUT`, the frontend updates `localStorage` key `user` with the returned profile fields while **preserving** the existing session `token` and `userId` (map from `id` if needed), then dispatches `user-logged-in` so `MenuBar` refreshes (**FR-008**).

**Error response:** `{ "message": "Human-readable explanation." }`

| Status | When | Message (exact where quoted in Gherkin) |
|--------|------|----------------------------------------|
| `401` | Missing/invalid/expired session | Unauthorized message (Feature 1 auth middleware) |
| `404` | `:id` ≠ `req.user.id`, or own row missing | `User with id=<id> not found.` |
| `400` | Empty/missing required field (e.g. first name) | e.g. `First name is required.` |
| `400` | Password provided and length &lt; 8 | `Password must be at least 8 characters.` |
| `400` | Duplicate username | `Username is already taken.` |
| `400` | Duplicate email | `Email is already registered.` |

**Server rules (aligned with FRs):** trim required strings; reject empty required strings; normalize `username` with `trim().toLowerCase()`; trim `email`; when `password` is omitted or empty, leave the stored hash unchanged; when provided, enforce min length 8 and bcrypt-hash before save; never return the password hash; `role` is returned read-only and must not be changed by this endpoint.

---

## Screen Requirements

No new router page. Profile UX lives in existing app chrome (`MenuBar`) and removes the duplicate logout control from the home/dashboard surface.

### [Component: MenuBar] — app chrome on authenticated routes

* User icon / avatar opens a profile dropdown (existing starter pattern).
* Dropdown displays:
  * Full name (`fName` + `lName`)
  * Username
  * Email
* Actions in the dropdown:
  * **Edit Profile** (opens dialog; primary labeled CTA uses `oc-cta` per `ui-style-system.mdc`)
  * **Log out** — calls Feature 1 logout (`POST /recipe/logout`), clears `localStorage` key `user`, redirects to login (`name: "login"`)
* Data source: `Utils.getStore("user")`; listen for `user-logged-in` (and remount/`onMounted`) so display name updates after save (**FR-008**).
* **Do not** show a standalone **Sign out** control in the menu bar itself (**US-4.4**).

### [Dialog: Edit Profile] — opened from MenuBar

* Title / purpose: edit the signed-in user’s profile.
* Fields pre-filled from current user: first name, last name, email, username; optional password + confirmation (blank = no password change).
* Email field uses shared `emailRules` from `frontend/src/config/validation.js` (**FR-009**).
* Client validation before API call:
  * Invalid email → **"Enter a valid email address."** (no request)
  * Password / confirmation mismatch → **"Passwords do not match."** (no request)
  * Password shorter than 8 characters → **"Password must be at least 8 characters."** (no request)
* Primary action: **Save** (`oc-cta`, may show `:loading` while request is in flight).
* Secondary action: **Cancel** — closes dialog with no API call; stored profile unchanged.
* On success (`200`): close dialog; update `localStorage` `user`; dispatch `user-logged-in`; reopening the dropdown shows updated values.
* On API `400` (or other error with `{ "message": "..." }`): show `<v-alert type="error">`; keep dialog open.

### [View: Home / dashboard] — remove duplicate logout

* Remove the standalone **Sign out** button from the home/dashboard page content so logout exists only in the profile dropdown (**US-4.4** / **US-4.3**).
* Recipe list and ingredient behavior unchanged (**FR-010**).

---

## Data Model Requirements

No new tables. This feature uses the existing `users` table from Feature 1.

| Field | Notes for this feature |
|-------|------------------------|
| `fName`, `lName`, `email`, `username` | Editable via `PUT /recipe/users/:id` |
| `password` | Optional on update; hashed when provided |
| `role` | Read-only in API responses; not editable in this feature |

---

## Acceptance Criteria (Gherkin)

### US-4.1 — View profile from the menu bar

#### Scenario: User opens the profile dropdown from the menu bar
*   **Given** I am signed in on the dashboard
*   **When** I click the user icon on the menu bar
*   **Then** the profile dropdown is displayed
*   **And** the dropdown shows my full name (`fName` + `lName`)
*   **And** the dropdown shows my username
*   **And** the dropdown shows my email
*   **And** an **Edit Profile** button is displayed
*   **And** a **Log out** action is displayed

---

### US-4.2 — Edit profile

#### Scenario: User opens the edit profile dialog
*   **Given** I am signed in
*   **And** the profile dropdown is displayed
*   **When** I click **Edit Profile**
*   **Then** the Edit Profile dialog is displayed
*   **And** fields are pre-filled with my current first name, last name, email, and username

#### Scenario: User cancels the edit profile dialog
*   **Given** I am signed in
*   **And** the Edit Profile dialog is displayed
*   **When** I change one or more fields
*   **And** I click **Cancel**
*   **Then** the Edit Profile dialog closes
*   **And** no profile update API request is sent
*   **And** my stored profile data is unchanged

#### Scenario: User saves profile changes
*   **Given** I am signed in
*   **And** the Edit Profile dialog is displayed
*   **When** I update my first name, last name, email, or username with valid values
*   **And** I click **Save**
*   **Then** the API returns `200` with the updated user object (no password hash)
*   **And** the Edit Profile dialog closes
*   **And** `localStorage` key `user` is updated
*   **And** reopening the profile dropdown shows my updated full name, username, and email

#### Scenario: User saves profile with invalid email format
*   **Given** I am signed in
*   **And** the Edit Profile dialog is displayed
*   **When** I enter a value that is not a valid email address (e.g. `notanemail`)
*   **And** I click **Save**
*   **Then** inline validation blocks the request
*   **And** I see the message **"Enter a valid email address."**
*   **And** no profile update API request is sent

#### Scenario: User saves profile with mismatched passwords
*   **Given** I am signed in
*   **And** the Edit Profile dialog is displayed
*   **When** I enter a new password and a non-matching confirmation
*   **And** I click **Save**
*   **Then** inline validation blocks the request
*   **And** I see the message **"Passwords do not match."**
*   **And** no profile update API request is sent

#### Scenario: User saves profile with a password that is too short
*   **Given** I am signed in
*   **And** the Edit Profile dialog is displayed
*   **When** I enter a new password shorter than 8 characters with a matching confirmation
*   **And** I click **Save**
*   **Then** inline validation blocks the request
*   **And** I see the message **"Password must be at least 8 characters."**
*   **And** no profile update API request is sent

#### Scenario: Profile update API returns an error
*   **Given** I am signed in
*   **And** the Edit Profile dialog is displayed
*   **When** I click **Save**
*   **And** the API returns `400` with `{ "message": "..." }`
*   **Then** the error is displayed in a `<v-alert type="error">`
*   **And** the Edit Profile dialog remains open

#### Scenario: User fetches their own profile
*   **Given** I am signed in as user A
*   **When** I request `GET /recipe/users/:id` with my user ID
*   **Then** the API returns `200` with my profile fields
*   **And** the response does not include a password hash

#### Scenario: User attempts to fetch another user's profile
*   **Given** I am signed in as user A
*   **And** user B exists
*   **When** I request `GET /recipe/users/:id` with user B's ID
*   **Then** the API returns `404` with `{ "message": "User with id=<id> not found." }`

#### Scenario: User attempts to update another user's profile
*   **Given** I am signed in as user A
*   **And** user B exists
*   **When** I send `PUT /recipe/users/:id` with user B's ID
*   **Then** the API returns `404` with `{ "message": "User with id=<id> not found." }`
*   **And** user B's profile is unchanged in the database

#### Scenario: Unauthenticated profile API request
*   **Given** I have no valid session token
*   **When** I request `GET /recipe/users/1`
*   **Then** the API returns `401` with an unauthorized message

#### Scenario: Profile update rejects a password that is too short
*   **Given** I am signed in as user A
*   **When** I send `PUT /recipe/users/:id` with body `{ "password": "short" }`
*   **Then** the API returns `400` with `{ "message": "Password must be at least 8 characters." }`

#### Scenario: Profile update rejects missing required fields
*   **Given** I am signed in as user A
*   **When** I send `PUT /recipe/users/:id` with a body that omits a required field (e.g. first name)
*   **Then** the API returns `400` with `{ "message": "First name is required." }`
*   **And** my stored profile is unchanged

#### Scenario: Profile update rejects a duplicate username
*   **Given** I am signed in as user A
*   **And** user B exists with username `userb`
*   **When** I send `PUT /recipe/users/:id` with body `{ "username": "userb" }` (and other valid fields)
*   **Then** the API returns `400` with `{ "message": "Username is already taken." }`
*   **And** user B's username remains `userb`

#### Scenario: Profile update rejects a duplicate email
*   **Given** I am signed in as user A
*   **And** user B exists with email `b@example.com`
*   **When** I send `PUT /recipe/users/:id` with body `{ "email": "b@example.com" }` (and other valid fields)
*   **Then** the API returns `400` with `{ "message": "Email is already registered." }`
*   **And** user B's email remains `b@example.com`

#### Scenario: Unauthenticated profile update API request
*   **Given** I have no valid session token
*   **When** I send `PUT /recipe/users/1` with a valid profile body
*   **Then** the API returns `401` with an unauthorized message

---

### US-4.3 — Log out from profile

#### Scenario: User logs out from the profile dropdown
*   **Given** I am signed in on the dashboard
*   **And** the profile dropdown is open
*   **When** I click **Log out**
*   **Then** the API invalidates my session token on the server
*   **And** `localStorage` key `user` is removed
*   **And** I am redirected to the login page

---

### US-4.4 — Single logout entry point

#### Scenario: Menu bar does not show Sign out
*   **Given** I am signed in on the dashboard
*   **When** I view the menu bar
*   **Then** I do not see a **Sign out** button on the menu bar

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-4.1 | User opens the profile dropdown from the menu bar | `frontend/tests/MenuBar.test.js` | `User opens the profile dropdown from the menu bar` |
| US-4.2 | User opens the edit profile dialog | `frontend/tests/MenuBar.test.js` | `User opens the edit profile dialog` |
| US-4.2 | User cancels the edit profile dialog | `frontend/tests/MenuBar.test.js` | `User cancels the edit profile dialog` |
| US-4.2 | User saves profile changes | `frontend/tests/MenuBar.test.js`, `backend/tests/users.test.js` | `User saves profile changes` |
| US-4.2 | User saves profile with invalid email format | `frontend/tests/MenuBar.test.js` | `User saves profile with invalid email format` |
| US-4.2 | User saves profile with mismatched passwords | `frontend/tests/MenuBar.test.js` | `User saves profile with mismatched passwords` |
| US-4.2 | User saves profile with a password that is too short | `frontend/tests/MenuBar.test.js` | `User saves profile with a password that is too short` |
| US-4.2 | Profile update API returns an error | `frontend/tests/MenuBar.test.js` | `Profile update API returns an error` |
| US-4.2 | User fetches their own profile | `backend/tests/users.test.js` | `User fetches their own profile` |
| US-4.2 | User attempts to fetch another user's profile | `backend/tests/users.test.js` | `User attempts to fetch another user's profile` |
| US-4.2 | User attempts to update another user's profile | `backend/tests/users.test.js` | `User attempts to update another user's profile` |
| US-4.2 | Unauthenticated profile API request | `backend/tests/users.test.js` | `Unauthenticated profile API request` |
| US-4.2 | Profile update rejects a password that is too short | `backend/tests/users.test.js` | `Profile update rejects a password that is too short` |
| US-4.2 | Profile update rejects missing required fields | `backend/tests/users.test.js` | `Profile update rejects missing required fields` |
| US-4.2 | Profile update rejects a duplicate username | `backend/tests/users.test.js` | `Profile update rejects a duplicate username` |
| US-4.2 | Profile update rejects a duplicate email | `backend/tests/users.test.js` | `Profile update rejects a duplicate email` |
| US-4.2 | Unauthenticated profile update API request | `backend/tests/users.test.js` | `Unauthenticated profile update API request` |
| US-4.3 | User logs out from the profile dropdown | `frontend/tests/MenuBar.test.js`, `backend/tests/auth.test.js` | `User logs out from the profile dropdown` |
| US-4.4 | Menu bar does not show Sign out | `frontend/tests/MenuBar.test.js` | `Menu bar does not show Sign out` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 4 from @features/feature-4-user-profile-management.md on branch `feature/4-user-profile-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md` (add owned `GET`/`PUT` `/users/:id`), `features/reference/behavior.md` (profile ownership, Edit Profile / Log out in MenuBar, single logout entry point). Schema unchanged — touch `features/reference/data-model.md` only if implementation notes require it.

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

- Admin user management / role changes
- Listing all users (`GET /recipe/users`) or deleting users
- Password reset / email verification / OAuth
- Avatar upload or profile photo
- New profile route/page (dialog + MenuBar only)
- Changing Feature 2–3 recipe or ingredient behavior (**FR-010**)


