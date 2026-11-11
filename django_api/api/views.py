import os
import re
import secrets
import bcrypt
from datetime import datetime
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from . import db

# In-memory sessions store (like server.js Map)
sessions = {}


def make_id(prefix):
    token = f"{prefix}_{int(datetime.utcnow().timestamp())}_{secrets.token_hex(4)}"
    return token[:20]


def today_parts():
    now = datetime.utcnow()
    return {'date': now.strftime('%Y-%m-%d'), 'time': now.strftime('%H:%M:%S')}


def digits(value):
    return re.sub(r"\D", "", str(value or ""))


def validate_password(password):
    if not password or len(password) < 8:
        return "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return "Password must contain at least one number"
    return None


async def passwords_match(plain, stored):
    # Not async in Django; keep signature compatible
    if isinstance(stored, str) and stored.startswith("$2"):
        return bcrypt.checkpw(plain.encode('utf-8'), stored.encode('utf-8'))
    return plain == stored


def public_user(role, row):
    if role == 'admin':
        return {'role': role, 'userId': row.get('key'), 'name': 'Administrator', 'key': row.get('key')}
    if role == 'caretaker':
        return {
            'role': role,
            'userId': row.get('employee_id'),
            'name': row.get('name'),
            'employee_id': row.get('employee_id'),
            'email': row.get('email'),
            'phone': row.get('phone_number')
        }
    return {
        'role': role,
        'userId': str(row.get('roll_number')) if row.get('roll_number') is not None else None,
        'name': row.get('name'),
        'roll': str(row.get('roll_number')) if row.get('roll_number') is not None else None,
        'registration': str(row.get('registered_number')) if row.get('registered_number') is not None else None,
        'email': row.get('email'),
        'phone': row.get('phone_number'),
        'year': row.get('year'),
        'gender': row.get('gender'),
        'room': str(row.get('room_number')) if row.get('room_number') else None,
        'block': row.get('hostel_name') or None,
        'block_id': row.get('block_id') or None,
        'room_id': row.get('room_id') or None,
    }


def require_auth(roles=None):
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            header = request.headers.get('Authorization', '')
            token = header[7:] if header.startswith('Bearer ') else ''
            session = sessions.get(token)
            if not session:
                return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)
            if roles and session.get('role') not in roles:
                return JsonResponse({'success': False, 'message': 'Access denied'}, status=403)
            request.session_data = session
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


# Helper to call db.query (synchronous)
def run_query(sql, params=None):
    return db.query(sql, params)


def json_post_required(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)
    try:
        data = request.body and request.body.decode('utf-8')
        import json
        return json.loads(data) if data else {}
    except Exception:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)


def health(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        run_query('SELECT 1')
        return JsonResponse({'success': True, 'database': 'connected'})
    except Exception as e:
        return JsonResponse({'success': False, 'database': 'not connected', 'message': str(e)}, status=500)


@csrf_exempt
def register(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    import json
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    roll = data.get('roll')
    registration = data.get('registration')
    password = data.get('password')
    year = data.get('year')
    gender = data.get('gender')
    if not all([name, email, phone, roll, registration, password, year, gender]):
        return JsonResponse({'success': False, 'message': 'All registration fields are required'}, status=400)
    if not re.match(r"^\S+@\S+\.\S+$", email):
        return JsonResponse({'success': False, 'message': 'Please enter a valid email address'}, status=400)
    password_error = validate_password(password)
    if password_error:
        return JsonResponse({'success': False, 'message': password_error}, status=400)
    try:
        roll_number = int(roll)
        registered_number = int(registration)
        student_year = int(year)
        phone_number = int(digits(phone))
    except Exception:
        return JsonResponse({'success': False, 'message': 'Roll, registration, and phone must be numbers'}, status=400)
    if student_year not in [1, 2, 3, 4]:
        return JsonResponse({'success': False, 'message': 'Year must be 1, 2, 3, or 4'}, status=400)
    if gender not in ['Male', 'Female']:
        return JsonResponse({'success': False, 'message': 'Gender must be Male or Female'}, status=400)
    try:
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        run_query(
            """
            INSERT INTO student
            (roll_number, registered_number, name, year, phone_number, email, password, gender)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            [roll_number, registered_number, name.strip(), student_year, phone_number, email.strip(), password_hash, gender]
        )
        return JsonResponse({'success': True, 'message': 'Registration successful'}, status=201)
    except Exception as e:
        # check duplicate error code if available from DB wrapper
        msg = str(e)
        if 'unique' in msg.lower() or 'duplicate' in msg.lower():
            return JsonResponse({'success': False, 'message': 'Student already exists'}, status=409)
        return JsonResponse({'success': False, 'message': 'Registration failed'}, status=500)


@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    import json
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    id_ = data.get('id')
    password = data.get('password')
    role = data.get('role')
    if not id_ or not password or not role:
        return JsonResponse({'success': False, 'message': 'id, password, and role are required'}, status=400)
    try:
        row = None
        if role == 'admin':
            result = run_query('SELECT key, password FROM admin WHERE key = $1', [id_])
            row = result['rows'][0] if result['rows'] else None
        elif role == 'caretaker':
            result = run_query(
                """
                SELECT employee_id, name, phone_number, email, password
                FROM caretaker
                WHERE employee_id = $1 OR email = $1
                """,
                [id_]
            )
            row = result['rows'][0] if result['rows'] else None
        elif role == 'student':
            result = run_query(
                """
                SELECT roll_number, password
                FROM student
                WHERE roll_number::text = $1 OR email = $1 OR registered_number::text = $1
                """,
                [id_]
            )
            if result['rows']:
                candidate = result['rows'][0]
                # fetch full student context
                student_res = run_query(
                    """
                    SELECT s.roll_number, s.registered_number, s.name, s.year, s.phone_number, s.email, s.gender,
                           sh.room_id, r.room_number, r.floor_number, r.block_id, h.name AS hostel_name, h.for_gender
                    FROM student s
                    LEFT JOIN student_hostel sh ON sh.roll_number = s.roll_number
                    LEFT JOIN room r ON r.room_id = sh.room_id
                    LEFT JOIN hostel h ON h.block_id = r.block_id
                    WHERE s.roll_number = $1
                    LIMIT 1
                    """,
                    [candidate['roll_number']]
                )
                row = student_res['rows'][0] if student_res['rows'] else None
                if row:
                    pwrow = run_query('SELECT password FROM student WHERE roll_number = $1', [row['roll_number']])
                    row['password'] = pwrow['rows'][0]['password'] if pwrow['rows'] else None
        else:
            return JsonResponse({'success': False, 'message': 'Invalid role'}, status=400)
        if not row:
            return JsonResponse({'success': False, 'message': 'User not found'}, status=401)
        ok = bcrypt.checkpw(password.encode('utf-8'), row.get('password').encode('utf-8')) if row.get('password') else False
        if not ok:
            return JsonResponse({'success': False, 'message': 'Invalid password'}, status=401)
        user = public_user(role, row)
        token = secrets.token_hex(24)
        sessions[token] = {**user, 'token': token, 'loginTime': int(datetime.utcnow().timestamp() * 1000)}
        return JsonResponse({'success': True, 'token': token, 'user': user})
    except Exception:
        return JsonResponse({'success': False, 'message': 'Login failed'}, status=500)


@require_auth()
def me(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        sess = request.session_data
        if sess.get('role') == 'student':
            student = run_query(
                """
                SELECT s.roll_number, s.registered_number, s.name, s.year, s.phone_number, s.email, s.gender,
                       sh.room_id, r.room_number, r.floor_number, r.block_id, h.name AS hostel_name, h.for_gender
                FROM student s
                LEFT JOIN student_hostel sh ON sh.roll_number = s.roll_number
                LEFT JOIN room r ON r.room_id = sh.room_id
                LEFT JOIN hostel h ON h.block_id = r.block_id
                WHERE s.roll_number = $1
                LIMIT 1
                """,
                [int(sess.get('userId'))]
            )
            student_row = student['rows'][0] if student['rows'] else None
            return JsonResponse({'success': True, 'user': public_user('student', student_row)})
        if sess.get('role') == 'caretaker':
            blocks = run_query(
                """
                SELECT h.block_id, h.name
                FROM caretaker_hostel ch
                JOIN hostel h ON h.block_id = ch.block_id
                WHERE ch.employee_id = $1
                """,
                [sess.get('userId')]
            )
            return JsonResponse({'success': True, 'user': {**sess, 'blocks': blocks['rows']}})
        return JsonResponse({'success': True, 'user': sess})
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to load profile'}, status=500)


@require_auth()
def hostels(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        result = run_query(
            """
            SELECT h.*, COALESCE(json_agg(hy.student_year) FILTER (WHERE hy.student_year IS NOT NULL), '[]') AS years
            FROM hostel h
            LEFT JOIN hostel_year hy ON hy.block_id = h.block_id
            GROUP BY h.block_id
            ORDER BY h.name
            """
        )
        return JsonResponse({'success': True, 'hostels': result['rows']})
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to load hostels'}, status=500)


@require_auth()
def announcements(request):
    if request.method == 'GET':
        try:
            result = run_query(
                """
                SELECT a.announcement_id, a.date, a.time, a.announcement,
                       COALESCE(json_agg(h.name) FILTER (WHERE h.name IS NOT NULL), '[]') AS hostels
                FROM announcements a
                LEFT JOIN hostel_announcements ha ON ha.announcement_id = a.announcement_id
                LEFT JOIN hostel h ON h.block_id = ha.block_id
                GROUP BY a.announcement_id
                ORDER BY a.date DESC, a.time DESC
                """
            )
            return JsonResponse({'success': True, 'announcements': result['rows']})
        except Exception:
            return JsonResponse({'success': False, 'message': 'Failed to load announcements'}, status=500)
    elif request.method == 'POST':
        # only admin/caretaker
        return announcements_post(request)
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
@require_auth(['admin', 'caretaker'])
def announcements_post(request):
    import json
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    text = str(data.get('announcement', '')).strip()
    block_ids = data.get('block_ids') if isinstance(data.get('block_ids'), list) else []
    if not text:
        return JsonResponse({'success': False, 'message': 'Announcement text is required'}, status=400)
    try:
        stamp = today_parts()
        announcement_id = make_id('ANN')
        run_query(
            """
            INSERT INTO announcements (announcement_id, date, time, announcement)
            VALUES ($1, $2, $3, $4)
            """,
            [announcement_id, stamp['date'], stamp['time'], text]
        )
        for block_id in block_ids:
            run_query(
                """
                INSERT INTO hostel_announcements (block_id, announcement_id) VALUES ($1, $2)
                """,
                [block_id, announcement_id]
            )
        return JsonResponse({'success': True, 'announcement_id': announcement_id}, status=201)
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to create announcement'}, status=500)


@require_auth()
def complaints(request):
    if request.method == 'GET':
        try:
            mine = request.GET.get('mine') == 'true'
            params = []
            where = ''
            sess = request.session_data
            if sess.get('role') == 'student' or mine:
                params.append(int(sess.get('userId')))
                where = 'WHERE c.roll_number = $1'
            elif sess.get('role') == 'caretaker':
                params.append(sess.get('userId'))
                where = "WHERE r.block_id IN (SELECT block_id FROM caretaker_hostel WHERE employee_id = $1)"
            result = run_query(
                f"""
                SELECT c.complaint_id, c.roll_number, c.room_id, c.date, c.time, c.complaint, c.status,
                       s.name AS student_name, r.room_number, r.block_id, h.name AS hostel_name
                FROM complaints c
                JOIN student s ON s.roll_number = c.roll_number
                JOIN room r ON r.room_id = c.room_id
                JOIN hostel h ON h.block_id = r.block_id
                {where}
                ORDER BY c.date DESC, c.time DESC
                """,
                params
            )
            return JsonResponse({'success': True, 'complaints': result['rows']})
        except Exception:
            return JsonResponse({'success': False, 'message': 'Failed to load complaints'}, status=500)
    elif request.method == 'POST':
        return complaints_post(request)
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
@require_auth(['student'])
def complaints_post(request):
    import json
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    title = str(data.get('title', '')).strip()
    body = str(data.get('body', '')).strip()
    if not title or not body:
        return JsonResponse({'success': False, 'message': 'Title and description are required'}, status=400)
    try:
        student = run_query(
            """
            SELECT s.roll_number, s.registered_number, s.name, s.year, s.phone_number, s.email, s.gender,
                   sh.room_id, r.room_number, r.floor_number, r.block_id, h.name AS hostel_name, h.for_gender
            FROM student s
            LEFT JOIN student_hostel sh ON sh.roll_number = s.roll_number
            LEFT JOIN room r ON r.room_id = sh.room_id
            LEFT JOIN hostel h ON h.block_id = r.block_id
            WHERE s.roll_number = $1
            LIMIT 1
            """,
            [int(request.session_data.get('userId'))]
        )
        student_row = student['rows'][0] if student['rows'] else None
        if not student_row or not student_row.get('room_id'):
            return JsonResponse({'success': False, 'message': 'No room is allocated yet'}, status=400)
        stamp = today_parts()
        complaint_id = make_id('CMP')
        run_query(
            """
            INSERT INTO complaints (complaint_id, roll_number, room_id, date, time, complaint, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            [complaint_id, student_row['roll_number'], student_row['room_id'], stamp['date'], stamp['time'], f"{title}\n\n{body}", False]
        )
        if student_row.get('block_id'):
            run_query(
                """
                INSERT INTO hostel_complaints (block_id, complaint_id) VALUES ($1, $2)
                """,
                [student_row['block_id'], complaint_id]
            )
        return JsonResponse({'success': True, 'complaint_id': complaint_id}, status=201)
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to submit complaint'}, status=500)


@csrf_exempt
@require_auth(['caretaker', 'admin'])
def complaints_patch(request):
    # For simplicity, use outings/complaints patch endpoints elsewhere via same path with id param
    return JsonResponse({'success': False, 'message': 'Not implemented here'}, status=501)


@require_auth()
def maintenance(request):
    if request.method == 'GET':
        try:
            params = []
            where = ''
            sess = request.session_data
            if sess.get('role') == 'student':
                params.append(int(sess.get('userId')))
                where = 'WHERE m.roll_number = $1'
            elif sess.get('role') == 'caretaker':
                params.append(sess.get('userId'))
                where = "WHERE r.block_id IN (SELECT block_id FROM caretaker_hostel WHERE employee_id = $1)"
            result = run_query(
                f"""
                SELECT m.*, s.name AS student_name, r.room_number, r.block_id, h.name AS hostel_name
                FROM maintenance m
                JOIN student s ON s.roll_number = m.roll_number
                JOIN room r ON r.room_id = m.room_id
                JOIN hostel h ON h.block_id = r.block_id
                {where}
                ORDER BY m.date DESC, m.time DESC
                """,
                params
            )
            return JsonResponse({'success': True, 'maintenance': result['rows']})
        except Exception:
            return JsonResponse({'success': False, 'message': 'Failed to load maintenance'}, status=500)
    elif request.method == 'POST':
        return maintenance_post(request)
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
@require_auth(['caretaker', 'admin', 'student'])
def maintenance_post(request):
    import json
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    try:
        roll_number = int(data.get('roll_number')) if data.get('roll_number') else int(request.session_data.get('userId'))
        if request.session_data.get('role') == 'student':
            roll_number = int(request.session_data.get('userId'))
        student = run_query(
            """
            SELECT s.roll_number, s.registered_number, s.name, s.year, s.phone_number, s.email, s.gender,
                   sh.room_id, r.room_number, r.floor_number, r.block_id, h.name AS hostel_name, h.for_gender
            FROM student s
            LEFT JOIN student_hostel sh ON sh.roll_number = s.roll_number
            LEFT JOIN room r ON r.room_id = sh.room_id
            LEFT JOIN hostel h ON h.block_id = r.block_id
            WHERE s.roll_number = $1
            LIMIT 1
            """,
            [roll_number]
        )
        student_row = student['rows'][0] if student['rows'] else None
        if not student_row or not student_row.get('room_id'):
            return JsonResponse({'success': False, 'message': 'Student has no allocated room'}, status=400)
        stamp = today_parts()
        maintenance_id = make_id('MNT')
        run_query(
            """
            INSERT INTO maintenance
            (maintenance_id, roll_number, room_id, cleaning_status, moping_status, remarks, date, time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            [maintenance_id, student_row['roll_number'], student_row['room_id'], bool(data.get('cleaning')), bool(data.get('moping')), str(data.get('remarks') or 'None').strip() or 'None', stamp['date'], stamp['time']]
        )
        if student_row.get('block_id'):
            run_query(
                """
                INSERT INTO hostel_maintenance (block_id, maintenance_id) VALUES ($1, $2)
                """,
                [student_row['block_id'], maintenance_id]
            )
        return JsonResponse({'success': True, 'maintenance_id': maintenance_id}, status=201)
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to add maintenance record'}, status=500)


@require_auth()
def outings(request):
    if request.method == 'GET':
        try:
            params = []
            where = ''
            sess = request.session_data
            if sess.get('role') == 'student':
                params.append(int(sess.get('userId')))
                where = 'WHERE o.roll_number = $1'
            elif sess.get('role') == 'caretaker':
                params.append(sess.get('userId'))
                where = "WHERE r.block_id IN (SELECT block_id FROM caretaker_hostel WHERE employee_id = $1)"
            result = run_query(
                f"""
                SELECT o.*, s.name AS student_name, sh.room_id, r.room_number, r.block_id, h.name AS hostel_name
                FROM outing o
                JOIN student s ON s.roll_number = o.roll_number
                LEFT JOIN student_hostel sh ON sh.roll_number = o.roll_number
                LEFT JOIN room r ON r.room_id = sh.room_id
                LEFT JOIN hostel h ON h.block_id = r.block_id
                {where}
                ORDER BY o.date DESC, o.time DESC
                """,
                params
            )
            return JsonResponse({'success': True, 'outings': result['rows']})
        except Exception:
            return JsonResponse({'success': False, 'message': 'Failed to load outing requests'}, status=500)
    elif request.method == 'POST':
        return outings_post(request)
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
@require_auth(['student'])
def outings_post(request):
    import json
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    destination = data.get('destination')
    from_date = data.get('from')
    to_date = data.get('to')
    phone = data.get('phone')
    reason = data.get('reason')
    if not destination or not from_date or not to_date or not phone or not reason:
        return JsonResponse({'success': False, 'message': 'All outing fields are required'}, status=400)
    parent_phone = digits(phone)
    if not parent_phone:
        return JsonResponse({'success': False, 'message': 'Parent phone must be a number'}, status=400)
    try:
        student = run_query(
            """
            SELECT s.roll_number, s.registered_number, s.name, s.year, s.phone_number, s.email, s.gender,
                   sh.room_id, r.room_number, r.floor_number, r.block_id, h.name AS hostel_name, h.for_gender
            FROM student s
            LEFT JOIN student_hostel sh ON sh.roll_number = s.roll_number
            LEFT JOIN room r ON r.room_id = sh.room_id
            LEFT JOIN hostel h ON h.block_id = r.block_id
            WHERE s.roll_number = $1
            LIMIT 1
            """,
            [int(request.session_data.get('userId'))]
        )
        stamp = today_parts()
        outing_id = make_id('OUT')
        purpose = f"Destination: {destination}\n{reason}"
        run_query(
            """
            INSERT INTO outing
            (outing_id, roll_number, from_date, to_date, purpose, parent_ph_no, date, time, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """,
            [outing_id, int(request.session_data.get('userId')), from_date, to_date, purpose, int(parent_phone), stamp['date'], stamp['time'], False]
        )
        student_row = student['rows'][0] if student['rows'] else None
        if student_row and student_row.get('block_id'):
            run_query(
                """
                INSERT INTO hostel_outing (block_id, outing_id) VALUES ($1, $2)
                """,
                [student_row['block_id'], outing_id]
            )
        return JsonResponse({'success': True, 'outing_id': outing_id}, status=201)
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to submit outing request'}, status=500)


@require_auth(['caretaker', 'admin'])
def outings_patch(request):
    return JsonResponse({'success': False, 'message': 'Not implemented'}, status=501)


@require_auth(['caretaker', 'admin'])
def students(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        params = []
        where = ''
        sess = request.session_data
        if sess.get('role') == 'caretaker':
            params.append(sess.get('userId'))
            where = "WHERE r.block_id IN (SELECT block_id FROM caretaker_hostel WHERE employee_id = $1)"
        result = run_query(
            f"""
            SELECT s.roll_number, s.registered_number, s.name, s.year, s.phone_number, s.email, s.gender,
                   r.room_number, r.block_id, h.name AS hostel_name
            FROM student s
            LEFT JOIN student_hostel sh ON sh.roll_number = s.roll_number
            LEFT JOIN room r ON r.room_id = sh.room_id
            LEFT JOIN hostel h ON h.block_id = r.block_id
            {where}
            ORDER BY s.roll_number
            """,
            params
        )
        return JsonResponse({'success': True, 'students': result['rows']})
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to load students'}, status=500)


@require_auth(['admin'])
def reports(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        result = run_query("""
            SELECT
              (SELECT count(*)::int FROM student) AS students,
              (SELECT count(*)::int FROM caretaker) AS caretakers,
              (SELECT count(*)::int FROM hostel) AS hostels,
              (SELECT count(*)::int FROM room) AS rooms,
              (SELECT count(*)::int FROM complaints) AS complaints,
              (SELECT count(*)::int FROM outing) AS outings,
              (SELECT count(*)::int FROM maintenance) AS maintenance
        """)
        return JsonResponse({'success': True, 'reports': result['rows'][0]})
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to load reports'}, status=500)
