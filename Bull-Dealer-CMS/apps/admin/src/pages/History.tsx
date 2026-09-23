import { useReadQuery } from "../services/api";
import { Status } from "../components/Status";
export function History() {
  const q = useReadQuery("history");
  return (
    <>
      <h1>Publish history</h1>
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
