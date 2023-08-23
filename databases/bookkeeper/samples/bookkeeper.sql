--
-- PostgreSQL database dump
--

-- Dumped from database version 14.0
-- Dumped by pg_dump version 14.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.database_users DROP CONSTRAINT IF EXISTS database_users_user_id_foreign;
ALTER TABLE IF EXISTS ONLY public.database_users DROP CONSTRAINT IF EXISTS database_users_database_id_foreign;
DROP INDEX IF EXISTS public.database_users_database_id_user_id_index;
DROP INDEX IF EXISTS public.cached_requests_method_url_index;
DROP INDEX IF EXISTS public.cached_requests_created_index;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_name_unique;
ALTER TABLE IF EXISTS ONLY public.knex_migrations DROP CONSTRAINT IF EXISTS knex_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.knex_migrations_lock DROP CONSTRAINT IF EXISTS knex_migrations_lock_pkey;
ALTER TABLE IF EXISTS ONLY public.databases DROP CONSTRAINT IF EXISTS databases_pkey;
ALTER TABLE IF EXISTS ONLY public.databases DROP CONSTRAINT IF EXISTS databases_name_unique;
ALTER TABLE IF EXISTS ONLY public.database_users DROP CONSTRAINT IF EXISTS database_users_user_id_database_id_unique;
ALTER TABLE IF EXISTS ONLY public.cached_requests DROP CONSTRAINT IF EXISTS cached_requests_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.knex_migrations_lock ALTER COLUMN index DROP DEFAULT;
ALTER TABLE IF EXISTS public.knex_migrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.databases ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cached_requests ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.settings;
DROP SEQUENCE IF EXISTS public.knex_migrations_lock_index_seq;
DROP TABLE IF EXISTS public.knex_migrations_lock;
DROP SEQUENCE IF EXISTS public.knex_migrations_id_seq;
DROP TABLE IF EXISTS public.knex_migrations;
DROP SEQUENCE IF EXISTS public.databases_id_seq;
DROP TABLE IF EXISTS public.databases;
DROP TABLE IF EXISTS public.database_users;
DROP SEQUENCE IF EXISTS public.cached_requests_id_seq;
DROP TABLE IF EXISTS public.cached_requests;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cached_requests; Type: TABLE; Schema: public; Owner: bookkeeper
--

CREATE TABLE public.cached_requests (
    id integer NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    method character varying(255) NOT NULL,
    url character varying(255) NOT NULL,
    query jsonb DEFAULT '{}'::jsonb,
    headers jsonb DEFAULT '{}'::jsonb,
    status integer,
    result jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.cached_requests OWNER TO bookkeeper;

--
-- Name: cached_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: bookkeeper
--

CREATE SEQUENCE public.cached_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cached_requests_id_seq OWNER TO bookkeeper;

--
-- Name: cached_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookkeeper
--

ALTER SEQUENCE public.cached_requests_id_seq OWNED BY public.cached_requests.id;


--
-- Name: database_users; Type: TABLE; Schema: public; Owner: bookkeeper
--

CREATE TABLE public.database_users (
    user_id integer NOT NULL,
    database_id integer NOT NULL,
    config jsonb NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.database_users OWNER TO bookkeeper;

--
-- Name: databases; Type: TABLE; Schema: public; Owner: bookkeeper
--

CREATE TABLE public.databases (
    id integer NOT NULL,
    name character varying(32) NOT NULL,
    host character varying(64) NOT NULL,
    port integer NOT NULL,
    "user" character varying(32) NOT NULL,
    password character varying(256) NOT NULL,
    config jsonb NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.databases OWNER TO bookkeeper;

--
-- Name: databases_id_seq; Type: SEQUENCE; Schema: public; Owner: bookkeeper
--

CREATE SEQUENCE public.databases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.databases_id_seq OWNER TO bookkeeper;

--
-- Name: databases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookkeeper
--

ALTER SEQUENCE public.databases_id_seq OWNED BY public.databases.id;


--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: bookkeeper
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO bookkeeper;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: bookkeeper
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_id_seq OWNER TO bookkeeper;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookkeeper
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: bookkeeper
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO bookkeeper;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: bookkeeper
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_lock_index_seq OWNER TO bookkeeper;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookkeeper
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: bookkeeper
--

CREATE TABLE public.settings (
    name character varying(64) NOT NULL,
    value jsonb
);


ALTER TABLE public.settings OWNER TO bookkeeper;

--
-- Name: users; Type: TABLE; Schema: public; Owner: bookkeeper
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(32) NOT NULL,
    password character varying(256) NOT NULL,
    name character varying(64) DEFAULT NULL::character varying,
    config jsonb NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    disabled boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO bookkeeper;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: bookkeeper
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO bookkeeper;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookkeeper
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: cached_requests id; Type: DEFAULT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.cached_requests ALTER COLUMN id SET DEFAULT nextval('public.cached_requests_id_seq'::regclass);


--
-- Name: databases id; Type: DEFAULT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.databases ALTER COLUMN id SET DEFAULT nextval('public.databases_id_seq'::regclass);


--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: cached_requests; Type: TABLE DATA; Schema: public; Owner: bookkeeper
--

COPY public.cached_requests (id, created, method, url, query, headers, status, result) FROM stdin;
\.


--
-- Data for Name: database_users; Type: TABLE DATA; Schema: public; Owner: bookkeeper
--

COPY public.database_users (user_id, database_id, config, created) FROM stdin;
\.


--
-- Data for Name: databases; Type: TABLE DATA; Schema: public; Owner: bookkeeper
--

COPY public.databases (id, name, host, port, "user", password, config, created) FROM stdin;
\.


--
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: bookkeeper
--

COPY public.knex_migrations (id, name, batch, migration_time) FROM stdin;
1	00001_init.js	1	2023-08-23 16:13:49.46+00
2	00002_disable-user.js	1	2023-08-23 16:13:49.464+00
3	00003_request_cache.js	1	2023-08-23 16:13:49.478+00
\.


--
-- Data for Name: knex_migrations_lock; Type: TABLE DATA; Schema: public; Owner: bookkeeper
--

COPY public.knex_migrations_lock (index, is_locked) FROM stdin;
1	0
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: bookkeeper
--

COPY public.settings (name, value) FROM stdin;
siteUrl	"http://localhost:7205"
currency	"EUR"
canRegister	true
isEmailConfirmationRequired	false
uuid	"da4e7b0d-509b-8498-0b18-db5726e27b4a"
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: bookkeeper
--

COPY public.users (id, email, password, name, config, created, disabled) FROM stdin;
7	root@localhost	$2b$13$57sG6gHqHRgieppoiJeMteVmYcxMaZvX3VGJKIhx7sj3pdwPBXsQS	System Admin	{"admin": true, "superuser": true}	2023-08-23 16:59:50.034745+00	f
8	user@localhost	$2b$13$.u0aSGyIYoCYTHwkyZD2h.5xg3QKFqTfUHR8Zqh13qBfXZBMnBOZC	Sample User	{"admin": false, "superuser": false}	2023-08-23 17:00:11.948524+00	f
\.


--
-- Name: cached_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bookkeeper
--

SELECT pg_catalog.setval('public.cached_requests_id_seq', 1, false);


--
-- Name: databases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bookkeeper
--

SELECT pg_catalog.setval('public.databases_id_seq', 1, false);


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bookkeeper
--

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 3, true);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: bookkeeper
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bookkeeper
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: cached_requests cached_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.cached_requests
    ADD CONSTRAINT cached_requests_pkey PRIMARY KEY (id);


--
-- Name: database_users database_users_user_id_database_id_unique; Type: CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.database_users
    ADD CONSTRAINT database_users_user_id_database_id_unique UNIQUE (user_id, database_id);


--
-- Name: databases databases_name_unique; Type: CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.databases
    ADD CONSTRAINT databases_name_unique UNIQUE (name);


--
-- Name: databases databases_pkey; Type: CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.databases
    ADD CONSTRAINT databases_pkey PRIMARY KEY (id);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: settings settings_name_unique; Type: CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_name_unique UNIQUE (name);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cached_requests_created_index; Type: INDEX; Schema: public; Owner: bookkeeper
--

CREATE INDEX cached_requests_created_index ON public.cached_requests USING btree (created);


--
-- Name: cached_requests_method_url_index; Type: INDEX; Schema: public; Owner: bookkeeper
--

CREATE INDEX cached_requests_method_url_index ON public.cached_requests USING btree (method, url);


--
-- Name: database_users_database_id_user_id_index; Type: INDEX; Schema: public; Owner: bookkeeper
--

CREATE INDEX database_users_database_id_user_id_index ON public.database_users USING btree (database_id, user_id);


--
-- Name: database_users database_users_database_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.database_users
    ADD CONSTRAINT database_users_database_id_foreign FOREIGN KEY (database_id) REFERENCES public.databases(id);


--
-- Name: database_users database_users_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bookkeeper
--

ALTER TABLE ONLY public.database_users
    ADD CONSTRAINT database_users_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

