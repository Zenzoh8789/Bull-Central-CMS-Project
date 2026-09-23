import { useAppSelector } from "../store";
import { useState } from "react";
import { useReadQuery, useWriteMutation, errorText } from "../services/api";
import { Status } from "../components/Status";
export function Users() {
  const actor = useAppSelector((s) => s.auth.user);
  const q = useReadQuery("users"),
    dealers = useReadQuery("dealers");
  const [role, setRole] = useState("EDITOR"),
    [message, setMessage] = useState("");
  const [write, { isLoading }] = useWriteMutation();
  return (
    <>
      <h1>Users & access</h1>
      <p>
        Super admins manage the network and publish. Editors prepare content.
        Dealer admins edit and publish only their own dealership.
      </p>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            f = new FormData(form);
          try {
            await write({
              path: "users",
              body: {
                name: f.get("name"),
                username: f.get("username"),
                email: f.get("email"),
                password: f.get("password"),
                role,
                dealerId: Number(f.get("dealerId")),
              },
            }).unwrap();
            form.reset();
            setMessage("User created.");
          } catch (e) {
            setMessage(errorText(e));
          }
        }}
      >
        <h2>Create user</h2>
        <div className="field-grid">
          <label>
            Name
            <input name="name" required maxLength={100} />
          </label>
          <label>
            Contact email
            <input name="email" type="email" required />
          </label>
          <label>
            Username
            <input
              name="username"
              required
              minLength={3}
              maxLength={80}
              pattern="[a-zA-Z0-9_.-]+"
              autoComplete="off"
            />
          </label>
          <label>
            Initial password
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={200}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {["EDITOR", "DEALER_ADMIN", "SUPER_ADMIN"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          {role === "DEALER_ADMIN" && (
            <label>
              Dealer
              <select name="dealerId" required>
                {dealers.data?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <button className="primary" disabled={isLoading}>
          Create user
        </button>
      </form>
      <p role="status">{message}</p>
      <Status query={q} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Contact email</th>
              <th>Role</th>
              <th>Dealer</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((u: any) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.dealer_id || "Network"}</td>
                <td>
                  <button
                    disabled={isLoading || u.id === actor.id}
                    onClick={async () => {
                      try {
                        await write({
                          path: "users/" + u.id,
                          method: "PATCH",
                          body: { active: !u.active },
                        }).unwrap();
                        setMessage("User access updated.");
                      } catch (e) {
                        setMessage(errorText(e));
                      }
                    }}
                  >
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
