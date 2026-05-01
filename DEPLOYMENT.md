# PAL Institute — Deployment Guide

This project is split into two deployable parts:

| Part      | Stack                  | Recommended host          |
| --------- | ---------------------- | ------------------------- |
| Frontend  | React (CRA + Tailwind) | **Vercel**                |
| Backend   | Python FastAPI         | **Render** *or* PythonAnywhere |
| Database  | MongoDB                | **MongoDB Atlas**         |

No code change is needed to switch hosts — everything is driven by
environment variables.

---

## Project structure

```
/app
├── backend/                    # Python FastAPI backend
│   ├── server.py               # Main app (ASGI for uvicorn, importable for WSGI)
│   ├── wsgi.py                 # WSGI entry point (PythonAnywhere)
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Local environment (NOT committed)
│   └── .env.example            # Template — copy to .env and fill in
│
├── frontend/                   # React frontend (CRA)
│   ├── src/                    # Source
│   ├── public/
│   ├── package.json
│   ├── vercel.json             # Vercel build + SPA rewrite config
│   ├── .env                    # Local environment (NOT committed)
│   └── .env.example            # Template — copy to .env and fill in
│
└── DEPLOYMENT.md               # This file
```

---

## 1. MongoDB Atlas (database)

1. Create a free cluster at https://cloud.mongodb.com.
2. **Network Access** → add `0.0.0.0/0` (or PythonAnywhere outbound IP).
   PythonAnywhere outbound IPs: see https://www.pythonanywhere.com/whitelist/
3. **Database Access** → create a user with read/write permissions.
4. Click **Connect → Drivers → Python** and copy the connection string.
   Replace `<password>` with the user's password.
5. Append your DB name to the URI, e.g. `…mongodb.net/pal_institute?retryWrites=true&w=majority`.

The provided connection string in `.env.example` already points to a
test cluster:

```
MONGO_URI=mongodb+srv://test:test@cluster0.w2rlirg.mongodb.net/pal_institute?retryWrites=true&w=majority
```

---

## 2. Backend — Render (recommended)

The repo ships with a `render.yaml` Blueprint at the project root.

### One-click setup
1. Push the repo to GitHub.
2. https://dashboard.render.com → **New +** → **Blueprint** → select your repo.
3. Render reads `render.yaml`, creates a web service, and prompts for the
   secret env vars (`MONGO_URI`, `ADMIN_PASSWORD`, `CORS_ORIGINS`).
4. Click **Apply** → first build runs `pip install -r backend/requirements.txt`
   → start command boots `gunicorn app:app -k uvicorn.workers.UvicornWorker`.
5. Visit `https://<your-service>.onrender.com/api/health` — expect
   `{"status":"ok","db":"connected"}`.

### Manual setup (if you skip the Blueprint)

Render dashboard → **New + → Web Service** → connect repo, then set:

| Field                | Value                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| **Root Directory**   | `backend`                                                              |
| **Runtime**          | Python 3                                                               |
| **Build Command**    | `pip install -r requirements.txt`                                      |
| **Start Command**    | `gunicorn app:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 2 --timeout 90` |
| **Health Check Path**| `/api/health`                                                          |

> **Why both `app:app` and `server:app` work** — `backend/app.py` is a tiny
> shim that re-exports `app` from `server.py`, so either name is valid in
> the start command.

Add these env vars in the Render dashboard (Settings → Environment):

| Variable          | Value                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `MONGO_URI`       | `mongodb+srv://test:test@cluster0.w2rlirg.mongodb.net/pal_institute?retryWrites=true&w=majority`       |
| `DB_NAME`         | `pal_institute`                                                                                        |
| `ADMIN_PASSWORD`  | (your strong password)                                                                                 |
| `JWT_SECRET`      | a long random string (`python -c "import secrets;print(secrets.token_urlsafe(48))"`)                   |
| `CORS_ORIGINS`    | `https://<your-vercel-app>.vercel.app` (comma-separated for multiple)                                  |

### Render notes

- **Free tier** spins down after 15 min idle → first request after sleep takes ~30 s.
- **MongoDB Atlas** must allow Render's outbound IPs. The simplest setup is
  `0.0.0.0/0` in Atlas → Network Access (acceptable when DB user has a strong password).
- Logs are visible in real time in Render dashboard → **Logs** tab.

---

## 2b. Backend — PythonAnywhere (alternative)

### a) Push the code to PythonAnywhere

```bash
# In a PythonAnywhere Bash console
git clone <your-repo-url> ~/pal-institute
cd ~/pal-institute/backend

# Create a virtualenv (Python 3.10+ recommended)
mkvirtualenv pal-env --python=python3.10
pip install -r requirements.txt
```

### b) Create `.env` in the backend folder

```bash
cp .env.example .env
nano .env
```

Set:
```
MONGO_URI=mongodb+srv://test:test@cluster0.w2rlirg.mongodb.net/pal_institute?retryWrites=true&w=majority
DB_NAME=pal_institute
CORS_ORIGINS=https://<your-vercel-app>.vercel.app
ADMIN_PASSWORD=<choose-a-strong-password>
JWT_SECRET=<paste-a-long-random-string>
```

> Tip: generate a JWT secret with
> `python -c "import secrets;print(secrets.token_urlsafe(48))"`

### c) Configure the PythonAnywhere Web app

1. **Web** tab → **Add a new web app** → **Manual configuration** → Python 3.10.
2. **Source code:** `/home/<username>/pal-institute/backend`
3. **Working directory:** `/home/<username>/pal-institute/backend`
4. **Virtualenv:** `/home/<username>/.virtualenvs/pal-env`
5. Edit the **WSGI configuration file** (link near top of the Web tab).
   Replace its contents with:

```python
import sys
import os
from pathlib import Path

project_home = '/home/<username>/pal-institute/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Load env vars
from dotenv import load_dotenv
load_dotenv(Path(project_home) / '.env')

from wsgi import application
```

6. Click **Reload** at the top of the Web tab.
7. Visit `https://<username>.pythonanywhere.com/api/health` — you should see
   `{"status":"ok","db":"connected"}`.

### d) Free-tier note

The free PythonAnywhere tier only allows outbound HTTPS to whitelisted
domains. MongoDB Atlas (`*.mongodb.net`) **is whitelisted**, so this works
on free accounts. If you ever connect to a non-whitelisted host you must
upgrade to a paid plan or whitelist the host.

---

## 3. Frontend — Vercel

### a) Connect the repo

1. https://vercel.com → **Add New → Project** → import the GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Vercel auto-detects Create React App. The committed `vercel.json`
   handles the SPA rewrite (so `/admin`, `/terms-and-conditions`, etc.
   all resolve to `index.html`).

### b) Environment variables (Vercel dashboard → Settings → Environment Variables)

| Name                     | Value                                                     |
| ------------------------ | --------------------------------------------------------- |
| `REACT_APP_BACKEND_URL`  | `https://<your-username>.pythonanywhere.com`              |

Make sure there is **no trailing slash**. The frontend appends `/api/...`
automatically.

### c) Deploy

Click **Deploy**. After ~2 minutes the site is live at
`https://<your-project>.vercel.app`.

### d) Update CORS on the backend

Once the Vercel URL is known, edit `backend/.env` on PythonAnywhere:

```
CORS_ORIGINS=https://<your-project>.vercel.app
```

Reload the PythonAnywhere web app.

---

## 4. Local development

```bash
# Backend
cd backend
cp .env.example .env       # adjust MONGO_URI to local mongo if you like
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend
cd ../frontend
cp .env.example .env       # set REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start
```

---

## 5. Environment variable reference

### Backend (`backend/.env`)

| Variable          | Required | Default      | Notes                                 |
| ----------------- | -------- | ------------ | ------------------------------------- |
| `MONGO_URI`       | yes\*    | —            | Atlas / standalone connection string  |
| `MONGO_URL`       | yes\*    | —            | Legacy alias; used if `MONGO_URI` unset |
| `DB_NAME`         | no       | `pal_institute` | Mongo database name                |
| `CORS_ORIGINS`    | no       | `*`          | Comma-separated list of allowed origins |
| `ADMIN_PASSWORD`  | no       | `admin123`   | Password for `/admin`                 |
| `JWT_SECRET`      | no       | dev fallback | **Set in production**                 |

\*One of `MONGO_URI` / `MONGO_URL` must be set.

### Frontend (`frontend/.env`)

| Variable                | Required | Notes                                    |
| ----------------------- | -------- | ---------------------------------------- |
| `REACT_APP_BACKEND_URL` | yes      | Public URL of the backend, no trailing `/` |

---

## 6. Verify after deployment

- Open `https://<vercel-app>.vercel.app` → site loads, hero animates.
- Submit a demo booking — check that you get the success modal.
- Sign in to `/admin` with `ADMIN_PASSWORD` → confirm the booking shows up.
- Hit `https://<pythonanywhere>.pythonanywhere.com/api/health` →
  `{"status":"ok","db":"connected"}`.
- Open browser dev tools → Network tab → confirm requests go to your
  PythonAnywhere domain (not localhost) and return 200.

---

## 7. Troubleshooting

| Symptom                                       | Fix                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `CORS` error in browser console               | Set `CORS_ORIGINS` to your exact Vercel URL on the backend, reload PythonAnywhere.   |
| `db: error` on `/api/health`                  | MongoDB Atlas: whitelist PythonAnywhere IPs and verify user/password in `MONGO_URI`. |
| 500 on every API call                         | Check `Server Error log` in PythonAnywhere Web tab.                                  |
| Routes like `/admin` 404 on Vercel            | Make sure `frontend/vercel.json` is committed (handles SPA rewrites).                |
| Login works but every admin call returns 401  | Probably mis-set `JWT_SECRET` between login and verify, or token expired in browser. |
