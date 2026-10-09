import { MediaDealerStateContext } from "./MediaDealerStateContext";
import { ItemSaveContext } from "./ItemSaveContext";
import { errorText } from "../services/api";
import { ContentTextarea } from "./ContentTextarea";
import { YouTubeField } from "./YouTubeField";
import "./Fields.css";
import { useState, useContext } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CmsDialog } from "./CmsDialog";
const blankItem = (v: any): any =>
  Array.isArray(v)
    ? []
    : v && typeof v === "object"
      ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankItem(x)]))
      : typeof v === "boolean"
        ? false
        : typeof v === "number"
          ? 0
          : "";
import { MediaField } from "./MediaField";
const title = (s: string) =>
  s.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
export function Fields({
  value,
  template,
  onChange,
  path = "",
  variant,
  media = [],
  onUploadingChange,
}: {
  value: any;
  template: any;
  onChange: (v: any) => void;
  path?: string;
  variant?: string;
  media?: any[];
  onUploadingChange?: (busy: boolean) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [itemDraft, setItemDraft] = useState<any>(null);
  const persist = useContext(ItemSaveContext);
  const dealerState = useContext(MediaDealerStateContext);
  const [viewOnly, setViewOnly] = useState(false);
  const [itemError, setItemError] = useState("");
  const [busy, setBusy] = useState(false);
  value = value ?? structuredClone(template);
  if (Array.isArray(template)) {
    const fixedItems =
      (path === "social.items" && variant === "contact-social") ||
      path === "contact.fields" ||
      path === "pageLayout.sections" ||
      path === "statistics.items";
    const itemName = (v: any, i: number) =>
      (path === "products.items" && variant === "menu" && v.menuLabel) || v.title || v.label || v.name || v.heading || v.alt || "Item " + (i + 1);
    const openItem = (item: any, index: number, readonly = false) => {
      setViewOnly(readonly);
      setItemError("");
      setItemDraft(path === "deliveryMedia.items" ? { ...structuredClone(item), state: dealerState } : structuredClone(item));
      setExpanded(index);
    };
    const closeItem = () => {
      if (!busy) {
        setExpanded(null);
        setItemDraft(null);
      }
    };
    return (
      <div
        className={
          "array-editor" + (path === "products.items" ? " product-list" : "")
        }
      >
        <div className="array-title">
          <strong>
            {title(path.split(".").pop() || "Items")} ({value.length})
          </strong>
          {!fixedItems && variant !== "contact-social" && (
            <button
              type="button"
              disabled={busy || value.length >= 150}
              onClick={() => {
                const next = blankItem(template[0]);
                if (path === "deliveryMedia.items") next.type = "photo";
                if (path === "news.items") {
                  next.slug = "news-" + crypto.randomUUID();
                  next.date = new Date().toISOString().slice(0, 10);
                }
                if (path === "products.items") {
                  next.id = "product-" + crypto.randomUUID().slice(0, 12);
                  next.showInMenu = true;
                  next.menuOrder = value.length;
                  next.category = template[0].category;
                }
                openItem(next, value.length);
              }}
            >
              <Plus size={20} />
              {path === "products.items" && variant === "menu" ? "New Item" : "Add item"}
            </button>
          )}
        </div>
        {itemError && expanded === null && (
          <p className="error" role="alert">
            {itemError}
          </p>
        )}
        <div className="content-table-wrap">
          <table className="content-table">
            <thead>
              <tr>
                <th>#</th>
                {value.some(
                  (v: any) => v.image || v.menuImage || v.logo || v.bannerImage,
                ) && <th>Image</th>}
                <th>Title</th>
                {value.some((v: any) => v.date) && <th>Date</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {value.map((v: any, i: number) => (
                <tr key={v.id || i}>
                  <td>{String(i + 1).padStart(2, "0")}</td>
                  {value.some(
                    (v: any) =>
                      v.image || v.menuImage || v.logo || v.bannerImage,
                  ) && (
                    <td>
                      <span className="table-thumbnail">
                        {(v.image ||
                          v.menuImage ||
                          v.logo ||
                          v.bannerImage) && (
                          <img
                            src={
                              variant === "menu"
                                ? v.menuImage || v.image
                                : v.image || v.logo || v.bannerImage
                            }
                            alt=""
                          />
                        )}
                      </span>
                    </td>
                  )}
                  <td>
                    <strong>{itemName(v, i)}</strong>
                    <p className="table-summary">
                      {(path === "products.items" ? "" : v.description) ||
                        v.body ||
                        v.text ||
                        v.placeholder ||
                        (path === "statistics.items" ? v.value : "")}
                    </p>
                  </td>
                  {value.some((v: any) => v.date) && <td>{v.date || "—"}</td>}
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        onClick={() => openItem(v, i, true)}
                      >
                        View
                      </button>
                      <button type="button" onClick={() => openItem(v, i)}>
                        Edit
                      </button>
                      {!fixedItems && (
                        <button
                          type="button"
                          className="delete-item"
                          aria-label={"Delete " + itemName(v, i)}
                          disabled={busy}
                          onClick={async () => {
                            if (
                              !window.confirm("Delete " + itemName(v, i) + "?")
                            )
                              return;
                            onChange(
                              value.filter((_: any, j: number) => j !== i),
                            );
                            setBusy(true);
                            try {
                              if (!persist)
                                throw new Error(
                                  "The editor is not ready to save.",
                                );
                              await persist();
                            } catch (error) {
                              onChange(value);
                              setItemError(errorText(error));
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {expanded !== null && itemDraft && (
          <CmsDialog
            title={
              expanded === value.length
                ? "Add item"
                : itemName(value[expanded], expanded)
            }
            busy={busy}
            onClose={closeItem}
          >
            <div className="cms-dialog-body item-dialog-body">
              <fieldset disabled={viewOnly || busy}>
                <Fields
                  value={itemDraft}
                  template={template[0]}
                  path={path + "." + expanded}
                  variant={variant}
                  media={media}
                  onChange={setItemDraft}
                  onUploadingChange={(b) => {
                    setBusy(b);
                    onUploadingChange?.(b);
                  }}
                />
              </fieldset>
              {itemError && (
                <p className="error" role="alert">
                  {itemError}
                </p>
              )}
              <div className="sticky-actions item-dialog-actions">
                <button type="button" disabled={busy} onClick={closeItem}>
                  {viewOnly ? "Close" : "Cancel"}
                </button>
                {!viewOnly && (
                  <button
                    type="button"
                    className="primary"
                    disabled={busy}
                    onClick={async (e) => {
                      const dialog = e.currentTarget.closest("dialog");
                      const fields = Array.from(
                        dialog?.querySelectorAll<
                          HTMLInputElement | HTMLTextAreaElement
                        >("input,textarea") || [],
                      );
                      if (fields.some((field) => !field.reportValidity()))
                        return;
                      const next = { ...itemDraft };
                      if (path === "deliveryMedia.items") next.state = dealerState;
                      if (path === "products.items" && variant === "menu" && expanded === value.length) {
                        next.name = next.menuLabel;
                        next.image = next.menuImage;
                      }
                      if (
                        path === "products.items" &&
                        variant !== "menu" &&
                        !next.menuLabel
                      ) {
                        next.menuLabel = next.name;
                        next.menuImage = next.image;
                      }
                      onChange(
                        expanded === value.length
                          ? [...value, next]
                          : value.map((x: any, j: number) =>
                              j === expanded ? next : x,
                            ),
                      );
                      setBusy(true);
                      try {
                        if (!persist)
                          throw new Error("The editor is not ready to save.");
                        await persist();
                        setExpanded(null);
                        setItemDraft(null);
                      } catch (error) {
                        onChange(value);
                        setItemError(errorText(error));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? "Saving…" : "Save item"}
                  </button>
                )}
              </div>
            </div>
          </CmsDialog>
        )}
      </div>
    );
  }

  if (template && typeof template === "object")
    return (
      <div className="field-grid">
        {Object.keys(template)
          .filter((key) => {
            if (/^deliveryMedia\.items\.\d+$/.test(path)) return key !== "videoId" || value.type === "video";
            if (/^news\.items\.\d+$/.test(path)) return key !== "slug";
            if (path === "branding") return key === "dealerLogo";
            if (path === "banners") return key === "items";
            if (/^banners\.items\.\d+$/.test(path))
              return ["image", "alt"].includes(key);
            if (path === "seo")
              return !["enabled", "socialImage", "favicon"].includes(key);
            if (path === "statistics") return key === "items";
            if (path === "about")
              return ["heading", "text", "image", "alt"].includes(key);
            if (path === "service") return ["heading", "image"].includes(key);
            if (path === "dealerContact")
              return ["name", "address", "phone", "email"].includes(key);
            if (path === "social")
              return ["enabled", "heading", "description", "items"].includes(
                key,
              );
            if (/^products\.categories\.\d+$/.test(path))
              return ["heading", "subtitle", "description"].includes(key);
            if (/^products\.items\.\d+$/.test(path))
              return (
                variant === "menu"
                  ? ["menuLabel", "menuImage", "menuOrder", "url"]
                  : variant === "backhoe" ? ["name", "image", "url", "newStyle", ...(value.newStyle ? ["productModel"] : [])] : ["name", "image", "url"]
              ).includes(key);
            if (/^testimonials\.items\.\d+$/.test(path))
              return ["image", "title", "description", "videoId"].includes(key);
            if (/^contact\.fields\.\d+$/.test(path)) return key !== "name";
            return true;
          })
          .map((key) => (
            <div
              key={key}
              className={typeof template[key] === "object" ? "wide" : ""}
            >
              <Fields
                value={value?.[key]}
                template={template[key]}
                path={path ? path + "." + key : key}
                onUploadingChange={onUploadingChange}
                variant={variant}
                media={media}
                onChange={(v) => onChange({ ...value, [key]: v })}
              />
            </div>
          ))}
      </div>
    );
  const name = path.split(".").pop() || "Value";
  const label = name === "newStyle" ? "Show new product style" : name === "productModel" ? "Product model / series" : /url$/i.test(name)
    ? title(name.replace(/url$/i, "link"))
    : title(name);
  const id = "field-" + path;
  const image = /image$|logo$|banner$|background$|favicon$/i.test(name);
  const document = /^downloads\./.test(path) && name === "url";
  if (/^deliveryMedia\.items\.\d+\.type$/.test(path)) return <div className="field"><label htmlFor={id}>Media type</label><select id={id} value={value} onChange={e => onChange(e.target.value)}><option value="photo">Photo</option><option value="video">YouTube video</option></select></div>;
  if (/^deliveryMedia\.items\.\d+\.state$/.test(path)) return <div className="field"><label htmlFor={id}>State</label><input id={id} value={dealerState} readOnly /></div>;
  if (name === "videoId")
    return <YouTubeField id={id} value={value} onChange={onChange} />;
  if (image || document)
    return (
      <div className="field">
        <label htmlFor={id}>{document ? "Document" : label}</label>
        <MediaField
          id={id}
          label={label}
          value={value}
          onChange={onChange}
          onUploadingChange={onUploadingChange}
          media={media}
          document={document}
        />
      </div>
    );
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {typeof template === "boolean" ? (
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
      ) : typeof template === "number" ? (
        <input
          id={id}
          type="number"
          min="0"
          max="1000000"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      ) : (
        <>
          {/text|description|address|message|body/i.test(name) ||
          /^products\.categories\.\d+\.heading$/.test(path) ? (
            <ContentTextarea id={id} value={value} onChange={onChange} />
          ) : (
            <input
              id={id}
              required={/^deliveryMedia\.items\.\d+\.(title|district|state)$/.test(path)}
              placeholder={name === "district" ? "District where the machine was delivered" : undefined}
              type={name === "date" ? "date" : "text"}
              readOnly={(variant === "contact-social" && /^social\.items\.\d+\.label$/.test(path)) || /^contact\.fields\.\d+\.name$|^pageLayout\.sections\.\d+\.key$/.test(
                path,
              )}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </>
      )}
    </div>
  );
}
