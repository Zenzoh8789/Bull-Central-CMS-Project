import { CmsDialog } from "../components/CmsDialog";
import "../styles/staff.css";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Trash2, Plus, Users, X } from "lucide-react";
import {
  api,
  errorText,
  useEnterMutation,
  useLogoutMutation,
  useMeQuery,
  useReadQuery,
  useWriteMutation,
} from "../services/api";
import { useAppDispatch, useAppSelector } from "../store";
import { profileUpdated, signedOut } from "../store/authSlice";
import { Status } from "../components/Status";

type Employee = {
  id: number;
  name: string;
  department: string;
  active: number | boolean;
};

function Brand() {
  return (
    <div className="staff-brand">
      <img src="/admin/brand/bull-machine-logo.webp" alt="BULL" />
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="staff-avatar" aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export function ChooseEmployee() {
  const token = useAppSelector((s) => s.auth.token);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const me = useMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  const employeesQuery = useReadQuery("employees", {
    skip: !token || me.data?.role !== "SUPER_ADMIN",
    refetchOnMountOrArgChange: true,
  });

  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [enter, { isLoading }] = useEnterMutation();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const employees: Employee[] = (employeesQuery.data || []).filter(
    (employee: Employee) => Boolean(employee.active),
  );

  const selectedEmployee = employees.find(
    (employee) => employee.id === selected,
  );

  const busy = isLoading || isLoggingOut;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (me.data && (me.data.role !== "SUPER_ADMIN" || me.data.cms_entered)) {
    return <Navigate to="/" replace />;
  }

  async function continueWithEmployee() {
    if (!selectedEmployee) return;

    setError("");

    try {
      const profile = await enter({
        employeeId: selectedEmployee.id,
      }).unwrap();

      dispatch(profileUpdated(profile));
      await me.refetch();
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function backToLogin() {
    setError("");

    try {
      await logout().unwrap();
      dispatch(signedOut());
      dispatch(api.util.resetApiState());
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className="staff-page">
      <section className="staff-shell staff-chooser">
        <Brand />

        <div className="staff-heading staff-heading-center">
          <h1>Choose Employee</h1>
          <p>Select your profile to track your CMS activity.</p>
        </div>

        <Status query={me} />
        <Status query={employeesQuery} />

        <div
          className="staff-choice-grid"
          role="group"
          aria-label="Choose Employee"
        >
          {employees.map((employee) => (
            <button
              type="button"
              key={employee.id}
              className={`staff-choice ${
                selected === employee.id ? "is-selected" : ""
              }`}
              aria-pressed={selected === employee.id}
              disabled={busy}
              onClick={() => setSelected(employee.id)}
            >
              <Avatar name={employee.name} />

              <span className="staff-choice-info">
                <strong>{employee.name}</strong>
                <small>{employee.department}</small>
              </span>

              {selected === employee.id && (
                <Check
                  className="staff-choice-check"
                  size={18}
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>

        {employeesQuery.isSuccess && !employees.length && (
          <p className="staff-empty">
            No active employees yet. Create an employee to get started.
          </p>
        )}

        {error && (
          <p className="staff-error" role="alert">
            {error}
          </p>
        )}

        <div className="staff-chooser-actions">
          <button
            type="button"
            className="staff-button staff-button-primary"
            disabled={!selectedEmployee || busy}
            onClick={continueWithEmployee}
          >
            <Check size={18} aria-hidden="true" />
            {isLoading
              ? "Entering CMS…"
              : selectedEmployee
                ? `Continue as ${selectedEmployee.name}`
                : "Select an employee to continue"}
          </button>

          <Link
            className="staff-button staff-button-secondary"
            to="/setup-employees"
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
            aria-disabled={busy}
          >
            <Users size={18} aria-hidden="true" />
            Manage / Add Employees
          </Link>

          <button
            type="button"
            className="staff-button staff-button-secondary"
            disabled={busy}
            onClick={backToLogin}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {isLoggingOut ? "Signing out…" : "Back to Login"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function Employees({ embedded = false }: { embedded?: boolean }) {
  const token = useAppSelector((s) => s.auth.token);

  const me = useMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  const employeesQuery = useReadQuery("employees", {
    skip: !token || me.data?.role !== "SUPER_ADMIN",
    refetchOnMountOrArgChange: true,
  });

  const [write, { isLoading }] = useWriteMutation();

  const [editing, setEditing] = useState<Employee | null>(null);
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [removing, setRemoving] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const editDialog = useRef<HTMLDialogElement>(null);
  const removeDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = editDialog.current;

    if (editing && !dialog?.open) {
      dialog?.showModal();
    } else if (!editing && dialog?.open) {
      dialog.close();
    }
  }, [editing]);

  useEffect(() => {
    const dialog = removeDialog.current;

    if (removing && !dialog?.open) {
      dialog?.showModal();
    } else if (!removing && dialog?.open) {
      dialog.close();
    }
  }, [removing]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (me.data && me.data.role !== "SUPER_ADMIN") {
    return <Navigate to="/" replace />;
  }

  function openNewEmployee() {
    setError("");
    setNotice("");
    setEditing({
      id: 0,
      name: "",
      department: "",
      active: true,
    });
  }

  function openEditEmployee(employee: Employee) {
    setError("");
    setNotice("");
    setEditing(employee);
  }

  function openRemoveEmployee(employee: Employee) {
    setError("");
    setNotice("");
    setRemoving(employee);
  }

  async function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing) return;

    setError("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const department = String(form.get("department") || "").trim();

    if (!name || !department) {
      setError("Enter an employee name and department / role.");
      return;
    }

    try {
      await write({
        path: editing.id ? `employees/${editing.id}` : "employees",
        method: editing.id ? "PUT" : "POST",
        body: {
          name,
          department,
          active: form.get("active") === "true",
        },
      }).unwrap();

      setNotice(editing.id ? "Employee updated." : "Employee created.");
      setEditing(null);
      await me.refetch();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function removeEmployee() {
    if (!removing) return;

    setError("");

    try {
      await write({
        path: `employees/${removing.id}`,
        method: "DELETE",
      }).unwrap();

      setRemoving(null);
      setNotice("Employee removed.");
      await me.refetch();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className={embedded ? "staff-embedded" : "staff-page"}>
      <section className="staff-shell staff-management">
        <div className="staff-top">
          {!embedded && <Brand />}

          <div className="staff-top-actions">
            {!embedded && (
              <Link
                className="staff-button staff-button-secondary"
                to="/choose-employee"
              >
                <ArrowLeft size={18} aria-hidden="true" />
                Choose Employee
              </Link>
            )}

            <button
              type="button"
              className="staff-button staff-button-primary"
              disabled={!me.data || isLoading}
              onClick={openNewEmployee}
            >
              <Plus size={18} aria-hidden="true" />
              New Employee
            </button>
          </div>
        </div>

        <div className="staff-heading">
          <h1>Employees</h1>
          <p>Create, edit, deactivate or remove CMS employees.</p>
        </div>

        <Status query={me} />
        <Status query={employeesQuery} />

        {notice && (
          <p className="staff-notice" role="status">
            {notice}
          </p>
        )}

        <div className="content-table-wrap">
          <table className="content-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeesQuery.data?.map((employee: Employee, index: number) => (
                <tr key={employee.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{employee.name}</strong>
                  </td>
                  <td>{employee.department}</td>
                  <td>
                    <span
                      className={
                        "staff-status " +
                        (employee.active ? "is-active" : "is-inactive")
                      }
                    >
                      {employee.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        onClick={() => setViewing(employee)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => openEditEmployee(employee)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="delete-item"
                        aria-label={"Delete " + employee.name}
                        disabled={isLoading}
                        onClick={() => openRemoveEmployee(employee)}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {viewing && (
          <CmsDialog title={viewing.name} onClose={() => setViewing(null)}>
            <div className="cms-dialog-body">
              <p>
                <strong>Department:</strong> {viewing.department}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {viewing.active ? "Active" : "Inactive"}
              </p>
            </div>
          </CmsDialog>
        )}

        {employeesQuery.isSuccess && !employeesQuery.data?.length && (
          <p className="staff-empty">
            No employees added. Click New Employee above to get started.
          </p>
        )}

        <dialog
          ref={editDialog}
          className="staff-dialog"
          aria-labelledby="staff-edit-title"
          onCancel={(event) => {
            if (isLoading) {
              event.preventDefault();
            } else {
              setEditing(null);
            }
          }}
        >
          {editing && (
            <form key={editing.id} onSubmit={saveEmployee}>
              <div className="staff-dialog-heading">
                <h2 id="staff-edit-title">
                  {editing.id ? "Edit Employee" : "New Employee"}
                </h2>

                <button
                  type="button"
                  className="staff-close"
                  aria-label="Close employee form"
                  disabled={isLoading}
                  onClick={() => setEditing(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <fieldset disabled={isLoading}>
                <label>
                  Employee Name
                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={editing.name}
                    autoFocus
                    placeholder="Enter employee name"
                  />
                </label>

                <label>
                  Department / Role
                  <input
                    name="department"
                    required
                    maxLength={100}
                    defaultValue={editing.department}
                    placeholder="Procurement / Accounts / Admin"
                  />
                </label>

                <label>
                  Status
                  <select
                    name="active"
                    defaultValue={String(Boolean(editing.active))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </label>
              </fieldset>

              {error && (
                <p className="staff-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="staff-button staff-button-primary staff-button-full"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving…"
                  : editing.id
                    ? "Save Changes"
                    : "Create Employee"}
              </button>
            </form>
          )}
        </dialog>

        <dialog
          ref={removeDialog}
          className="staff-dialog"
          aria-labelledby="staff-remove-title"
          onCancel={(event) => {
            if (isLoading) {
              event.preventDefault();
            } else {
              setRemoving(null);
            }
          }}
        >
          <div className="staff-dialog-heading">
            <h2 id="staff-remove-title">Remove {removing?.name}?</h2>

            <button
              type="button"
              className="staff-close"
              aria-label="Close removal confirmation"
              disabled={isLoading}
              onClick={() => setRemoving(null)}
            >
              <X size={20} />
            </button>
          </div>

          <p className="staff-dialog-description">
            This employee will no longer appear in the chooser. Their activity
            history will be retained.
          </p>

          {error && (
            <p className="staff-error" role="alert">
              {error}
            </p>
          )}

          <div className="staff-dialog-actions">
            <button
              type="button"
              className="staff-button staff-button-secondary"
              disabled={isLoading}
              onClick={() => setRemoving(null)}
            >
              Cancel
            </button>

            <button
              type="button"
              className="staff-button staff-button-danger"
              disabled={isLoading}
              onClick={removeEmployee}
            >
              {isLoading ? "Removing…" : "Remove Employee"}
            </button>
          </div>
        </dialog>
      </section>
    </div>
  );
}
