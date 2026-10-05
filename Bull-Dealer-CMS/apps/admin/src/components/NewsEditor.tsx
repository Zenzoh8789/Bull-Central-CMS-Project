import { Fields } from "./Fields";
import { MediaField } from "./MediaField";
export function NewsEditor({
  value,
  onChange,
  onUploadingChange,
}: {
  value: any;
  onChange: (v: any) => void;
  onUploadingChange?: (busy: boolean) => void;
}) {
  return (
    <div className="news-editor purpose-editor">
      <label>
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
        />{" "}
        Show News and Updates
      </label>
      <section className="editor-card">
        <h3>News listing banner</h3>
        <MediaField
          id="news-banner-image"
          label="Banner image"
          value={value.bannerImage}
          onChange={(bannerImage) => onChange({ ...value, bannerImage })}
          onUploadingChange={onUploadingChange}
        />
      </section>
      <Fields
        path="news.items"
        value={value.items}
        template={[{ slug: "", title: "", date: "", image: "", body: "" }]}
        onChange={(items) => onChange({ ...value, items })}
        onUploadingChange={onUploadingChange}
      />
    </div>
  );
}
