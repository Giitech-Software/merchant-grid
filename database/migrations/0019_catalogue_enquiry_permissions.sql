insert into permissions (code, description) values
  ('catalogue.enquiries.view', 'View public catalogue enquiries'),
  ('catalogue.enquiries.manage', 'Update public catalogue enquiry statuses')
on conflict (code) do update set description = excluded.description;
