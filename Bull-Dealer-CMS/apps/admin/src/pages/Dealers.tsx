import { stateOf, districtOf } from "../components/DealerAudience";

import { districtsForState, indiaStates } from "../data/indiaGeography";

import { Trash2, Plus, Search, Building2 } from "lucide-react";

import { useState } from "react";


import { useReadQuery, useWriteMutation, errorText } from "../services/api";

import { useAppSelector } from "../store";

import { Status } from "../components/Status";


import { DealerEditorDialog } from "../components/DealerEditorDialog";


import "./Dealers.css";

const blank = {

  name: "",

  location: "",

  address: "",

  about: "",

  active: false,

  domains: [],

};

function dealerWebsiteUrl(domain: string) {
  const value = String(domain || "").trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;

  const host = value.split("/")[0].split(":")[0].toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1";

  return `${isLocal ? "http" : "https"}://${value}`;
}

export function Dealers() {
const q = useReadQuery("dealers");

  const user = useAppSelector((s) => s.auth.user);

  const [edit, setEdit] = useState<any>(null);

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [stateFilter, setStateFilter] = useState("");

  const [districtFilter, setDistrictFilter] = useState("");
const [write, { isLoading }] = useWriteMutation();

  const dealers = q.data || [];

  const states = indiaStates;

  const districts = Array.from(

    new Set([

      ...districtsForState(stateFilter),

      ...dealers

        .filter((d: any) => !stateFilter || stateOf(d) === stateFilter)

        .map(districtOf),

    ]),

  ).sort((a, b) => a.localeCompare(b));

  const filtered = dealers.filter((d: any) => {

    const matchesSearch =

      `${d.name} ${d.location} ${d.state || ""} ${d.district || ""} ${d.domains.join(" ")}`

        .toLowerCase()

        .includes(search.toLowerCase());

    const matchesState = !stateFilter || stateOf(d) === stateFilter;

    const matchesDistrict = !districtFilter || districtOf(d) === districtFilter;

    return matchesSearch && matchesState && matchesDistrict;

  });

  return (

    <div className="dealers-page">

      <div className="workspace-heading">

        <div>

          <h1>Dealers</h1>

        </div>

        {user.role === "SUPER_ADMIN" && (

          <button

            className="primary"

            onClick={() => {

              setEdit({ ...blank });

              setMessage("");

            }}

          >

            <Plus size={17} />

            Add dealer

          </button>

        )}

      </div>



      <div className="dealer-list-toolbar">

        <label className="search-field">

          <Search size={18} />

          <input

            aria-label="Search dealers"

            placeholder="Search name, location or domain"

            value={search}

            onChange={(e) => setSearch(e.target.value)}

          />

        </label>



        <label className="dealer-filter-field">

          <span>State</span>

          <select

            aria-label="Filter dealers by state"

            value={stateFilter}

            onChange={(e) => {

              setStateFilter(e.target.value);

              setDistrictFilter("");

            }}

          >

            <option value="">All states</option>

            {states.map((state) => (

              <option key={state} value={state}>

                {state}

              </option>

            ))}

          </select>

        </label>



        <label className="dealer-filter-field">

          <span>District</span>

          <select

            aria-label="Filter dealers by district"

            value={districtFilter}

            onChange={(e) => setDistrictFilter(e.target.value)}

          >

            <option value="">All districts</option>

            {districts.map((district) => (

              <option key={district} value={district}>

                {district}

              </option>

            ))}

          </select>

        </label>

        {(stateFilter || districtFilter) && (
          <button
            type="button"
            className="dealer-filter-clear"
            onClick={() => {
              setStateFilter("");
              setDistrictFilter("");
            }}
          >
            Clear
          </button>
        )}

        <span>{filtered.length} dealers</span>

      </div>

      <Status query={q} />

      {message && (

        <p className="notice" role="status">

          {message}

        </p>

      )}

      {edit && (

        <DealerEditorDialog dealer={edit} onClose={() => setEdit(null)} />

      )}

      <div className="dealer-table-wrap">

        <table className="dealers-table">

          <thead>

            <tr>

              <th scope="col">Dealer</th>

              <th scope="col">Website domain</th>

              <th scope="col">Status</th>

              <th scope="col">Actions</th>

            </tr>

          </thead>

          <tbody>

            {filtered?.map((d: any) => (

              <tr key={d.id}>

                <td>

                  <div className="dealer-identity">

                    <span className="dealer-monogram">

                      <Building2 size={20} />

                    </span>

                    <div>

                      <button

                        type="button"

                        className="dealer-name-button"

                        onClick={() => setEdit(d)}

                      >

                        {d.name}

                      </button>

                      <small>

                        {[d.district, d.state || d.location]

                          .filter(Boolean)

                          .join(", ")}

                      </small>

                    </div>

                  </div>

                </td>

                <td>

                  {d.domains.map((domain: string) => (

                    <span className="dealer-domain" key={domain}>

                      {domain}

                    </span>

                  ))}

                </td>

                <td>

                  <span

                    className={`dealer-status ${d.active ? "is-active" : ""}`}

                  >

                    <i />

                    {d.active ? "Active" : "Inactive"}

                  </span>

                </td>

                <td>

                  <div className="dealer-row-actions">

                    <button
                      aria-label={`View ${d.name} website`}
                      title="Open dealer website"
                      disabled={!d.domains?.length}
                      onClick={() => {
                        const url = dealerWebsiteUrl(d.domains?.[0]);
                        if (url) {
                          window.open(url, "_blank", "noopener,noreferrer");
                        }
                      }}
                    >
                      View
                    </button>

                    <button

                      className="edit-dealer-button"

                      title="Edit dealer"

                      aria-label={`Edit ${d.name}`}

                      onClick={() => {

                        setMessage("");

                        setEdit(d);

                      }}

                    >

                      Edit

                    </button>

                    {user.role === "SUPER_ADMIN" && (

                      <button

                        className="delete-dealer"

                        aria-label={`Delete ${d.name}`}

                        title="Delete dealer"

                        disabled={isLoading}

                        onClick={async () => {

                          if (

                            !window.confirm(

                              `Delete ${d.name}? Its domains, content and enquiries will be removed and its users disabled.`,

                            )

                          )

                            return;

                          try {

                            await write({

                              path: `dealers/${d.id}`,

                              method: "DELETE",

                            }).unwrap();


                            setMessage("Dealer deleted.");

                          } catch (error) {

                            setMessage(errorText(error));

                          }

                        }}

                      >

                        <Trash2 size={16} />

                      </button>

                    )}

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {!q.isLoading && !q.isError && filtered?.length === 0 && (

          <p className="empty-state">

            {search || stateFilter || districtFilter

              ? "No dealers match your filters."

              : "No dealers yet."}

          </p>

        )}

      </div>
</div>

  );

}
