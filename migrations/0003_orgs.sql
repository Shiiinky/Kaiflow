-- Multi-tenant SaaS: organizations, memberships, invites, platform role.

alter table "user" add column if not exists platform_role text not null default 'user';

create table if not exists organizations (
  id            text primary key,
  name          text not null,
  slug          text not null unique,
  plan          text not null default 'free',
  status        text not null default 'active',
  max_seats     integer not null default 1,
  billing_email text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists organization_members (
  id         text primary key,
  org_id     text not null references organizations (id) on delete cascade,
  user_id    text not null references "user" (id) on delete cascade,
  role       text not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists org_members_user_idx on organization_members (user_id);
create index if not exists org_members_org_idx on organization_members (org_id);

create table if not exists organization_invites (
  id         text primary key,
  org_id     text not null references organizations (id) on delete cascade,
  email      text not null,
  role       text not null default 'member',
  token      text not null unique,
  invited_by text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists org_invites_email_idx on organization_invites (lower(email));
create index if not exists org_invites_token_idx on organization_invites (token);

-- Optional org scope on flows (enterprise shared later; still user-owned for now)
alter table flows add column if not exists org_id text references organizations (id) on delete set null;
create index if not exists flows_org_id_idx on flows (org_id);
