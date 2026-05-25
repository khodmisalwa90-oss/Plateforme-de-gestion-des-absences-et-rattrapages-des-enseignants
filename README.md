# Plateforme de Gestion des Absences et Rattrapages des Enseignants

![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript)

## 📌 Description

**Plateforme de Gestion des Absences et Rattrapages des Enseignants** est une application web full-stack permettant de gérer efficacement les absences des enseignants, les séances de rattrapage, les emplois du temps, les notifications et les interactions entre les différents acteurs d’un établissement universitaire.

Le projet intègre également un **assistant virtuel IA** capable d’aider les utilisateurs à consulter des informations, déclarer une absence, proposer un rattrapage ou effectuer certaines actions selon leurs permissions.

---

## ✨ Fonctionnalités principales

- Authentification sécurisée avec JWT et gestion des sessions côté frontend.
- Gestion des utilisateurs selon plusieurs rôles.
- Déclaration, validation et suivi des absences des enseignants.
- Proposition, validation, annulation et consultation des séances de rattrapage.
- Gestion des départements, groupes, matières, salles et emplois du temps.
- Notifications automatiques selon les événements importants.
- Tableau de bord avec statistiques et suivi global.
- Upload de justificatifs pour les absences.
- Assistant virtuel IA connecté à la plateforme.
- Documentation API interactive via Swagger UI.

---

## 👥 Rôles utilisateurs

| Rôle | Code | Permissions principales |
|---|---|---|
| Administrateur Système | `admin_systeme` | Gestion complète de la plateforme, utilisateurs, départements et données globales |
| Administration | `administration` | Validation des absences/rattrapages, gestion pédagogique et administrative |
| Enseignant | `enseignant` | Déclaration des absences, proposition de rattrapages, consultation du planning |
| Étudiant | `etudiant` | Consultation de l’emploi du temps, des notifications et des rattrapages |

---

## 🧱 Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14, TypeScript, App Router |
| UI | Tailwind CSS, Shadcn UI |
| Backend | FastAPI, Python |
| Base de données | PostgreSQL |
| ORM | SQLAlchemy |
| Authentification | JWT, NextAuth.js |
| IA / Chatbot | Groq API, `llama-3.3-70b-versatile` |
| Documentation API | Swagger UI / OpenAPI |

---

## 📁 Structure du projet

```bash
Plateforme-de-gestion-des-absences-et-rattrapages-des-enseignants/
├── backend/
│   ├── app/
│   │   ├── api/                 # Endpoints REST
│   │   ├── core/                # Configuration, sécurité, base de données
│   │   ├── models/              # Modèles SQLAlchemy
│   │   ├── routers/             # Routeurs FastAPI
│   │   ├── schemas/             # Schémas Pydantic
│   │   ├── services/            # Logique métier
│   │   └── utils/               # Fonctions utilitaires
│   ├── uploads/                 # Fichiers uploadés
│   ├── requirements.txt         # Dépendances Python
│   └── run.bat                  # Script de lancement Windows
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Pages Next.js App Router
│   │   ├── components/          # Composants réutilisables
│   │   ├── lib/                 # API client, helpers, auth
│   │   └── types/               # Types TypeScript
│   └── package.json
│
├── API_DOCUMENTATION.md
└── README.md
```

---

## ⚙️ Prérequis

Avant de lancer le projet, installez :

- Python `3.10+`
- Node.js `18+`
- PostgreSQL `14+`
- Git
- npm ou pnpm

---

## 🚀 Installation et lancement

### 1. Cloner le projet

```bash
git clone https://github.com/khodmisalwa90-oss/Plateforme-de-gestion-des-absences-et-rattrapages-des-enseignants.git
cd Plateforme-de-gestion-des-absences-et-rattrapages-des-enseignants
```

---

### 2. Configuration du backend

```bash
cd backend
python -m venv venv
```

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

#### Installer les dépendances

```bash
pip install -r requirements.txt
```

#### Créer le fichier `.env`

Créez un fichier `.env` dans le dossier `backend/` :

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/gestion_absences

SECRET_KEY=change_this_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

UPLOAD_DIR=./uploads/justificatifs
MAX_UPLOAD_SIZE=5242880
ALLOWED_EXTENSIONS=.pdf,.jpg,.jpeg,.png

GROQ_API_KEY=your_groq_api_key
```

#### Lancer le backend

```bash
uvicorn main:app --reload
```

Ou sur Windows :

```bash
run.bat
```

Backend disponible sur :

```text
http://127.0.0.1:8000
```

Documentation Swagger :

```text
http://127.0.0.1:8000/docs
```

---

### 3. Configuration du frontend

```bash
cd ../frontend
npm install
```

#### Créer le fichier `.env.local`

Créez un fichier `.env.local` dans le dossier `frontend/` :

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change_this_nextauth_secret
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

#### Lancer le frontend

```bash
npm run dev
```

Frontend disponible sur :

```text
http://localhost:3000
```

---

## 🔐 Authentification

L’application utilise :

- JWT côté backend pour sécuriser les endpoints API.
- NextAuth.js côté frontend pour gérer les sessions utilisateur.
- Des permissions basées sur les rôles pour limiter l’accès aux fonctionnalités.

Exemple d’en-tête API :

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 📡 API REST

URL de base :

```text
http://127.0.0.1:8000/api/v1
```

| Module | Préfixe |
|---|---|
| Authentification | `/auth` |
| Utilisateurs | `/users` |
| Départements | `/departements` |
| Groupes | `/groupes` |
| Matières | `/matieres` |
| Salles | `/salles` |
| Emplois du temps | `/emplois-du-temps` |
| Absences | `/absences` |
| Rattrapages | `/rattrapages` |
| Dashboard | `/dashboard` |
| Notifications | `/notifications` |
| Chatbot IA | `/chatbot` |

Pour plus de détails, consultez :

```text
API_DOCUMENTATION.md
```

---

## 🗄️ Base de données

Le projet utilise **PostgreSQL** avec **SQLAlchemy ORM**.

### Tables principales

| Table | Description |
|---|---|
| `utilisateurs` | Comptes utilisateurs et rôles |
| `departements` | Départements universitaires |
| `groupes` | Groupes d’étudiants |
| `matieres` | Matières enseignées |
| `salles` | Salles de cours |
| `emplois_du_temps` | Créneaux horaires |
| `absences` | Absences déclarées |
| `rattrapages` | Séances de rattrapage |
| `etudiants_groupes` | Association étudiants/groupes |
| `notifications` | Notifications système |

---

## 🤖 Assistant virtuel IA

L’application contient un chatbot intégré utilisant l’API Groq avec le modèle :

```text
llama-3.3-70b-versatile
```

### Capacités

- Répondre aux questions sur les absences, rattrapages, emplois du temps et salles.
- Adapter les réponses selon le rôle connecté.
- Aider à déclarer une absence.
- Aider à proposer une séance de rattrapage.
- Confirmer une action avant exécution.
- Gérer l’upload de justificatifs.

### Endpoints chatbot

| Endpoint | Description |
|---|---|
| `POST /api/v1/chatbot/message` | Envoyer un message au chatbot |
| `POST /api/v1/chatbot/confirm` | Confirmer une action proposée |
| `POST /api/v1/chatbot/upload` | Uploader un justificatif |

---

## 🔔 Notifications automatiques

Le système génère des notifications lors de plusieurs événements :

- Nouvelle absence déclarée.
- Absence validée ou rejetée.
- Nouvelle proposition de rattrapage.
- Rattrapage validé, annulé ou rejeté.
- Affectation d’un étudiant à un groupe.
- Création, activation ou désactivation d’un compte.
- Changements importants liés à l’emploi du temps.

---

## 🧪 Tests rapides

### Tester le backend

```bash
curl http://127.0.0.1:8000/docs
```

### Tester le frontend

Ouvrir dans le navigateur :

```text
http://localhost:3000
```

---

## 🛠️ Commandes utiles

### Backend

```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

### Vérifier les dépendances frontend

```bash
npm audit
```

### Installer une nouvelle dépendance frontend

```bash
npm install package-name
```

---

## 📸 Captures d’écran

Vous pouvez ajouter ici des captures d’écran de l’application :

```md
![Dashboard](./docs/screenshots/dashboard.png)
![Absences](./docs/screenshots/absences.png)
![Chatbot](./docs/screenshots/chatbot.png)
```

Structure recommandée :

```bash
docs/
└── screenshots/
    ├── dashboard.png
    ├── absences.png
    └── chatbot.png
```

---

## 📌 Améliorations futures

- Dockerisation complète du frontend, backend et PostgreSQL.
- Ajout d’un fichier `docker-compose.yml`.
- Tests unitaires et tests d’intégration.
- CI/CD avec GitHub Actions.
- Export PDF des absences et rattrapages.
- Système de statistiques avancées.
- Amélioration de l’assistant IA avec plus de contexte métier.
- Déploiement cloud ou VPS.

---

## 🤝 Contribution

Les contributions sont les bienvenues.

```bash
git checkout -b feature/ma-fonctionnalite
git add .
git commit -m "feat: add new feature"
git push origin feature/ma-fonctionnalite
```

Ensuite, ouvrez une Pull Request.

---

## 👨‍💻 Auteur

Développé par **Salwa** dans le cadre d’un projet académique.

GitHub : [Salwa](https://github.com/khodmisalwa90-oss)

---

## 📄 Licence

Projet académique — Gestion des Absences et Rattrapages des Enseignants.

Tous droits réservés © 2026.
