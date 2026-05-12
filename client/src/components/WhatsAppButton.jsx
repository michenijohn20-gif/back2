const WHATSAPP_NUMBER = "254748241837";
const WHATSAPP_MESSAGE = "Hi RefurbKE, I'd like to ask about a refurbished device.";

export function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2 rounded-full border border-[#128C7E]/20 bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1EBE5D] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      aria-label="Chat with RefurbKE on WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none">
        <path
          d="M5.1 18.9 6 15.6A7.6 7.6 0 1 1 8.4 18l-3.3.9Z"
          fill="currentColor"
          opacity="0.95"
        />
        <path
          d="M9.3 8.3c-.2-.4-.4-.4-.7-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.6.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.4l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.6.1-.2-.1-1-.4-1.9-1.1-.7-.6-1.2-1.4-1.4-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-1.9Z"
          fill="#25D366"
        />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
