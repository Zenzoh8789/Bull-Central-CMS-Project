import { errorText } from "../services/api";
export function Status({ query }: { query: any }) {
  if (query.isLoading) return <p role="status">Loading…</p>;
  if (query.isError)
    return (
      <p role="alert" className="error">
        {errorText(query.error)}{" "}
        <button onClick={() => query.refetch()}>Retry</button>
      </p>
    );
  return null;
}
