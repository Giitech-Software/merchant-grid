"use client";
import { FormEvent, useEffect, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

const app =
  getApps()[0] ??
  initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
const auth = getAuth(app);
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const modules = [
  "Dashboard",
  "Catalogue",
  "Inventory",
  "Sales",
  "Purchasing",
  "Accounting",
  "Settings",
];
type Business = { id: string; name: string };
type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  categoryId?: string | null;
  sku: string;
  name: string;
  brand?: string | null;
};
type Variant = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  retailPrice: string;
};
type Location = { id: string; name: string; code: string; kind?: string };
type Customer = { id: string; name: string; phone?: string | null };
type Supplier = { id: string; name: string; phone?: string | null };
type Account = { id: string; code: string; name: string; accountType: string };
type TrialBalanceRow = { accountId: string; code: string; name: string; debit: string; credit: string };
type AccessUser = { id: string; email: string; displayName: string; status?: string };
type Role = { id: string; name: string; description?: string | null };
type Membership = { id: string; userId: string; roleId: string; locationId?: string | null; status: string };
type Summary = { total: string; count: number };
export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const [message, setMessage] = useState("Sign in to continue.");
  const [tenant, setTenant] = useState("");
  const [token, setToken] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dashboard, setDashboard] = useState({ inventory: "0", receivables: "0", payables: "0" });
  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("Signing in…");
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await credential.user.getIdToken();
      setToken(idToken);
      const headers = { Authorization: `Bearer ${idToken}` };
      const responses = await Promise.all([
        fetch(`${apiBase}/v1/context`, { headers }),
        fetch(`${apiBase}/v1/businesses`, { headers }),
        fetch(`${apiBase}/v1/catalogue/products`, { headers }),
        fetch(`${apiBase}/v1/catalogue/categories`, { headers }),
        fetch(`${apiBase}/v1/reports/inventory-valuation`, { headers }),
        fetch(`${apiBase}/v1/reports/receivables`, { headers }),
        fetch(`${apiBase}/v1/reports/payables`, { headers }),
      ]);
      if (responses.some((r) => !r.ok))
        throw new Error("Your account is not authorized for MerchantGrid");
      const context = await responses[0].json();
      const businessData = await responses[1].json();
      const productData = await responses[2].json();
      const categoryData = await responses[3].json();
      const inventoryData = (await responses[4].json()) as { data: Summary };
      const receivablesData = (await responses[5].json()) as { data: Summary };
      const payablesData = (await responses[6].json()) as { data: Summary };
      setTenant(context.tenantId);
      setBusinesses(businessData.data);
      setProducts(productData.data);
      setCategories(categoryData.data);
      setDashboard({ inventory: inventoryData.data.total, receivables: receivablesData.data.total, payables: payablesData.data.total });
      setMessage("Signed in");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed");
    }
  }
  async function logout() {
    await signOut(auth);
    setBusinesses([]);
    setCategories([]);
    setProducts([]);
    setToken("");
    setTenant("");
    setMessage("Signed out.");
  }
  if (businesses.length === 0)
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
        <Brand />
        <p className="mt-4 text-slate-600">{message}</p>
        <section className="mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Administrator sign in</h2>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input
                className="rounded-lg border border-slate-300 p-3 font-normal"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Password
              <input
                className="rounded-lg border border-slate-300 p-3 font-normal"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={show}
                onChange={(e) => setShow(e.target.checked)}
              />{" "}
              Show password
            </label>
            <button className="rounded-lg bg-teal-700 px-4 py-3 font-bold text-white">
              Sign in
            </button>
          </form>
        </section>
      </main>
    );
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 border-r border-slate-200 bg-slate-950 p-6 text-white md:block">
        <p className="text-xs font-bold tracking-[0.2em] text-teal-300">
          MERCHANTGRID
        </p>
        <p className="mt-2 text-sm text-slate-400">Operations workspace</p>
        <nav className="mt-10 space-y-2">
          {modules.map((item) => (
            <button
              key={item}
              onClick={() => setActive(item)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${active === item ? "bg-teal-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-6 py-8 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-700">
              MerchantGrid Demo Business
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              {active}
            </h1>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
            Signed in
          </span>
          <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Sign out
          </button>
        </header>
        {active === "Catalogue" ? (
          <Catalogue
            products={products}
            categories={categories}
            token={token}
            onCreated={(product) =>
              setProducts((current) => [...current, product])
            }
            onCategoryCreated={(category) =>
              setCategories((current) => [...current, category])
            }
          />
        ) : active === "Inventory" ? (
          <Inventory products={products} token={token} />
        ) : active === "Sales" ? (
          <Sales products={products} token={token} />
        ) : active === "Purchasing" ? (
          <Purchasing products={products} token={token} />
        ) : active === "Accounting" ? (
          <Accounting token={token} />
        ) : active === "Settings" ? (
          <Settings token={token} />
        ) : (
          <>
            <section className="mt-8 grid gap-5 md:grid-cols-3">
              <Metric
                label="Businesses"
                value={String(businesses.length)}
              />
              <Metric label="Tenant" value={tenant.slice(0, 8) + "…"} />
              <Metric label="Inventory valuation" value={dashboard.inventory} />
              <Metric label="Receivables" value={dashboard.receivables} />
              <Metric label="Payables" value={dashboard.payables} />
              <Metric label="Products" value={String(products.length)} />
            </section>
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Businesses</h2>
              <ul className="mt-4 divide-y divide-slate-100">
                {businesses.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between py-4"
                  >
                    <span className="font-medium">{b.name}</span>
                    <code className="text-xs text-slate-500">{b.id}</code>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
function Settings({ token }: { token: string }) {
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [status, setStatus] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  async function load() {
    const [usersResponse, rolesResponse, membershipsResponse] = await Promise.all([
      fetch(`${apiBase}/v1/users`, { headers }),
      fetch(`${apiBase}/v1/roles`, { headers }),
      fetch(`${apiBase}/v1/memberships`, { headers }),
    ]);
    const [usersPayload, rolesPayload, membershipsPayload] = await Promise.all([usersResponse.json(), rolesResponse.json(), membershipsResponse.json()]);
    setUsers(usersPayload.data ?? []);
    setRoles(rolesPayload.data ?? []);
    setMemberships(membershipsPayload.data ?? []);
  }

  useEffect(() => { void load(); }, [token]);

  return (
    <>
      <section className="mt-8 grid gap-5 md:grid-cols-3"><Metric label="Users" value={String(users.length)} /><Metric label="Roles" value={String(roles.length)} /><Metric label="Memberships" value={String(memberships.length)} /></section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Access management</h2><p className="mt-1 text-sm text-slate-500">Users and roles with access to this business.</p></div><button onClick={() => { setStatus("Refreshing access data…"); void load().then(() => setStatus("Access data refreshed")); }} className="rounded-lg bg-slate-800 px-4 py-3 font-bold text-white">Refresh</button></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="pb-3">User</th><th className="pb-3">Status</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-slate-100"><td className="py-3"><div className="font-medium">{user.displayName}</div><div className="text-slate-500">{user.email}</div></td><td className="py-3 capitalize text-slate-500">{user.status ?? "active"}</td></tr>)}</tbody></table></div>
        <p className="mt-3 text-sm text-slate-500">{status}</p>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Roles</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{roles.map((role) => <div key={role.id} className="rounded-lg bg-slate-50 p-4"><div className="font-semibold">{role.name}</div><div className="mt-1 text-sm text-slate-500">{role.description ?? "No description"}</div></div>)}</div></section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Business memberships</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="pb-3">User</th><th className="pb-3">Role</th><th className="pb-3">Location</th><th className="pb-3">Status</th></tr></thead><tbody>{memberships.map((membership) => { const user = users.find((item) => item.id === membership.userId); const role = roles.find((item) => item.id === membership.roleId); return <tr key={membership.id} className="border-b border-slate-100"><td className="py-3">{user?.displayName ?? membership.userId}</td><td className="py-3">{role?.name ?? membership.roleId}</td><td className="py-3 text-slate-500">{membership.locationId ?? "All locations"}</td><td className="py-3 capitalize text-slate-500">{membership.status}</td></tr>; })}</tbody></table></div></section>
    </>
  );
}
function Accounting({ token }: { token: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
  const [summaries, setSummaries] = useState({ inventory: "0", receivables: "0", payables: "0" });
  const [status, setStatus] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  async function load() {
    const [accountsResponse, trialResponse, inventoryResponse, receivablesResponse, payablesResponse] = await Promise.all([
      fetch(`${apiBase}/v1/accounting/accounts`, { headers }),
      fetch(`${apiBase}/v1/reports/trial-balance`, { headers }),
      fetch(`${apiBase}/v1/reports/inventory-valuation`, { headers }),
      fetch(`${apiBase}/v1/reports/receivables`, { headers }),
      fetch(`${apiBase}/v1/reports/payables`, { headers }),
    ]);
    const accountsPayload = await accountsResponse.json();
    const trialPayload = await trialResponse.json();
    const inventoryPayload = await inventoryResponse.json();
    const receivablesPayload = await receivablesResponse.json();
    const payablesPayload = await payablesResponse.json();
    setAccounts(accountsPayload.data ?? []);
    setTrialBalance(trialPayload.data ?? []);
    setSummaries({ inventory: inventoryPayload.data?.total ?? "0", receivables: receivablesPayload.data?.total ?? "0", payables: payablesPayload.data?.total ?? "0" });
  }

  useEffect(() => { void load(); }, [token]);

  async function seedDefaults() {
    const response = await fetch(`${apiBase}/v1/accounting/accounts/seed-defaults`, { method: "POST", headers });
    const payload = await response.json();
    setStatus(response.ok ? "Default accounts created" : payload.status ?? "Unable to seed accounts");
    if (response.ok) await load();
  }

  return (
    <>
      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <Metric label="Inventory valuation" value={summaries.inventory} />
        <Metric label="Receivables" value={summaries.receivables} />
        <Metric label="Payables" value={summaries.payables} />
      </section>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Chart of accounts</h2><p className="mt-1 text-sm text-slate-500">Accounts used for operational posting.</p></div>
          <button onClick={seedDefaults} className="rounded-lg bg-teal-700 px-4 py-3 font-bold text-white">Seed defaults</button>
        </div>
        <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="pb-3">Code</th><th className="pb-3">Name</th><th className="pb-3">Type</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id} className="border-b border-slate-100"><td className="py-3 font-mono">{account.code}</td><td className="py-3 font-medium">{account.name}</td><td className="py-3 capitalize text-slate-500">{account.accountType}</td></tr>)}</tbody></table></div>
        <p className="mt-3 text-sm text-slate-500">{status}</p>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Trial balance</h2>
        {trialBalance.length === 0 ? (
          <p className="mt-4 text-slate-500">No trial-balance rows yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-slate-500"><tr><th className="pb-3">Code</th><th className="pb-3">Account</th><th className="pb-3 text-right">Debit</th><th className="pb-3 text-right">Credit</th></tr></thead>
              <tbody>
                {trialBalance.map((row) => <tr key={row.accountId} className="border-b border-slate-100"><td className="py-3 font-mono">{row.code}</td><td className="py-3 font-medium">{row.name}</td><td className="py-3 text-right">{row.debit}</td><td className="py-3 text-right">{row.credit}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Purchasing({ products, token }: { products: Product[]; token: string }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [locationId, setLocationId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/v1/locations`, { headers }).then((response) => response.json()),
      fetch(`${apiBase}/v1/suppliers`, { headers }).then((response) => response.json()),
    ]).then(([locationPayload, supplierPayload]) => {
      setLocations(locationPayload.data ?? []);
      setSuppliers(supplierPayload.data ?? []);
    });
  }, [token]);

  async function selectProduct(id: string) {
    setProductId(id);
    setVariantId("");
    setVariants([]);
    if (!id) return;
    const response = await fetch(`${apiBase}/v1/catalogue/products/${id}/variants`, { headers });
    if (response.ok) setVariants((await response.json()).data ?? []);
  }

  async function createSupplier(e: FormEvent) {
    e.preventDefault();
    const response = await fetch(`${apiBase}/v1/suppliers`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ name: supplierName }) });
    const payload = await response.json();
    if (!response.ok) return setStatus(payload.status ?? "Unable to create supplier");
    setSuppliers((current) => [...current, payload.data]);
    setSupplierId(payload.data.id);
    setSupplierName("");
    setStatus("Supplier created");
  }

  async function createOrder(e: FormEvent) {
    e.preventDefault();
    const response = await fetch(`${apiBase}/v1/purchasing/orders`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ locationId, supplierId, items: [{ variantId, quantity, unitCost }] }) });
    const payload = await response.json();
    if (!response.ok) return setStatus(payload.status ?? "Unable to create purchase order");
    setOrderId(payload.data.id);
    setStatus(`Purchase order ${payload.data.orderNumber} created`);
  }

  async function approveOrder() {
    const response = await fetch(`${apiBase}/v1/purchasing/orders/${orderId}/approve`, { method: "POST", headers });
    const payload = await response.json();
    setStatus(response.ok ? "Purchase order approved" : payload.status ?? "Unable to approve order");
  }

  async function receiveGoods() {
    const response = await fetch(`${apiBase}/v1/purchasing/goods-received`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ purchaseOrderId: orderId, locationId, items: [{ variantId, quantity, unitCost }] }) });
    const payload = await response.json();
    setStatus(response.ok ? `Goods received: ${payload.data.receivedNumber}` : payload.status ?? "Unable to receive goods");
  }

  return (
    <>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Suppliers</h2>
        <form onSubmit={createSupplier} className="mt-4 flex gap-4">
          <input className="flex-1 rounded-lg border border-slate-300 p-3" placeholder="Supplier name" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
          <button className="rounded-lg bg-teal-700 px-4 py-3 font-bold text-white">Add supplier</button>
        </form>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create purchase order</h2>
        <form onSubmit={createOrder} className="mt-4 grid gap-4 md:grid-cols-3">
          <select className="rounded-lg border border-slate-300 p-3" value={locationId} onChange={(e) => setLocationId(e.target.value)} required><option value="">Receive at location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
          <select className="rounded-lg border border-slate-300 p-3" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required><option value="">Select supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>
          <select className="rounded-lg border border-slate-300 p-3" value={productId} onChange={(e) => selectProduct(e.target.value)} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
          <select className="rounded-lg border border-slate-300 p-3" value={variantId} onChange={(e) => setVariantId(e.target.value)} required><option value="">Select variant</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</select>
          <input className="rounded-lg border border-slate-300 p-3" type="number" min="0.000001" step="0.000001" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <input className="rounded-lg border border-slate-300 p-3" type="number" min="0" step="0.0001" placeholder="Unit cost" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required />
          <button className="rounded-lg bg-slate-800 px-4 py-3 font-bold text-white md:col-span-3">Create purchase order</button>
        </form>
        <p className="mt-3 text-sm text-slate-500">{status}</p>
      </section>
      {orderId && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Process purchase order</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={approveOrder} className="rounded-lg bg-indigo-700 px-4 py-3 font-bold text-white">Approve order</button>
            <button onClick={receiveGoods} className="rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white">Receive goods</button>
          </div>
          <p className="mt-3 text-sm text-slate-500">Approve the order first, then receive the goods into the selected location.</p>
        </section>
      )}
    </>
  );
}
function Sales({ products, token }: { products: Product[]; token: string }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [locationId, setLocationId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [status, setStatus] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/v1/locations`, { headers }).then((response) => response.json()),
      fetch(`${apiBase}/v1/customers`, { headers }).then((response) => response.json()),
    ]).then(([locationPayload, customerPayload]) => {
      setLocations(locationPayload.data ?? []);
      setCustomers(customerPayload.data ?? []);
    });
  }, [token]);

  async function selectProduct(id: string) {
    setProductId(id);
    setVariantId("");
    setVariants([]);
    if (!id) return;
    const response = await fetch(`${apiBase}/v1/catalogue/products/${id}/variants`, { headers });
    if (response.ok) setVariants((await response.json()).data ?? []);
  }

  async function createCustomer(e: FormEvent) {
    e.preventDefault();
    const response = await fetch(`${apiBase}/v1/customers`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ name: customerName }) });
    const payload = await response.json();
    if (!response.ok) return setStatus(payload.status ?? "Unable to create customer");
    setCustomers((current) => [...current, payload.data]);
    setCustomerId(payload.data.id);
    setCustomerName("");
    setStatus("Customer created");
  }

  async function createInvoice(e: FormEvent) {
    e.preventDefault();
    const response = await fetch(`${apiBase}/v1/sales/invoices`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ locationId, customerId: customerId || undefined, items: [{ variantId, quantity, unitPrice }] }) });
    const payload = await response.json();
    if (!response.ok) return setStatus(payload.status ?? "Unable to create invoice");
    setInvoiceId(payload.data.id);
    setPaymentAmount(payload.data.total);
    setStatus(`Invoice ${payload.data.invoiceNumber} created`);
  }

  async function postInvoice() {
    const response = await fetch(`${apiBase}/v1/sales/invoices/${invoiceId}/post`, { method: "POST", headers });
    const payload = await response.json();
    setStatus(response.ok ? "Invoice posted" : payload.status ?? "Unable to post invoice");
  }

  async function recordPayment(e: FormEvent) {
    e.preventDefault();
    const response = await fetch(`${apiBase}/v1/sales/payments`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId, method: paymentMethod, amount: paymentAmount }) });
    const payload = await response.json();
    setStatus(response.ok ? "Payment recorded" : payload.status ?? "Unable to record payment");
  }

  return (
    <>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Customers</h2>
        <form onSubmit={createCustomer} className="mt-4 flex gap-4">
          <input className="flex-1 rounded-lg border border-slate-300 p-3" placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          <button className="rounded-lg bg-teal-700 px-4 py-3 font-bold text-white">Add customer</button>
        </form>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create sales invoice</h2>
        <form onSubmit={createInvoice} className="mt-4 grid gap-4 md:grid-cols-3">
          <select className="rounded-lg border border-slate-300 p-3" value={locationId} onChange={(e) => setLocationId(e.target.value)} required><option value="">Select location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
          <select className="rounded-lg border border-slate-300 p-3" value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Walk-in customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select>
          <select className="rounded-lg border border-slate-300 p-3" value={productId} onChange={(e) => selectProduct(e.target.value)} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
          <select className="rounded-lg border border-slate-300 p-3" value={variantId} onChange={(e) => setVariantId(e.target.value)} required><option value="">Select variant</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</select>
          <input className="rounded-lg border border-slate-300 p-3" type="number" min="0.000001" step="0.000001" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <input className="rounded-lg border border-slate-300 p-3" type="number" min="0" step="0.0001" placeholder="Unit price" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
          <button className="rounded-lg bg-slate-800 px-4 py-3 font-bold text-white md:col-span-3">Create invoice</button>
        </form>
        <p className="mt-3 text-sm text-slate-500">{status}</p>
      </section>
      {invoiceId && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Complete invoice</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={postInvoice} className="rounded-lg bg-indigo-700 px-4 py-3 font-bold text-white">Post invoice</button>
          </div>
          <form onSubmit={recordPayment} className="mt-5 grid gap-4 md:grid-cols-3">
            <select className="rounded-lg border border-slate-300 p-3" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="bank">Bank</option><option value="mobile_money">Mobile money</option><option value="credit">Credit</option></select>
            <input className="rounded-lg border border-slate-300 p-3" type="number" min="0" step="0.0001" placeholder="Payment amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
            <button className="rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white">Record payment</button>
          </form>
        </section>
      )}
    </>
  );
}
function Inventory({ products, token }: { products: Product[]; token: string }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationName, setLocationName] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [movementType, setMovementType] = useState("receipts");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [status, setStatus] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${apiBase}/v1/locations`, { headers })
      .then((response) => response.json())
      .then((payload) => setLocations(payload.data ?? []));
  }, [token]);

  async function createLocation(e: FormEvent) {
    e.preventDefault();
    setStatus("Saving location…");
    const response = await fetch(`${apiBase}/v1/locations`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name: locationName, code: locationCode, kind: "warehouse" }),
    });
    const payload = await response.json();
    if (!response.ok) return setStatus(payload.status ?? "Unable to save location");
    setLocations((current) => [...current, payload.data]);
    setLocationName("");
    setLocationCode("");
    setStatus("Location created");
  }

  async function selectProduct(productId: string) {
    setSelectedProduct(productId);
    setSelectedVariant("");
    setVariants([]);
    if (!productId) return;
    const response = await fetch(`${apiBase}/v1/catalogue/products/${productId}/variants`, { headers });
    if (response.ok) setVariants((await response.json()).data ?? []);
  }

  async function checkBalance(e: FormEvent) {
    e.preventDefault();
    const response = await fetch(`${apiBase}/v1/inventory/balance?locationId=${selectedLocation}&variantId=${selectedVariant}`, { headers });
    const payload = await response.json();
    setBalance(response.ok ? String(payload.data?.quantity ?? payload.data?.balance ?? 0) : null);
    setStatus(response.ok ? "Balance loaded" : payload.status ?? "Unable to load balance");
  }

  async function postMovement(e: FormEvent) {
    e.preventDefault();
    setStatus("Posting stock movement…");
    const response = await fetch(`${apiBase}/v1/inventory/${movementType}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId: selectedLocation,
        variantId: selectedVariant,
        quantity,
        unitCost: unitCost || "0",
        sourceType: "manual",
        sourceId: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
        reason: "Admin workspace entry",
      }),
    });
    const payload = await response.json();
    setStatus(response.ok ? "Stock movement posted" : payload.status ?? "Unable to post movement");
    if (response.ok) {
      setQuantity("");
      setUnitCost("");
      setBalance(null);
    }
  }

  return (
    <>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Stock locations</h2>
        <form onSubmit={createLocation} className="mt-4 grid gap-4 md:grid-cols-3">
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Location name" value={locationName} onChange={(e) => setLocationName(e.target.value)} required />
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Code, e.g. MAIN" value={locationCode} onChange={(e) => setLocationCode(e.target.value)} required />
          <button className="rounded-lg bg-teal-700 px-4 py-3 font-bold text-white">Create location</button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {locations.map((location) => <span key={location.id} className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">{location.name} ({location.code})</span>)}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Check stock balance</h2>
        <form onSubmit={checkBalance} className="mt-4 grid gap-4 md:grid-cols-3">
          <select className="rounded-lg border border-slate-300 p-3" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} required><option value="">Select location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
          <select className="rounded-lg border border-slate-300 p-3" value={selectedProduct} onChange={(e) => selectProduct(e.target.value)} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
          <select className="rounded-lg border border-slate-300 p-3" value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)} required><option value="">Select variant</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} ({variant.sku})</option>)}</select>
          <button className="rounded-lg bg-slate-800 px-4 py-3 font-bold text-white md:col-span-3">Check balance</button>
        </form>
        {balance !== null && <p className="mt-5 text-2xl font-bold text-slate-950">Available quantity: {balance}</p>}
        <p className="mt-3 text-sm text-slate-500">{status}</p>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Post stock movement</h2>
        <form onSubmit={postMovement} className="mt-4 grid gap-4 md:grid-cols-4">
          <select className="rounded-lg border border-slate-300 p-3" value={movementType} onChange={(e) => setMovementType(e.target.value)}><option value="receipts">Receipt</option><option value="issues">Issue</option><option value="adjustments">Adjustment</option></select>
          <input className="rounded-lg border border-slate-300 p-3" type="number" min="0" step="0.000001" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <input className="rounded-lg border border-slate-300 p-3" type="number" min="0" step="0.000001" placeholder="Unit cost" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required />
          <button className="rounded-lg bg-amber-600 px-4 py-3 font-bold text-white" disabled={!selectedLocation || !selectedVariant}>Post movement</button>
        </form>
        <p className="mt-3 text-sm text-slate-500">Choose a location and variant above before posting a movement.</p>
      </section>
    </>
  );
}
function Catalogue({
  products,
  categories,
  token,
  onCreated,
  onCategoryCreated,
}: {
  products: Product[];
  categories: Category[];
  token: string;
  onCreated: (product: Product) => void;
  onCategoryCreated: (category: Category) => void;
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [status, setStatus] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [variantName, setVariantName] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  async function create(e: FormEvent) {
    e.preventDefault();
    setStatus("Saving…");
    const response = await fetch(`${apiBase}/v1/catalogue/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        sku,
        brand: brand || undefined,
        categoryId: categoryId || undefined,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.status ?? "Unable to save product");
      return;
    }
    onCreated(payload.data);
    setName("");
    setSku("");
    setBrand("");
    setCategoryId("");
    setStatus("Product created");
  }
  async function createVariant(e: FormEvent) {
    e.preventDefault();
    setStatus("Saving variant…");
    const response = await fetch(`${apiBase}/v1/catalogue/variants`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: selectedProduct, name: variantName, sku: variantSku, retailPrice }) });
    const payload = await response.json();
    setStatus(response.ok ? "Variant created" : payload.status ?? "Unable to save variant");
    if (response.ok) {
      setVariants((current) => [...current, payload.data]);
      setVariantName("");
      setVariantSku("");
      setRetailPrice("");
    }
  }
  async function loadVariants(productId: string) {
    setSelectedProduct(productId);
    setVariants([]);
    if (!productId) return;
    const response = await fetch(`${apiBase}/v1/catalogue/products/${productId}/variants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const payload = await response.json();
      setVariants(payload.data);
    }
  }
  async function createCategory(e: FormEvent) {
    e.preventDefault();
    setStatus("Saving category…");
    const response = await fetch(`${apiBase}/v1/catalogue/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: categoryName, slug: categorySlug }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.status ?? "Unable to save category");
      return;
    }
    onCategoryCreated(payload.data);
    setCategoryName("");
    setCategorySlug("");
    setStatus("Category created");
  }
  return (
    <>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Add product</h2>
        <form onSubmit={create} className="mt-4 grid gap-4 md:grid-cols-5">
          <input
            className="rounded-lg border border-slate-300 p-3"
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-300 p-3"
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-300 p-3"
            placeholder="Brand (optional)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <select
            className="rounded-lg border border-slate-300 p-3"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-teal-700 px-4 py-3 font-bold text-white">
            Create
          </button>
        </form>
        <p className="mt-3 text-sm text-slate-500">{status}</p>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Manage categories</h2>
        <form onSubmit={createCategory} className="mt-4 grid gap-4 md:grid-cols-3">
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Category name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Slug, e.g. beverages" pattern="[a-z0-9-]+" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} required />
          <button className="rounded-lg bg-indigo-700 px-4 py-3 font-bold text-white">Create category</button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category.id} className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              {category.name}
            </span>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Add product variant</h2>
        <form onSubmit={createVariant} className="mt-4 grid gap-4 md:grid-cols-4">
          <select className="rounded-lg border border-slate-300 p-3" value={selectedProduct} onChange={(e) => loadVariants(e.target.value)} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Variant name" value={variantName} onChange={(e) => setVariantName(e.target.value)} required />
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Variant SKU" value={variantSku} onChange={(e) => setVariantSku(e.target.value)} required />
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Retail price" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} required />
          <button className="rounded-lg bg-slate-800 px-4 py-3 font-bold text-white md:col-span-4">Create variant</button>
        </form>
        {selectedProduct && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="font-semibold">Existing variants</h3>
            {variants.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No variants yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-medium">{variant.name} ({variant.sku})</span>
                    <span className="text-slate-600">{variant.retailPrice}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">
            {products.length}
          </span>
        </div>
        {products.length === 0 ? (
          <p className="mt-8 text-slate-500">
            No products have been created yet.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Brand</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-4 font-medium">{p.name}</td>
                    <td className="py-4">{p.sku}</td>
                    <td className="py-4 text-slate-500">{p.brand ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Brand() {
  return (
    <>
      <p className="text-xs font-bold tracking-[0.2em] text-teal-700">
        MERCHANTGRID
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">
        Operations workspace
      </h1>
    </>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
