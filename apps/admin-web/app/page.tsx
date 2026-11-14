"use client";
import { FormEvent, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
type Product = { id: string; sku: string; name: string; brand?: string | null };
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
      ]);
      if (responses.some((r) => !r.ok))
        throw new Error("Your account is not authorized for MerchantGrid");
      const context = await responses[0].json();
      const businessData = await responses[1].json();
      const productData = await responses[2].json();
      const categoryData = await responses[3].json();
      setTenant(context.tenantId);
      setBusinesses(businessData.data);
      setProducts(productData.data);
      setCategories(categoryData.data);
      setMessage("Signed in");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed");
    }
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
        ) : (
          <>
            <section className="mt-8 grid gap-5 md:grid-cols-3">
              <Metric
                label="Business access"
                value={`${businesses.length} business`}
              />
              <Metric label="Tenant" value={tenant.slice(0, 8) + "…"} />
              <Metric label="Workspace" value="Operational" />
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
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [status, setStatus] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [variantName, setVariantName] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  async function create(e: FormEvent) {
    e.preventDefault();
    setStatus("Saving…");
    const response = await fetch(`${apiBase}/v1/catalogue/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, sku, brand: brand || undefined }),
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
    setStatus("Product created");
  }
  async function createVariant(e: FormEvent) {
    e.preventDefault();
    setStatus("Saving variant…");
    const response = await fetch(`${apiBase}/v1/catalogue/variants`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: selectedProduct, name: variantName, sku: variantSku, retailPrice }) });
    const payload = await response.json();
    setStatus(response.ok ? "Variant created" : payload.status ?? "Unable to save variant");
    if (response.ok) { setVariantName(""); setVariantSku(""); setRetailPrice(""); }
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
        <form onSubmit={create} className="mt-4 grid gap-4 md:grid-cols-4">
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
          <select className="rounded-lg border border-slate-300 p-3" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Variant name" value={variantName} onChange={(e) => setVariantName(e.target.value)} required />
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Variant SKU" value={variantSku} onChange={(e) => setVariantSku(e.target.value)} required />
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Retail price" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} required />
          <button className="rounded-lg bg-slate-800 px-4 py-3 font-bold text-white md:col-span-4">Create variant</button>
        </form>
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
