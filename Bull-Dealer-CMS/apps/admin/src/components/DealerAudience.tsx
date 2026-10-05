import { useOutletContext } from "react-router-dom";
import { Globe, MapPin } from "lucide-react";
import { dealerState } from "../utils/dealerState";
import type { WorkspaceContext } from "./WorkspaceContext";
export const stateOf = (d: any) => d.state?.trim() || dealerState(d.location);
export const districtOf = (d: any) => d.district?.trim() || "Unspecified";
export function DealerAudience() {
  const ctx = useOutletContext<WorkspaceContext>();
  const states = [...new Set<string>(ctx.dealers.map(stateOf))].sort();
  const districts = [
    ...new Set<string>(
      ctx.dealers.filter((d) => stateOf(d) === ctx.region).map(districtOf),
    ),
  ].sort();
  return (
    <div className="location-filter">
      <div className="location-modes">
        <button
          type="button"
          className={!ctx.locationMode ? "selected" : ""}
          aria-pressed={!ctx.locationMode}
          onClick={() => ctx.setLocationFilter(false)}
        >
          <Globe />
          All dealers
        </button>
        <button
          type="button"
          className={ctx.locationMode ? "selected" : ""}
          aria-pressed={ctx.locationMode}
          onClick={() => ctx.setLocationFilter(true)}
        >
          <MapPin />
          State & district
        </button>
      </div>
      {ctx.locationMode && (
        <>
          <label>
            State
            <select
              aria-label="State"
              value={ctx.region}
              onChange={(e) => ctx.setLocationFilter(true, e.target.value, "")}
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            District
            <select
              disabled={!ctx.region}
              aria-label="District"
              value={ctx.district}
              onChange={(e) =>
                ctx.setLocationFilter(true, ctx.region, e.target.value)
              }
            >
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Dealer
            <select
              aria-label="Choose dealer"
              value={ctx.dealerId}
              onChange={(e) => ctx.chooseDealer(Number(e.target.value))}
            >
              <option value={0}>Choose a dealer</option>
              {ctx.dealers
                .filter(
                  (d) =>
                    (!ctx.region || stateOf(d) === ctx.region) &&
                    (!ctx.district || districtOf(d) === ctx.district),
                )
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
