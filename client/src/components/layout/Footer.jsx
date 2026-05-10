import { Link } from "react-router-dom";

function IconMpesa() {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
      <span className="w-7 h-7 rounded bg-[#4CAF50] text-white flex items-center justify-center text-xs">
        M
      </span>
      M-Pesa
    </span>
  );
}

function IconCards() {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-body">
      <span className="px-2 py-1 border border-border rounded bg-white">Visa</span>
      <span className="px-2 py-1 border border-border rounded bg-white">Mastercard</span>
    </span>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-bold text-ink text-lg">
            Refurb<span className="text-primary">KE</span>
          </p>
          <p className="text-sm text-muted mt-2">
            Curated refurbished tech for Kenya. Tested, priced in KES, delivered from Nairobi.
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink mb-2">Help</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link className="hover:text-primary" to="/about">
                About
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary" to="/faq">
                FAQ
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary" to="/contact">
                Contact
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary" to="/terms">
                Terms
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary" to="/privacy">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink mb-2">Payments</p>
          <div className="flex flex-wrap gap-4 items-center">
            <IconMpesa />
            <IconCards />
          </div>
          <div className="flex gap-3 mt-4 text-muted text-sm">
            <a href="https://twitter.com" className="hover:text-primary">
              Twitter
            </a>
            <a href="https://instagram.com" className="hover:text-primary">
              Instagram
            </a>
            <a href="https://facebook.com" className="hover:text-primary">
              Facebook
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} RefurbKE — Nairobi, Kenya
      </div>
    </footer>
  );
}
