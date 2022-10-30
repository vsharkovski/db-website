create table people
(
    id                  bigserial primary key,
    wikidata_code       varchar(32),
    birth               int,
    death               int,
    gender              varchar(32),
    name                varchar(128),
    level_1_main_occ    varchar(32),
    level_2_main_occ    varchar(32),
    level_2_second_occ  varchar(32),
    citizenship_1_b     varchar(32),
    citizenship_2_b     varchar(32),
    area_1_r_attachment varchar(32),
    area_2_r_attachment varchar(32),
    birth_longitude     real,
    birth_latitude      real,
    death_longitude     real,
    death_latitude      real
);