import { Link } from "react-router-dom";

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
  const faqs = [
    {
      q: "What does RefurbKE sell?",
      a: "RefurbKE lists refurbished phones, laptops, tablets, audio gear, and accessories. Some items are locally available, while concierge items may be sourced from international refurb marketplaces after payment.",
    },
    {
      q: "Are devices network unlocked?",
      a: "Listings state the known network status where available. For phones, customers should confirm Safaricom, Airtel, and other Kenyan network requirements before paying if a network lock would affect use.",
    },
    {
      q: "How long does delivery take?",
      a: "Typical delivery estimates are shown at checkout, but international sourcing, airline movement, freight forwarding, and KRA customs clearance can extend timelines. We share order updates as soon as they are available.",
    },
    {
      q: "Can I cancel after paying?",
      a: "Once funds are committed to the international seller, freight forwarder, or payment partner, change-of-mind cancellations are not available. Please review device model, grade, storage, colour, and delivery details before paying.",
    },
    {
      q: "What warranty do I get?",
      a: "Warranty terms depend on the product grade and listing. Where a defect is covered, RefurbKE may arrange inspection and repair through a certified local technician in Nairobi or Ruiru before considering other remedies.",
    },
    {
      q: "When should I report damage?",
      a: "Report visible physical damage within 24 hours of pickup or delivery, with clear photos and your order number. After that window, the item is treated as accepted in the condition delivered.",
    },
    {
      q: "Which payment methods are supported?",
      a: "Checkout is handled through Paystack, which can present supported card and mobile money options for KES payments. RefurbKE does not store your card CVV or M-Pesa PIN.",
    },
    {
      q: "Do prices change?",
      a: "Prices are listed in KES but may move before full payment because international electronics costs, freight, taxes, and the USD/KES exchange rate can change.",
    },
  ];

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Help center</p>
        <h1 className="text-3xl font-semibold text-ink mt-1">Frequently asked questions</h1>
        <p className="text-body mt-3 max-w-2xl">
          Clear answers for Kenyan buyers ordering refurbished electronics through RefurbKE.
        </p>
      </div>
      <div className="divide-y divide-border border border-border rounded bg-white shadow-card">
        {faqs.map((item, idx) => (
          <details key={item.q} className="group p-4" open={idx === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
              <span>{item.q}</span>
              <span className="text-primary group-open:rotate-45 transition">+</span>
            </summary>
            <p className="text-sm text-body mt-3 leading-6">{item.a}</p>
          </details>
        ))}
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
    <article className="max-w-4xl mx-auto px-4 py-12 text-body text-sm leading-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Legal</p>
        <h1 className="text-3xl font-semibold text-ink mt-1">Terms and Conditions</h1>
        <p className="mt-3">
          These Terms apply when you browse, reserve, or buy refurbished electronics through RefurbKE. Please
          read them carefully before placing an order.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">1. Our Role as a Concierge Sourcing Service</h2>
          <p>
            RefurbKE acts as a facilitator, sourcing agent, and concierge e-commerce service for customers in
            Kenya. We are not the original manufacturer, original seller, refurbisher, or warranty issuer for
            products sourced from third-party marketplaces such as Back Market or similar international
            suppliers.
          </p>
          <p>
            Product names, trademarks, and brand references belong to their respective owners and are used only
            to identify the goods requested by the customer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">2. Orders, Availability, and Pricing</h2>
          <p>
            An order is accepted only after full payment is received and we confirm that the item can be sourced.
            Because international inventory moves quickly, a product listed on our site may become unavailable
            before purchase from the third-party seller is completed.
          </p>
          <p>
            Prices are quoted in Kenyan Shillings and may change until the order is paid in full. Price changes
            may be caused by USD/KES exchange rate movements, seller price changes, freight costs, taxes, duties,
            or payment processing costs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">3. Payment and Non-Cancellation</h2>
          <p>
            Payments are processed through approved payment partners such as Paystack and supported mobile money
            or card channels. Once an order is placed and funds are committed to the international seller,
            freight forwarder, payment processor, or other order partner, the order cannot be cancelled or
            refunded for change of mind.
          </p>
          <p>
            You are responsible for checking the model, grade, storage, colour, price, delivery details, and
            these Terms before completing payment.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">4. Shipping, Customs, and Delivery Estimates</h2>
          <p>
            Delivery timelines are estimates only. International orders may depend on seller dispatch, warehouse
            intake, freight forwarders such as Savo Store or Aquantuo, airlines, local couriers, and Kenya Revenue
            Authority customs clearance.
          </p>
          <p>
            RefurbKE is not liable for delays caused by international carriers, airlines, freight forwarders,
            customs inspection, KRA clearance, public holidays, force majeure events, or inaccurate customer
            delivery information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">5. Inspection Window and Acceptance</h2>
          <p>
            You must inspect the item immediately on pickup or delivery. Any visible physical damage, missing
            item, or materially incorrect model must be reported to RefurbKE within exactly 24 hours of pickup or
            delivery, with clear photos, videos where useful, and the order number.
          </p>
          <p>
            After 24 hours, the item is deemed accepted "as is" for visible physical condition, packaging, and
            external accessories, except for covered functional defects under the applicable warranty terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">6. Limited Warranty and Local Repair</h2>
          <p>
            Refurbished electronics are pre-owned devices. Cosmetic wear is expected according to the listed
            grade. Warranty coverage, where offered, applies only to qualifying functional defects and excludes
            misuse, liquid contact, power surge damage, accidental damage, unauthorised repair, software
            tampering, or normal battery wear unless expressly stated.
          </p>
          <p>
            Because international returns can be costly and slow, RefurbKE reserves the right to inspect and
            repair a covered defective item through a certified local technician in Nairobi, Ruiru, or another
            suitable Kenyan service location instead of offering a full refund or international return.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">7. Customer Information and Delivery Accuracy</h2>
          <p>
            You must provide accurate names, phone numbers, email addresses, county, town or estate, building,
            road, and any pickup details required to complete delivery. RefurbKE may share necessary delivery
            information with couriers, freight partners, and order support providers.
          </p>
          <p>
            We are not responsible for failed delivery, extra courier costs, or delays caused by incorrect,
            incomplete, or unreachable customer contact details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">8. Data Protection</h2>
          <p>
            RefurbKE handles personal data in line with the Kenya Data Protection Act, 2019. We collect and use
            customer data such as name, email, phone number, delivery address, order history, and payment
            reference details for order fulfilment, customer support, fraud prevention, legal compliance, and
            payment reconciliation.
          </p>
          <p>
            Payment details are processed by third-party payment providers such as Paystack and mobile money
            partners. RefurbKE does not store your card CVV, card PIN, or M-Pesa PIN. We may retain transaction
            references and payment status records for accounting, tax, dispute, and support purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">9. Consumer Rights and Disputes</h2>
          <p>
            These Terms are intended to give clear information before you enter an online agreement. Nothing in
            these Terms removes rights that cannot be excluded under applicable Kenyan law.
          </p>
          <p>
            If a dispute arises, please contact RefurbKE first with your order number, issue description, and
            supporting evidence. We will review the matter in good faith and propose a practical remedy where the
            claim is valid.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-ink">10. Updates to These Terms</h2>
          <p>
            We may update these Terms from time to time to reflect changes in our business model, payment
            partners, logistics process, or legal requirements. The version posted on this page applies at the
            time you place your order.
          </p>
        </section>
      </div>
    </article>
  );
}

export function SuccessPage() {
  const orderNumber = new URLSearchParams(window.location.search).get("order");

  return (
    <article className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="border border-border rounded bg-white shadow-card p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Payment received</p>
        <h1 className="text-3xl font-semibold text-ink mt-2">Order is processing</h1>
        <p className="text-body mt-3">
          {orderNumber ? (
            <>
              Order <span className="font-semibold text-ink">{orderNumber}</span> is now in our fulfilment queue.
            </>
          ) : (
            "Your order is now in our fulfilment queue."
          )}
        </p>
        <p className="text-sm text-muted mt-2">
          We will send updates as sourcing, quality checks, customs clearance, and local dispatch progress.
        </p>
        <Link
          to="/account"
          className="inline-flex items-center justify-center px-4 py-2.5 text-[15px] font-medium rounded-[6px] transition border bg-primary text-white border-primary hover:bg-blue-700 mt-6"
        >
          View orders
        </Link>
      </div>
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
      <p>Payment payloads for M-Pesa and Paystack are processed by regulated partners; RefurbKE never writes your PIN or CVV.</p>
    </article>
  );
}
