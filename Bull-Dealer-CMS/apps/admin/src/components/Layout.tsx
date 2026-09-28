import { useRef, useState } from "react";
import {
  Link,
  Outlet,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Globe,
  PanelTop,
  Image,
  Info,
  Box,
  Images,
  Video,
  Newspaper,
  MapPin,
  Share2,
  CheckCircle,
  History,
  Settings,
  Search,
  ExternalLink,
  Menu,
  X,
  Layers,
  Mail,
  LogOut,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store";
import { signedOut } from "../store/authSlice";
import { api, useLogoutMutation, useMeQuery } from "../services/api";

const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/dealers", "Dealers", Users],
  ["/content?section=seo", "SEO", Globe],
  ["/content?section=navigation", "Navigation", Menu],
  ["/content?section=branding", "Dealer Logo", PanelTop],
  ["/content?section=banners", "Main Banner", Image],
  ["/content?section=statistics", "Statistics", LayoutDashboard],
  ["/content?section=about", "About Us", Info],
  ["/content?section=products", "Products", Box],
  ["/content?section=equipment", "Equipment Sections", Layers],
  ["/content?section=service", "Service", Settings],
  ["/content?section=dealerContact", "Dealer Contact", MapPin],
  ["/content?section=locations", "Locations", MapPin],
  ["/content?section=whatsapp", "WhatsApp", Mail],
  ["/content?section=pageLayout", "Page Layout", Layers],
  ["/content?section=gallery", "Gallery", Images],
  ["/content?section=downloads", "Downloads", Box],
  ["/media", "Media Library", Images],
  ["/content?section=testimonials", "Videos & Testimonials", Video],
  ["/content?section=news", "News & Updates", Newspaper],
  ["/content?section=contact", "Contact & Map", MapPin],
  ["/content?section=social", "Social Links", Share2],
  ["/content?section=footer", "Footer", PanelTop],
  ["/groups", "Dealer Groups", Users],
  ["/publish", "Publish Center", CheckCircle],
  ["/enquiries", "Enquiries", Mail],
  ["/history", "Logs & History", History],
] as const;
export function Layout() {
  const { token, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();
  const me = useMeQuery(undefined, { skip: !token });
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editorState, setEditorState] = useState({ dirty: false, busy: false });
  const canLeave = () =>
    !editorState.busy &&
    (!editorState.dirty || window.confirm("Discard unsaved edits?"));
  const searchRef = useRef<HTMLInputElement>(null);
  if (!token) return <Navigate to="/login" replace />;
  if (me.isLoading) return <p>Verifying session…</p>;
  const navigation = links;
  const matches = search.trim()
    ? navigation.filter(([, label]) =>
        label.toLowerCase().includes(search.toLowerCase()),
      )
    : [];
  return (
    <div className="admin-shell">
      <aside className={open ? "sidebar is-open" : "sidebar"}>
        <Link
          onClick={(event) => {
            if (!canLeave()) event.preventDefault();
          }}
          className="brand"
          to="/"
          aria-label="BULL CMS dashboard"
        >
          <div className="brand-logo">
            <img src="/admin/brand/bull-machine-logo.webp" alt="BULL" />
            <img
              className="white-bull"
              src="/admin/brand/bull-machine-logo.webp"
              alt=""
            />
          </div>
        </Link>
        <button
          className="mobile-close"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <nav aria-label="Admin navigation">
          {navigation.map(([path, label, Icon]) => (
            <Link
              key={path}
              to={path}
              onClick={(event) => {
                if (!canLeave()) event.preventDefault();
                else setOpen(false);
              }}
              aria-current={
                location.pathname + location.search === path
                  ? "page"
                  : undefined
              }
              className={
                location.pathname + location.search === path ? "active" : ""
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="session">
          <button
            onClick={async () => {
              if (!canLeave()) return;
              await logout();
              dispatch(signedOut());
              dispatch(api.util.resetApiState());
            }}
          >
            <LogOut size={22} /> Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header>
          <button
            className="mobile-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="admin-search">
            <Search size={20} />
            <input
              ref={searchRef}
              aria-label="Search CMS modules"
              placeholder="Search dealers, content, products, banners…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearch("");
                if (e.key === "Enter" && matches[0]) {
                  if (!canLeave()) return;
                  navigate(matches[0][0]);
                  setSearch("");
                }
              }}
            />
            {search && (
              <div className="search-results">
                {matches.length ? (
                  matches.map(([path, label]) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={(event) => {
                        if (!canLeave()) event.preventDefault();
                        else setSearch("");
                      }}
                    >
                      {label}
                    </Link>
                  ))
                ) : (
                  <span>No matching modules</span>
                )}
              </div>
            )}
          </div>
          <a
            className="website-link"
            href={
              window.location.port === "5174"
                ? window.location.protocol +
                  "//" +
                  window.location.hostname +
                  ":5173"
                : "/"
            }
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={18} />
            <span>Dealer website</span>
          </a>
          <span className="user-chip">ADMIN PANEL</span>
        </header>
        <main>
          <Outlet context={{ setEditorState }} />
        </main>
      </div>
    </div>
  );
}
