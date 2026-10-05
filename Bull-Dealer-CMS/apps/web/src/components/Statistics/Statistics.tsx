import { useContent } from "../../services/useContent";
import "./Statistics.css";
export function Statistics() {
  const { statistics: s } = useContent();
  if (!s.enabled) return null;
  return (
    <div className="statistics" aria-label="BULL statistics">
      {s.items.slice(0, 5).map((v: any, i: number) => (
        <div className="stat" key={i}>
          <img src={v.image} alt="" />
          <div>
            <strong>{v.value}</strong>
            <span>{v.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
