import { useState } from "react";
import { useWriteMutation, errorText } from "../services/api";

export function MediaField({
  value,
  onChange,
  onUploadingChange,
  label,
  id,
  media = [],
  document = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onUploadingChange?: (busy: boolean) => void;
  label: string;
  id: string;
  media?: any[];
  document?: boolean;
}) {
  const [upload, { isLoading }] = useWriteMutation();
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const filename = value
    ? selected?.url === value
      ? selected.name
      : media.find((m) => m.url === value)?.original_name ||
        value.split("/").pop() ||
        "Uploaded file"
    : "No file chosen";
  return (
    <div className="media-field">
      {value &&
        (document ? (
          <a href={value} target="_blank" rel="noreferrer">
            View uploaded document ↗
          </a>
        ) : (
          <img className="field-image" src={value} alt={label + " preview"} />
        ))}
      <div className="file-picker">
        <label className="file-picker-button" htmlFor={id}>
          Choose file
        </label>
        <span className="file-picker-name">{filename}</span>
        <input
          className="file-picker-input"
          id={id}
          type="file"
          disabled={isLoading}
          accept={
            document ? "application/pdf" : "image/png,image/jpeg,image/webp"
          }
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            setMessage("");
            if (file.size > 10 * 1024 * 1024) {
              setMessage("Choose a file smaller than 10 MB.");
              input.value = "";
              return;
            }
            const body = new FormData();
            body.append("file", file);
            onUploadingChange?.(true);
            try {
              const result = await upload({ path: "media", body }).unwrap();
              setSelected({ url: result.url, name: file.name });
              onChange(result.url);
              setMessage("Uploaded. Save changes to update the website.");
            } catch (error) {
              setMessage(errorText(error));
            } finally {
              onUploadingChange?.(false);
              input.value = "";
            }
          }}
        />
      </div>
      <small>
        {document ? "PDF" : "PNG, JPEG or WebP"} · Maximum 10 MB · Stored on
        your VPS
      </small>
      {value && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            setSelected(null);
            onChange("");
          }}
        >
          Remove {document ? "document" : "image"}
        </button>
      )}
      <span role="status">{isLoading ? "Uploading…" : message}</span>
    </div>
  );
}
