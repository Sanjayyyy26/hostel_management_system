import os
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv()

DB_PARAMS = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': os.environ.get('DB_PORT', '5432'),
    'dbname': os.environ.get('DB_NAME'),
    'user': os.environ.get('DB_USER'),
    'password': os.environ.get('DB_PASSWORD'),
}


def query(sql, params=None):
    params = params or []
    conn = None
    try:
        conn = psycopg2.connect(**{k: v for k, v in DB_PARAMS.items() if v})
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params)
        if cur.description:
            rows = cur.fetchall()
            return {'rows': [dict(r) for r in rows]}
        else:
            conn.commit()
            return {'rows': []}
    finally:
        if conn:
            conn.close()
