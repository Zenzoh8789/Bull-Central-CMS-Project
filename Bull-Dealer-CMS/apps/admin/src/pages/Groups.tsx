import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Pencil, ArrowUpRight } from "lucide-react";
import "./Groups.css";
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
    <div className="groups-page">
      <div className="workspace-heading">
        <div>
          <h1>Dealer groups</h1>
        </div>
      </div>
      <Status query={q} />
      {user.role === "SUPER_ADMIN" && (
        <button
          className="primary"
          onClick={() => setEdit({ name: "", dealerIds: [] })}
        >
          <Plus size={16} /> Create group
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
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="cards">
        {q.data?.map((g: any) => (
          <article className="group-management-card" key={g.id}>
            <span className="section-icon">
              <Users size={22} />
            </span>
            <h2>{g.name}</h2>
            <p>
              <strong>{g.dealerIds.length}</strong> dealers
            </p>
            <Link
              className="button group-content-link"
              to={`/content?scope=GROUP&owner=${g.id}`}
            >
              Edit content <ArrowUpRight size={15} />
            </Link>
            {user.role === "SUPER_ADMIN" && (
              <button
                className="group-membership-button"
                onClick={() => {
                  setEdit(structuredClone(g));
                  setMessage("");
                }}
              >
                <Pencil size={14} /> Edit members
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
