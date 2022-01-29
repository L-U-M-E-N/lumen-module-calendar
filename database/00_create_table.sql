-- Table: public.calendar

-- DROP TABLE IF EXISTS public.calendar;

CREATE TABLE IF NOT EXISTS public.calendar
(
    id character varying COLLATE pg_catalog."default" NOT NULL,
    title character varying COLLATE pg_catalog."default" NOT NULL,
    description character varying COLLATE pg_catalog."default" NOT NULL,
    start timestamp(4) with time zone NOT NULL,
    "end" timestamp(4) with time zone NOT NULL,
    origin character varying COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT calendar_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.calendar
    OWNER to lumen;