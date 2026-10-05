import { Routes, Route, Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Login } from "../pages/Login";
import { Overview } from "../pages/Overview";
import { Content } from "../pages/Content";
import { Dealers } from "../pages/Dealers";
import { History } from "../pages/History";
import { ChooseEmployee, Employees } from "../pages/Employees";
export function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="choose-employee" element={<ChooseEmployee />} />
      <Route path="setup-employees" element={<Employees />} />
      <Route element={<Layout />}>
        <Route path="employees" element={<Employees embedded />} />
        <Route index element={<Overview />} />
        <Route path="content" element={<Content />} />
        <Route path="dealers" element={<Dealers />} />
        <Route path="history" element={<History />} />
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
