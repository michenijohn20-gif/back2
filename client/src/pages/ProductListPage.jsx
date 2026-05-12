import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { ProductCard } from "../components/ProductCard.jsx";
import { Btn } from "../components/ui.jsx";
import { ProductGridSkeleton } from "../components/SkeletonGrid.jsx";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest" },
];

const CONDITIONS = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

export function ProductListPage({ mode = "catalog" }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cats, setCats] = useState([]);
  const [brnds, setBrnds] = useState([]);
  const [data, setData] = useState({ products: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);

  const page = Number(searchParams.get("page") || "1");
  const q = mode === "search" ? searchParams.get("q") || "" : searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "featured";

  const selectedCats = searchParams.get("categories")?.split(",").filter(Boolean) || [];
  const selectedBrands = searchParams.get("brands")?.split(",").filter(Boolean) || [];
  const condition = searchParams.get("condition") || "EXCELLENT";
  const priceMin = searchParams.get("priceMin") || "";
  const priceMax = searchParams.get("priceMax") || "";
  const storageFilter = searchParams.get("storage") || "";
  const colorFilter = searchParams.get("color") || "";
  const inStock = searchParams.get("inStock") || "";

  const maxPrice = Number(searchParams.get("priceSliderMax") || "250000");

  useEffect(() => {
    let stopped = false;
    Promise.all([
      api.get("/api/categories"),
      api.get("/api/brands"),
    ])
      .then(([c, b]) => {
        if (stopped) return;
        setCats(c.data);
        setBrnds(b.data);
      })
      .catch(() => {});
    return () => {
      stopped = true;
    };
  }, []);

  const queryKey = searchParams.toString();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api
      .get("/api/products", {
        signal: controller.signal,
        params: Object.fromEntries(
          [
            ["page", page],
            ["pageSize", 12],
            ["sort", sort],
            ["condition", condition],
            ["priceMin", priceMin],
            ["priceMax", priceMax],
            ["storage", storageFilter],
            ["color", colorFilter],
            ["inStock", inStock === "true" ? "true" : ""],
            ["categories", selectedCats.join(",")],
            ["brands", selectedBrands.join(",")],
            ["q", q],
          ].filter(([, v]) => v !== "" && v != null),
        ),
      })
      .then((r) => setData({ products: r.data.products || [], total: r.data.total || 0 }))
      .catch((e) => {
        if (e.name !== "CanceledError" && e.code !== "ERR_CANCELED") {
          setData({ products: [], total: 0 });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [
    queryKey,
    page,
    sort,
    condition,
    priceMin,
    priceMax,
    storageFilter,
    colorFilter,
    inStock,
    selectedCats.join(","),
    selectedBrands.join(","),
    q,
  ]);

  const totalPages = Math.max(1, Math.ceil(data.total / 12));

  const updateParam = (mutator) => {
    const next = new URLSearchParams(searchParams);
    mutator(next);
    setSearchParams(next);
  };

  const toggleSlug = (key, slug) => {
    updateParam((sp) => {
      const raw = sp.get(key)?.split(",").filter(Boolean) || [];
      const has = raw.includes(slug);
      const n = has ? raw.filter((x) => x !== slug) : [...raw, slug];
      if (n.length) sp.set(key, n.join(","));
      else sp.delete(key);
      sp.delete("page");
    });
  };

  const Sidebar = ({ mobile }) => (
    <div className={`${mobile ? "p-4" : "p-5"} space-y-6`}>
      <div>
        <p className="font-semibold text-ink mb-2">Category</p>
        <div className="space-y-2">
          {cats.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm text-body cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCats.includes(c.slug)}
                onChange={() => toggleSlug("categories", c.slug)}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="font-semibold text-ink mb-2">Brand</p>
        <div className="space-y-2 max-h-48 overflow-auto pr-2">
          {brnds.map((b) => (
            <label key={b.id} className="flex items-center gap-2 text-sm text-body cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBrands.includes(b.slug)}
                onChange={() => toggleSlug("brands", b.slug)}
              />
              <span>{b.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-ink mb-2">Condition</p>
        <div className="space-y-2">
          {CONDITIONS.map((co) => (
            <label key={co.value} className="flex items-center gap-2 text-sm text-body cursor-pointer">
              <input
                type="radio"
                checked={condition === co.value}
                onChange={() =>
                  updateParam((sp) => {
                    sp.set("condition", co.value);
                    sp.delete("page");
                  })
                }
              />
              <span>{co.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-ink mb-2">Price range (KES)</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Min"
            inputMode="numeric"
            className="min-w-0 w-full border border-border rounded px-2 py-1 text-sm"
            value={priceMin}
            onChange={(e) =>
              updateParam((sp) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                if (v) sp.set("priceMin", v);
                else sp.delete("priceMin");
                sp.delete("page");
              })
            }
          />
          <input
            placeholder="Max"
            inputMode="numeric"
            className="min-w-0 w-full border border-border rounded px-2 py-1 text-sm"
            value={priceMax}
            onChange={(e) =>
              updateParam((sp) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                if (v) sp.set("priceMax", v);
                else sp.delete("priceMax");
                sp.delete("page");
              })
            }
          />
        </div>
        <div className="mt-4">
          <input
            type="range"
            min={15000}
            max={280000}
            step={2500}
            value={Math.min(280000, Math.max(Number(priceMax) || maxPrice || 120000))}
            onChange={(e) =>
              updateParam((sp) => {
                sp.set("priceMax", String(e.target.value));
                sp.set("priceSliderMax", String(e.target.value));
                sp.delete("page");
              })
            }
            className="w-full"
          />
          <p className="text-xs text-muted mt-2">Slides update the maximum instantly.</p>
        </div>
      </div>

      <div>
        <label className="font-semibold text-ink mb-2 block">Storage</label>
        <input
          className="w-full border border-border rounded px-2 py-1 text-sm"
          placeholder="128GB · 256GB SSD"
          value={storageFilter}
          onChange={(e) =>
            updateParam((sp) => {
              const v = e.target.value;
              if (v) sp.set("storage", v);
              else sp.delete("storage");
              sp.delete("page");
            })
          }
        />
      </div>

      <div>
        <label className="font-semibold text-ink mb-2 block">Colour</label>
        <input
          className="w-full border border-border rounded px-2 py-1 text-sm"
          placeholder="Graphite · Silver"
          value={colorFilter}
          onChange={(e) =>
            updateParam((sp) => {
              const v = e.target.value;
              if (v) sp.set("color", v);
              else sp.delete("color");
              sp.delete("page");
            })
          }
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-body cursor-pointer">
        <input
          type="checkbox"
          checked={inStock === "true"}
          onChange={(e) =>
            updateParam((sp) => {
              if (e.target.checked) sp.set("inStock", "true");
              else sp.delete("inStock");
              sp.delete("page");
            })
          }
        />
        Available to order only
      </label>

      <Btn
        variant="secondary"
        className="w-full"
        onClick={() => setSearchParams(new URLSearchParams())}
      >
        Clear filters
      </Btn>
    </div>
  );

  const title = useMemo(() => {
    if (mode === "search") {
      if (!q) return "Search RefurbKE";
      return `${data.total} results for "${q}"`;
    }
    return "All products";
  }, [mode, q, data.total]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink">{title}</h1>
          {!data.total && !loading ? (
            <p className="text-sm text-muted mt-2">
              Try widening filters or explore{" "}
              <button type="button" className="text-primary underline" onClick={() => navigate("/products")}>
                the full storefront
              </button>
              .
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="lg:hidden px-2.5 sm:px-3 py-2 rounded border border-border text-sm font-medium"
            onClick={() => setDrawer(true)}
          >
            Filters
          </button>
          <select
            className="border border-border rounded-[6px] px-2 sm:px-3 py-2 text-sm bg-white text-ink w-[132px] sm:w-auto sm:min-w-[200px]"
            value={sort}
            onChange={(e) =>
              updateParam((sp) => {
                sp.set("sort", e.target.value);
                sp.delete("page");
              })
            }
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-72 shrink-0 border border-border rounded bg-white shadow-card self-start">
          <Sidebar />
        </aside>
        <div className="flex-1 space-y-4">
          {loading ? (
            <ProductGridSkeleton cols={mode === "search" ? 3 : 4} label="Loading products..." />
          ) : data.products.length === 0 ? (
            <div className="border border-dashed border-border rounded p-12 text-center text-muted">
              No refurbished units match right now — adjust filters or check back shortly.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {data.products.map((p) => (
                <ProductCard key={p.id} product={p} condition={condition} />
              ))}
            </div>
          )}
          <div className="flex gap-3 justify-center items-center pt-6">
            <Btn
              variant="ghost"
              disabled={page <= 1}
              onClick={() =>
                updateParam((sp) => {
                  sp.set("page", String(Math.max(1, page - 1)));
                })
              }
            >
              Previous
            </Btn>
            <span className="text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            <Btn
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() =>
                updateParam((sp) => {
                  sp.set("page", String(Math.min(totalPages, page + 1)));
                })
              }
            >
              Next
            </Btn>
          </div>
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/30" onClick={() => setDrawer(false)}>
          <div
            className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-white shadow-card overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b px-4 py-3">
              <p className="font-semibold text-ink">Filters</p>
              <button type="button" aria-label="Close" onClick={() => setDrawer(false)}>
                ✕
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}
    </div>
  );
}
