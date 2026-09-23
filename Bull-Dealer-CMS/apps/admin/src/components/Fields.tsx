import "./Fields.css";
const title = (s: string) =>
  s.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
export function Fields({
  value,
  template,
  onChange,
  path = "",
  media = [],
}: {
  value: any;
  template: any;
  onChange: (v: any) => void;
  path?: string;
  media?: any[];
}) {
  value = value ?? structuredClone(template);
  if (Array.isArray(template)) {
    return (
      <div className="array-editor">
        <div className="array-title">
          <strong>
            {title(path.split(".").pop() || "Items")} ({value.length})
          </strong>
          <button
            type="button"
            disabled={value.length >= 150}
            onClick={() => onChange([...value, structuredClone(template[0])])}
          >
            + Add item
          </button>
        </div>
        {value.map((v: any, i: number) => (
          <details key={i} open={value.length < 4}>
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
        {Object.keys(template).map((key) => (
          <div
            key={key}
            className={typeof template[key] === "object" ? "wide" : ""}
          >
            <Fields
              value={value?.[key]}
              template={template[key]}
              path={path ? path + "." + key : key}
              media={media}
              onChange={(v) => onChange({ ...value, [key]: v })}
            />
          </div>
        ))}
      </div>
    );
  const name = path.split(".").pop() || "Value";
  const label = title(name);
  const id = "field-" + path;
  const image = /image$|logo$|banner$|background$/i.test(name);
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
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}{" "}
          {(image || /url$/i.test(name)) && media.length > 0 && (
            <select
              aria-label={"Choose media for " + path}
              value=""
              onChange={(e) => {
                if (e.target.value) onChange(e.target.value);
              }}
            >
              <option value="">Choose from media library…</option>
              {media
                .filter((m) => !image || m.mime.startsWith("image/"))
                .map((m) => (
                  <option key={m.id} value={m.url}>
                    {m.original_name}
                  </option>
                ))}
            </select>
          )}
          {image && value && (
            <img className="field-image" src={value} alt={label + " preview"} />
          )}
        </>
      )}
    </div>
  );
}
