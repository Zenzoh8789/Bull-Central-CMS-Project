import { useState } from "react";
import { useContent } from "../../services/useContent";
import { useEnquiryMutation } from "../../services/siteApi";
import "./EnquiryForm.css";
export function EnquiryForm({
  selected = "Help me choose",
}: {
  selected?: string;
}) {
  const { contact: c, products: p } = useContent();
  const [submit, { isLoading }] = useEnquiryMutation();
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  if (!c.enabled) return null;
  if (reference)
    return (
      <div role="status">
        <h2>{c.successMessage}</h2>
        <p>Reference: {reference}</p>
      </div>
    );
  return (
    <form
      className="enquiry-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const f = new FormData(e.currentTarget);
        try {
          const result = await submit({
            name: String(f.get("name") || ""),
            phone: String(f.get("phone") || ""),
            email: String(f.get("email") || ""),
            address: String(f.get("address") || ""),
            district: String(f.get("district") || ""),
            message: String(f.get("message") || ""),
            product: String(f.get("product") || "Help me choose"),
            consent: f.get("consent") === "on",
          }).unwrap();
          setReference(result.reference);
        } catch (e: any) {
          setError(
            Array.isArray(e.data?.message)
              ? e.data.message.join(". ")
              : e.data?.message || "Unable to send. Please try again.",
          );
        }
      }}
    >
      <div className="enquiry-fields">
        {c.fields.map((f: any) => (
          <label key={f.name}>
            {f.label}
            {f.required ? " *" : ""}
            {["message", "address"].includes(f.name) ? (
              <textarea
                name={f.name}
                required={f.required}
                maxLength={f.name === "address" ? 1000 : 2000}
                rows={3}
                placeholder={f.placeholder}
              />
            ) : (
              <input
                name={f.name}
                required={f.required}
                type={
                  f.name === "email"
                    ? "email"
                    : f.name === "phone"
                      ? "tel"
                      : "text"
                }
                maxLength={
                  f.name === "phone" ? 20 : f.name === "name" ? 100 : 150
                }
                pattern={f.name === "phone" ? "[+0-9 ()-]{10,20}" : undefined}
                placeholder={f.placeholder}
              />
            )}
          </label>
        ))}
      </div>
      <label>
        Equipment
        <select name="product" defaultValue={selected || "Help me choose"}>
          <option>Help me choose</option>
          {p.enabled &&
            p.items.map((p: any) => <option key={p.id}>{p.name}</option>)}
          <option>Service & spare parts</option>
        </select>
      </label>
      <label className="consent">
        <input name="consent" type="checkbox" required />
        {c.consentLabel}
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="button yellow" disabled={isLoading}>
        {isLoading ? "Sending…" : c.submitLabel}
      </button>
    </form>
  );
}
