import { useContent } from "../../services/useContent";
import "./WhatsAppLink.css";
export function WhatsAppLink() {
  const { whatsapp: w } = useContent();
  if (!w.enabled) return null;
  return (
    <a
      className="whatsapp"
      href={
        "https://wa.me/" +
        w.phone.replace(/[^0-9]/g, "") +
        "?text=" +
        encodeURIComponent(w.message)
      }
      target="_blank"
      rel="noreferrer"
      aria-label={w.label}
    >
      <span className="whatsapp-tooltip">
        We are available! Click here to chat
      </span>
      <svg
        viewBox="0 0 32 32"
        width="36"
        height="36"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16 .8A15.1 15.1 0 0 0 3 23.6L.9 31l7.6-2A15.2 15.2 0 1 0 16 .8Zm0 27.7a12.6 12.6 0 0 1-6.4-1.7l-.5-.3-4.5 1.2 1.2-4.4-.3-.5A12.6 12.6 0 1 1 16 28.5Zm7-9.4c-.4-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.8.2l-1.2 1.4c-.2.2-.4.3-.8.1a10.3 10.3 0 0 1-3-1.9 11.4 11.4 0 0 1-2.1-2.6c-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.3 0-.5 0-.7l-1.2-2.8c-.3-.7-.6-.6-.8-.6h-.7c-.3 0-.7.1-1 .5a4.3 4.3 0 0 0-1.3 3.2c0 1.9 1.4 3.7 1.6 4 .2.2 2.7 4.1 6.5 5.7 2.4 1 3.4 1.1 4.6.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.3-.3-.7-.5Z" />
      </svg>
    </a>
  );
}
