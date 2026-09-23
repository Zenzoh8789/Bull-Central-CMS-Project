import { Routes, Route, Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Login } from "../pages/Login";
import { Overview } from "../pages/Overview";
import { Content } from "../pages/Content";
import { Dealers } from "../pages/Dealers";
import { Groups } from "../pages/Groups";
import { Publish } from "../pages/Publish";
import { History } from "../pages/History";
import { Media } from "../pages/Media";
import { Enquiries } from "../pages/Enquiries";
import { Users } from "../pages/Users";
export function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="content" element={<Content />} />
        <Route path="dealers" element={<Dealers />} />
        <Route path="groups" element={<Groups />} />
        <Route path="publish" element={<Publish />} />
        <Route path="history" element={<History />} />
        <Route path="media" element={<Media />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="users" element={<Users />} />
        <Route
          path="*"
          element={
            <p>
              Page not found. <Link to="/">Return to overview</Link>
            </p>
          }
        />
      </Route>
    </Routes>
  );
}
