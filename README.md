# IEM Admission System — MERN POC

A full-stack **MERN** (MongoDB · Express · React · Node.js) proof-of-concept for an online
college admission portal, built for the SWE Laboratory project.

It has two roles:

- **Applicant** — register → verify (OTP) → fill application → upload documents → pay the
  fee → submit → track status → view the merit list and provisional offer letter.
- **Admission Officer (Admin)** — review applications, verify documents, move each one
  through the workflow **Submitted → Under Review → Selected / Rejected**, then
  **generate & publish the merit list**.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Database | **MongoDB** (via Mongoose) |
| Backend | **Express** + **Node.js** — REST API, JWT auth, bcrypt passwords, Multer file uploads |
| Frontend | **React** (Vite) — SPA that talks to the API |

```
iem-admission-mern/
├── server/        Express + MongoDB API
│   ├── models/    User, Application, Merit (Mongoose schemas)
│   ├── routes/    auth, applications, admin, merit
│   ├── middleware/ JWT auth + admin guard
│   ├── app.js     Express app
│   ├── server.js  starts the server + DB
│   └── seed.js    creates the admin + sample applicants
└── client/        React (Vite) app
    └── src/       App, Auth, Student, Admin, api, ui, styles
```

---

## Prerequisites

1. **Node.js 18+** — https://nodejs.org
2. **MongoDB** — choose ONE:
   - **MongoDB Atlas (recommended, free, no install):** create a free cluster at
     https://www.mongodb.com/atlas , add a database user, allow network access
     (0.0.0.0/0 for testing), and copy the connection string.
   - **Local MongoDB:** install MongoDB Community Server and make sure it is running
     (`mongodb://127.0.0.1:27017`).

---

## Run it locally (two terminals)

### 1) Backend (API)

```bash
cd server
npm install
cp .env.example .env        # then open .env and set MONGO_URI + JWT_SECRET
npm run seed                # creates admin + 3 sample applicants
npm run dev                 # starts API on http://localhost:5000
```

> On Windows use `copy .env.example .env`.

### 2) Frontend (React)

Open a **second terminal**:

```bash
cd client
npm install
npm run dev                 # starts the app on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### Demo logins

- **Admission Officer:** `admin@iem.edu` / `admin123`
- **Sample applicants** (already submitted, for the admin to review): `ananya@example.com`,
  `rohan@example.com`, `ishita@example.com` — all with password `demo123`.
- Or **register** a brand-new applicant (a demo OTP is shown on screen).

### Quick demo script (for the POC video)

1. Log in as **officer** → Dashboard shows live counts.
2. Open **Rohan Mehta** → mark documents **verified** → **Approve (Select)**.
3. Go to **Merit List → Generate & publish**.
4. Log out, register/log in as an **applicant**, complete application → upload → pay → submit.
5. Show **Status** tracking and, for a selected student, the **offer letter**.

---

## How it maps to the design (for the viva)

- **Models** (`server/models`) match the **class diagram**: `User` (Student/Admin),
  `Application` (with embedded `documents[]` and `payment`), `Merit`.
- **Status workflow** (`Submitted → Under Review → Selected/Rejected`) is enforced on the
  server (`routes/admin.js`), matching the **activity** and **sequence** diagrams.
- **Layers** (React client → Express API → MongoDB) match the **architecture diagram**.
- **Actors** Student and Admission Officer come from the **use-case diagram**; role-based
  access is enforced with JWT + an admin guard.

---

## Deploying (optional — a shareable live link)

This is a two-part app, so it is **not** a single static site:

- **Database:** MongoDB Atlas (free).
- **Backend (server/):** deploy to **Render** or **Railway** (free Node web service). Set the
  env vars `MONGO_URI`, `JWT_SECRET`, `PORT`. Start command: `npm start`.
- **Frontend (client/):** set `VITE_API_URL` to your deployed API URL, run `npm run build`,
  and deploy the `dist/` folder to **Netlify** or **Vercel**.

For the exam POC demo, running it locally on a laptop (the two terminals above) is enough —
that counts as the "deployed application on a laptop".

---

## Notes

- Uploaded documents are stored in `server/uploads/` and served at `/uploads`.
- Passwords are hashed with bcrypt; sessions use JWT (7-day expiry).
- `npm run seed` wipes and re-seeds the database — handy before a demo.
