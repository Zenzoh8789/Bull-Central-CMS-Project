import { normalizeNews, supportsNewsArticles } from "@bull/content/news";
import { NewsEditor } from "../components/NewsEditor";
import { useState, useEffect } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { useReadQuery, useWriteMutation, errorText } from "../services/api";
import { useAppSelector } from "../store";
import { Fields } from "../components/Fields";
import { Status } from "../components/Status";
export function Content() {
  const [params] = useSearchParams();
  const { setEditorState } = useOutletContext<{
    setEditorState: (state: { dirty: boolean; busy: boolean }) => void;
  }>();
  const user = useAppSelector((s) => s.auth.user);
  const registry = useReadQuery("registry", {
      refetchOnMountOrArgChange: true,
    }),
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
  const editorKey = layer + ":" + owner + ":" + section;
  const [loadedKey, setLoadedKey] = useState("");
  const [doc, setDoc] = useState<any>(null);
  const [revision, setRevision] = useState(0);
  const [remove, setRemove] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    setEditorState({ dirty, busy: uploading || isLoading });
    return () => setEditorState({ dirty: false, busy: false });
  }, [dirty, uploading, isLoading, setEditorState]);
  const definition = registry.data?.find((r: any) => r.key === section);
  const newsApiReady = section !== "news" || supportsNewsArticles(definition);
  const draft = drafts.data?.find(
    (d: any) =>
      d.layer === layer &&
      d.owner_id === (layer === "COMMON" ? 0 : owner) &&
      d.section_key === section,
  );
  useEffect(() => {
    if (loadedKey === editorKey && dirty) return;
    if (
      owner &&
      ["DEALER", "OVERRIDE"].includes(layer) &&
      !draft &&
      (resolved.isFetching || resolved.isError)
    )
      return;
    if (definition && !drafts.isLoading) {
      setDoc(
        (section === "news" ? normalizeNews : structuredClone)(
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
    resolved.isFetching,
    resolved.isError,
    loadedKey,
    dirty,
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
        Manage your website from the sidebar. Save changes to update the
        selected websites.
      </p>
      <div className="toolbar">
        <label>
          Content layer
          <select
            disabled={uploading || isLoading}
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
              disabled={uploading || isLoading}
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
                if (uploading || isLoading) return;
                if (!newsApiReady) {
                  setMessage(
                    "The API is running the old News schema. Rebuild and restart the API with this update, then reload this page.",
                  );
                  return;
                }
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
                  setDoc(saved.document);
                  setDirty(false);
                  setMessage(
                    saved.published
                      ? "Saved and published to the selected website(s)."
                      : "Draft saved. " +
                          (saved.publishError ||
                            "An administrator must publish this draft."),
                  );
                } catch (e) {
                  setMessage(errorText(e));
                }
              }}
            >
              <h2>{definition.label}</h2>
              {!newsApiReady && (
                <p role="alert">
                  The API is running the old News schema and cannot save blog
                  articles. Install the complete news update, rebuild and
                  restart the API, then reload this page. Your article has not
                  been saved.
                </p>
              )}
              {section === "news" && (
                <p>
                  Choose an image from your computer and write your article.
                  View More opens this article; More News returns to the News
                  and Updates listing.
                </p>
              )}
              <p>
                Changes apply to{" "}
                {layer === "COMMON"
                  ? "all active dealers (except sections with an override)"
                  : "the selected " +
                    (layer === "GROUP" ? "dealer group" : "dealer")}
                . Editors save drafts for administrator publishing.
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
              <fieldset disabled={remove || isLoading || uploading}>
                <>
                  {section === "news" ? (
                    <NewsEditor
                      key={editorKey}
                      value={doc}
                      onUploadingChange={setUploading}
                      onChange={(v) => {
                        setDoc(v);
                        setDirty(true);
                      }}
                    />
                  ) : (
                    <Fields
                      key={editorKey}
                      path={section}
                      value={doc}
                      template={definition.template || definition.defaultValue}
                      media={media.data || []}
                      onUploadingChange={setUploading}
                      onChange={(v) => {
                        setDoc(v);
                        setDirty(true);
                      }}
                    />
                  )}
                </>
              </fieldset>
              <div className="sticky-actions">
                <button
                  className="primary"
                  disabled={
                    isLoading ||
                    uploading ||
                    !newsApiReady ||
                    (!owner && layer !== "COMMON")
                  }
                >
                  {isLoading
                    ? "Saving…"
                    : user.role === "EDITOR"
                      ? "Save draft"
                      : "Save & publish"}
                </button>
                <span role="status">{message}</span>
              </div>
            </form>
          )}
      </div>
    </>
  );
}
