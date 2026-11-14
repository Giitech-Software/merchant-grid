# End-to-end security scenario

The authenticated business route now has a composition test covering:

`Bearer token → provider identity → membership resolution → request context → permission check → tenant-scoped repository`

The provider test double returns only a user ID. The membership test double supplies the tenant and business scope. This reflects the production rule that identity providers authenticate people, while MerchantGrid authorizes access from its own membership data.
