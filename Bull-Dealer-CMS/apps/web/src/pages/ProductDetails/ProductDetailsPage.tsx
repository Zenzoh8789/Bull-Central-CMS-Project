import { Link, useParams } from "react-router-dom";
import { useProductQuery } from "../../services/siteApi";
import { useAppDispatch } from "../../store/hooks";
import { actions } from "../../store/uiSlice";

import { NotFoundPage } from "../NotFound/NotFoundPage";
import "./ProductDetailsPage.css";
export function ProductDetailsPage() {
  const { productId } = useParams();
  const {
    currentData: data,
    isFetching,
    isError,
    error,
    refetch,
  } = useProductQuery(productId || "");
  const dispatch = useAppDispatch();
  if (isFetching && !data)
    return <p className="route-page api-message">Loading equipment…</p>;
  if (isError && (error as { status?: number })?.status !== 404)
    return (
      <div className="route-page api-message" role="alert">
        Equipment unavailable.{" "}
        <button onClick={() => refetch()}>Try again</button>
      </div>
    );
  const product = data;
  if (!product) return <NotFoundPage />;
  return (
    <section className="product-details-page route-page content-width">
      <Link to="/products">← All products</Link>
      <div className="product-details-grid">
        <img src={product.image} alt={product.name} />
        <div>
          <p>{product.category}</p>
          {product.tag && <p>{product.tag}</p>}
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <button
            className="button yellow"
            onClick={() => dispatch(actions.openEnquiry(product.name))}
          >
            Enquire now
          </button>
          <a
            className="manufacturer-link"
            href={product.url}
            target="_blank"
            rel="noreferrer"
          >
            Manufacturer specifications ↗
          </a>
        </div>
      </div>
    </section>
  );
}
