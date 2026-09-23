import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useReadQuery, useWriteMutation, errorText } from "../services/api";
import { useAppSelector } from "../store";
import { Status } from "../components/Status";
const blank = {
  name: "",
  location: "",
  address: "",
  about: "",
  active: false,
  domains: [],
};
export function Dealers() {
  const [params] = useSearchParams();
  const q = useReadQuery("dealers");
  const user = useAppSelector((s) => s.auth.user);
  const [edit, setEdit] = useState<any>(null),
    [domains, setDomains] = useState(""),
    [message, setMessage] = useState(""),
    [preview, setPreview] = useState(Number(params.get("dealer")) || 0);
  const resolved = useReadQuery("dealers/" + preview + "/resolved", {
    skip: !preview,
  });
  const [write, { isLoading }] = useWriteMutation();
  return (
    <>
      <h1>Dealers & domains</h1>
      <p>
        Each domain resolves to one dealer. New dealers start inactive until
        their identity and content are ready.
      </p>
      <Status query={q} />
      {user.role === "SUPER_ADMIN" && (
        <button
          className="primary"
          onClick={() => {
            setEdit({ ...blank });
            setDomains("");
            setMessage("");
          }}
        >
          Add dealer
        </button>
      )}
      {edit && (
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            setMessage("");
            try {
              await write({
                path: "dealers" + (edit.id ? "/" + edit.id : ""),
                method: edit.id ? "PUT" : "POST",
                body: {
                  ...edit,
                  active: Boolean(edit.active),
                  domains: domains.split(/[\s,]+/).filter(Boolean),
                },
              }).unwrap();
              setEdit(null);
              setMessage("Dealer saved.");
            } catch (e) {
              setMessage(errorText(e));
            }
          }}
        >
          <h2>{edit.id ? "Edit dealer" : "New dealer"}</h2>
          <div className="field-grid">
            {["name", "location", "address", "about"].map((key) => (
              <label key={key}>
                {key}
                <textarea
                  required
                  value={edit[key]}
                  onChange={(e) => setEdit({ ...edit, [key]: e.target.value })}
                />
              </label>
            ))}
            <label>
              Domains, one per line
              <textarea
                required
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={Boolean(edit.active)}
                onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
              />
              Active website
            </label>
          </div>
          <div className="actions">
            <button className="primary" disabled={isLoading}>
              Save dealer
            </button>
            <button type="button" onClick={() => setEdit(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <p role="status">{message}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Dealer</th>
              <th>Domains</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((d: any) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.name}</strong>
                  <small>{d.location}</small>
                </td>
                <td>{d.domains.join(", ")}</td>
                <td>{d.active ? "Active" : "Inactive"}</td>
                <td>
                  <button onClick={() => setPreview(d.id)}>
                    Inspect published content
                  </button>
                  {user.role === "SUPER_ADMIN" && (
                    <button
                      onClick={() => {
                        setEdit(d);
                        setDomains(d.domains.join("\n"));
                      }}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview > 0 && (
        <div className="panel">
          <h2>Published content: {resolved.data?.dealer.name}</h2>
          <Status query={resolved} />
          <p>
            Section sources show which layer currently controls each section.
          </p>
          {resolved.data &&
            Object.entries(resolved.data.content).map(([key, value]: any) => (
              <details key={key}>
                <summary>
                  {key} · {resolved.data.sources[key] || "Default"}
                </summary>
                <pre>{JSON.stringify(value, null, 2)}</pre>
              </details>
            ))}
          <button onClick={() => setPreview(0)}>Close inspection</button>
        </div>
      )}
    </>
  );
}
