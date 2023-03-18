create table export_jobs
(
    id            bigserial primary key not null,
    creation_time timestamp             not null,
    update_time   timestamp             not null,
    status        varchar(32)           not null,
    search_term   varchar               not null
)