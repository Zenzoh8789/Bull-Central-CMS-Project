import { Equipment } from "../Equipment/Equipment";
import { useContent } from "../../services/useContent";
import "./EquipmentCatalogue.css";
export function EquipmentCatalogue() {
  const { equipment: e, products: p } = useContent();
  if (!e.enabled || !p.enabled) return null;
  return (
    <>
      {(p.categories || e.categories).map((c: any) => (
        <Equipment
          key={c.id}
          id={c.id}
          title={<span className="equipment-title-lines">{c.heading}</span>}
          subtitle={c.subtitle}
          category={c.category}
          description={c.description}
          background={e.background}
          products={p.items}
        />
      ))}
    </>
  );
}
