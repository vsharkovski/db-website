alter table people
    drop column level_2_main_occ_id;

alter table people
    drop column level_2_second_occ_id;

alter table people
    add column level_3_main_occ_id smallint references occupations (id);

alter table occupations
    add column type smallint not null default 0;