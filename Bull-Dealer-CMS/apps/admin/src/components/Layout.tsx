import { sectionLabel } from "./contentSections";
import { contentSections } from "./contentSections";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  History,
  UserRound,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store";
import { signedOut } from "../store/authSlice";
import {
  api,
  useLogoutMutation,
  useMeQuery,
  useReadQuery,
} from "../services/api";

const commonSections = contentSections.filter(
  (s) => !["branding", "seo", "about", "deliveryMedia"].includes(s.key),
);
const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/dealers", "Dealers", Users],
  ...commonSections.map(
    (s) => ["/content?section=" + s.key, s.key === "contact" ? "Contact US" : s.label, s.icon] as const,
  ),
  ["/history", "Logs & history", History],
] as const;
export function Layout() {
  const { token, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();
  const me = useMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000,
  });
  const dealerQuery = useReadQuery("dealers", { skip: !token });
  const [dealerId, setDealerId] = useState<number>(user?.dealer_id || 0);
  const [region, setRegion] = useState(""),
    [district, setDistrict] = useState(""),
    [locationMode, setLocationMode] = useState(false);
  const location = useLocation();
  const activePath =
    location.pathname === "/content" &&
    new URLSearchParams(location.search).get("section")
      ? "/content?section=" +
        new URLSearchParams(location.search).get("section")
      : location.pathname;
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname, location.search]);
  const [editorState, setEditorState] = useState({ dirty: false, busy: false });
  const canLeave = () =>
    !editorState.busy &&
    (!editorState.dirty || window.confirm("Discard unsaved edits?"));
  const chooseDealer = (id: number) => {
    if (canLeave()) setDealerId(id);
  };
  const setLocationFilter = (mode: boolean, state = "", area = "") => {
    if (canLeave()) {
      setLocationMode(mode);
      setRegion(state);
      setDistrict(area);
      setDealerId(user?.dealer_id || 0);
    }
  };
  const sectionKey = new URLSearchParams(location.search).get("section");
  const pageTitle =
    location.pathname === "/content"
      ? "Content"
      : location.pathname === "/dealers"
        ? "Dealers"
        : location.pathname === "/"
          ? "Dashboard"
          : location.pathname === "/history"
            ? "Logs & history"
            : location.pathname.slice(1).replace(/^./, (x) => x.toUpperCase());
  if (!token) return <Navigate to="/login" replace />;
  if (me.isLoading) return <p>Verifying session…</p>;
  if (me.isError)
    return (
      <p className="error">
        Unable to verify your session. Reload to try again.
      </p>
    );
  const profile = me.data || user;
  if (profile?.role === "SUPER_ADMIN" && !profile.cms_entered)
    return <Navigate to="/choose-employee" replace />;
  const navigation =
    profile?.role === "SUPER_ADMIN"
      ? [...links, ["/employees", "Employees", Users] as const]
      : links;
  const renderLink = ([path, label, Icon]: (typeof navigation)[number]) => (
    <Link
      key={path}
      to={path}
      onClick={(event) => {
        if (!canLeave()) event.preventDefault();
        else setOpen(false);
      }}
      aria-current={activePath === path ? "page" : undefined}
      className={activePath === path ? "active" : ""}
    >
      <Icon size={24} />
      <span>{label}</span>
    </Link>
  );
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
        <nav aria-label="Admin navigation" className="sidebar-navigation">
          <div className="sidebar-primary">
            {navigation.slice(0, 2).map(renderLink)}
          </div>
          <p className="sidebar-section-heading">Common selection</p>
          <div className="sidebar-common">
            {navigation.slice(2, 2 + commonSections.length).map(renderLink)}
          </div>
          <div className="sidebar-bottom">
            {navigation.slice(2 + commonSections.length).map(renderLink)}
          </div>
        </nav>
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
          <div className="header-path">
            <strong>{sectionKey ? sectionLabel(sectionKey) : pageTitle}</strong>
          </div>
          <div
            className="profile-menu"
            ref={profileRef}
            onMouseEnter={() => setProfileOpen(true)}
            onMouseLeave={() => {
              if (!profileRef.current?.contains(document.activeElement))
                setProfileOpen(false);
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setProfileOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setProfileOpen(false);
                profileButton.current?.focus();
              }
            }}
          >
            <button
              ref={profileButton}
              className="profile-avatar"
              aria-label="Open profile"
              aria-expanded={profileOpen}
              aria-controls="profile-popover"
              onClick={() => setProfileOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setProfileOpen(true);
                }
              }}
            >
              <UserRound size={21} aria-hidden="true" />
            </button>
            {profileOpen && (
              <div className="profile-popover" id="profile-popover">
                <p>
                  Hi,{" "}
                  <strong>
                    {profile?.employee_name ||
                      (profile?.role === "SUPER_ADMIN"
                        ? "Admin"
                        : profile?.name)}
                  </strong>
                </p>
                <button
                  className="logout-button"
                  onClick={async () => {
                    if (!canLeave()) return;
                    await logout();
                    dispatch(signedOut());
                    dispatch(api.util.resetApiState());
                  }}
                >
                  <LogOut size={17} aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main>
          <Outlet
            context={{
              setEditorState,
              dealers: dealerQuery.data || [],
              dealerId,
              chooseDealer,
              region,
              district,
              locationMode,
              setLocationFilter,
            }}
          />
        </main>
      </div>
    </div>
  );
}
