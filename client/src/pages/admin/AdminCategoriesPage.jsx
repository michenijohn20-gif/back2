import { useEffect, useState } from "react";
import { adminApi } from "../../lib/adminApi.js";
import { Btn } from "../../components/ui.jsx";

export function AdminCategoriesPage() {
  const [cats, setCats] = useState([]);
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  const load = () => adminApi.get("/api/admin/categories").then((r) => setCats(r.data));

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    await adminApi.post("/api/admin/categories", { name, iconUrl });
    setName("");
    setIconUrl("");
    load();
  };

  const del = async (id) => {
    if (!window.confirm("Delete category? Ensure no products rely on it.")) return;
    await adminApi.delete(`/api/admin/categories/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Categories</h1>
      <div className="border border-border rounded bg-white shadow-card p-4 space-y-3 max-w-md">
        <input
          className="w-full border border-border rounded px-3 py-2 text-sm"
          placeholder="Name e.g. Drones"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border border-border rounded px-3 py-2 text-sm"
          placeholder="Icon URL (Dicebear SVG or Cloudinary)"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
        />
        <Btn onClick={add} disabled={!name}>
          Add category
        </Btn>
      </div>
      <div className="grid gap-3">
        {cats.map((c) => (
          <div key={c.id} className="border border-border rounded p-4 flex justify-between bg-white shadow-card">
            <div className="flex gap-3">
              {c.iconUrl && <img loading="lazy" src={c.iconUrl} alt="" className="h-10 w-10 rounded border" />}
              <div>
                <p className="font-semibold text-ink">{c.name}</p>
                <p className="text-xs text-muted">{c.slug}</p>
              </div>
            </div>
            <button type="button" className="text-red-600 text-sm" onClick={() => del(c.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
