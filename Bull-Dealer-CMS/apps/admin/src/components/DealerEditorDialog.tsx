import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useReadQuery, useWriteMutation, errorText } from "../services/api";
import { CmsDialog } from "./CmsDialog";
import { SectionWorkspace } from "./SectionWorkspace";
import { contentSections, type EditorState } from "./contentSections";
import { Status } from "./Status";

export function DealerEditorDialog({
  dealer,
  onClose,
}: {
  dealer: any;
  onClose: () => void;
}) {
  const [section, setSection] = useState(dealer.id ? "seo" : "details");
  const [state, setState] = useState<EditorState>({
    dirty: false,
    busy: false,
  });
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [current, setCurrent] = useState(dealer);
  const [domains, setDomains] = useState((dealer.domains || []).join("\n"));
  const [message, setMessage] = useState("");
  const [write, { isLoading }] = useWriteMutation();
  const registry = useReadQuery("registry");
  const busy = state.busy || isLoading;
  const dirty = state.dirty || detailsDirty;
  const leave = (action: () => void) => {
    if (!busy && (!dirty || window.confirm("Discard unsaved edits?"))) action();
  };
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (detailsDirty || isLoading) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [detailsDirty, isLoading]);
  const select = (key: string) => {
    if (section === key) return;
    leave(() => {
      setSection(key);
      setDetailsDirty(false);
      setMessage("");
      setCurrent(dealer);
      setDomains((dealer.domains || []).join("\n"));
    });
  };
  const update = (key: string, value: string | boolean) => {
    setCurrent({ ...current, [key]: value });
    setDetailsDirty(true);
  };
  return (
    <CmsDialog
      title={dealer.id ? dealer.name : "Add dealer"}

      wide={Boolean(dealer.id)}
      busy={busy}
      onClose={() => leave(onClose)}
    >
      {dealer.id && (
        <nav
          className="section-tabs dealer-section-tabs"
          aria-label="Dealer website sections"
        >
          {contentSections
            .filter((s) => registry.data?.some((r: any) => r.key === s.key))
            .map((s) => (
              <button
                key={s.key}
                type="button"
                disabled={busy}
                className={section === s.key ? "selected" : ""}
                aria-current={section === s.key ? "page" : undefined}
                onClick={() => select(s.key)}
              >
                {s.label}
              </button>
            ))}
        </nav>
      )}
      <div className="cms-dialog-body">
        {section === "details" ? (
          <form
            className="dealer-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setMessage("");
              try {
                await write({
                  path: "dealers" + (dealer.id ? "/" + dealer.id : ""),
                  method: dealer.id ? "PUT" : "POST",
                  body: {
                    ...current,
                    active: Boolean(current.active),
                    domains: domains.split(/[\s,]+/).filter(Boolean),
                  },
                }).unwrap();
                setDetailsDirty(false);
                onClose();
              } catch (error) {
                setMessage(errorText(error));
              }
            }}
          >
            <fieldset disabled={isLoading}>
              <div className="field-grid">
                <label>
                  Dealer name
                  <input
                    required
                    maxLength={200}
                    value={current.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </label>
                <label>
                  Location / state
                  <input
                    required
                    maxLength={100}
                    value={current.location}
                    onChange={(e) => update("location", e.target.value)}
                  />
                </label>
                <label className="wide">
                  Address
                  <textarea
                    required
                    maxLength={2000}
                    value={current.address}
                    onChange={(e) => update("address", e.target.value)}
                  />
                </label>
                <label>
                  State
                  <input
                    maxLength={100}
                    value={current.state || ""}
                    onChange={(e) => update("state", e.target.value)}
                  />
                </label>
                <label>
                  District
                  <input
                    maxLength={100}
                    value={current.district || ""}
                    onChange={(e) => update("district", e.target.value)}
                  />
                </label>
                <label className="wide">
                  About
                  <textarea
                    required
                    maxLength={20000}
                    value={current.about}
                    onChange={(e) => update("about", e.target.value)}
                  />
                </label>
                <label className="wide">
                  Domains<small>One domain per line</small>
                  <textarea
                    required
                    value={domains}
                    onChange={(e) => {
                      setDomains(e.target.value);
                      setDetailsDirty(true);
                    }}
                  />
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={Boolean(current.active)}
                    onChange={(e) => update("active", e.target.checked)}
                  />
                  Active website
                </label>
              </div>
            </fieldset>
            {message && (
              <p className="error" role="alert">
                {message}
              </p>
            )}
            <div className="sticky-actions">
              <button
                type="button"
                disabled={busy}
                onClick={() => leave(onClose)}
              >
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                <Save size={16} />
                {isLoading ? "Saving…" : "Save dealer"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <Status query={registry} />
            <SectionWorkspace
              key={`${dealer.id}:${section}`}
              section={section}
              layer="OVERRIDE"
              owner={dealer.id}
              onStateChange={setState}
            />
          </>
        )}
      </div>
    </CmsDialog>
  );
}
