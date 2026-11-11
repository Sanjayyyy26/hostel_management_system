-- Hostellers schema (corrected from the PostgreSQL dump)
-- Fixes:
-- 1. password columns are TEXT so bcrypt hashes fit (varchar(20) was too short)
-- 2. missing primary keys on junction / floor tables
-- 3. unique emails and registered_number
-- 4. phone stored as BIGINT as in the original dump

CREATE TABLE IF NOT EXISTS public.admin (
    key character varying(20) NOT NULL,
    password text NOT NULL,
    CONSTRAINT admin_pkey PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS public.caretaker (
    employee_id character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    phone_number bigint NOT NULL,
    email character varying(70) NOT NULL,
    password text NOT NULL,
    CONSTRAINT caretaker_pkey PRIMARY KEY (employee_id),
    CONSTRAINT caretaker_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.student (
    roll_number integer NOT NULL,
    registered_number integer NOT NULL,
    name character varying(100) NOT NULL,
    year integer NOT NULL,
    phone_number bigint NOT NULL,
    email character varying(70) NOT NULL,
    password text NOT NULL,
    gender character varying(10) NOT NULL,
    CONSTRAINT student_pkey PRIMARY KEY (roll_number),
    CONSTRAINT student_registered_number_key UNIQUE (registered_number),
    CONSTRAINT student_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.hostel (
    block_id character varying(10) NOT NULL,
    name character varying(255) NOT NULL,
    floors integer NOT NULL,
    seater integer NOT NULL,
    capacity integer NOT NULL,
    for_gender character varying(10) NOT NULL,
    CONSTRAINT hostel_pkey PRIMARY KEY (block_id)
);

CREATE TABLE IF NOT EXISTS public.hostel_year (
    student_year integer NOT NULL,
    block_id character varying(10) NOT NULL,
    CONSTRAINT hostel_year_pkey PRIMARY KEY (student_year, block_id),
    CONSTRAINT hostel_year_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.hostel(block_id)
);

CREATE TABLE IF NOT EXISTS public.hostel_floor_rooms (
    block_id character varying(10) NOT NULL,
    floor_number integer NOT NULL,
    number_of_rooms integer NOT NULL,
    CONSTRAINT hostel_floor_rooms_pkey PRIMARY KEY (block_id, floor_number),
    CONSTRAINT hostel_floor_rooms_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.hostel(block_id)
);

CREATE TABLE IF NOT EXISTS public.room (
    room_id character varying(20) NOT NULL,
    room_number integer NOT NULL,
    floor_number integer NOT NULL,
    block_id character varying(10) NOT NULL,
    CONSTRAINT room_pkey PRIMARY KEY (room_id),
    CONSTRAINT room_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.hostel(block_id)
);

CREATE TABLE IF NOT EXISTS public.caretaker_hostel (
    employee_id character varying(10) NOT NULL,
    block_id character varying(10) NOT NULL,
    CONSTRAINT caretaker_hostel_pkey PRIMARY KEY (employee_id, block_id),
    CONSTRAINT caretaker_hostel_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.caretaker(employee_id),
    CONSTRAINT caretaker_hostel_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.hostel(block_id)
);

CREATE TABLE IF NOT EXISTS public.student_hostel (
    roll_number integer NOT NULL,
    room_id character varying(20) NOT NULL,
    CONSTRAINT student_hostel_pkey PRIMARY KEY (roll_number, room_id),
    CONSTRAINT student_hostel_roll_number_fkey FOREIGN KEY (roll_number) REFERENCES public.student(roll_number),
    CONSTRAINT student_hostel_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(room_id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
    announcement_id character varying(20) NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    announcement text NOT NULL,
    CONSTRAINT announcements_pkey PRIMARY KEY (announcement_id)
);

CREATE TABLE IF NOT EXISTS public.hostel_announcements (
    block_id character varying(10) NOT NULL,
    announcement_id character varying(20) NOT NULL,
    CONSTRAINT hostel_announcements_pkey PRIMARY KEY (block_id, announcement_id),
    CONSTRAINT hostel_announcements_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.hostel(block_id),
    CONSTRAINT hostel_announcements_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(announcement_id)
);

CREATE TABLE IF NOT EXISTS public.complaints (
    complaint_id character varying(20) NOT NULL,
    roll_number integer NOT NULL,
    room_id character varying(20) NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    complaint text NOT NULL,
    status boolean,
    resolved_at timestamp with time zone,
    votes integer DEFAULT 0,
    CONSTRAINT complaints_pkey PRIMARY KEY (complaint_id),
    CONSTRAINT complaints_roll_number_fkey FOREIGN KEY (roll_number) REFERENCES public.student(roll_number),
    CONSTRAINT complaints_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(room_id)
);

CREATE TABLE IF NOT EXISTS public.hostel_complaints (
    block_id character varying(10) NOT NULL,
    complaint_id character varying(20) NOT NULL,
    CONSTRAINT hostel_complaints_pkey PRIMARY KEY (block_id, complaint_id),
    CONSTRAINT hostel_complaints_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.hostel(block_id),
    CONSTRAINT hostel_complaints_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaints(complaint_id)
);

CREATE TABLE IF NOT EXISTS public.complaint_votes (
    complaint_id character varying(20) NOT NULL,
    user_id character varying(50) NOT NULL,
    voted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT complaint_votes_pkey PRIMARY KEY (complaint_id, user_id),
    CONSTRAINT complaint_votes_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaints(complaint_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS public.maintenance (
    maintenance_id character varying(20) NOT NULL,
    roll_number integer NOT NULL,
    room_id character varying(20) NOT NULL,
    cleaning_status boolean,
    moping_status boolean,
    remarks text NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    CONSTRAINT maintenance_pkey PRIMARY KEY (maintenance_id),
    CONSTRAINT maintenance_roll_number_fkey FOREIGN KEY (roll_number) REFERENCES public.student(roll_number),
    CONSTRAINT maintenance_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(room_id)
);

CREATE TABLE IF NOT EXISTS public.hostel_maintenance (
    block_id character varying(10) NOT NULL,
    maintenance_id character varying(20) NOT NULL,
    CONSTRAINT hostel_maintenance_pkey PRIMARY KEY (block_id, maintenance_id),
    CONSTRAINT hostel_maintenance_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.hostel(block_id),
    CONSTRAINT hostel_maintenance_maintenance_id_fkey FOREIGN KEY (maintenance_id) REFERENCES public.maintenance(maintenance_id)
);

CREATE TABLE IF NOT EXISTS public.outing (
    outing_id character varying(20) NOT NULL,
    roll_number integer NOT NULL,
    from_date date NOT NULL,
    to_date date NOT NULL,
    purpose text NOT NULL,
    parent_ph_no bigint NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    status boolean,
    CONSTRAINT outing_pkey PRIMARY KEY (outing_id),
    CONSTRAINT outing_roll_number_fkey FOREIGN KEY (roll_number) REFERENCES public.student(roll_number)
);

CREATE TABLE IF NOT EXISTS public.hostel_outing (
    block_id character varying(10) NOT NULL,
    outing_id character varying(20) NOT NULL,
    CONSTRAINT hostel_outing_pkey PRIMARY KEY (block_id, outing_id),
    CONSTRAINT hostel_outing_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.hostel(block_id),
    CONSTRAINT hostel_outing_outing_id_fkey FOREIGN KEY (outing_id) REFERENCES public.outing(outing_id)
);

INSERT INTO public.admin (key, password) VALUES
    ('Admin_001', 'Admin@001'),
    ('Admin_002', 'Admin@002')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.caretaker (employee_id, name, phone_number, email, password) VALUES
    ('EMP_001', 'One Caretaker', 9096735463, 'emp001@gmail.com', 'OC@001'),
    ('EMP_002', 'Two Caretaker', 8897896709, 'emp002@gmail.com', 'TC@002'),
    ('EMP_003', 'Third Caretaker', 8790126379, 'emp003@gmail.com', 'TC@003')
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO public.student (roll_number, registered_number, name, year, phone_number, email, password, gender) VALUES
    (524001, 924002, 'Second Person', 3, 8900327640, 'secondperson@gmail.com', 'SP@001', 'Male'),
    (424001, 924001, 'First Person', 3, 9182347654, 'firstperson@gmail.com', 'Student@001', 'Male'),
    (424154, 924154, 'Santhosh', 3, 1234567890, 'santhosh@student.nitandhra.ac.in', 'Sonthosh@123', 'Male'),
    (325003, 925002, 'Third Person', 2, 9988765342, '325003@student.nitandhra.ac.in', 'TP@003', 'Female'),
    (425005, 925004, 'Fourth Person', 2, 7765983254, '425005@student.nitandhra.ac.in', 'FP@005', 'Male')
ON CONFLICT (roll_number) DO NOTHING;

INSERT INTO public.hostel (block_id, name, floors, seater, capacity, for_gender) VALUES
    ('VAM_B_01', 'Vamsadhara', 5, 4, 480, 'Male'),
    ('NAG_B_02', 'Nagavalli', 5, 2, 320, 'Male'),
    ('KRI_G_01', 'Krishna', 3, 4, 340, 'Female'),
    ('SAB_B_03', 'Sabari', 3, 2, 186, 'Male'),
    ('IND_B_03', 'Indhravathi', 3, 2, 186, 'Male')
ON CONFLICT (block_id) DO NOTHING;

INSERT INTO public.hostel_year (student_year, block_id) VALUES
    (1, 'VAM_B_01'),
    (2, 'NAG_B_02'),
    (1, 'KRI_G_01'),
    (2, 'KRI_G_01'),
    (3, 'SAB_B_03'),
    (3, 'IND_B_03')
ON CONFLICT (student_year, block_id) DO NOTHING;

INSERT INTO public.room (room_id, room_number, floor_number, block_id) VALUES
    ('SAB_B_03-101', 101, 1, 'SAB_B_03'),
    ('SAB_B_03-102', 102, 1, 'SAB_B_03'),
    ('IND_B_03-101', 101, 1, 'IND_B_03'),
    ('IND_B_03-102', 102, 1, 'IND_B_03'),
    ('NAG_B_02-101', 101, 1, 'NAG_B_02'),
    ('VAM_B_01-101', 101, 1, 'VAM_B_01'),
    ('KRI_G_01-101', 101, 1, 'KRI_G_01')
ON CONFLICT (room_id) DO NOTHING;

INSERT INTO public.caretaker_hostel (employee_id, block_id) VALUES
    ('EMP_001', 'VAM_B_01'),
    ('EMP_001', 'NAG_B_02'),
    ('EMP_002', 'SAB_B_03'),
    ('EMP_002', 'IND_B_03'),
    ('EMP_003', 'KRI_G_01')
ON CONFLICT (employee_id, block_id) DO NOTHING;

INSERT INTO public.student_hostel (roll_number, room_id) VALUES
    (424001, 'SAB_B_03-101'),
    (524001, 'IND_B_03-101'),
    (425005, 'NAG_B_02-101'),
    (325003, 'KRI_G_01-101')
ON CONFLICT (roll_number, room_id) DO NOTHING;
