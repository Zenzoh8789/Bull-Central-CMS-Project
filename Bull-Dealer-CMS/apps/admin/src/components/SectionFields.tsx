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
  if (section === "banners")
    return (
      <BannerEditor
        value={value}
        onChange={onChange}
        onUploadingChange={onUploadingChange}
      />
    );
  if (section === "products") {
    const menu = variant === "menu";
    const index = variant === "skid" ? 1 : 0;
    const category = value.categories[index];
    const items = menu
      ? value.items
      : value.items.filter((item: any) => item.category === category.category);
    return (
      <div className="purpose-editor">
        {!menu && (
          <section className="editor-card">
            <h3>Section heading & content</h3>
            <Fields
              {...shared}
              path={`products.categories.${index}`}
              value={category}
              template={template.categories[index]}
              onChange={(next) =>
                onChange({
                  ...value,
                  categories: value.categories.map((c: any, i: number) =>
                    i === index ? next : c,
                  ),
                })
              }
            />
          </section>
        )}
        <section className="editor-card">
          <h3>{menu ? "Our products menu" : category.category}</h3>
          <Fields
            {...shared}
            path="products.items"
            variant={menu ? "menu" : "catalogue"}
            value={items}
            template={template.items}
            onChange={(next) =>
              onChange({
                ...value,
                items: menu
                  ? next
                  : [
                      ...value.items.filter(
                        (item: any) => item.category !== category.category,
                      ),
                      ...next.map((item: any) => ({
                        ...item,
                        category: category.category,
                      })),
                    ],
              })
            }
          />
        </section>
      </div>
    );
  }
  if (section === "contact") {
    const blocks = [
      ["Page banner", ["banner"]],
      [
        "Enquiry form",
        ["heading", "intro", "submitLabel", "successMessage", "consentLabel"],
      ],
      ["Form fields", ["fields"]],
    ] as const;
    return (
      <div className="purpose-editor">
        {blocks.map(([label, keys]) => (
          <section
            className={
              label === "Page banner"
                ? "editor-card contact-banner-card"
                : "editor-card"
            }
            key={label}
          >
            <h3>{label}</h3>
            <Fields
              {...shared}
              path="contact"
              value={value}
              template={Object.fromEntries(
                keys.map((key) => [key, template[key]]),
              )}
              onChange={onChange}
            />
          </section>
        ))}
      </div>
    );
  }
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
