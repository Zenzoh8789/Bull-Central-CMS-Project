import { MediaDealerStateContext } from "./MediaDealerStateContext";
import { dealerState } from "../utils/dealerState";
import { ItemSaveContext } from "./ItemSaveContext";
import { normalizeEditorSection } from "@bull/content/editing";
import { SectionFields } from "./SectionFields";
import { useEffect, useState, useRef } from "react";
import { Save, LoaderCircle } from "lucide-react";
import { normalizeNews, supportsNewsArticles } from "@bull/content/news";
import { useReadQuery, errorText } from "../services/api";
import { useAppSelector } from "../store";
import { NewsEditor } from "./NewsEditor";
import { useSaveDraftMutation } from "../services/drafts";
import { Status } from "./Status";
import { type ContentLayer, type EditorState } from "./contentSections";

export function SectionEditor({
  section,
  layer,
  owner,
  onStateChange,
  variant,
  readOnly = false,
}: {
  section: string;
  variant?: string;
  readOnly?: boolean;
  layer: ContentLayer;
  owner: number;
  onStateChange: (state: EditorState) => void;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const registry = useReadQuery("registry", {
    refetchOnMountOrArgChange: true,
  });
  const drafts = useReadQuery("drafts");
  const media = useReadQuery("media");
  const dealerScope = layer === "DEALER" || layer === "OVERRIDE";
  const resolved = useReadQuery(`dealers/${owner}/resolved`, {
    skip: !owner || !dealerScope,
  });
  const dealer = resolved.currentData?.dealer;
  const mediaState = dealer?.state?.trim() || (dealer ? dealerState(dealer.location) : "");
  const common = useReadQuery("common/resolved", { skip: layer !== "COMMON" });
  const [write, { isLoading }] = useSaveDraftMutation();
  const [doc, setDoc] = useState<any>(null);
  const docRef = useRef<any>(null);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [remove, setRemove] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const definition = registry.data?.find((item: any) => item.key === section);
  const draft = drafts.data?.find(
    (item: any) =>
      item.layer === layer &&
      item.owner_id === (layer === "COMMON" ? 0 : owner) &&
      item.section_key === section,
  );
  const newsReady = section !== "news" || supportsNewsArticles(definition);

  useEffect(() => {
    if (doc !== null || !definition || drafts.isLoading || drafts.isError)
      return;
    if (dealerScope && (!owner || resolved.isFetching || resolved.isError))
      return;
    if (layer === "COMMON" && (common.isFetching || common.isError)) return;
    const source =
      draft?.document ||
      (layer === "COMMON" ? common.currentData?.content?.[section] : null) ||
      (dealerScope ? resolved.currentData?.content?.[section] : null) ||
      definition.defaultValue;
    const initial =
      section === "news"
        ? normalizeNews(source)
        : normalizeEditorSection(
            section,
            source,
            resolved.currentData?.content,
          );
    if (section === "contact" && initial && initial.bannerAlt === undefined)
      initial.bannerAlt = "Contact Us";
    if (section === "social" && variant === "social" && initial) initial.enabled = true;
    if (section === "locations" && variant === "location" && initial) {
      const dealer = resolved.currentData?.content?.dealerContact;
      const first = initial.items?.[0] || definition.defaultValue.items[0];
      const custom = draft || resolved.currentData?.sources?.locations;
      initial.items = [{ ...first,
        title: "Dealer location",
        ...(!custom && dealer ? { name: dealer.name, address: dealer.address, phone: dealer.phone, email: dealer.email } : {}),
      }];
    }
    docRef.current = initial;
    setDoc(initial);
    setRevision(draft?.revision || 0);
    setRemove(false);
  }, [
    doc,
    definition,
    draft,
    drafts.isLoading,
    drafts.isError,
    dealerScope,
    owner,
    resolved.isFetching,
    resolved.isError,
    resolved.currentData,
    common.currentData,
    common.isFetching,
    common.isError,
    layer,
    section,
    variant,
  ]);

  useEffect(() => {
    onStateChange({ dirty, busy: uploading || isLoading });
  }, [dirty, uploading, isLoading, onStateChange]);
  useEffect(
    () => () => onStateChange({ dirty: false, busy: false }),
    [onStateChange],
  );
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty || uploading || isLoading) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, uploading, isLoading]);

  const change = (value: any) => {
    docRef.current = value;
    setDoc(value);
    setDirty(true);
    setMessage("");
  };
  const persist = async () => {
    if (
      readOnly ||
      uploading ||
      isLoading ||
      !newsReady ||
      (layer !== "COMMON" && !owner)
    )
      throw new Error("The editor is not ready to save.");
    setMessage("");
    setFailed(false);
    try {
      const saved = await write({
        layer,
        ownerId: layer === "COMMON" ? 0 : owner,
        section,
        document: docRef.current,
        expectedRevision: revision,
        removeOverride: remove,
      }).unwrap();
      setRevision(saved.revision);
      docRef.current = saved.document;
      setDoc(saved.document);
      setDirty(false);
      setFailed(Boolean(saved.publishError));
      setMessage(
        saved.published
          ? "Changes published."
          : "Draft saved. " +
              (saved.publishError || "Ready for administrator approval."),
      );
    } catch (error) {
      setFailed(true);
      setMessage(errorText(error));
      throw error;
    }
  };
  return (
    <div className="section-editor">
      <Status query={registry} />
      <Status query={drafts} />
      {layer === "COMMON" && <Status query={common} />}
      {dealerScope && <Status query={resolved} />}
      {!registry.isLoading && !registry.isError && !definition && (
        <p className="empty-state">This section is unavailable.</p>
      )}
      {doc && definition && !drafts.isError && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              uploading ||
              isLoading ||
              !newsReady ||
              (layer !== "COMMON" && !owner)
            )
              return;
            await persist().catch(() => {});
          }}
        >
          {!newsReady && (
            <p className="error" role="alert">
              News editing is unavailable with the current server version.
              Update the API and reload.
            </p>
          )}
          <MediaDealerStateContext.Provider value={mediaState}>
          <ItemSaveContext.Provider value={persist}>
            <fieldset
              disabled={
                readOnly || remove || isLoading || uploading || !newsReady
              }
            >
              {section === "news" ? (
                <NewsEditor
                  value={doc}
                  onChange={change}
                  onUploadingChange={setUploading}
                />
              ) : (
                <SectionFields
                  section={section}
                  variant={variant}
                  value={doc}
                  template={normalizeEditorSection(
                    section,
                    definition.template || definition.defaultValue,
                  )}
                  media={media.data || []}
                  onChange={change}
                  onUploadingChange={setUploading}
                />
              )}
            </fieldset>
          </ItemSaveContext.Provider>
          </MediaDealerStateContext.Provider>
          {!readOnly && (
            <div className="sticky-actions">
              <span
                className={
                  failed ? "editor-feedback is-error" : "editor-feedback"
                }
                role={failed ? "alert" : "status"}
              >
                {uploading ? "Uploading…" : message}
              </span>
              <button
                className="primary"
                disabled={
                  isLoading ||
                  uploading ||
                  !newsReady ||
                  (layer !== "COMMON" && !owner)
                }
              >
                {isLoading ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Save size={17} />
                )}
                {isLoading
                  ? "Saving…"
                  : user.role === "EDITOR"
                    ? "Save draft"
                    : "Save"}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
