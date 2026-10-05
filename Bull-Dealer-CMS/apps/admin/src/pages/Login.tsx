import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useLoginMutation, errorText, api } from "../services/api";
import { useAppDispatch, useAppSelector } from "../store";
import { signedIn } from "../store/authSlice";
export function Login() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState("");
  if (token) return <Navigate to="/choose-employee" replace />;
  return (
    <div className="login">
      <div className="login-frame">
        <section className="login-visual">
          <img
            src="/admin/brand/plant.webp"
            alt="BULL construction equipment"
          />
        </section>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              const result = await login({
                username: String(f.get("username")),
                password: String(f.get("password")),
              }).unwrap();
              dispatch(api.util.resetApiState());
              dispatch(signedIn(result));
            } catch (e) {
              setError(errorText(e));
            }
          }}
        >
          <div className="brand">
            <img
              src="/admin/brand/bull-machine-logo.webp"
              alt="BULL"
              className="bull-logo"
            />
          </div>
          <span className="eyebrow">WELCOME</span>
          <h1>Sign in to your workspace</h1>
          <p>Manage your dealer network with BULL Central CMS.</p>
          <label>
            Username
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
