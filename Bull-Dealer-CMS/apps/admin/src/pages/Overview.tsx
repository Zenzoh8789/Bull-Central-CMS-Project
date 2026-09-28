import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Box,
  Newspaper,
  Images,
  Play,
  ShieldCheck,
  Settings,
  ChartNoAxesColumnIncreasing,
  ArrowRight,
  Search,
  Eye,
  FileText,
  Zap,
  UserPlus,
  Upload,
} from "lucide-react";
import { useReadQuery } from "../services/api";
import { Status } from "../components/Status";
export function Overview() {
  const q = useReadQuery("dashboard"),
    dealers = useReadQuery("dealers"),
    history = useReadQuery("history");
  const first = dealers.data?.[0]?.id;
  const site = useReadQuery("dealers/" + first + "/resolved", { skip: !first });
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [location, setLocation] = useState("all");
  const content = site.data?.content;
  const rows = (dealers.data || []).filter(
    (d: any) =>
      (d.name + " " + d.location)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "all" || Boolean(d.active) === (status === "active")) &&
      (location === "all" || location === d.location),
  );
  const metrics = [
    ["Total Dealers", q.data?.dealers, Users, "gold", "/dealers"],
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
  return (
    <div className="dashboard">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <p>POWERING PROGRESS TOGETHER</p>
          <h1>
            <span>{q.data?.dealers ?? "—"} DEALERS</span>
            <br />
            WORLDWIDE
          </h1>
          <p className="hero-description">
            Manage content, products, and updates from
            <br />
            one powerful platform.
          </p>
          <Link className="button primary" to="/dealers">
            Manage Your Network <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hero-values">
          {[
            [ShieldCheck, "RELIABLE"],
            [Settings, "POWERFUL"],
            [Users, "VERSATILE"],
            [ChartNoAxesColumnIncreasing, "BUILT FOR A STRONGER TOMORROW"],
          ].map(([Icon, label]: any) => (
            <div key={label}>
              <Icon size={27} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
      <Status query={q} />
      <div className="dashboard-metrics">
        {metrics.map(([label, value, Icon, color, to]) => (
          <Link key={label} to={to} className={"metric-card " + color}>
            <span className="metric-icon">
              <Icon size={29} />
            </span>
            <div>
              <strong>{value ?? "—"}</strong>
              <span>{label}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="dashboard-panel dealers-panel">
          <div className="panel-title">
            <h2>
              <Users size={21} /> Recent Dealers
            </h2>
            <Link to="/dealers">
              View All <ArrowRight size={15} />
            </Link>
          </div>
          <div className="dealer-filters">
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Search dealers"
                placeholder="Search dealer name, location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Filter dealer status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              aria-label="Filter dealer location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="all">All Locations</option>
              {Array.from(
                new Set((dealers.data || []).map((d: any) => d.location)),
              ).map((l: any) => (
                <option key={l}>{l}</option>
              ))}
            </select>
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
                  .slice(-5)
                  .reverse()
                  .map((d: any) => (
                    <tr key={d.id}>
                      <td>{String(d.id).padStart(3, "0")}</td>
                      <td>{d.name}</td>
                      <td>{d.location}</td>
                      <td>
                        <span
                          className={
                            "dealer-status " +
                            (d.active ? "active" : "inactive")
                          }
                        >
                          {d.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={"/dealers?dealer=" + d.id}
                          aria-label={"View " + d.name}
                        >
                          <Eye size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!dealers.isLoading && !rows.length && (
              <p className="empty-state">No dealers match your filters.</p>
            )}
          </div>
        </section>
        <div className="dashboard-side">
          <section className="dashboard-panel">
            <div className="panel-title">
              <h2>
                <FileText size={21} /> Recent Updates
              </h2>
              <Link to="/history">
                View All <ArrowRight size={15} />
              </Link>
            </div>
            <Status query={history} />
            <div className="recent-updates">
              {history.data?.slice(0, 4).map((p: any) => (
                <Link to="/history" key={p.id}>
                  <span className="update-icon">
                    <FileText size={24} />
                  </span>
                  <div>
                    <strong>Publication #{p.id}</strong>
                    <span>
                      Applied to {p.recipients.length} dealer
                      {p.recipients.length === 1 ? "" : "s"}
                    </span>
                    <small>{new Date(p.created_at).toLocaleString()}</small>
                  </div>
                </Link>
              ))}
              {history.data?.length === 0 && <p>No publications yet.</p>}
            </div>
          </section>
          <section className="dashboard-panel quick-panel">
            <div className="panel-title">
              <h2>
                <Zap size={22} /> Quick Actions
              </h2>
            </div>
            <div className="quick-actions">
              {[
                [Users, "Dealers", "/dealers"],
                [Upload, "Upload Media", "/media"],
                [Newspaper, "Edit News", "/content?section=news"],
                [Images, "Manage Banners", "/content?section=banners"],
              ].map(([Icon, label, to]: any) => (
                <Link to={to} key={label}>
                  <Icon size={25} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
