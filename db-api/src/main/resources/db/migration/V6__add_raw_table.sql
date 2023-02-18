create table raw_csv_data
(
    id        bigserial primary key,
    person_id bigint references people (id) unique not null,
    data      varchar unique                       not null
);
