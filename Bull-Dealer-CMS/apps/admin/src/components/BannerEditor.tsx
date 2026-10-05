import { useContext, useRef, useState } from "react";
import { Plus, Trash2, UploadCloud, X } from "lucide-react";
import {
  indianStates,
  normalizeBanners,
  publishLabel,
  type BannerDocument,
  type BannerItem,
} from "@bull/content/banners";
import { ItemSaveContext } from "./ItemSaveContext";
import { CmsDialog } from "./CmsDialog";
import { errorText, useWriteMutation } from "../services/api";
import "../styles/banners.css";
export function BannerEditor({
  value,
  onChange,
  onUploadingChange,
}: {
  value: BannerDocument;
  onChange: (v: BannerDocument) => void;
  onUploadingChange: (v: boolean) => void;
}) {
  const doc = normalizeBanners(value);
  const persist = useContext(ItemSaveContext);
  const [upload] = useWriteMutation();
  const [editing, setEditing] = useState<{
    index: number;
    view: boolean;
    item: BannerItem;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const lock = useRef(false);
  const dirty = useRef(false);
  const open = (index: number, view = false) => {
    setError("");
    setSearch("");
    dirty.current = false;
    setEditing({
      index,
      view,
      item:
        index < doc.items.length
          ? structuredClone(doc.items[index])
          : {
              image: "",
              alt: "",
              url: "",
              title: "Banner",
              images: [],
              states: ["ALL"],
              enabled: true,
            },
    });
  };
  const close = () => {
    if (
      !lock.current &&
      (!dirty.current || window.confirm("Discard unsaved banner changes?"))
    )
      setEditing(null);
  };
  const change = (patch: Partial<BannerItem>) => {
    dirty.current = true;
    setEditing((current) =>
      current ? { ...current, item: { ...current.item, ...patch } } : null,
    );
  };
  const setWorking = (v: boolean) => {
    lock.current = v;
    setBusy(v);
    onUploadingChange(v);
  };
  const chooseFiles = async (files: File[]) => {
    if (!editing || lock.current || editing.view || !files.length) return;
    setError("");
    if (editing.item.images.length + files.length > 3) {
      setError(
        "Maximum 3 images per banner. Remove an image before adding more.",
      );
      return;
    }
    if (
      files.some(
        (f) =>
          !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
          f.size > 10 * 1024 * 1024,
      )
    ) {
      setError("Choose PNG, JPEG or WebP images, each up to 10 MB.");
      return;
    }
    setWorking(true);
    const images = [...editing.item.images];
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const result = await upload({ path: "media", body }).unwrap();
        images.push(result.url);
        change({ images: [...images] });
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setWorking(false);
    }
  };
  const save = async () => {
    if (!editing || lock.current) return;
    const internalTitle =
      String(editing.item.title || editing.item.alt || "Banner").trim() ||
      "Banner";
    const item = {
      ...editing.item,
      title: internalTitle.slice(0, 200),
    };
    if (!item.images.length || item.images.length > 3) {
      setError("Choose between 1 and 3 images.");
      return;
    }
    if (!item.states.length) {
      setError("Select All States or at least one state or UT.");
      return;
    }
    if (indianStates.every((state) => item.states.includes(state)))
      item.states = ["ALL"];

    // One CMS item retains its images, audience and status when edited.
    item.image = item.images[0];
    item.alt = item.title;
    const items = [...doc.items];
    if (editing.index === doc.items.length) items.push(item);
    else items[editing.index] = item;
    setError("");
    lock.current = true;
    setBusy(true);
    try {
      onChange({ ...doc, items });
      if (!persist) throw new Error("The editor is not ready to save.");
      await persist();
      dirty.current = false;
      setEditing(null);
    } catch (e) {
      onChange(doc);
      setError(errorText(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="banner-manager">
      <div className="array-title">
        <strong>Items ({doc.items.length})</strong>
        <button
          type="button"
          className="primary"
          onClick={() => open(doc.items.length)}
          disabled={busy || doc.items.length >= 150}
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>
      {listError && (
        <p className="error" role="alert">
          {listError}
        </p>
      )}
      <div className="content-table-wrap">
        <table className="content-table banner-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
              <th>Publish</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item: BannerItem, index: number) => (
              <tr key={index}>
                <td>{String(index + 1).padStart(2, "0")}</td>
                <td>
                  <div className="banner-thumbnails">
                    {item.images.map((image: string, i: number) => (
                      <img
                        key={i}
                        src={image}
                        alt={"Banner image " + (i + 1)}
                      />
                    ))}
                  </div>
                </td>
                <td>
                  <span className="banner-publish">
                    {item.enabled ? publishLabel(item.states) : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" onClick={() => open(index, true)}>
                      View
                    </button>
                    <button type="button" onClick={() => open(index)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete-item"
                      aria-label={"Delete banner " + (index + 1)}
                      disabled={busy}
                      onClick={async () => {
                        if (
                          lock.current ||
                          !window.confirm("Delete this banner?")
                        )
                          return;
                        lock.current = true;
                        setBusy(true);
                        setListError("");
                        try {
                          onChange({
                            ...doc,
                            items: doc.items.filter(
                              (_: BannerItem, i: number) => i !== index,
                            ),
                          });
                          if (!persist)
                            throw new Error("The editor is not ready to save.");
                          await persist();
                        } catch (e) {
                          onChange(doc);
                          setListError(errorText(e));
                        } finally {
                          lock.current = false;
                          setBusy(false);
                        }
                      }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!doc.items.length && (
          <p className="empty-state">No banners yet. Add your first banner.</p>
        )}
      </div>
      {editing && (
        <CmsDialog
          title={
            editing.view
              ? "View banner"
              : editing.index === doc.items.length
                ? "Add banner"
                : "Edit banner"
          }
          busy={busy}
          onClose={close}
        >
          <div className="cms-dialog-body">
            <fieldset disabled={busy || editing.view} className="banner-form">
              <div className="banner-images">
                <strong>Images ({editing.item.images.length}/3)</strong>
                {!editing.view && (
                  <label className="banner-upload">
                    <UploadCloud size={28} />
                    <span>Choose files</span>
                    <small>PNG, JPEG or WebP · Up to 10 MB each</small>
                    <input
                      aria-label="Banner images"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      disabled={busy || editing.item.images.length >= 3}
                      onChange={(e) => {
                        const files = Array.from(e.currentTarget.files || []);
                        e.currentTarget.value = "";
                        void chooseFiles(files);
                      }}
                    />
                  </label>
                )}
                {busy && <span role="status">Please wait…</span>}
                <div className="banner-previews">
                  {editing.item.images.map((src: string, i: number) => (
                    <figure key={i}>
                      <img src={src} alt={"Preview " + (i + 1)} />
                      {!editing.view && (
                        <button
                          type="button"
                          aria-label={"Remove image " + (i + 1)}
                          onClick={() =>
                            change({
                              images: editing.item.images.filter(
                                (_: string, j: number) => j !== i,
                              ),
                            })
                          }
                        >
                          <X size={18} />
                        </button>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
              <div className="banner-details">
                <label className="field">
                  Status
                  <select
                    aria-label="Status"
                    value={editing.item.enabled ? "ACTIVE" : "INACTIVE"}
                    onChange={(event) =>
                      change({ enabled: event.target.value === "ACTIVE" })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
                <fieldset className="banner-audience">
                  <legend>To Whom</legend>
                  {editing.view ? (
                    <p>{publishLabel(editing.item.states)}</p>
                  ) : (
                    <>
                      <input
                        type="search"
                        aria-label="Search states and UTs"
                        placeholder="Search states and UTs"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <label className="banner-state">
                        <input
                          type="checkbox"
                          checked={editing.item.states.includes("ALL")}
                          onChange={(e) =>
                            change({ states: e.target.checked ? ["ALL"] : [] })
                          }
                        />
                        All States
                      </label>
                      <div className="banner-state-list">
                        {indianStates
                          .filter((s) =>
                            s.toLowerCase().includes(search.toLowerCase()),
                          )
                          .map((state) => (
                            <label key={state} className="banner-state">
                              <input
                                type="checkbox"
                                checked={editing.item.states.includes(state)}
                                onChange={(e) =>
                                  change({
                                    states: e.target.checked
                                      ? [
                                          ...editing.item.states.filter(
                                            (s: string) => s !== "ALL",
                                          ),
                                          state,
                                        ]
                                      : editing.item.states.filter(
                                          (s: string) => s !== state,
                                        ),
                                  })
                                }
                              />
                              {state}
                            </label>
                          ))}
                        {!indianStates.some((s) =>
                          s.toLowerCase().includes(search.toLowerCase()),
                        ) && <p>No matching states or UTs.</p>}
                      </div>
                      <p className="banner-selection">
                        {editing.item.states.length
                          ? publishLabel(editing.item.states)
                          : "No states selected"}
                      </p>
                    </>
                  )}
                </fieldset>
              </div>
            </fieldset>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="sticky-actions">
              <button type="button" disabled={busy} onClick={close}>
                {editing.view ? "Close" : "Cancel"}
              </button>
              {!editing.view && (
                <button
                  type="button"
                  className="primary"
                  disabled={busy}
                  onClick={() => void save()}
                >
                  {busy ? "Saving…" : "Save banner"}
                </button>
              )}
            </div>
          </div>
        </CmsDialog>
      )}
    </div>
  );
}
