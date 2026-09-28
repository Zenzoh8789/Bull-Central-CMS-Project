import "./Fields.css";
import { useState } from "react";
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
  media = [],
  onUploadingChange,
}: {
  value: any;
  template: any;
  onChange: (v: any) => void;
  path?: string;
  media?: any[];
  onUploadingChange?: (busy: boolean) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  value = value ?? structuredClone(template);
  if (Array.isArray(template)) {
    const fixedItems =
      path === "contact.fields" || path === "pageLayout.sections";
    return (
      <div className="array-editor">
        <div className="array-title">
          <strong>
            {title(path.split(".").pop() || "Items")} ({value.length})
          </strong>
          <button
            type="button"
            disabled={fixedItems || value.length >= 150}
            onClick={() => {
              const next = blankItem(template[0]);
              setExpanded(value.length);
              if (path === "products.items")
                next.id = "product-" + crypto.randomUUID().slice(0, 12);
              onChange([...value, next]);
            }}
          >
            + Add item
          </button>
        </div>
        {value.map((v: any, i: number) => (
          <details
            key={i}
            open={expanded === i || (expanded === null && value.length < 4)}
          >
            <summary>
              {i + 1}.{" "}
              {v.title ||
                v.label ||
                v.name ||
                v.heading ||
                v.alt ||
                v.id ||
                "Item"}
            </summary>
            <div className="array-actions">
              <button
                type="button"
                disabled={!i}
                onClick={() => {
                  const a = [...value];
                  [a[i - 1], a[i]] = [a[i], a[i - 1]];
                  onChange(a);
                }}
              >
                ↑ Move up
              </button>
              <button
                type="button"
                disabled={i === value.length - 1}
                onClick={() => {
                  const a = [...value];
                  [a[i + 1], a[i]] = [a[i], a[i + 1]];
                  onChange(a);
                }}
              >
                ↓ Move down
              </button>
              <button
                type="button"
                disabled={fixedItems}
                onClick={() =>
                  onChange(value.filter((_: any, j: number) => j !== i))
                }
              >
                Remove
              </button>
            </div>
            <Fields
              value={v}
              template={template[0]}
              path={path + "." + i}
              onChange={(next) =>
                onChange(value.map((x: any, j: number) => (i === j ? next : x)))
              }
              onUploadingChange={onUploadingChange}
              media={media}
            />
          </details>
        ))}
      </div>
    );
  }
  if (template && typeof template === "object")
    return (
      <div className="field-grid">
        {Object.keys(template)
          .filter((key) =>
            path === "branding"
              ? key === "dealerLogo"
              : path === "banners"
                ? !["enabled", "autoplay"].includes(key)
                : true,
          )
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
                media={media}
                onChange={(v) => onChange({ ...value, [key]: v })}
              />
            </div>
          ))}
      </div>
    );
  const name = path.split(".").pop() || "Value";
  const label = /url$/i.test(name)
    ? title(name.replace(/url$/i, "link"))
    : title(name);
  const id = "field-" + path;
  const image = /image$|logo$|banner$|background$|favicon$/i.test(name);
  const document = /^downloads\./.test(path) && name === "url";
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
          {/text|description|address|message/i.test(name) ? (
            <textarea
              id={id}
              rows={4}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <input
              id={id}
              readOnly={/^contact\.fields\.\d+\.name$|^pageLayout\.sections\.\d+\.key$/.test(
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
