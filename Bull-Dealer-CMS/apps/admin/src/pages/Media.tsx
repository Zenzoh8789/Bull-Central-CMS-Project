import { useState } from "react";
import { useReadQuery, useWriteMutation, errorText } from "../services/api";
import { Status } from "../components/Status";
export function Media() {
  const q = useReadQuery("media");
  const [write, { isLoading }] = useWriteMutation();
  const [message, setMessage] = useState("");
  return (
    <>
      <h1>Media library</h1>
      <p>
        Upload PNG, JPEG, WebP or PDF files up to 10 MB. Select uploaded media
        directly in content editors.
      </p>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          try {
            await write({ path: "media", body: new FormData(form) }).unwrap();
            form.reset();
            setMessage("File uploaded.");
          } catch (e) {
            setMessage(errorText(e));
          }
        }}
      >
        <label>
          File
          <input
            name="file"
            type="file"
            required
            accept="image/png,image/jpeg,image/webp,application/pdf"
          />
        </label>
        <button className="primary" disabled={isLoading}>
          {isLoading ? "Uploading…" : "Upload file"}
        </button>
      </form>
      <p role="status">{message}</p>
      <Status query={q} />
      <div className="media-grid">
        {q.data?.map((m: any) => (
          <article className="panel" key={m.id}>
            {m.mime.startsWith("image/") ? (
              <img src={m.url} alt={m.original_name} />
            ) : (
              <div className="pdf-icon">PDF</div>
            )}
            <h3>{m.original_name}</h3>
            <small>{Math.ceil(m.size_bytes / 1024)} KB</small>
            <input
              readOnly
              aria-label={"URL for " + m.original_name}
              value={m.url}
            />
            <a href={m.url} target="_blank" rel="noreferrer">
              Open file ↗
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
