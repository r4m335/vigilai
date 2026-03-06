# vigilaidiff --git a/README.md b/README.md
index cdc56db5638972886092d9e7811df806c3d16d60..4ec8f1152bd66490cff5a8c82dea073743ad263d 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,129 @@
-# vigilai
\ No newline at end of file
+# VigilAI
+
+VigilAI is a full-stack case management and investigation support platform for law-enforcement style workflows. It combines a Django REST API backend, a React frontend, and optional ML-assisted suspect prediction endpoints.
+
+## Project Structure
+
+- `backend/` — Django + Django REST Framework API (accounts, cases, dashboard, chat, notifications).
+- `vigilai_frontend/` — React application used by investigators/admins.
+- `backend/ml/` and `backend/cases/ml_utils.py` — ML utilities used by prediction endpoints.
+
+## Key Features
+
+- JWT-based authentication and profile management.
+- Case, evidence, witness, criminal, and criminal-record management APIs.
+- Admin dashboard APIs for managing users and case artifacts.
+- Chat rooms, messages, and notifications.
+- Criminal search/statistics and suspect prediction endpoints.
+- OpenAPI schema and Swagger UI documentation.
+
+## Tech Stack
+
+### Backend
+- Python, Django, Django REST Framework
+- SimpleJWT authentication
+- PostgreSQL (configured in settings)
+- drf-spectacular (API schema/docs)
+
+### Frontend
+- React (Create React App)
+- React Router
+- Axios
+- Bootstrap + React-Bootstrap
+
+## Prerequisites
+
+- Python 3.11+ (or a compatible Python 3.x version)
+- Node.js 18+ and npm
+- PostgreSQL 13+
+
+## Backend Setup
+
+1. Create and activate a virtual environment:
+   ```bash
+   cd backend
+   python -m venv .venv
+   source .venv/bin/activate
+   ```
+
+2. Install dependencies (if you do not yet have a lock/requirements file, install explicitly):
+   ```bash
+   pip install django djangorestframework djangorestframework-simplejwt drf-spectacular drf-spectacular-sidecar django-cors-headers psycopg2-binary pandas numpy joblib lightgbm python-dateutil
+   ```
+
+3. Configure PostgreSQL credentials in `backend/backend/settings.py`:
+   - `NAME`
+   - `USER`
+   - `PASSWORD`
+   - `HOST`
+   - `PORT`
+
+4. Run migrations:
+   ```bash
+   python manage.py migrate
+   ```
+
+5. (Optional) Seed default roles:
+   ```bash
+   python manage.py create_roles
+   ```
+
+6. Start backend server:
+   ```bash
+   python manage.py runserver
+   ```
+
+Backend runs at `http://localhost:8000` by default.
+
+## Frontend Setup
+
+1. Install dependencies:
+   ```bash
+   cd vigilai_frontend
+   npm install
+   ```
+
+2. Start the frontend:
+   ```bash
+   npm start
+   ```
+
+Frontend runs at `http://localhost:3000` and proxies API calls to `http://localhost:8000`.
+
+## API Documentation
+
+With the backend running:
+
+- OpenAPI schema: `http://localhost:8000/api/schema/`
+- Swagger UI: `http://localhost:8000/api/docs/`
+
+## Main API Route Groups
+
+All backend endpoints are mounted under `/api/`:
+
+- Auth & profile: `/api/register/`, `/api/login/`, `/api/token/`, `/api/profile/`, `/api/users/`
+- Cases domain: `/api/cases/`, `/api/evidences/`, `/api/witnesses/`, `/api/criminals/`, `/api/criminal-records/`
+- Predictions: `/api/predict/`, `/api/predict/multiple/`, `/api/cases/<id>/generate_prediction/`
+- Search/stats: `/api/criminals/search/`, `/api/criminals/stats/`
+- Dashboard/admin: `/api/admin-dashboard/...`
+- Chat/notifications: `/api/chat/rooms/`, `/api/chat/messages/`, `/api/notifications/`
+
+## Running Tests
+
+### Backend
+```bash
+cd backend
+python manage.py test
+```
+
+### Frontend
+```bash
+cd vigilai_frontend
+npm test
+```
+
+## Notes
+
+- CORS is configured for `http://localhost:3000` in backend settings.
+- Media uploads are served from `/media/` in development mode.
+- This repository currently lacks pinned backend dependency files (`requirements.txt`/`pyproject.toml`), so creating one is recommended for reproducibility.
