import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useReadQuery, useWriteMutation, errorText } from "../services/api";
import { useAppSelector } from "../store";
import { Fields } from "../components/Fields";
import { Status } from "../components/Status";
export function Content() {
  const [params, setParams] = useSearchParams();
  const user = useAppSelector((s) => s.auth.user);
  const registry = useReadQuery("registry"),
    drafts = useReadQuery("drafts"),
    dealers = useReadQuery("dealers"),
    groups = useReadQuery("groups"),
    media = useReadQuery("media");
  const [write, { isLoading }] = useWriteMutation();
  const [layer, setLayer] = useState(
    user.role === "DEALER_ADMIN" ? "DEALER" : "COMMON",
  );
  const [owner, setOwner] = useState(user.dealer_id || 0);
  const resolved = useReadQuery("dealers/" + owner + "/resolved", {
    skip: !owner || !["DEALER", "OVERRIDE"].includes(layer),
  });
  const section = params.get("section") || "banners";
  const setSection = (key: string) => setParams({ section: key });
  const editorKey = layer + ":" + owner + ":" + section;
  const [loadedKey, setLoadedKey] = useState("");
  const [doc, setDoc] = useState<any>(null);
  const [revision, setRevision] = useState(0);
  const [remove, setRemove] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const definition = registry.data?.find((r: any) => r.key === section);
  const draft = drafts.data?.find(
    (d: any) =>
      d.layer === layer &&
      d.owner_id === (layer === "COMMON" ? 0 : owner) &&
      d.section_key === section,
  );
  useEffect(() => {
    if (definition && !drafts.isLoading) {
      setDoc(
        structuredClone(
          draft?.document ||
            resolved.currentData?.content[section] ||
            definition.defaultValue,
        ),
      );
      setLoadedKey(editorKey);
      setRevision(draft?.revision || 0);
      setRemove(Boolean(draft?.remove_override));
      setDirty(false);
    }
  }, [
    editorKey,
    definition,
    draft,
    layer,
    owner,
    section,
    resolved.currentData,
    drafts.isLoading,
  ]);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty]);
  const changeScope = (f: () => void) => {
    if (!dirty || window.confirm("Discard unsaved edits?")) {
      setMessage("");
      f();
    }
  };
  return (
    <>
      <h1>Website content</h1>
      <p>
        Edit all 20 website sections. Save a draft, then review the target
        dealers on Publish.
      </p>
      <div className="toolbar">
        <label>
          Content layer
          <select
            value={layer}
            onChange={(e) =>
              changeScope(() => {
                setLayer(e.target.value);
                setOwner(
                  e.target.value === "GROUP"
                    ? groups.data?.[0]?.id || 0
                    : user.dealer_id || dealers.data?.[0]?.id || 0,
                );
              })
            }
          >
            {(user.role === "DEALER_ADMIN"
              ? ["DEALER", "OVERRIDE"]
              : ["COMMON", "GROUP", "DEALER", "OVERRIDE"]
            ).map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        {layer !== "COMMON" && (
          <label>
            {layer === "GROUP" ? "Group" : "Dealer"}
            <select
              value={owner}
              onChange={(e) =>
                changeScope(() => setOwner(Number(e.target.value)))
              }
            >
              <option value="0">Choose…</option>
              {(layer === "GROUP" ? groups.data : dealers.data)?.map(
                (v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ),
              )}
            </select>
          </label>
        )}
        <span className="badge">
          {dirty
            ? "Unsaved edits"
            : revision
              ? "Draft revision " + revision
              : "New draft"}
        </span>
      </div>
      <Status query={registry} />
      <Status query={drafts} />
      <div className="editor-layout">
        <nav className="section-list" aria-label="Editable sections">
          {registry.data?.map((r: any) => (
            <button
              key={r.key}
              className={section === r.key ? "selected" : ""}
              onClick={() => changeScope(() => setSection(r.key))}
            >
              {r.label}
              <small>{r.preferredScope.toLowerCase()}</small>
            </button>
          ))}
        </nav>
        {doc &&
          loadedKey === editorKey &&
          definition &&
          !drafts.isLoading &&
          !drafts.isError && (
            <form
              className="panel"
              onSubmit={async (e) => {
                e.preventDefault();
                setMessage("");
                try {
                  const saved = await write({
                    path: "drafts",
                    body: {
                      layer,
                      ownerId: layer === "COMMON" ? 0 : owner,
                      section,
                      document: doc,
                      expectedRevision: revision,
                      removeOverride: remove,
                    },
                  }).unwrap();
                  setRevision(saved.revision);
                  setDirty(false);
                  setMessage("Draft saved. Publish it to update the website.");
                } catch (e) {
                  setMessage(errorText(e));
                }
              }}
            >
              <h2>{definition.label}</h2>
              <p>
                Preferred scope: {definition.preferredScope.toLowerCase()}. This
                editor replaces the complete section at the chosen layer.
              </p>
              {layer === "OVERRIDE" && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={remove}
                    onChange={(e) => {
                      setRemove(e.target.checked);
                      setDirty(true);
                    }}
                  />
                  Remove explicit override on publish and return to inherited
                  content
                </label>
              )}
              <fieldset disabled={remove}>
                <Fields
                  value={doc}
                  template={definition.defaultValue}
                  media={media.data || []}
                  onChange={(v) => {
                    setDoc(v);
                    setDirty(true);
                  }}
                />
              </fieldset>
              <div className="sticky-actions">
                <button
                  className="primary"
                  disabled={isLoading || (!owner && layer !== "COMMON")}
                >
                  {isLoading ? "Saving…" : "Save draft"}
                </button>
                <span role="status">{message}</span>
              </div>
            </form>
          )}
      </div>
    </>
  );
}
