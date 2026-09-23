import { useState } from "react";
import { useReadQuery, useWriteMutation, errorText } from "../services/api";
import { Status } from "../components/Status";
export function Enquiries() {
  const q = useReadQuery("enquiries");
  const [write, { isLoading }] = useWriteMutation();
  const [message, setMessage] = useState("");
  return (
    <>
      <h1>Dealer enquiries</h1>
      <p>The latest 500 enquiries visible to your role.</p>
      <Status query={q} />
      <p role="status">{message}</p>
      {q.data?.map((e: any) => (
        <details className="panel" key={e.id}>
          <summary>
            <strong>{e.name}</strong> · {e.product} · dealer #{e.dealer_id} ·{" "}
            {e.status}
          </summary>
          <p>
            <a href={"tel:" + e.phone}>{e.phone}</a> · {e.email}
          </p>
          <p>
            {e.address} {e.district}
          </p>
          <p>{e.message}</p>
          <small>
            {e.reference} · {new Date(e.created_at).toLocaleString()}
          </small>
          <label>
            Status
            <select
              disabled={isLoading}
              value={e.status}
              onChange={async (v) => {
                try {
                  await write({
                    path: "enquiries/" + e.id,
                    method: "PATCH",
                    body: { status: v.target.value },
                  }).unwrap();
                  setMessage("Status saved.");
                } catch (e) {
                  setMessage(errorText(e));
                }
              }}
            >
              {["NEW", "CONTACTED", "CLOSED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </details>
      ))}
    </>
  );
}
