create table if not exists flows (
  id         text primary key,
  user_id    text not null,
  nom        text not null,
  usine      text not null default '',
  atelier    text not null default '',
  doc        jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists flows_user_id_idx on flows (user_id);
