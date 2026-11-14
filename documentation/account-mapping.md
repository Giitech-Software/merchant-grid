# Account mapping

Automatic posting must resolve accounts through tenant-scoped mappings rather than hardcoded IDs. Initial mapping keys are:

- `cash`
- `bank`
- `mobile_money`
- `accounts_receivable`
- `accounts_payable`
- `inventory`
- `sales_revenue`
- `cost_of_goods_sold`
- `operating_expenses`

Mappings must be configured before automatic posting is enabled for a business. Missing mappings fail the source transaction rather than creating incomplete accounting entries.
