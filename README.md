I'll update the README.md to include the MIT License information:

```markdown
# VigilAI

VigilAI is a full-stack case management and investigation support platform for law-enforcement style workflows. It combines a Django REST API backend, a React frontend, and optional ML-assisted suspect prediction endpoints.

## Project Structure

- `backend/` — Django + Django REST Framework API (accounts, cases, dashboard, chat, notifications).
- `vigilai_frontend/` — React application used by investigators/admins.
- `backend/ml/` and `backend/cases/ml_utils.py` — ML utilities used by prediction endpoints.

## Key Features

- JWT-based authentication and profile management.
- Case, evidence, witness, criminal, and criminal-record management APIs.
- Admin dashboard APIs for managing users and case artifacts.
- Chat rooms, messages, and notifications.
- Criminal search/statistics and suspect prediction endpoints.
- OpenAPI schema and Swagger UI documentation.

## Tech Stack

### Backend
- Python, Django, Django REST Framework
- SimpleJWT authentication
- PostgreSQL (configured in settings)
- drf-spectacular (API schema/docs)
- ML libraries: pandas, numpy, joblib, lightgbm

### Frontend
- React (Create React App)
- React Router
- Axios
- Bootstrap + React-Bootstrap

## Prerequisites

- Python 3.11+ (or a compatible Python 3.x version)
- Node.js 18+ and npm
- PostgreSQL 13+

## Backend Setup

1. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies using pip:
   ```bash
   pip install -r requirements.txt
   ```
   
   Or install in editable mode using the pyproject.toml:
   ```bash
   pip install -e .
   ```

3. Configure PostgreSQL credentials in `backend/backend/settings.py`:
   - `NAME`: Your database name
   - `USER`: Your database user
   - `PASSWORD`: Your database password
   - `HOST`: Your database host (typically localhost)
   - `PORT`: Your database port (typically 5432)

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. (Optional) Seed default roles:
   ```bash
   python manage.py create_roles
   ```

6. Start backend server:
   ```bash
   python manage.py runserver
   ```

Backend runs at `http://localhost:8000` by default.

## Frontend Setup

1. Install dependencies:
   ```bash
   cd vigilai_frontend
   npm install
   ```

2. Start the frontend:
   ```bash
   npm start
   ```

Frontend runs at `http://localhost:3000` and proxies API calls to `http://localhost:8000`.

## API Documentation

With the backend running:

- OpenAPI schema: `http://localhost:8000/api/schema/`
- Swagger UI: `http://localhost:8000/api/docs/`

## Main API Route Groups

All backend endpoints are mounted under `/api/`:

- **Auth & profile**: `/api/register/`, `/api/login/`, `/api/token/`, `/api/profile/`, `/api/users/`
- **Cases domain**: `/api/cases/`, `/api/evidences/`, `/api/witnesses/`, `/api/criminals/`, `/api/criminal-records/`
- **Predictions**: `/api/predict/`, `/api/predict/multiple/`, `/api/cases/<id>/generate_prediction/`
- **Search/stats**: `/api/criminals/search/`, `/api/criminals/stats/`
- **Dashboard/admin**: `/api/admin-dashboard/...`
- **Chat/notifications**: `/api/chat/rooms/`, `/api/chat/messages/`, `/api/notifications/`

## Running Tests

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd vigilai_frontend
npm test
```

## Backend Dependencies

The backend uses the following main dependencies (as specified in `pyproject.toml` and `requirements.txt`):

- Django >=5.2, <6.0
- djangorestframework >=3.15, <4.0
- djangorestframework-simplejwt >=5.3, <6.0
- drf-spectacular >=0.27, <1.0
- drf-spectacular-sidecar >=2024.1, <2027.0
- django-cors-headers >=4.4, <5.0
- psycopg2-binary >=2.9, <3.0
- pandas >=2.2, <3.0
- numpy >=1.26, <3.0
- joblib >=1.4, <2.0
- lightgbm >=4.5, <5.0
- python-dateutil >=2.9, <3.0

## License

MIT License

Copyright (c) 2026 MUHAMMED RAMEES M A

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Notes

- CORS is configured for `http://localhost:3000` in backend settings.
- Media uploads are served from `/media/` in development mode.

## Contributors

- MUHAMMED RAMEES M A (@r4m335)



