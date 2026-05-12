import { useEffect, useState } from "react";
import { adminApi } from "../../lib/adminApi.js";
import { formatKes } from "../../utils/format.js";
import { Btn } from "../../components/ui.jsx";

const blankVariant = {
  storage: "",
  color: "",
  priceExcellent: "",
  priceGood: "",
  priceFair: "",
  stockExcellent: "0",
  stockGood: "0",
  stockFair: "0",
};

const blankProduct = {
  name: "",
  description: "",
  whatsInBox: "",
  categoryId: "",
  brandId: "",
  featured: false,
  metaTitle: "",
  metaDescription: "",
};

function cleanImageUrl(url = "") {
  const match = String(url).match(/^\s*([^|]+)\s*\|\s*(https?:\/\/.+)$/i);
  return (match ? match[2] : url).trim();
}

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 50 });
  const [showCreate, setShowCreate] = useState(false);
  const [lookup, setLookup] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState("");
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);
  const [form, setForm] = useState(blankProduct);
  const [specsText, setSpecsText] = useState("{}");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [variants, setVariants] = useState([{ ...blankVariant }]);

  const load = (page = meta.page) =>
    adminApi.get("/api/admin/products", { params: { page, pageSize: meta.pageSize } }).then((r) => {
      setProducts(r.data.products || []);
      setMeta({ total: r.data.total || 0, page: r.data.page || page, pageSize: r.data.pageSize || meta.pageSize });
    });

  useEffect(() => {
    load().catch(() => {});
    Promise.all([adminApi.get("/api/categories"), adminApi.get("/api/brands")]).then(([c, b]) => {
      setCategories(c.data || []);
      setBrands(b.data || []);
      setForm((f) => ({
        ...f,
        categoryId: f.categoryId || c.data?.[0]?.id || "",
        brandId: f.brandId || b.data?.[0]?.id || "",
      }));
    });
  }, []);

  const del = async (id) => {
    if (!window.confirm("Archive / delete permanently?")) return;
    await adminApi.delete(`/api/admin/products/${id}`);
    load();
  };

  const resetEditor = () => {
    setForm({
      ...blankProduct,
      categoryId: categories[0]?.id || "",
      brandId: brands[0]?.id || "",
    });
    setSpecsText("{}");
    setImageUrlsText("");
    setVariants([{ ...blankVariant }]);
    setDeletedVariantIds([]);
    setEditingProductId("");
    setLookup("");
  };

  const openCreate = () => {
    resetEditor();
    setShowCreate(true);
  };

  const openEdit = async (id) => {
    const { data } = await adminApi.get(`/api/admin/products/${id}`);
    setEditingProductId(data.id);
    setForm({
      name: data.name || "",
      description: data.description || "",
      whatsInBox: data.whatsInBox || "",
      categoryId: data.categoryId || "",
      brandId: data.brandId || "",
      featured: Boolean(data.featured),
      metaTitle: data.metaTitle || "",
      metaDescription: data.metaDescription || "",
    });
    setSpecsText(JSON.stringify(data.specs || {}, null, 2));
    setImageUrlsText((data.images || []).map((img) => img.url).join("\n"));
    const nextVariants = (data.variants || []).map((v) => ({
      id: v.id,
      storage: v.storage || "",
      color: v.color || "",
      priceExcellent: String(v.priceExcellent ?? ""),
      priceGood: String(v.priceGood ?? ""),
      priceFair: String(v.priceFair ?? ""),
      stockExcellent: String(v.stockExcellent ?? 0),
      stockGood: String(v.stockGood ?? 0),
      stockFair: String(v.stockFair ?? 0),
    }));
    setVariants(nextVariants.length ? nextVariants : [{ ...blankVariant }]);
    setDeletedVariantIds([]);
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const autofill = async () => {
    if (!lookup.trim()) return;
    setLookupBusy(true);
    try {
      const { data } = await adminApi.get("/api/admin/products/autofill", { params: { q: lookup } });
      setForm((f) => ({
        ...f,
        name: data.name || f.name,
        description: data.description || f.description,
        whatsInBox: data.whatsInBox || f.whatsInBox,
        metaTitle: data.name || f.metaTitle,
        metaDescription: data.description?.slice?.(0, 160) || f.metaDescription,
      }));
      setSpecsText(JSON.stringify(data.specs || {}, null, 2));
      setImageUrlsText((data.imageUrls || []).join("\n"));
      if (data.variants?.length) setVariants(data.variants.slice(0, 6));
    } catch (e) {
      window.alert(e.response?.data?.error || "Could not fetch specs. Check MOBILEAPI_KEY.");
    } finally {
      setLookupBusy(false);
    }
  };

  const saveProduct = async () => {
    setSaving(true);
    try {
      let specs = {};
      try {
        specs = JSON.parse(specsText || "{}");
      } catch {
        window.alert("Specs must be valid JSON.");
        return;
      }
      const payload = {
        ...form,
        specs,
        imageUrls: imageUrlsText.split("\n").map((u) => u.trim()).filter(Boolean),
        variants: variants.map((v) => ({
          ...v,
          priceExcellent: Number(v.priceExcellent || 0),
          priceGood: Number(v.priceGood || 0),
          priceFair: Number(v.priceFair || 0),
          stockExcellent: Number(v.stockExcellent || 0),
          stockGood: Number(v.stockGood || 0),
          stockFair: Number(v.stockFair || 0),
        })),
        deletedVariantIds,
      };
      if (editingProductId) {
        await adminApi.patch(`/api/admin/products/${editingProductId}`, payload);
      } else {
        await adminApi.post("/api/admin/products", payload);
      }
      resetEditor();
      setShowCreate(false);
      load(1);
    } catch (e) {
      window.alert(e.response?.data?.error || "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const updateVariant = (idx, patch) => {
    setVariants((rows) => rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const removeVariant = (idx) => {
    setVariants((rows) => {
      const variant = rows[idx];
      if (variant?.id) setDeletedVariantIds((ids) => [...ids, variant.id]);
      const next = rows.filter((_, i) => i !== idx);
      return next.length ? next : [{ ...blankVariant }];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Products</h1>
          <p className="text-xs text-muted">Add devices manually or autofill specs from MobileAPI.dev.</p>
        </div>
        <Btn onClick={showCreate ? () => setShowCreate(false) : openCreate}>{showCreate ? "Close" : "Add product"}</Btn>
      </div>

      {showCreate && (
        <div className="border border-border rounded bg-white shadow-card p-5 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {editingProductId ? "Edit product" : "Create product"}
            </h2>
            <p className="text-xs text-muted">
              Update product details, images, specs, prices, and stock from one place.
            </p>
          </div>
          <div className="grid md:grid-cols-[1fr_auto] gap-3">
            <input
              className="border border-border rounded px-3 py-2 text-sm"
              placeholder="Search phone, e.g. iPhone 13 Pro Max"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
            />
            <Btn variant="secondary" disabled={lookupBusy} onClick={autofill}>
              {lookupBusy ? "Searching..." : "Autofill specs"}
            </Btn>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Product name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Category" value={form.categoryId} onChange={(v) => setForm({ ...form, categoryId: v })} rows={categories} />
              <Select label="Brand" value={form.brandId} onChange={(v) => setForm({ ...form, brandId: v })} rows={brands} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Feature this product on the storefront
          </label>

          <TextArea label="Description" value={form.description} rows={4} onChange={(v) => setForm({ ...form, description: v })} />
          <TextArea label="What's in the box" value={form.whatsInBox} rows={2} onChange={(v) => setForm({ ...form, whatsInBox: v })} />

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="SEO title" value={form.metaTitle} onChange={(v) => setForm({ ...form, metaTitle: v })} />
            <Field label="SEO description" value={form.metaDescription} onChange={(v) => setForm({ ...form, metaDescription: v })} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <TextArea label="Specs JSON" value={specsText} rows={8} onChange={setSpecsText} />
            <TextArea
              label="Image URLs, one per line. Optional: Colour | https://image-url"
              value={imageUrlsText}
              rows={8}
              onChange={setImageUrlsText}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Variants</p>
              <Btn variant="secondary" onClick={() => setVariants([...variants, { ...blankVariant }])}>
                Add variant
              </Btn>
            </div>
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={idx} className="grid md:grid-cols-[repeat(8,minmax(0,1fr))_auto] gap-2 border border-border rounded p-3">
                  <SmallField label="Storage" value={v.storage} onChange={(value) => updateVariant(idx, { storage: value })} />
                  <SmallField label="Colour" value={v.color} onChange={(value) => updateVariant(idx, { color: value })} />
                  <SmallField label="Excellent" value={v.priceExcellent} onChange={(value) => updateVariant(idx, { priceExcellent: value })} />
                  <SmallField label="Good" value={v.priceGood} onChange={(value) => updateVariant(idx, { priceGood: value })} />
                  <SmallField label="Fair" value={v.priceFair} onChange={(value) => updateVariant(idx, { priceFair: value })} />
                  <SmallField label="Stock Ex" value={v.stockExcellent} onChange={(value) => updateVariant(idx, { stockExcellent: value })} />
                  <SmallField label="Stock Good" value={v.stockGood} onChange={(value) => updateVariant(idx, { stockGood: value })} />
                  <SmallField label="Stock Fair" value={v.stockFair} onChange={(value) => updateVariant(idx, { stockFair: value })} />
                  <button type="button" className="text-xs text-red-600 self-end px-2 py-2" onClick={() => removeVariant(idx)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={() => { resetEditor(); setShowCreate(false); }}>Cancel</Btn>
            <Btn disabled={saving} onClick={saveProduct}>
              {saving ? "Saving..." : editingProductId ? "Save changes" : "Create product"}
            </Btn>
          </div>
        </div>
      )}

      <div className="overflow-auto border border-border rounded bg-white shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price (Ex)</th>
              <th className="p-3">Stock</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const v0 = p.variants?.[0];
              const stock = (v0?.stockExcellent || 0) + (v0?.stockGood || 0) + (v0?.stockFair || 0);
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <img loading="lazy" src={cleanImageUrl(p.images?.[0]?.url) || "/placeholder.svg"} alt="" className="h-12 w-12 object-cover rounded border border-border" />
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-ink">{p.name}</div>
                    <div className="text-xs text-muted">{p.brand?.name}</div>
                  </td>
                  <td className="p-3">{p.category?.name}</td>
                  <td className="p-3">{formatKes(v0?.priceExcellent || 0)}</td>
                  <td className="p-3">{stock}</td>
                  <td className="p-3 text-right">
                    <button type="button" className="text-primary text-xs mr-3" onClick={() => openEdit(p.id)}>
                      Edit
                    </button>
                    <button type="button" className="text-red-600 text-xs" onClick={() => del(p.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {meta.total > meta.pageSize && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <span className="text-muted">Page {meta.page} of {Math.max(1, Math.ceil(meta.total / meta.pageSize))}</span>
          <Btn variant="secondary" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>Previous</Btn>
          <Btn variant="secondary" disabled={meta.page >= Math.ceil(meta.total / meta.pageSize)} onClick={() => load(meta.page + 1)}>Next</Btn>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input className="mt-1 w-full border border-border rounded px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SmallField({ label, value, onChange }) {
  return (
    <label className="block text-xs">
      <span className="text-muted">{label}</span>
      <input className="mt-1 w-full border border-border rounded px-2 py-1.5 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextArea({ label, value, rows, onChange }) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <textarea className="mt-1 w-full border border-border rounded px-3 py-2 text-sm font-mono" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, rows }) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <select className="mt-1 w-full border border-border rounded px-3 py-2 text-sm bg-white" value={value} onChange={(e) => onChange(e.target.value)}>
        {rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
    </label>
  );
}
