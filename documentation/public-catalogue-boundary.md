# Public catalogue boundary

Public catalogue queries read only `public_catalogue_products` where `status = 'published'`. The projection is owner-approved and contains no buying cost, supplier information, employee data, customer data, private accounting data, or unrestricted stock.

Stock is exposed only according to `stock_display_mode`:

- `exact` — approved published quantity
- `available` — availability state only
- `hidden` — no stock information
