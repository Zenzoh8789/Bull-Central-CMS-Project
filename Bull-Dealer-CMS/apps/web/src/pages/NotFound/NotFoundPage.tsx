import { Link } from "react-router-dom";
import "./NotFoundPage.css";
export function NotFoundPage() {
  return (
    <section className="not-found-page route-page">
      <h1>Page not found</h1>
      <p>The page you requested is not available.</p>
      <Link className="button yellow" to="/">
        Back to home
      </Link>
    </section>
  );
}
