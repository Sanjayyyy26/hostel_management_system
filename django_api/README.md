Django API migration of the original Express app.

Quick start:

1. Create a Python virtualenv and activate it:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install requirements:

```bash
pip install -r django_api/requirements.txt
```

3. Provide database connection env vars (Postgres):

- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD

You can copy `.env.example` to `.env` and edit it.

4. Run the Django development server:

```bash
cd "Software Engineering project"/django_api
python manage.py runserver 8000
```

API root: `http://localhost:8000/api/` — endpoints mirror the original `server.js`.
