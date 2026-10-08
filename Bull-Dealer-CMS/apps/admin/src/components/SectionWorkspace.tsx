import { useCallback, useState } from "react";
import { SectionEditor } from "./SectionEditor";
import type { ContentLayer, EditorState } from "./contentSections";
export function SectionWorkspace({
  section,
  ...props
}: {
  section: string;
  readOnly?: boolean;
  layer: ContentLayer;
  owner: number;
  onStateChange: (state: EditorState) => void;
}) {
  const options =
    section === "products"
      ? [
          { key: "menu", label: "Our products menu", section: "products" },
          { key: "backhoe", label: "Backhoe catalogue", section: "products" },
          { key: "skid", label: "Skid steer catalogue", section: "products" },
        ]
      : section === "footer"
        ? [
            { key: "contact", label: "Contact us", section: "dealerContact" },
            { key: "social", label: "Follow us", section: "social" },
          ]
        : section === "contact" && props.layer !== "COMMON"
          ? [
              { key: "social", label: "Follow us", section: "social" },
              { key: "location", label: "Dealer location", section: "locations" },
            ]
          : [];
  const [selected, setSelected] = useState(options[0]?.key || "");
  const [state, setState] = useState<EditorState>({
    dirty: false,
    busy: false,
  });
  const { onStateChange } = props;
  const update = useCallback(
    (next: EditorState) => {
      setState(next);
      onStateChange(next);
    },
    [onStateChange],
  );
  const active = options.find((option) => option.key === selected);
  return (
    <>
      {options.length > 0 && (
        <div className="editor-mode-tabs" aria-label={`${section} settings`}>
          {section === "products" ? (
            <label className="product-content-select">
              Product content
              <select
                aria-label="Product content"
                value={selected}
                disabled={state.busy}
                onChange={(e) => {
                  if (!state.dirty || window.confirm("Discard unsaved edits?"))
                    setSelected(e.target.value);
                }}
              >
                {options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            options.map((option) => (
              <button
                type="button"
                key={option.key}
                aria-pressed={option.key === selected}
                disabled={state.busy}
                className={option.key === selected ? "selected" : ""}
                onClick={() => {
                  if (
                    option.key !== selected &&
                    (!state.dirty || window.confirm("Discard unsaved edits?"))
                  )
                    setSelected(option.key);
                }}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
      <SectionEditor
        {...props}
        key={`${section}:${selected}`}
        section={active?.section || section}
        variant={selected}
        onStateChange={update}
      />
    </>
  );
}
