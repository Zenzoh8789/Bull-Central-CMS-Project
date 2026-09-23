import { useState } from "react";
import { useReadQuery, useWriteMutation, errorText } from "../services/api";
import { useAppSelector } from "../store";
import { Status } from "../components/Status";
export function Groups() {
  const q = useReadQuery("groups"),
    dealers = useReadQuery("dealers");
  const user = useAppSelector((s) => s.auth.user);
  const [edit, setEdit] = useState<any>(null),
    [message, setMessage] = useState("");
  const [write, { isLoading }] = useWriteMutation();
  return (
    <>
      <h1>Dealer groups</h1>
      <p>
        Organize dealers by region or campaign. Group publishing uses the
        current membership shown in its preview.
      </p>
      <Status query={q} />
      {user.role === "SUPER_ADMIN" && (
        <button
          className="primary"
          onClick={() => setEdit({ name: "", dealerIds: [] })}
        >
          Create group
        </button>
      )}
      {edit && (
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await write({
                path: "groups" + (edit.id ? "/" + edit.id : ""),
                method: edit.id ? "PUT" : "POST",
                body: edit,
              }).unwrap();
              setEdit(null);
              setMessage("Group saved.");
            } catch (e) {
              setMessage(errorText(e));
            }
          }}
        >
          <label>
            Group name
            <input
              required
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          </label>
          <div className="dealer-picker">
            {dealers.data?.map((d: any) => (
              <label className="check" key={d.id}>
                <input
                  type="checkbox"
                  checked={edit.dealerIds.includes(d.id)}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      dealerIds: e.target.checked
                        ? [...edit.dealerIds, d.id]
                        : edit.dealerIds.filter((id: number) => id !== d.id),
                    })
                  }
                />
                {d.name}
              </label>
            ))}
          </div>
          <div className="actions">
            <button className="primary" disabled={isLoading}>
              Save group
            </button>
            <button type="button" onClick={() => setEdit(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <p role="status">{message}</p>
      <div className="cards">
        {q.data?.map((g: any) => (
          <article className="panel" key={g.id}>
            <h2>{g.name}</h2>
            <p>{g.dealerIds.length} dealers</p>
            {user.role === "SUPER_ADMIN" && (
              <button onClick={() => setEdit(g)}>Edit membership</button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
