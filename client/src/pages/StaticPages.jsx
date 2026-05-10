export function AboutPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-neutral">
      <h1 className="text-3xl font-semibold text-ink">About RefurbKE</h1>
      <p className="text-body">
        RefurbKE is Nairobi’s speciality refurb storefront for Kenyan buyers who want inspected electronics
        priced in Kenyan Shillings—not grey imports with surprise duties. Founder-operated sourcing keeps
        quality control tight from intake to courier handoff.
      </p>
      <p className="text-body">
        Every unit is photographed, battery‑tested where applicable, and matched to honest Excellent / Good /
        Fair grading so you know exactly what is arriving in Mombasa, Kisumu, Eldoret, or right here in the
        capital.
      </p>
    </article>
  );
}

export function FaqPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      <h1 className="text-3xl font-semibold text-ink">Frequently asked questions</h1>
      <div className="space-y-3 text-body text-sm">
        <p className="font-semibold text-ink">Are devices network unlocked?</p>
        <p>Phones ship carrier policy dependent; we annotate each listing when a unit arrives unlocked for Safaricom, Airtel, or Faiba LTE.</p>
        <p className="font-semibold text-ink">How fast is delivery?</p>
        <p>Nairobi courier routes dispatch in 5–9 business days on average once payment settles. Counties outside Nairobi may add a rural last‑mile hop.</p>
        <p className="font-semibold text-ink">Do you negotiate prices?</p>
        <p>Listed KES totals already bake in reseller margin; bundle quotes for NGOs or schools welcome via email.</p>
      </div>
    </article>
  );
}

export function ContactPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 space-y-3">
      <h1 className="text-3xl font-semibold text-ink">Contact RefurbKE</h1>
      <p className="text-body">
        Email{" "}
        <a href="mailto:support@refurbke.ke" className="text-primary">
          support@refurbke.ke
        </a>{" "}
        — we reply same business day between 09:00 and 18:00 EAT.
      </p>
      <p className="text-body">Visit-in appointments can be organised along Mombasa Road logistics hubs by prior booking.</p>
    </article>
  );
}

export function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 space-y-3 text-body text-sm">
      <h1 className="text-3xl font-semibold text-ink">Terms of service</h1>
      <p>
        Purchasing from RefurbKE means you agree shipments originate from Kenya, invoices are denominated in
        KES, and warranties are limited to faults not caused by power surges, liquid contact, or
        unauthorised servicing.
      </p>
      <p>Returns follow the grading-specific window quoted on checkout; accessories must remain factory paired.</p>
    </article>
  );
}

export function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 space-y-3 text-body text-sm">
      <h1 className="text-3xl font-semibold text-ink">Privacy policy</h1>
      <p>
        We store your name, email, phone, and delivery counties solely to fulfil orders, send transactional
        updates, and satisfy tax record keeping under Kenyan regulations.
      </p>
      <p>Payment payloads for M-Pesa and Pesapal are processed by regulated partners; RefurbKE never writes your PIN or CVV.</p>
    </article>
  );
}
