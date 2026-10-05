import { useState } from "react";
import { useReadQuery } from "../services/api";
import { Status } from "../components/Status";
export function History() {
  const q = useReadQuery("history");
  const activity = useReadQuery("activity");
  const [filter, setFilter] = useState("");
  const records = (activity.data || []).filter((row: any) =>
    JSON.stringify([row.action, row.account, row.details])
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  return (
    <>
      <h1>Activity & Publish History</h1>
      <p>
        Track admin, employee and dealer changes. Latest 500 activity records.
      </p>
      <label className="history-search">
        Search activity
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Employee, dealer ID or action"
        />
      </label>
      <Status query={activity} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Employee / Admin</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row: any) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>
                  <strong>
                    {row.details.employeeName ||
                      row.details.accountName ||
                      row.account ||
                      "System"}
                  </strong>
                  <small>
                    {row.details.employeeName
                      ? "Via " + (row.details.accountName || row.account)
                      : "Admin account"}
                  </small>
                </td>
                <td>
                  {row.action === "ENTER_CMS"
                    ? "SESSION STARTED"
                    : row.action.replaceAll("_", " ")}
                </td>
                <td>
                  <details>
                    <summary>View details</summary>
                    <pre>{JSON.stringify(row.details, null, 2)}</pre>
                  </details>
                </td>
              </tr>
            ))}
            {!records.length && !activity.isLoading && (
              <tr>
                <td colSpan={4}>No activity found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <h2 className="history-title">Publish history</h2>
      <p>
        Immutable publication snapshots, actor, exact recipients and draft
        revisions. To restore older content, copy its values into a new draft
        and publish it.
      </p>
      <Status query={q} />
      {q.data?.map((p: any) => (
        <details className="panel" key={p.id}>
          <summary>
            <strong>Publication #{p.id}</strong> · {p.target.mode} ·{" "}
            {p.recipients.length} dealers · {p.actor} ·{" "}
            {new Date(p.created_at).toLocaleString()}
          </summary>
          <p>Dealer IDs: {p.recipients.join(", ")}</p>
          {p.revisions.map((r: any, i: number) => (
            <details key={i}>
              <summary>
                {r.section} · {r.layer} · revision {r.revision}
                {r.removeOverride ? " · override removed" : ""}
              </summary>
              <pre>{JSON.stringify(r.document, null, 2)}</pre>
            </details>
          ))}
        </details>
      ))}
    </>
  );
}
