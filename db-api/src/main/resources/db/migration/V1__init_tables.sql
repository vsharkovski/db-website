create table genders
(
    id   smallserial primary key,
    name varchar(64) not null unique
);

create table occupations
(
    id   smallserial primary key,
    name varchar(64) not null unique
);

create table citizenships
(
    id             smallserial primary key,
    name           varchar(64) not null unique,
    name_processed varchar(64) not null
);

create table people
(
    id                    bigserial primary key,
    wikidata_code         integer unique,
    name                  varchar(128),
    name_processed        varchar(128),
    birth                 integer,
    death                 integer,
    gender_id             smallint references genders (id),
    level_1_main_occ_id   smallint references occupations (id),
    level_2_main_occ_id   smallint references occupations (id),
    level_2_second_occ_id smallint references occupations (id),
    citizenship_1_b_id    smallint references citizenships (id),
    citizenship_2_b_id    smallint references citizenships (id),
    birth_longitude       real,
    birth_latitude        real,
    death_longitude       real,
    death_latitude        real
);