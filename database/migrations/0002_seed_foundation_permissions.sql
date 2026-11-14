insert into permissions (code, description) values
  ('business.view', 'View businesses and business configuration summaries'),
  ('business.configure', 'Configure business settings'),
  ('user.manage-access', 'Create users and manage memberships and permissions'),
  ('audit.view', 'View audit history')
on conflict (code) do update set description = excluded.description;
