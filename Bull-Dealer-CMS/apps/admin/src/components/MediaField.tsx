import { useState } from "react";
import { UploadCloud, Image as ImageIcon, FolderOpen } from "lucide-react";
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
  onChange: (v: string) => void;
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
  const [dragging, setDragging] = useState(false);
  const logo = id === "field-branding.dealerLogo";
  const filename = value
    ? selected?.url === value
      ? selected.name
      : media.find((m) => m.url === value)?.original_name ||
        value.split("/").pop() ||
        "Uploaded file"
    : "No file chosen";
  const uploadFile = async (file: File) => {
    if (isLoading) return;
    setMessage("");
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Choose a file smaller than 10 MB.");
      return;
    }
    const allowed = document
      ? ["application/pdf"]
      : ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setMessage(
        document ? "Choose a PDF file." : "Choose a PNG, JPEG or WebP image.",
      );
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
    }
  };
  const picker = (
    <div className="file-picker">
      <label className="file-picker-button" htmlFor={id}>
        {logo && <FolderOpen size={20} />}Choose file
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
        onChange={async (e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          if (file) await uploadFile(file);
          input.value = "";
        }}
      />
    </div>
  );
  const preview = value ? (
    document ? (
      <a href={value} target="_blank" rel="noreferrer">
        View uploaded document ↗
      </a>
    ) : (
      <img className="field-image" src={value} alt={label + " preview"} />
    )
  ) : (
    <ImageIcon size={70} aria-label="No logo uploaded" />
  );
  return (
    <div className={logo ? "media-field logo-field" : "media-field"}>
      {logo ? (
        <div className="logo-upload-layout">
          <div
            className={"logo-dropzone" + (dragging ? " is-dragging" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              if (!e.currentTarget.closest("fieldset:disabled"))
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.currentTarget.closest("fieldset:disabled")) return;
              const file = e.dataTransfer.files[0];
              if (file) void uploadFile(file);
            }}
          >
            <UploadCloud size={46} />
            <strong>Drag & drop your logo here</strong>
            <span>or click to browse</span>
            {picker}
          </div>
          <div className="logo-preview">
            <strong>Preview</strong>
            <div>{preview}</div>
          </div>
        </div>
      ) : (
        <>
          {value && preview}
          {picker}
        </>
      )}
      <small>{document ? "PDF" : "PNG, JPEG or WebP"} · Maximum 10 MB</small>
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
