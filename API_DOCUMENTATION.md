# API Documentation — Gestion des Absences et Rattrapages des Enseignants

**Base URL:** `http://127.0.0.1:8000/api/v1`  
**Version:** 1.0.0  
**Authentication:** All protected routes require `Authorization: Bearer <JWT_TOKEN>` header.  
**Live Docs:** http://127.0.0.1:8000/docs

---

## Roles & Permissions

| Role | Code | Description |
|---|---|---|
| System Admin | `admin_systeme` | Full access to everything |
| Administration | `administration` | Manages absences, rattrapages, groups, users |
| Teacher | `enseignant` | Declares absences, proposes rattrapages |
| Student | `etudiant` | Views timetable and upcoming rattrapages |

---

## Schéma de la base de données

> **Base de données :** PostgreSQL  
> **ORM :** SQLAlchemy (Python)  
> **SGBD URL :** `postgresql://postgres:<password>@localhost:5432/gestion_absences`

---

### Table : `utilisateurs`

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `id` | `Integer` | `SERIAL` | `PRIMARY KEY`, `INDEX` |
| `nom` | `String(100)` | `VARCHAR(100)` | `NOT NULL` |
| `prenom` | `String(100)` | `VARCHAR(100)` | `NOT NULL` |
| `email` | `String(150)` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE`, `INDEX` |
| `mot_de_passe` | `String(255)` | `VARCHAR(255)` | `NOT NULL` |
| `role` | `Enum(RoleUtilisateur)` | `ENUM` | `NOT NULL` — valeurs : `admin_systeme`, `administration`, `enseignant`, `etudiant` |
| `actif` | `Boolean` | `BOOLEAN` | `DEFAULT TRUE` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()`, mis à jour automatiquement |

**Relations :**
- `matieres_enseignees` → `matieres` (1→N)
- `absences` → `absences` (1→N, cascade delete)
- `rattrapages_valides` → `rattrapages` (1→N)
- `groupes` → `etudiants_groupes` → `groupes` (N→N via table de liaison)
- `notifications` → `notifications` (1→N, cascade delete)

---

### Table : `departements`

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `id` | `Integer` | `SERIAL` | `PRIMARY KEY`, `INDEX` |
| `nom` | `String(100)` | `VARCHAR(100)` | `NOT NULL` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()`, mis à jour automatiquement |

**Relations :**
- `groupes` → `groupes` (1→N, cascade delete)
- `matieres` → `matieres` (1→N, cascade delete)

---

### Table : `groupes`

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `id` | `Integer` | `SERIAL` | `PRIMARY KEY`, `INDEX` |
| `nom` | `String(100)` | `VARCHAR(100)` | `NOT NULL` |
| `departement_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → departements(id) ON DELETE CASCADE` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()`, mis à jour automatiquement |

**Relations :**
- `departement` → `departements` (N→1)
- `etudiants` → `utilisateurs` (N→N via `etudiants_groupes`)
- `emplois_du_temps` → `emplois_du_temps` (1→N, cascade delete)

---

### Table : `matieres`

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `id` | `Integer` | `SERIAL` | `PRIMARY KEY`, `INDEX` |
| `nom` | `String(100)` | `VARCHAR(100)` | `NOT NULL` |
| `departement_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → departements(id) ON DELETE CASCADE` |
| `enseignant_id` | `Integer` | `INTEGER` | `NULLABLE`, `FK → utilisateurs(id) ON DELETE SET NULL` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()`, mis à jour automatiquement |

**Relations :**
- `departement` → `departements` (N→1)
- `enseignant` → `utilisateurs` (N→1, nullable)
- `absences` → `absences` (1→N, cascade delete)
- `emplois_du_temps` → `emplois_du_temps` (1→N, cascade delete)

---

### Table : `salles`

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `id` | `Integer` | `SERIAL` | `PRIMARY KEY`, `INDEX` |
| `nom` | `String(50)` | `VARCHAR(50)` | `NOT NULL` |
| `capacite` | `Integer` | `INTEGER` | `NOT NULL` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()`, mis à jour automatiquement |

**Relations :**
- `rattrapages` → `rattrapages` (1→N, cascade delete)
- `emplois_du_temps` → `emplois_du_temps` (1→N, cascade delete)

---

### Table : `absences`

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `id` | `Integer` | `SERIAL` | `PRIMARY KEY`, `INDEX` |
| `enseignant_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → utilisateurs(id) ON DELETE CASCADE` |
| `matiere_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → matieres(id) ON DELETE CASCADE` |
| `date_absence` | `Date` | `DATE` | `NOT NULL` |
| `motif` | `Text` | `TEXT` | `NOT NULL` |
| `justificatif` | `String(255)` | `VARCHAR(255)` | `NULLABLE` — chemin fichier justificatif |
| `statut` | `Enum(StatutAbsence)` | `ENUM` | `NOT NULL`, `DEFAULT 'en_attente'` — valeurs : `en_attente`, `valide`, `rejete` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()`, mis à jour automatiquement |

**Relations :**
- `enseignant` → `utilisateurs` (N→1)
- `matiere` → `matieres` (N→1)
- `rattrapages` → `rattrapages` (1→N, cascade delete)

---

### Table : `rattrapages`

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `id` | `Integer` | `SERIAL` | `PRIMARY KEY`, `INDEX` |
| `absence_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → absences(id) ON DELETE CASCADE` |
| `salle_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → salles(id) ON DELETE CASCADE` |
| `date_proposee` | `Date` | `DATE` | `NOT NULL` |
| `heure_debut` | `Time` | `TIME` | `NOT NULL` |
| `heure_fin` | `Time` | `TIME` | `NOT NULL` |
| `statut` | `Enum(StatutRattrapage)` | `ENUM` | `NOT NULL`, `DEFAULT 'propose'` — valeurs : `propose`, `valide`, `annule` |
| `valide_par` | `Integer` | `INTEGER` | `NULLABLE`, `FK → utilisateurs(id) ON DELETE SET NULL` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()`, mis à jour automatiquement |

**Relations :**
- `absence` → `absences` (N→1)
- `salle` → `salles` (N→1)
- `validateur` → `utilisateurs` (N→1, nullable)
- `emplois_du_temps` → `emplois_du_temps` (1→N, cascade delete)

---

### Table : `emplois_du_temps`

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `id` | `Integer` | `SERIAL` | `PRIMARY KEY`, `INDEX` |
| `groupe_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → groupes(id) ON DELETE CASCADE` |
| `matiere_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → matieres(id) ON DELETE CASCADE` |
| `salle_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → salles(id) ON DELETE CASCADE` |
| `jour_semaine` | `Integer` | `INTEGER` | `NOT NULL` — `0=Lundi, 1=Mardi, 2=Mercredi, 3=Jeudi, 4=Vendredi, 5=Samedi, 6=Dimanche` |
| `heure_debut` | `Time` | `TIME` | `NOT NULL` |
| `heure_fin` | `Time` | `TIME` | `NOT NULL` |
| `rattrapage_id` | `Integer` | `INTEGER` | `NULLABLE`, `FK → rattrapages(id) ON DELETE SET NULL` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()`, mis à jour automatiquement |

**Contraintes UNIQUE :**
- `uq_groupe_horaire` : `(groupe_id, jour_semaine, heure_debut, heure_fin)` — un groupe ne peut pas avoir deux cours en même temps
- `uq_salle_horaire` : `(salle_id, jour_semaine, heure_debut, heure_fin)` — une salle ne peut pas être utilisée deux fois en même temps

**Relations :**
- `groupe` → `groupes` (N→1)
- `matiere` → `matieres` (N→1)
- `salle` → `salles` (N→1)
- `rattrapage` → `rattrapages` (N→1, nullable)

---

### Table : `etudiants_groupes` *(table de liaison N→N)*

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `etudiant_id` | `Integer` | `INTEGER` | `PRIMARY KEY`, `FK → utilisateurs(id) ON DELETE CASCADE` |
| `groupe_id` | `Integer` | `INTEGER` | `PRIMARY KEY`, `FK → groupes(id) ON DELETE CASCADE` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

> Clé primaire composite : `(etudiant_id, groupe_id)` — un étudiant ne peut appartenir qu'à un seul groupe.

---

### Table : `notifications`

| Colonne | Type SQLAlchemy | Type SQL | Contraintes |
|---|---|---|---|
| `id` | `Integer` | `SERIAL` | `PRIMARY KEY`, `INDEX` |
| `utilisateur_id` | `Integer` | `INTEGER` | `NOT NULL`, `FK → utilisateurs(id) ON DELETE CASCADE` |
| `titre` | `String(200)` | `VARCHAR(200)` | `NOT NULL` |
| `message` | `Text` | `TEXT` | `NOT NULL` |
| `est_lu` | `Boolean` | `BOOLEAN` | `DEFAULT FALSE` |
| `created_at` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

**Relations :**
- `utilisateur` → `utilisateurs` (N→1)

---

### Diagramme des relations (ERD simplifié)

```
utilisateurs ─────────────────────────────────────────────────┐
    │                                                          │
    │ 1→N (enseignant)          N→N (via etudiants_groupes)   │
    ▼                           ▼                             │
matieres ──────┐          groupes ──────┐                     │
    │ 1→N       │              │ 1→N    │                     │
    ▼           │              ▼        │                     │
absences        │         emplois_du_temps ◄──────────────────┤
    │ 1→N       │              ▲                              │
    ▼           │              │ N→1                         │
rattrapages ────┘         salles ◄──── rattrapages            │
    │ 1→N                               ▲                    │
    ▼                                   │ N→1 (valide_par)   │
emplois_du_temps                   utilisateurs ◄────────────┘
                                        │ 1→N
                                        ▼
                                   notifications

departements ──► groupes (1→N)
departements ──► matieres (1→N)
```

---

## Standard Paginated Response

```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "per_page": 20,
  "total_pages": 3
}
```

---

## 1. Authentication (`/api/v1/auth`)

### `POST /auth/login`
**Description:** Authenticates a user with email and password. Returns a JWT Bearer token valid for the session. No authentication required to call this endpoint. All subsequent API calls must include this token in the `Authorization` header.

**Access:** Public — no token required.

**Request Body** (`application/json`):
```json
{
  "email": "j.dupont@univ.com",
  "mot_de_passe": "password123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error 401:** `{"detail": "Identifiants invalides"}` — wrong email or password.

---

### `GET /auth/me`
**Description:** Returns the full profile of the currently authenticated user. Useful for populating the UI after login (name, role, email, active status).

**Access:** Any authenticated role.

**Response 200:** `UtilisateurResponse` — full user object including `id`, `nom`, `prenom`, `email`, `role`, `actif`, `created_at`, `updated_at`.

---

### `PUT /auth/me`
**Description:** Allows the currently logged-in user to update their own profile: name, email, or password. Cannot change their own `role` or `actif` status — those are admin-only operations.

**Access:** Any authenticated role.

**Request Body** (`application/json`) — all fields optional:
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "nouveau@email.com",
  "mot_de_passe": "nouveauMotDePasse"
}
```

**Response 200:** Updated `UtilisateurResponse`.  
**Error 400:** Email already taken by another account.

---

### `POST /auth/forgot-password`
**Description:** Generates a secure random reset token, hashes it, saves it to the user database with a 1-hour expiration time, and sends a reset link email to the user.

**Access:** Public — no token required.

**Request Body** (`application/json`):
```json
{
  "email": "j.dupont@univ.com"
}
```

**Response 200:**
```json
{
  "message": "Si l'adresse email existe, un lien de réinitialisation a été envoyé."
}
```

---

### `GET /auth/verify-reset-token`
**Description:** Validates if a password reset token is valid and not yet expired. Used by the frontend reset password page to verify the token on page load.

**Access:** Public — no token required.

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `token` | string | Yes | The unhashed raw reset token |

**Response 200:**
```json
{
  "status": "valid",
  "email": "j.dupont@univ.com"
}
```

**Error 400:** `{"detail": "Le jeton de réinitialisation est invalide ou a expiré."}`

---

### `POST /auth/reset-password`
**Description:** Verifies the reset token, updates the user's password to the new password, and clears the reset token hash and expiration.

**Access:** Public — no token required.

**Request Body** (`application/json`):
```json
{
  "token": "raw_token_here",
  "nouveau_mot_de_passe": "newpassword123"
}
```

**Response 200:**
```json
{
  "message": "Votre mot de passe a été réinitialisé avec succès."
}
```

**Error 400:** `{"detail": "Le jeton de réinitialisation est invalide ou a expiré."}`

---

## 2. Users (`/api/v1/users`)

> Most endpoints restricted to `admin_systeme` only. The `administration` role can list students.

### `GET /users/`
**Description:** Returns a paginated, filterable list of all platform users. Supports filtering by role (e.g., list all teachers), active status (e.g., only deactivated accounts), and a full-text search across `nom`, `prenom`, and `email`. Useful for the admin user management panel. The `administration` role is restricted to listing students and teachers only (must pass `role=etudiant` or `role=enseignant`).

**Access:** `admin_systeme` (full access), `administration` (must pass `role=etudiant` or `role=enseignant`).

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `page` | int | No (default: 1) | Page number |
| `per_page` | int | No (default: 20, max: 100) | Items per page |
| `role` | string | No | Filter: `admin_systeme`, `administration`, `enseignant`, `etudiant` |
| `actif` | bool | No | Filter by `true` (active) or `false` (deactivated) |
| `search` | string | No | Case-insensitive search across nom, prenom, email |

**Response 200:** `PaginatedResponse[UtilisateurResponse]`
**Error 403:** `administration` role attempting to list users other than students or teachers.

---

### `POST /users/`
**Description:** Creates a new platform user (teacher, student, admin, etc.). The password is hashed before storage. After creation, a welcome notification is automatically sent to the new user: *"Bienvenue sur la plateforme"*.

**Access:** `admin_systeme` only.

**Request Body** (`application/json`):
```json
{
  "nom": "Martin",
  "prenom": "Sophie",
  "email": "s.martin@univ.com",
  "role": "enseignant",
  "mot_de_passe": "password123",
  "actif": true
}
```
`actif` defaults to `true` if omitted.

**Response 201:** `UtilisateurResponse`  
**Error 400:** Email already registered.  
**Notification triggered:** Welcome notification sent to new user.

---

### `GET /users/{user_id}`
**Description:** Fetches a single user by their unique ID. Returns full profile details. Typically used when clicking on a user in the admin panel.

**Access:** `admin_systeme` only.

**Path Param:** `user_id` (int)

**Response 200:** `UtilisateurResponse`  
**Error 404:** User not found.

---

### `PUT /users/{user_id}`
**Description:** Updates any field of a user account: name, email, password, role, or active status. Cannot be used to update your own account (use `PUT /auth/me` instead). If a new `mot_de_passe` is provided, it is automatically hashed.

**Access:** `admin_systeme` only. Cannot target own account.

**Request Body** — all fields optional:
```json
{
  "nom": "Nouveau Nom",
  "prenom": "Nouveau Prenom",
  "email": "new@email.com",
  "mot_de_passe": "newpass",
  "role": "administration",
  "actif": false
}
```

**Response 200:** Updated `UtilisateurResponse`  
**Error 403:** Attempting to update own account.  
**Error 404:** User not found.

---

### `DELETE /users/{user_id}`
**Description:** Permanently deletes a user account. Before deletion, a notification *"Compte supprimé"* is sent to the user. Cannot delete own account. This operation is irreversible.

**Access:** `admin_systeme` only. Cannot target own account.

**Response 204:** No content — successful deletion.  
**Error 403:** Attempting to delete own account.  
**Error 404:** User not found.  
**Notification triggered:** "Compte supprimé" sent to the deleted user.

---

### `PUT /users/{user_id}/activer`
**Description:** Reactivates a previously deactivated user account, allowing them to log in again. Sends a notification to the user informing them their account is active.

**Access:** `admin_systeme` only. Cannot target own account.

**Response 200:** `UtilisateurResponse` with `actif: true`  
**Error 404:** User not found.  
**Notification triggered:** "Compte réactivé" sent to the user.

---

### `PUT /users/{user_id}/desactiver`
**Description:** Deactivates a user account without deleting it. The user will be blocked from logging in. Sends a notification. Useful for suspending accounts temporarily.

**Access:** `admin_systeme` only. Cannot target own account.

**Response 200:** `UtilisateurResponse` with `actif: false`  
**Error 404:** User not found.  
**Notification triggered:** "Compte désactivé" sent to the user.

---

## 3. Departments (`/api/v1/departements`)

### `GET /departements/`
**Description:** Lists all departments with optional search by name. Departments are top-level organizational units under which groups and subjects are organized.

**Access:** `admin_systeme`, `administration`.

**Query Params:** `page`, `per_page`, `search` (optional name filter)

**Response 200:** `PaginatedResponse[DepartementResponse]`

---

### `POST /departements/`
**Description:** Creates a new department. Department names should be unique. Only the system admin can create departments as they are structural entities.

**Access:** `admin_systeme` only.

**Request Body:**
```json
{ "nom": "Informatique" }
```
`nom` max length: 100 characters.

**Response 201:** `DepartementResponse`

---

### `PUT /departements/{departement_id}`
**Description:** Updates the name of an existing department. Has no cascading effect on linked groups or subjects.

**Access:** `admin_systeme` only.

**Request Body:** `{ "nom": "Nouveau Nom" }` — optional.

**Response 200:** `DepartementResponse`  
**Error 404:** Department not found.

---

### `DELETE /departements/{departement_id}`
**Description:** Permanently deletes a department. Will fail if the department still has linked groups or subjects — those must be removed first to preserve referential integrity.

**Access:** `admin_systeme` only.

**Response 204:** No content.  
**Error 400:** Department has linked groups or subjects — cannot delete.  
**Error 404:** Department not found.

---

## 4. Groups (`/api/v1/groupes`)

### `GET /groupes/`
**Description:** Lists student groups. Admins and administration see all groups. Teachers see only groups they teach (determined by their assigned subjects in the timetable). Supports search by group name and pagination.

**Access:** `admin_systeme`, `administration` (all groups), `enseignant` (own groups only).

**Query Params:** `page`, `per_page`, `search`

**Response 200:** `PaginatedResponse[GroupeResponse]` — each group includes its department info and student list.

---

### `POST /groupes/`
**Description:** Creates a new student group linked to a department. The department must already exist. Group names should be descriptive (e.g., "Groupe A", "L2 Info S3").

**Access:** `admin_systeme`, `administration`.

**Request Body:**
```json
{
  "nom": "Groupe A",
  "departement_id": 1
}
```

**Response 201:** `GroupeResponse`  
**Error 400:** Department does not exist.

---

### `GET /groupes/{groupe_id}`
**Description:** Returns full details of a single group including its department and the list of students currently enrolled in it. Teachers can only access groups they teach.

**Access:** `admin_systeme`, `administration` (any group), `enseignant` (own groups only).

**Response 200:** `GroupeResponse`  
**Error 403:** Teacher is not assigned to teach this group.  
**Error 404:** Group not found.

---

### `PUT /groupes/{groupe_id}`
**Description:** Updates a group's name or moves it to a different department. If changing the department, the new department must exist.

**Access:** `admin_systeme`, `administration`.

**Request Body:** `nom` and/or `departement_id` — both optional.

**Response 200:** `GroupeResponse`  
**Error 404:** Group or department not found.

---

### `DELETE /groupes/{groupe_id}`
**Description:** Deletes a group. Will fail if the group is still referenced in any timetable entry (`EmploiDuTemps`). Remove timetable entries first before deleting the group.

**Access:** `admin_systeme` only.

**Response 204:** No content.  
**Error 400:** Group is used in at least one timetable entry.  
**Error 404:** Group not found.

---

### `GET /groupes/departement/{departement_id}`
**Description:** Lists all groups belonging to a specific department. Useful for filtering groups when building timetables or assigning students.

**Access:** `admin_systeme`, `administration`.

**Query Params:** `page`, `per_page`

**Response 200:** `PaginatedResponse[GroupeResponse]`  
**Error 403:** Insufficient permissions.  
**Error 404:** Department not found.

---

### `POST /groupes/{groupe_id}/etudiants`
**Description:** Adds one or more students to a group in a single call. Each student must have role `etudiant`. If any student is already in a *different* group, the entire operation is blocked (students can only belong to one group). Students already in the same target group are silently skipped. A notification *"Affectation à un groupe"* is sent to each successfully added student.

**Access:** `administration` only.

**Request Body:**
```json
{ "etudiants_ids": [3, 4, 5] }
```

**Response 200:**
```json
{ "message": "3 étudiants traités avec succès", "errors": [] }
```

**Error 409:** One or more students are already in a different group — returns their IDs.  
**Error 400:** Invalid student IDs.  
**Notification triggered:** "Affectation à un groupe" for each added student.

---

### `DELETE /groupes/{groupe_id}/etudiants/{etudiant_id}`
**Description:** Removes a single student from a group. After removal, the student has no group affiliation and can be assigned to another group. Sends a notification to the removed student.

**Access:** `administration` only.

**Response 204:** No content.  
**Error 404:** Group not found, or student not in this group.  
**Notification triggered:** "Retrait d'un groupe" sent to the student.

---

### `GET /groupes/{groupe_id}/etudiants`
**Description:** Returns a paginated list of all students enrolled in a specific group. Useful for admin panels showing group membership. Teachers can only view students of groups they teach.

**Access:** `admin_systeme`, `administration` (any group), `enseignant` (own groups only).

**Query Params:** `page`, `per_page`

**Response 200:** `PaginatedResponse[UtilisateurResponse]`  
**Error 403:** Teacher is not assigned to teach this group.  
**Error 404:** Group not found.

---

## 5. Subjects / Matières (`/api/v1/matieres`)

### `GET /matieres/`
**Description:** Lists all subjects across all departments. Supports search by subject name.

**Access:** `admin_systeme`, `administration`.

**Query Params:** `page`, `per_page`, `search`

**Response 200:** `PaginatedResponse[MatiereResponse]` — includes department and teacher info.

---

### `POST /matieres/`
**Description:** Creates a new subject (course). Must belong to an existing department. Optionally assigned to a teacher at creation time. If `enseignant_id` is provided, the teacher must exist and have role `enseignant`.

**Access:** `admin_systeme`, `administration`.

**Request Body:**
```json
{
  "nom": "Algorithmique Avancée",
  "departement_id": 1,
  "enseignant_id": 3
}
```
`enseignant_id` is optional.

**Response 201:** `MatiereResponse`  
**Error 400:** Department or teacher not found / invalid.

---

### `GET /matieres/{matiere_id}`
**Description:** Retrieves full details of a subject including its department and assigned teacher. If the user is a teacher (`enseignant`), they can only access the subject if they are the assigned teacher for it.

**Access:** `admin_systeme`, `administration`, `enseignant` (own subject only).

**Response 200:** `MatiereResponse`  
**Error 403:** Teacher attempting to access a subject assigned to another teacher.  
**Error 404:** Subject not found.

---

### `PUT /matieres/{matiere_id}`
**Description:** Updates a subject's name, department, or assigned teacher. Changing the teacher assignment will affect future absence declarations (the new teacher will own this subject).

**Access:** `admin_systeme`, `administration`.

**Request Body:** `nom`, `departement_id`, `enseignant_id` — all optional.

**Response 200:** `MatiereResponse`  
**Error 404:** Subject, department, or teacher not found.

---

### `DELETE /matieres/{matiere_id}`
**Description:** Permanently deletes a subject. Exercise caution — this may affect existing absences and timetable entries that reference it.

**Access:** `admin_systeme` only.

**Response 204:** No content.  
**Error 404:** Subject not found.

---

### `GET /matieres/enseignant/{enseignant_id}`
**Description:** Lists all subjects assigned to a specific teacher. Teachers use this to know which courses they can declare absences for. Admins use it to manage teacher workloads.

**Access:** `admin_systeme`, `administration`, `enseignant`.

**Query Params:** `page`, `per_page`

**Response 200:** `PaginatedResponse[MatiereResponse]`  
**Error 404:** Teacher not found.

---

## 6. Rooms / Salles (`/api/v1/salles`)

### `GET /salles/`
**Description:** Lists all classrooms/lecture halls available on the platform. Supports search by room name. Admins use this to manage rooms; teachers may browse it to see options when proposing a rattrapage.

**Access:** All authenticated roles.

**Query Params:** `page`, `per_page`, `search`

**Response 200:** `PaginatedResponse[SalleResponse]`

---

### `GET /salles/disponibles`
**Description:** Checks which rooms are available (not booked) for a given date and time slot. The system checks both the weekly recurring timetable (`EmploiDuTemps`) and already-scheduled rattrapages to determine availability. All authenticated users (teachers, students, and admins) use this to search for free rooms.

**Access:** All authenticated roles.

**Required Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `date` | date (YYYY-MM-DD) | The date to check |
| `heure_debut` | time (HH:MM) | Start time of the desired slot |
| `heure_fin` | time (HH:MM) | End time of the desired slot |
| `page` | int | Default: 1 |
| `per_page` | int | Default: 20 |

**Response 200:** `PaginatedResponse[SalleResponse]` — only rooms with no conflicts.  
**Error 400:** Start time must be strictly before end time.

---

### `GET /salles/{salle_id}`
**Description:** Returns details of a single room by ID including its name and capacity.

**Access:** All authenticated roles.

**Response 200:** `SalleResponse`  
**Error 404:** Room not found.

---

### `POST /salles/`
**Description:** Registers a new classroom or lecture hall. The capacity must be a positive integer. Room names should be unique and descriptive (e.g., "Amphi A", "Salle Info 03").

**Access:** `admin_systeme`, `administration`.

**Request Body:**
```json
{
  "nom": "Salle B202",
  "capacite": 45
}
```

**Response 201:** `SalleResponse`

---

### `PUT /salles/{salle_id}`
**Description:** Updates a room's name or capacity. Does not affect existing bookings.

**Access:** `admin_systeme`, `administration`.

**Request Body:** `nom`, `capacite` — both optional.

**Response 200:** `SalleResponse`  
**Error 404:** Room not found.

---

### `DELETE /salles/{salle_id}`
**Description:** Deletes a room. Will be blocked if the room has any active recurring weekly classes (`EmploiDuTemps`) or upcoming scheduled makeup (`Rattrapage`) sessions (to prevent orphaned bookings).

**Access:** `admin_systeme` only.

**Response 204:** No content.  
**Error 400:** Room has active recurring schedules or future makeup sessions — cannot delete.  
**Error 404:** Room not found.

---

## 7. Timetables / Emplois du Temps (`/api/v1/emplois-du-temps`)

> **`jour_semaine` encoding:** `0=Lundi, 1=Mardi, 2=Mercredi, 3=Jeudi, 4=Vendredi, 5=Samedi, 6=Dimanche`

### `GET /emplois-du-temps/groupe/{groupe_id}`
**Description:** Returns the weekly recurring timetable for a specific student group. Each entry represents a fixed course slot: which subject, in which room, on which day and time.

**Access:** `admin_systeme`, `administration`.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `page` | int | Default: 1 |
| `per_page` | int | Default: 20 |
| `jour_semaine` | int (0–6) | Filter by day of week (optional) |

**Response 200:** `PaginatedResponse[EmploiDuTempsResponse]`

---

### `GET /emplois-du-temps/etudiant`
**Description:** Returns the full weekly timetable for the currently authenticated student, automatically aggregating from all groups the student belongs to. The student does not need to specify their group — it is determined from their session.

**Access:** `etudiant` only.

**Query Params:** `page`, `per_page`, `jour_semaine` (optional, 0–6)

**Response 200:** `PaginatedResponse[EmploiDuTempsResponse]`

---

### `GET /emplois-du-temps/enseignant`
**Description:** Returns the weekly timetable for the currently authenticated teacher, showing all courses they are assigned to teach. Teachers see only their own schedule.

**Access:** `enseignant` only.

**Query Params:** `page`, `per_page`, `jour_semaine` (optional, 0–6)

**Response 200:** `PaginatedResponse[EmploiDuTempsResponse]`

---

### `GET /emplois-du-temps/salle/{salle_id}`
**Description:** Returns all timetable entries for a specific room. Useful for admins to see when a room is occupied across the week before scheduling anything.

**Access:** `admin_systeme`, `administration`.

**Query Params:** `page`, `per_page`, `jour_semaine` (optional)

**Response 200:** `PaginatedResponse[EmploiDuTempsResponse]`

---

### `GET /emplois-du-temps/matiere/{matiere_id}`
**Description:** Returns all timetable entries for a specific subject. Admins and teachers use this to see when and where a subject is scheduled across different groups. If the authenticated user is an `enseignant`, they can only retrieve the timetable if they are the assigned teacher for this subject.

**Access:** `admin_systeme`, `administration`, `enseignant`.

**Query Params:** `page`, `per_page`, `jour_semaine` (optional)

**Response 200:** `PaginatedResponse[EmploiDuTempsResponse]`
**Error 403:** Teacher attempting to access a subject assigned to another teacher.

---

### `GET /emplois-du-temps/conflits-planning`
**Description:** Analyzes the entire timetable and returns all scheduling conflicts: cases where a room is double-booked, a teacher has overlapping courses, or a group has two concurrent sessions. Returns a list of conflict objects with details about each collision.

**Access:** `admin_systeme`, `administration`.

**Response 200:** Array of conflict detail objects.

---

### `POST /emplois-du-temps/`
**Description:** Creates a new recurring weekly timetable slot. Before saving, the system runs the following validations **in order**:

1. **Existence check** — verifies that `groupe_id`, `matiere_id`, and `salle_id` all exist. Returns `404` for any missing entity.
2. **Time check** — verifies that `heure_debut < heure_fin`. Returns `400` otherwise.
3. **Conflict check** — runs `check_conflicts` across all three dimensions:
   - **Group conflict** — the group already has a course in the same time window on that day.
   - **Room conflict** — the room is already booked in the same time window on that day.
   - **Teacher conflict** — the teacher assigned to the subject is already teaching at the same time.

If **any** conflict is detected, the entry is **not saved** and a `409 Conflict` is returned with the full structured list. The `GET /emplois-du-temps/conflits-planning` endpoint continues to be available for a global audit of all existing planning conflicts.

**Access:** `admin_systeme`, `administration`.

**Request Body:**
```json
{
  "groupe_id": 1,
  "matiere_id": 2,
  "salle_id": 3,
  "jour_semaine": 0,
  "heure_debut": "08:00",
  "heure_fin": "10:00"
}
```

**Response 201:** `EmploiDuTempsResponse`  
**Error 400:** `heure_debut >= heure_fin`.  
**Error 404:** `groupe_id`, `matiere_id`, or `salle_id` not found. Response: `{ "detail": "Groupe ID 99 introuvable" }`  
**Error 409:** One or more scheduling conflicts detected. Entry not created.  
**Conflict response body (409):**
```json
{
  "detail": {
    "message": "Conflit de planning détecté. Le créneau ne peut pas être créé.",
    "conflicts": [
      { "type": "group",   "id": 13, "details": "Le groupe 'Groupe B' a déjà un cours programmé de 08:00 à 10:00." },
      { "type": "room",    "id": 13, "details": "La salle 'Salle 3' est déjà réservée de 08:00 à 10:00." },
      { "type": "teacher", "id": 13, "details": "Pr. Jean Dupont a déjà un cours prévu de 08:00 à 10:00." }
    ]
  }
}
```
**Conflict types:** `group`, `room`, `teacher`, `error`.

---

### `PUT /emplois-du-temps/{id}`
**Description:** Updates an existing timetable entry. All fields are optional. The system re-runs conflict detection after the update. If the new configuration causes any conflict, the update is rejected.

**Access:** `admin_systeme`, `administration`.

**Request Body:** Any subset of `groupe_id`, `matiere_id`, `salle_id`, `jour_semaine`, `heure_debut`, `heure_fin`.

**Response 200:** `EmploiDuTempsResponse`  
**Error 400:** `heure_debut >= heure_fin`.  
**Error 404:** Entry not found. Response: `{ "detail": "Cours non trouvé" }`  
**Error 409:** One or more scheduling conflicts detected. Entry not modified.  

**Conflict response body (409):**
```json
{
  "detail": {
    "message": "Conflit de planning détecté. Le créneau ne peut pas être modifié.",
    "conflicts": [
      "Le groupe 'Groupe B' a déjà un cours programmé de 12:13 à 21:13.",
      "La salle 'string2' est déjà réservée de 12:13 à 21:13.",
      "Pr. Jean Dupont a déjà un cours prévu de 12:13 à 21:13."
    ]
  }
}
```

---

### `DELETE /emplois-du-temps/{id}`
**Description:** Removes a recurring timetable slot permanently. Does not affect rattrapages already scheduled.

**Access:** `admin_systeme`, `administration`.

**Response 204:** No content.

---

## 8. Absences (`/api/v1/absences`)

### `GET /absences/`
**Description:** Returns a paginated list of absence declarations. Admins see all absences from all teachers. Teachers only see their own. Supports filtering by status and specific date.

**Access:** `admin_systeme`, `administration`, `enseignant` (own only).

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `page` | int | Default: 1 |
| `per_page` | int | Default: 20 |
| `statut` | string | `en_attente`, `valide`, or `rejete` |
| `date_absence` | date | Filter by exact date (YYYY-MM-DD) |

**Response 200:** `PaginatedResponse[AbsenceResponse]`

---

### `GET /absences/en-attente`
**Description:** Shortcut endpoint returning only absences with status `en_attente`. Designed for the admin review dashboard so administrators can quickly find all pending absence declarations that need action (validate or reject).

**Access:** `admin_systeme`, `administration`.

**Query Params:** `page`, `per_page`

**Response 200:** `PaginatedResponse[AbsenceResponse]`

---

### `GET /absences/historique`
**Description:** Returns the complete absence history for the currently authenticated teacher (all statuses: pending, validated, rejected). Allows teachers to track the lifecycle of their declarations without needing to filter by their own ID.

**Access:** `enseignant` only.

**Query Params:** `page`, `per_page`

**Response 200:** `PaginatedResponse[AbsenceResponse]`

---

### `GET /absences/{id}`
**Description:** Returns detailed information about a single absence by ID. Includes the teacher's name, subject name, date, reason, justification file path, and current status.

**Access:** Any authenticated user. Teachers can only access their own absences.

**Response 200:** `AbsenceResponse`  
**Error 403:** Teacher accessing another teacher's absence.  
**Error 404:** Absence not found.

---

### `POST /absences/`
**Description:** Allows a teacher to formally declare an absence. Uses `multipart/form-data` to support optional file upload (medical certificate, etc.). Several business rules are enforced before creation. A notification is automatically sent to all administrators.

**Access:** `enseignant` only.

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `matiere_id` | int | Yes | The subject the teacher is absent from |
| `date_absence` | date (YYYY-MM-DD) | Yes | The date of the absence |
| `motif` | string | Yes | Reason for the absence |
| `justificatif` | file | No | Supporting document (PDF, image, etc.) |

**Business Rules enforced:**
1. The teacher must be the assigned teacher for `matiere_id`.
2. The teacher must have a scheduled course (`EmploiDuTemps`) on the weekday of `date_absence`.
3. `date_absence` cannot be in the past.
4. No duplicate: same teacher + same subject + same date (non-rejected) cannot exist.

**Response 201:** `AbsenceResponse`  
**Error 400:** Any business rule violation.  
**Error 403:** User is not a teacher.  
**Notification triggered:** "Nouvelle absence déclarée" sent to all admins.

---

### `PUT /absences/{id}`
**Description:** Allows a teacher to update an absence declaration that is still `en_attente`. Once validated or rejected, it can no longer be modified. Useful for correcting a wrong date or adding a missing justification file. Triggers a notification to administrators.

**Access:** `enseignant` only (must own the absence).

**Content-Type:** `multipart/form-data`

**Form Fields (all optional):**

| Field | Type | Description |
|---|---|---|
| `matiere_id` | string (int) | New subject ID |
| `date_absence` | string (YYYY-MM-DD) | New absence date |
| `motif` | string | Updated reason |
| `justificatif` | file | New supporting document |

**Response 200:** Updated `AbsenceResponse`  
**Error 400:** Absence already validated or rejected — cannot modify.  
**Error 403:** Not the owner.  
**Error 404:** Absence not found.  
**Notification triggered:** "Absence modifiée" sent to all admins.

---

### `PUT /absences/{id}/valider`
**Description:** Validates (approves) an absence declaration. Once validated, the teacher is authorized to propose a rattrapage (makeup session) for that absence. The teacher receives an automatic notification.

**Access:** `admin_systeme`, `administration`.

**Response 200:** `AbsenceResponse` with `statut: "valide"`  
**Error 404:** Absence not found.  
**Notification triggered:** "Absence validée" sent to the teacher.

---

### `PUT /absences/{id}/rejeter`
**Description:** Rejects an absence declaration. The teacher is notified with the reason for rejection (the `motif` field of the absence). A rejected absence cannot have a rattrapage proposed for it.

**Access:** `admin_systeme`, `administration`.

**Response 200:** `AbsenceResponse` with `statut: "rejete"`  
**Error 404:** Absence not found.  
**Notification triggered:** "Absence rejetée" sent to the teacher with the motif.

---

### `DELETE /absences/{id}`
**Description:** Allows a teacher to withdraw (cancel) a pending absence declaration. Only possible while the status is `en_attente`. Cannot delete validated or rejected absences. Sends a notification to administrators informing them of the withdrawal.

**Access:** `enseignant` only (must own the absence).

**Response 204:** No content.  
**Error 400:** Absence is already validated or rejected.  
**Error 403:** Not the owner.  
**Error 404:** Absence not found.  
**Notification triggered:** "Absence annulée" sent to all admins.

---

## 9. Makeups / Rattrapages (`/api/v1/rattrapages`)

### `GET /rattrapages/`
**Description:** Returns a paginated list of rattrapage proposals. Admins see all rattrapages. Teachers see only their own (those linked to their absences). Supports multiple filters for flexible querying.

**Access:** All authenticated roles. Teachers filtered to own only.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `page` | int | Default: 1 |
| `per_page` | int | Default: 20 |
| `statut` | string | `propose`, `valide`, or `annule` |
| `absence_id` | int | Show rattrapages for a specific absence |
| `date_from` | date | Filter rattrapages from this date onwards |
| `date_to` | date | Filter rattrapages up to this date |

**Response 200:** `PaginatedResponse[RattrapageResponse]`

---

### `GET /rattrapages/a-venir`
**Description:** Returns upcoming (future date) rattrapage sessions that have not been cancelled. Role-aware: teachers see their own upcoming rattrapages; students see only validated ones (those confirmed by administration); admins see all non-cancelled upcoming sessions.

**Access:** All authenticated roles.

**Query Params:** `page`, `per_page`

**Response 200:** `PaginatedResponse[RattrapageResponse]`

---

### `GET /rattrapages/{id}`
**Description:** Returns full details of a rattrapage including absence info, teacher name, subject, proposed room, date, time slot, status, and who validated it.

**Access:** All authenticated. Teachers can only view their own.

**Response 200:** `RattrapageResponse`  
**Error 403:** Teacher accessing another teacher's rattrapage.  
**Error 404:** Not found.

---

### `POST /rattrapages/`
**Description:** Allows a teacher to propose a makeup session for one of their validated absences. The system enforces strict conflict detection before accepting the proposal: the room must be free, and the teacher must have no other session at the same time. Notifies administrators upon successful creation.

**Access:** `enseignant` only.

**Request Body** (`application/json`):
```json
{
  "absence_id": 5,
  "salle_id": 2,
  "date_proposee": "2026-06-15",
  "heure_debut": "14:00",
  "heure_fin": "16:00"
}
```

**Business Rules enforced:**
1. Teacher must own the referenced absence.
2. The absence must be `valide` (not pending or rejected).
3. `heure_debut` must be strictly before `heure_fin`.
4. `date_proposee` must be strictly after `date_absence`.
5. No existing active (non-cancelled) rattrapage for the same absence.
6. No room conflict: room not in use in weekly timetable or other rattrapages at the same time.
7. No teacher conflict: teacher not teaching another class or rattrapage at the same time.

**Response 201:** `RattrapageResponse` with `statut: "propose"`  
**Error 400:** Any rule or conflict violation — message describes which conflict.  
**Error 403:** Not a teacher, or not the owner of the absence.  
**Notification triggered:** "Proposition de rattrapage" sent to all admins.

---

### `PUT /rattrapages/{id}/valider`
**Description:** Administration validates a proposed rattrapage, confirming the date, time, and room. Once validated, it appears in the schedules of affected students. The teacher receives a notification, and all students in the affected groups receive a "Séance de rattrapage programmée" notification. Affected groups are determined by looking at which groups have this subject in their weekly timetable on the same weekday as the original absence.

**Access:** `admin_systeme`, `administration`.

**Response 200:** `RattrapageResponse` with `statut: "valide"`  
**Error 404:** Not found.  
**Notifications triggered:**
- "Rattrapage validé" → teacher
- "Séance de rattrapage programmée" → all affected students

---

### `PUT /rattrapages/{id}/annuler`
**Description:** Cancels a rattrapage. Can be done by the teacher (owner) or an administrator. If the rattrapage was already validated, affected students are also notified. A cancelled rattrapage cannot be reactivated — a new proposal must be created.

**Access:** Owner (`enseignant`) or `admin_systeme`/`administration`.

**Response 200:** `RattrapageResponse` with `statut: "annule"`  
**Error 403:** Not the owner and not an admin.  
**Error 404:** Not found.  
**Notifications triggered:**
- "Rattrapage annulé" → teacher
- "Rattrapage annulé" → affected students (if it was previously validated)

---

### `PUT /rattrapages/{id}/affecter-salle`
**Description:** Allows an administrator to change the room of an already-proposed or validated rattrapage. Re-runs conflict detection for the new room before applying the change. The teacher (and students if validated) are notified of the room change.

**Access:** `admin_systeme`, `administration`.

**Request Body** (`application/json`):
```json
{ "salle_id": 4 }
```

**Response 200:** `RattrapageResponse` with updated `salle_id` and `salle`.  
**Error 400:** `salle_id` missing, or new room has a conflict.  
**Error 404:** Rattrapage or room not found.  
**Notifications triggered:**
- "Salle de rattrapage modifiée" → teacher
- "Salle de rattrapage modifiée" → affected students (if validated)

---

### `DELETE /rattrapages/{id}`
**Description:** Permanently deletes a rattrapage proposal. Cannot be done if the rattrapage has already been validated (to preserve historical records). Allowed for the owning teacher or any admin.

**Access:** Owner (`enseignant`) or `admin_systeme`/`administration`.

**Response 204:** No content.  
**Error 400:** Cannot delete a validated rattrapage.  
**Error 403:** Not authorized.  
**Error 404:** Not found.

---

## 10. Dashboard (`/api/v1/dashboard`)

### `GET /dashboard/admin/stats`
**Description:** Returns a comprehensive statistics overview for administrators. Includes user counts by role, absence breakdown by status, rattrapage breakdown by status, and infrastructure stats (total rooms, total course slots). Used to populate the admin home dashboard.

**Access:** `admin_systeme`, `administration`.

**Response 200:** `AdminStatsResponse`
```json
{
  "users": {
    "total_users": 14,
    "total_enseignants": 2,
    "total_etudiants": 10,
    "total_administrations": 2
  },
  "absences": {
    "total_absences": 8,
    "absences_en_attente": 3,
    "absences_validees": 4,
    "absences_rejetees": 1,
    "absences_par_mois": [{"month": "2026-04", "count": 3}, {"month": "2026-05", "count": 5}]
  },
  "rattrapages": {
    "total_rattrapages": 4,
    "rattrapages_proposes": 1,
    "rattrapages_valides": 2,
    "rattrapages_annules": 1,
    "rattrapages_par_mois": [{"month": "2026-05", "count": 4}]
  },
  "salles_et_cours": {
    "total_salles": 6,
    "total_matieres": 8,
    "total_groupes": 5,
    "total_cours_par_semaine": 18
  }
}
```

> **Note:** `absences_par_mois` and `rattrapages_par_mois` return stats for the last 6 months. `users` counts only active users.

---

### `GET /dashboard/enseignant/stats`
**Description:** Returns personalized statistics for the authenticated teacher: their absence history breakdown, rattrapage status counts, and total number of assigned courses. Used to populate the teacher's personal dashboard.

**Access:** `enseignant` only.

**Response 200:** `TeacherStatsResponse`
```json
{
  "absences": {
    "total_absences": 3,
    "absences_en_attente": 1,
    "absences_validees": 2,
    "absences_rejetees": 0,
    "absences_par_mois": [{"month": "2026-05", "count": 3}]
  },
  "rattrapages": {
    "total_rattrapages": 2,
    "rattrapages_proposes": 1,
    "rattrapages_valides": 1,
    "rattrapages_annules": 0,
    "rattrapages_par_mois": [{"month": "2026-05", "count": 2}]
  },
  "cours": {
    "total_cours_par_semaine": 4,
    "groupes_enseignes": ["Groupe A", "L2 Info S3"]
  }
}
```

> **Note:** `absences_par_mois` and `rattrapages_par_mois` are arrays of `{"month": "YYYY-MM", "count": N}`. `groupes_enseignes` lists group names the teacher is assigned to.

---

### `GET /dashboard/etudiant/stats`
**Description:** Returns statistics relevant to the authenticated student: their course count, how many teacher absences have affected their schedule, rattrapage counts, and a list of upcoming confirmed rattrapage sessions they need to attend.

**Access:** `etudiant` only.

**Response 200:** `StudentStatsResponse`
```json
{
  "cours": {
    "total_cours_par_semaine": 6,
    "matieres_suivies": ["Algorithmique", "Base de Données"],
    "groupes_appartenance": ["Groupe A"]
  },
  "absences_enseignants": {
    "total": 2,
    "en_attente": 0,
    "validees": 2
  },
  "rattrapages": {
    "total": 1,
    "proposes": 0,
    "valides": 1,
    "a_venir": 1
  },
  "list_rattrapages_a_venir": [
    {
      "id": 5,
      "date": "2026-06-15",
      "matiere": "Algorithmique",
      "heure_debut": "14:00",
      "heure_fin": "16:00",
      "salle": "Salle B202"
    }
  ]
}
```

> **Note:** `matieres_suivies` lists subject names from the student's timetable. `groupes_appartenance` lists group names the student belongs to. `rattrapages.a_venir` counts upcoming validated rattrapages. `list_rattrapages_a_venir` items include an `id` field and use `date` instead of `date_proposee`.

---

## 11. Notifications (`/api/v1/notifications`)

> Notifications are created automatically by the system on key events. Users cannot create notifications manually via the API.

### `GET /notifications/`
**Description:** Returns all notifications for the currently authenticated user, ordered from newest to oldest. Includes both read and unread notifications. Used to display the full notification history in the UI.

**Access:** Any authenticated role (own notifications only).

**Query Params:** `page` (default: 1), `per_page` (default: 20)

**Response 200:** `PaginatedResponse[NotificationResponse]`

---

### `GET /notifications/non-lues`
**Description:** Returns only unread notifications (`est_lu: false`) for the authenticated user. Used to populate notification badges and alert panels in the UI.

**Access:** Any authenticated role.

**Query Params:** `page`, `per_page`

**Response 200:** `PaginatedResponse[NotificationResponse]`

---

### `GET /notifications/{id}`
**Description:** Fetches a single notification by ID. Only the owner of the notification can access it.

**Access:** Owner only.

**Response 200:** `NotificationResponse`  
**Error 404:** Notification not found or not owned by the requester.

---

### `PUT /notifications/{id}/lire`
**Description:** Marks a specific notification as read (`est_lu: true`). Typically called when a user clicks on a notification in the UI.

**Access:** Owner only.

**Response 200:** Updated `NotificationResponse` with `est_lu: true`  
**Error 404:** Not found.

---

### `PUT /notifications/tout-lire`
**Description:** Marks ALL unread notifications of the authenticated user as read in a single call. Useful for the "Mark all as read" button in notification panels.

**Access:** Any authenticated role.

**Response 200:**
```json
{
  "message": "Toutes les notifications ont été marquées comme lues",
  "updated_count": 7
}
```
`updated_count` is the number of notifications that were updated (previously unread).

---

### `DELETE /notifications/{id}`
**Description:** Permanently deletes a single notification. Cannot be undone.

**Access:** Owner only.

**Response 204:** No content.  
**Error 404:** Not found.

---

## 12. Virtual Assistant Chatbot (`/api/v1/chatbot`)

This module provides conversational AI capabilities to the application powered by the Groq API. It allows users to query database records, update their own profiles, declare/manage absences, and schedule or validate rattrapages through natural language conversation.

---

### `POST /chatbot/message`
**Description:** Sends a message in the conversation history to the AI Chatbot. The backend processes the message, uses the Groq LLM model to decide whether to call read-only query tools or action tools, runs authorization checks, and responds.
- If the AI wants to execute a read-only query (e.g., fetch timetable, find absences), the backend queries the DB and returns the synthesized answer in plain text.
- If the AI wants to perform a write action (e.g., declare absence, propose rattrapage, validate absence), the backend pre-validates the parameters and returns a confirmation payload instead of executing immediately.

**Access:** Any authenticated role.

**Request Body** (`application/json`):
```json
{
  "message": "Quels sont mes cours de lundi ?",
  "history": [
    {"role": "user", "content": "Bonjour"},
    {"role": "assistant", "content": "Bonjour ! Comment puis-je vous aider ?"}
  ]
}
```

**Response 200 (Plain text reply):**
```json
{
  "type": "text",
  "content": "Lundi, vous avez un cours de 'Algorithmique Avancée' de 08:00 à 10:00 dans la salle B202 avec le groupe A."
}
```

**Response 200 (Action confirmation prompt):**
```json
{
  "type": "confirmation",
  "content": "Confirmez-vous la déclaration d'absence pour le cours de **Algorithmique Avancée** le **2026-06-10** pour le motif suivant : *Rendez-vous médical* ?",
  "action_data": {
    "action": "declare_absence",
    "params": {
      "matiere_id": 2,
      "date_absence": "2026-06-10",
      "motif": "Rendez-vous médical"
    }
  }
}
```

---

### `POST /chatbot/confirm`
**Description:** Confirms and executes a previously validated chatbot action from the UI. After the user confirms the action prompt, the frontend sends this payload containing the exact action name and the pre-validated parameter list to write the changes to the database.

**Access:** Any authenticated role (permissions are checked against the specific action's rules).

**Request Body** (`application/json`):
```json
{
  "action": "declare_absence",
  "params": {
    "matiere_id": 2,
    "date_absence": "2026-06-10",
    "motif": "Rendez-vous médical",
    "justificatif_path": "uploads/justificatifs/medical.pdf"
  }
}
```

**Response 200 (Success):**
```json
{
  "success": true,
  "message": "✅ Votre absence pour le cours du 10/06/2026 a été déclarée avec succès et est en attente de validation par l'administration."
}
```

**Error 400:** `{"detail": "Error message detailing business rule violations or database issues"}`

---

### `POST /chatbot/upload`
**Description:** Uploads a supporting file (medical certificate, proof of justification) specifically during a chatbot conversation workflow. The file is saved inside the backend's static file system and the relative path is returned to be included inside the `confirm` action params.

**Access:** Any authenticated role.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file`: The supporting document file (PDF, PNG, JPG, JPEG. Max size: 5 MB).

**Response 200:**
```json
{
  "success": true,
  "filename": "certificat.pdf",
  "path": "uploads/justificatifs/2026-05-23_certificat.pdf"
}
```

**Error 400:** `{"detail": "File size exceeds limit / File format not allowed."}`

---

### Chatbot Actions Reference

The chatbot translates user intents into specific action confirmation flows. Below are the supported actions:

| Action | Allowed Roles | Description | Parameters |
|---|---|---|---|
| `update_my_profile` | **All** | Updates own first name, last name, email or password. | `nom` (str), `prenom` (str), `email` (str), `mot_de_passe` (str) |
| `declare_absence` | **Enseignant** | Declares a future absence. Enforces business rules (weekday, taught course). | `matiere_id` (int), `date_absence` (str), `motif` (str), `justificatif_path` (str, optional) |
| `propose_rattrapage` | **Enseignant** | Proposes a makeup session for a validated absence. Enforces conflict checks. | `absence_id` (int), `date_proposee` (str), `heure_debut` (str), `heure_fin` (str), `salle_id` (int) |
| `annuler_rattrapage` | **Enseignant** (own), **Admin** (any) | Cancels a proposed/validated makeup session. | `rattrapage_id` (int) |
| `valider_absence` | **Admin** | Validates a teacher's pending absence declaration. | `absence_id` (int) |
| `rejeter_absence` | **Admin** | Rejects a teacher's pending absence declaration. | `absence_id` (int) |
| `valider_rattrapage` | **Admin** | Validates a proposed makeup session. | `rattrapage_id` (int) |

---

### Chatbot Read-Only Query Tools Reference

When answering user questions directly, the chatbot utilizes the following tools to query database records:

| Tool | Parameters | Description |
|---|---|---|
| `get_my_absences` | `status` (str), `date_from` (str), `date_to` (str) | Lists relevant absences. Teachers see their own; Students see their teachers'; Admins see all. |
| `get_upcoming_rattrapages` | None | Lists upcoming/scheduled makeup sessions. |
| `get_timetable` | `target_type` (str), `search_query` (str, optional), `jour_semaine` (int, optional) | Fetches recurring weekly timetable for `self`, `enseignant`, `etudiant`, `groupe`, `salle`, or `matiere`. |
| `get_available_rooms` | `date` (str), `heure_debut` (str), `heure_fin` (str) | Finds free classrooms with no recurring course or makeup conflicts. |

---

## 13. Notification Events Reference

| Event | Recipient(s) | Title | Trigger |
|---|---|---|---|
| Teacher declares absence | All admins | Nouvelle absence déclarée | `POST /absences/` |
| Teacher modifies absence | All admins | Absence modifiée | `PUT /absences/{id}` |
| Teacher deletes absence | All admins | Absence annulée | `DELETE /absences/{id}` |
| Absence validated | Teacher | Absence validée | `PUT /absences/{id}/valider` |
| Absence rejected | Teacher | Absence rejetée | `PUT /absences/{id}/rejeter` |
| Teacher proposes rattrapage | All admins | Proposition de rattrapage | `POST /rattrapages/` |
| Rattrapage validated | Teacher + affected students | Rattrapage validé / Séance programmée | `PUT /rattrapages/{id}/valider` |
| Rattrapage cancelled | Teacher (+ students if was validated) | Rattrapage annulé | `PUT /rattrapages/{id}/annuler` |
| Room changed | Teacher (+ students if validated) | Salle de rattrapage modifiée | `PUT /rattrapages/{id}/affecter-salle` |
| Student added to group | That student | Affectation à un groupe | `POST /groupes/{id}/etudiants` |
| Student removed from group | That student | Retrait d'un groupe | `DELETE /groupes/{id}/etudiants/{id}` |
| New user created | That user | Bienvenue sur la plateforme | `POST /users/` |
| User activated | That user | Compte réactivé | `PUT /users/{id}/activer` |
| User deactivated | That user | Compte désactivé | `PUT /users/{id}/desactiver` |
| User deleted | That user | Compte supprimé | `DELETE /users/{id}` |

---

## 14. Data Schemas

### UtilisateurResponse
| Field | Type | Notes |
|---|---|---|
| `id` | int | Unique identifier |
| `nom` | string | Last name (max 100) |
| `prenom` | string | First name (max 100) |
| `email` | email | Unique (max 150) |
| `role` | RoleUtilisateur | See roles table |
| `actif` | bool | `false` = account suspended |
| `created_at` | datetime | ISO 8601 |
| `updated_at` | datetime | ISO 8601 |

### AbsenceResponse
| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `enseignant_id` | int | |
| `enseignant` | UtilisateurSimple | Nullable |
| `matiere_id` | int | |
| `matiere` | MatiereSimple | Nullable |
| `date_absence` | date | YYYY-MM-DD |
| `motif` | string | Declared reason |
| `justificatif` | string | File path, nullable |
| `statut` | StatutAbsence | `en_attente`/`valide`/`rejete` |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### RattrapageResponse
| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `absence_id` | int | |
| `absence` | AbsenceSimple | Nullable |
| `salle_id` | int | |
| `salle` | SalleSimple | Nullable |
| `date_proposee` | date | |
| `heure_debut` | time | HH:MM |
| `heure_fin` | time | HH:MM |
| `statut` | StatutRattrapage | `propose`/`valide`/`annule` |
| `valide_par` | int | Admin user ID, nullable |
| `validateur` | UtilisateurSimple | Admin who validated, nullable |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### EmploiDuTempsResponse
| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `groupe_id` | int | |
| `matiere_id` | int | |
| `salle_id` | int | |
| `jour_semaine` | int | 0=Lundi … 6=Dimanche |
| `heure_debut` | time | HH:MM |
| `heure_fin` | time | HH:MM |
| `rattrapage_id` | int | Nullable — set if this is a rattrapage slot |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### DepartementResponse
| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `nom` | string | Max 100 characters |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### GroupeResponse
| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `nom` | string | Max 100 characters |
| `departement_id` | int | |
| `departement` | DepartementSimple | Nullable |
| `etudiants` | List[UtilisateurSimple] | Nullable — enrolled students |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### MatiereResponse
| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `nom` | string | Max 100 characters |
| `departement_id` | int | |
| `enseignant_id` | int | Nullable |
| `departement` | DepartementSimple | Nullable |
| `enseignant` | UtilisateurSimple | Nullable |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### SalleResponse
| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `nom` | string | Max 50 characters |
| `capacite` | int | Positive integer |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### NotificationResponse
| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `titre` | string | Notification title |
| `message` | string | Full notification body |
| `est_lu` | bool | `false` = unread |
| `created_at` | datetime | |

### Enumerations
| Enum | Values |
|---|---|
| `RoleUtilisateur` | `admin_systeme`, `administration`, `enseignant`, `etudiant` |
| `StatutAbsence` | `en_attente`, `valide`, `rejete` |
| `StatutRattrapage` | `propose`, `valide`, `annule` |

---

## 15. HTTP Status Code Reference

| Code | Meaning | When |
|---|---|---|
| **200** | OK | Successful GET or PUT |
| **201** | Created | Successful POST |
| **204** | No Content | Successful DELETE |
| **400** | Bad Request | Business rule violation, invalid data |
| **401** | Unauthorized | Missing or invalid JWT token |
| **403** | Forbidden | Valid token but insufficient role/ownership |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | e.g. student already in another group |
| **422** | Unprocessable Entity | Pydantic schema validation failed |
