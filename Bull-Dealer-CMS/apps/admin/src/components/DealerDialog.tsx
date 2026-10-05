import { useEffect, useRef, useState } from "react";
import { X, Pencil } from "lucide-react";
import { useWriteMutation, errorText } from "../services/api";
import { useAppSelector } from "../store";
export function DealerDialog({
  dealer,
  onClose,
}: {
  dealer: any;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const [current, setCurrent] = useState(dealer);
  const user = useAppSelector((s) => s.auth.user);
  const [write, { isLoading }] = useWriteMutation();
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function close() {
    if (
      !isLoading &&
      (!editing || window.confirm("Discard unsaved dealer edits?"))
    )
      onClose();
  }
  return (
    <dialog
      className="dealer-dialog"
      ref={dialog}
      aria-labelledby="dealer-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">DEALER DETAILS</span>
          <h2 id="dealer-dialog-title">{current.name}</h2>
        </div>
        <button
          aria-label="Close dealer details"
          onClick={close}
          disabled={isLoading}
        >
          <X size={20} />
        </button>
      </div>
      {saved && (
        <p className="notice" role="status">
          Dealer changes saved.
        </p>
      )}
      {editing ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const f = new FormData(e.currentTarget);
            const body = {
              name: String(f.get("name")).trim(),
              location: String(f.get("location")).trim(),
              address: String(f.get("address")).trim(),
              about: String(f.get("about")).trim(),
              domains: String(f.get("domains"))
                .split(/[\s,]+/)
                .filter(Boolean),
              active: f.get("active") === "true",
            };
            try {
              await write({
                path: `dealers/${current.id}`,
                method: "PUT",
                body,
              }).unwrap();
              setCurrent({ ...current, ...body });
              setEditing(false);
              setSaved(true);
            } catch (err) {
              setError(errorText(err));
            }
          }}
        >
          <fieldset disabled={isLoading}>
            <div className="dealer-form-grid">
              <label>
                Dealer Name
                <input
                  name="name"
                  required
                  maxLength={200}
                  defaultValue={current.name}
                />
              </label>
              <label>
                Location / State
                <input
                  name="location"
                  required
                  maxLength={100}
                  defaultValue={current.location}
                />
              </label>
            </div>
            <label>
              Address
              <textarea
                name="address"
                required
                maxLength={2000}
                defaultValue={current.address}
              />
            </label>
            <label>
              About
              <textarea
                name="about"
                required
                maxLength={20000}
                defaultValue={current.about}
              />
            </label>
            <label>
              Domains
              <textarea
                name="domains"
                required
                defaultValue={current.domains.join("\n")}
              />
            </label>
            <label>
              Status
              <select
                name="active"
                defaultValue={String(Boolean(current.active))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="actions">
            <button className="primary" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setEditing(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <dl className="dealer-details">
            {[
              ["Location", current.location],
              ["Status", current.active ? "Active" : "Inactive"],
              ["Address", current.address],
              ["About", current.about],
              ["Domains", current.domains.join(", ")],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "—"}</dd>
              </div>
            ))}
          </dl>
          {user?.role === "SUPER_ADMIN" && (
            <button
              className="primary"
              onClick={() => {
                setEditing(true);
                setSaved(false);
              }}
            >
              <Pencil size={16} /> Edit Dealer
            </button>
          )}
        </>
      )}
    </dialog>
  );
}
