import { ContactSettings } from "./ContactSettings";
import { BannerEditor } from "./BannerEditor";
import { Fields } from "./Fields";
import "../styles/section-fields.css";

type Props = {
  section: string;
  variant?: string;
  value: any;
  template: any;
  media: any[];
  onChange: (value: any) => void;
  onUploadingChange: (busy: boolean) => void;
};
export function SectionFields({
  section,
  variant,
  value,
  template,
  media,
  onChange,
  onUploadingChange,
}: Props) {
  const shared = { media, onUploadingChange };
  if (section === "deliveryMedia") return <section className="editor-card"><Fields {...shared} path="deliveryMedia.items" value={value.items} template={template.items} onChange={(items) => onChange({ ...value, items })} /></section>;
  if (section === "banners")
    return (
      <BannerEditor
        value={value}
        onChange={onChange}
        onUploadingChange={onUploadingChange}
      />
    );
  if (section === "products") {
    const index = variant === "skid" ? 1 : 0;
    const category = value.categories[index];
    const items = value.items.filter((item: any) => item.category === category.category);
    return (
      <div className="purpose-editor">
        <section className="editor-card">
          <h3>Section heading & content</h3>
          <Fields {...shared} path={`products.categories.${index}`} value={category} template={template.categories[index]}
            onChange={(next) => onChange({ ...value, categories: value.categories.map((c: any, i: number) => i === index ? next : c) })} />
        </section>
        <section className="editor-card">
          <h3>{category.category}</h3>
          <Fields {...shared} path="products.items" variant={index === 0 ? "backhoe" : "catalogue"} value={items} template={template.items}
            onChange={(next) => onChange({ ...value, items: [
              ...value.items.filter((item: any) => item.category !== category.category),
              ...next.map((item: any) => ({ ...item, category: category.category, menuLabel: item.name, menuImage: item.image, showInMenu: true })),
            ] })} />
        </section>
      </div>
    );
  }
  if (section === "contact" || ["social", "location"].includes(variant || ""))
    return <ContactSettings section={section} value={value} template={template} media={media} onChange={onChange} onUploadingChange={onUploadingChange} />;
  return (
    <div className={`purpose-editor purpose-${section}`}>
      <Fields
        {...shared}
        path={section}
        value={value}
        template={template}
        onChange={onChange}
      />
    </div>
  );
}
