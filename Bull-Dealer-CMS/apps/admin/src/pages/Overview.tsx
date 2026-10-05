import {stateOf,districtOf} from "../components/DealerAudience";
import type {WorkspaceContext} from "../components/WorkspaceContext";
import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Users,
  Box,
  Newspaper,
  Images,
  Play,
  ArrowRight,
  Eye,
  FileText,
  Search,
} from "lucide-react";
import { useReadQuery } from "../services/api";
import { DealerDialog } from "../components/DealerDialog";
import { Status } from "../components/Status";
import { dealerState } from "../utils/dealerState";
export function Overview() {
  const ctx=useOutletContext<WorkspaceContext>();
  const dealers = useReadQuery("dealers"),
    updates = useReadQuery("activity");
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const first = dealers.data?.find((d:any)=>d.id===ctx.dealerId) || dealers.data?.[0];
  const site = useReadQuery(`dealers/${first?.id}/resolved`, { skip: !first });
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const content = site.data?.content;
  const rows = (dealers.data || [])
    .filter(
      (d: any) =>
        `${d.name} ${d.location} ${dealerState(d.location)} ${d.active ? "active" : "inactive"}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!ctx.dealerId || d.id===ctx.dealerId) && (!ctx.locationMode || !ctx.region || stateOf(d)===ctx.region) && (!ctx.locationMode || !ctx.district || districtOf(d)===ctx.district),
    )
    .slice()
    .sort((a: any, b: any) => b.id - a.id);
  const pages = Math.max(1, Math.ceil(rows.length / 5)),
    currentPage = Math.min(page, pages);
  const metrics = [
    ["Total Dealers", dealers.data?.length, Users, "gold", "/dealers"],
    [
      "Products",
      content?.products?.items?.length,
      Box,
      "blue",
      "/content?section=products",
    ],
    [
      "News & Updates",
      content?.news?.items?.length,
      Newspaper,
      "green",
      "/content?section=news",
    ],
    [
      "Banners",
      content?.banners?.items?.length,
      Images,
      "red",
      "/content?section=banners",
    ],
    [
      "Videos",
      content?.testimonials?.items?.length,
      Play,
      "purple",
      "/content?section=testimonials",
    ],
  ] as const;
  const recent = (updates.data || [])
    .filter((a: any) =>
      [
        "PUBLISH",
        "SAVE_DEALER",
        "DELETE_DEALER",
        "SAVE_DRAFT",
        "UPLOAD_MEDIA",
      ].includes(a.action),
    )
    .slice(0, 4);
  function updateTitle(a: any) {
    if (a.action === "PUBLISH") return "Content Published";
    if (a.action === "SAVE_DEALER") return "Dealer Updated";
    if (a.action === "DELETE_DEALER") return "Dealer Removed";
    if (a.action === "UPLOAD_MEDIA") return "Media Uploaded";
    return `${a.details.section || "Content"} Updated`;
  }
  return (
    <div className="dashboard">
      {selectedDealer && (
        <DealerDialog
          dealer={selectedDealer}
          onClose={() => setSelectedDealer(null)}
        />
      )}
      <section className="dashboard-banner" aria-label="BULL dealer network">
        <img
          src="/admin/brand/mountain-backhoe.png"
          alt="BULL backhoe loader at a mountain construction site"
        />
      </section>
      <div className="dashboard-metrics">
        {metrics.map(([label, value, Icon, color, to]) => (
          <Link to={to} className={`metric-card ${color}`} key={label}>
            <span className="metric-icon">
              <Icon size={27} />
            </span>
            <div>
              <strong>{value ?? "—"}</strong>
              <span>{label}</span>
            </div>
          </Link>
        ))}
      </div>
      <Status query={site} />
      <div className="dashboard-columns">
        <section className="dashboard-panel">
          <div className="panel-title">
            <h2>
              <Users size={21} />
              Recent Dealers
            </h2>
            <Link to="/dealers">
              View All <ArrowRight size={15} />
            </Link>
          </div>
          <div className="dealer-filters">
            <label className="dealer-search">
              <Search size={17} />
              <input
                aria-label="Search dealers"
                placeholder="Search dealer name, location, status…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>


          </div>
          <Status query={dealers} />
          <div className="dashboard-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Dealer Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice((currentPage - 1) * 5, currentPage * 5)
                  .map((d: any) => (
                    <tr key={d.id}>
                      <td>{String(d.id).padStart(3, "0")}</td>
                      <td>
                        <strong>{d.name}</strong>
                      </td>
                      <td>{d.location}</td>
                      <td>
                        <span
                          className={`dealer-status ${d.active ? "active" : "inactive"}`}
                        >
                          {d.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="dealer-view"
                          onClick={() => setSelectedDealer(d)}
                          aria-label={`View ${d.name}`}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                {!dealers.isLoading && !dealers.isError && !rows.length && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      No dealers match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="dealer-pagination">
            <span>
              {rows.length} dealers
            </span>
            <div>
              <button
                aria-label="Previous dealers"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                {currentPage} / {pages}
              </span>
              <button
                aria-label="Next dealers"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
        <section className="dashboard-panel">
          <div className="panel-title">
            <h2>
              <FileText size={21} />
              Recent Updates
            </h2>
            <Link to="/history">
              View All <ArrowRight size={15} />
            </Link>
          </div>
          <Status query={updates} />
          <div className="recent-updates">
            {recent.map((a: any) => (
              <Link to="/history" key={a.id}>
                <span className="update-icon">
                  <FileText size={23} />
                </span>
                <div>
                  <strong>{updateTitle(a)}</strong>
                  <span>
                    {a.details.employeeName ||
                      a.details.accountName ||
                      a.account ||
                      "Admin"}
                    {a.details.count ? ` · ${a.details.count} dealers` : ""}
                  </span>
                  <time dateTime={a.created_at}>
                    {new Date(a.created_at).toLocaleString()}
                  </time>
                </div>
              </Link>
            ))}
          </div>
          {!updates.isLoading && !updates.isError && !recent.length && (
            <p className="empty-state">No recent updates yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
