import { useState } from "react";
import { useReadQuery, useWriteMutation, errorText } from "../services/api";
import { useAppSelector } from "../store";
import { Status } from "../components/Status";
export function Publish() {
  const user = useAppSelector((s) => s.auth.user);
  const drafts = useReadQuery("drafts"),
    dealers = useReadQuery("dealers"),
    groups = useReadQuery("groups");
  const [selected, setSelected] = useState<number[]>([]),
    [mode, setMode] = useState(user.role === "DEALER_ADMIN" ? "SINGLE" : "ALL"),
    [ids, setIds] = useState<number[]>(user.dealer_id ? [user.dealer_id] : []),
    [group, setGroup] = useState(0),
    [preview, setPreview] = useState<any>(null),
    [message, setMessage] = useState("");
  const [write, { isLoading }] = useWriteMutation();
  const body = () => ({
    draftIds: selected,
    revisions: Object.fromEntries(
      (drafts.data || [])
        .filter((d: any) => selected.includes(d.id))
        .map((d: any) => [d.id, d.revision]),
    ),
    target: {
      mode,
      ...(mode === "GROUP" ? { groupId: group } : {}),
      ...(["SINGLE", "SELECTED"].includes(mode) ? { dealerIds: ids } : {}),
    },
  });
  const reset = () => {
    setPreview(null);
    setMessage("");
  };
  return (
    <>
      <h1>Review & publish</h1>
      <p>
        Choose drafts, review the exact recipient list, then publish. Lower
        layers never erase explicit dealer overrides.
      </p>
      <Status query={drafts} />
      {user.role === "EDITOR" ? (
        <p className="notice">
          Your editor role can save drafts. An administrator must publish them.
        </p>
      ) : (
        <>
          <div className="panel">
            <h2>1. Select saved drafts</h2>
            {!drafts.data?.length && (
              <p>No drafts yet. Save content in Content CMS first.</p>
            )}
            <div className="draft-picker">
              {drafts.data?.map((d: any) => (
                <label className="check" key={d.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(d.id)}
                    onChange={(e) => {
                      reset();
                      setSelected(
                        e.target.checked
                          ? [...selected, d.id]
                          : selected.filter((id) => id !== d.id),
                      );
                    }}
                  />
                  <span>
                    <strong>{d.section_key}</strong> · {d.layer}{" "}
                    {d.owner_id || ""} · revision {d.revision}
                    {d.remove_override ? " · REMOVE OVERRIDE" : ""}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2>2. Choose publishing target</h2>
            <div className="toolbar">
              <label>
                Audience
                <select
                  value={mode}
                  onChange={(e) => {
                    reset();
                    setMode(e.target.value);
                    setIds(user.dealer_id ? [user.dealer_id] : []);
                  }}
                >
                  {(user.role === "DEALER_ADMIN"
                    ? ["SINGLE"]
                    : ["ALL", "GROUP", "SELECTED", "SINGLE"]
                  ).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              {mode === "GROUP" && (
                <label>
                  Group
                  <select
                    value={group}
                    onChange={(e) => {
                      reset();
                      setGroup(Number(e.target.value));
                    }}
                  >
                    <option value="0">Choose group</option>
                    {groups.data?.map((g: any) => (
                      <option value={g.id} key={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {["SINGLE", "SELECTED"].includes(mode) && (
              <div className="dealer-picker">
                {dealers.data
                  ?.filter((d: any) => d.active)
                  .map((d: any) => (
                    <label className="check" key={d.id}>
                      <input
                        name="recipient"
                        type={mode === "SINGLE" ? "radio" : "checkbox"}
                        checked={ids.includes(d.id)}
                        onChange={(e) => {
                          reset();
                          setIds(
                            mode === "SINGLE"
                              ? [d.id]
                              : e.target.checked
                                ? [...ids, d.id]
                                : ids.filter((id) => id !== d.id),
                          );
                        }}
                      />
                      {d.name}
                    </label>
                  ))}
              </div>
            )}
            <button
              className="primary"
              disabled={isLoading || !selected.length}
              onClick={async () => {
                reset();
                try {
                  setPreview(
                    await write({
                      path: "publish/preview",
                      body: body(),
                    }).unwrap(),
                  );
                } catch (e) {
                  setMessage(errorText(e));
                }
              }}
            >
              Preview publishing
            </button>
          </div>
          {preview && (
            <div className="panel publish-preview">
              <h2>3. Publish to {preview.recipients.length} dealers</h2>
              <p>
                {preview.drafts.length} sections · {preview.preservedOverrides}{" "}
                explicit overrides preserved
              </p>
              <ul className="recipient-list">
                {preview.recipients.map((d: any) => (
                  <li key={d.id}>
                    {d.name} (#{d.id})
                  </li>
                ))}
              </ul>
              <details>
                <summary>Review content snapshots</summary>
                {preview.drafts.map((d: any) => (
                  <div key={d.id}>
                    <h3>
                      {d.section_key} · {d.layer}
                    </h3>
                    <pre>{JSON.stringify(d.document, null, 2)}</pre>
                  </div>
                ))}
              </details>
              <button
                className="primary"
                disabled={isLoading}
                onClick={async () => {
                  try {
                    const r = await write({
                      path: "publish",
                      body: { ...body(), previewHash: preview.previewHash },
                    }).unwrap();
                    setPreview(null);
                    setSelected([]);
                    setMessage(
                      "Publication #" +
                        r.publicationId +
                        " completed for " +
                        r.affected +
                        " dealers.",
                    );
                  } catch (e) {
                    setPreview(null);
                    setMessage(errorText(e));
                  }
                }}
              >
                {isLoading
                  ? "Publishing…"
                  : "Publish to these " +
                    preview.recipients.length +
                    " dealers"}
              </button>
            </div>
          )}
        </>
      )}
      <p role="status" className="notice">
        {message}
      </p>
    </>
  );
}
