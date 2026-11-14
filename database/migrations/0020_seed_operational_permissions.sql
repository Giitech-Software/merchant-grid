insert into permissions (code, description) values
  ('product.view', 'View catalogue products and categories'),
  ('product.create', 'Create catalogue products and variants'),
  ('inventory.post', 'Post inventory movements'),
  ('sales.view', 'View sales records'),
  ('sales.create', 'Create sales records'),
  ('sales.post', 'Post sales invoices'),
  ('accounting.post', 'Post accounting journals'),
  ('accounting.configure', 'Configure accounting mappings'),
  ('purchasing.view', 'View purchasing records'),
  ('purchasing.create', 'Create purchase orders'),
  ('purchasing.approve', 'Approve purchase orders'),
  ('expense.view', 'View expenses'),
  ('expense.create', 'Create expenses'),
  ('expense.approve', 'Approve expenses'),
  ('expense.pay', 'Pay approved expenses'),
  ('catalogue.publish', 'Publish public catalogue products')
on conflict (code) do update set description = excluded.description;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.name = 'Administrator' and r.is_system = true
on conflict do nothing;
