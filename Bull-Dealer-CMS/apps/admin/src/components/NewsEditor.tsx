import { useState } from "react";
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
  const [isLoading, setLoading] = useState(false);
  const change = (slug: string, key: string, v: string) =>
    onChange({
      ...value,
      items: value.items.map((a: any) =>
        a.slug === slug ? { ...a, [key]: v } : a,
      ),
    });
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
        />{" "}
        Show News and Updates
      </label>
      <section className="panel">
        <h3>News listing banner</h3>
        <label htmlFor="news-banner-image">Banner image</label>
        <MediaField
          id="news-banner-image"
          label="Banner image"
          value={value.bannerImage}
          onChange={(bannerImage) => onChange({ ...value, bannerImage })}
          onUploadingChange={(busy) => {
            setLoading(busy);
            onUploadingChange?.(busy);
          }}
        />
        <p>
          Upload the News and Updates banner. Its heading and description are
          fixed.
        </p>
      </section>
      <fieldset disabled={isLoading}>
        {value.items.map((a: any) => (
          <section className="panel" key={a.slug}>
            <label>
              Title
              <input
                required
                value={a.title}
                onChange={(e) => change(a.slug, "title", e.target.value)}
              />
            </label>
            <label>
              Date
              <input
                required
                type="date"
                value={a.date}
                onChange={(e) => change(a.slug, "date", e.target.value)}
              />
            </label>
            <label htmlFor={"news-image-" + a.slug}>Article image</label>
            <MediaField
              id={"news-image-" + a.slug}
              label="Article image"
              value={a.image}
              onChange={(url) => change(a.slug, "image", url)}
              onUploadingChange={(busy) => {
                setLoading(busy);
                onUploadingChange?.(busy);
              }}
            />
            <label>
              Article text (leave a blank line between paragraphs)
              <textarea
                required
                rows={8}
                value={a.body}
                onChange={(e) => change(a.slug, "body", e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  items: value.items.filter((x: any) => x.slug !== a.slug),
                })
              }
            >
              Remove article
            </button>
          </section>
        ))}
        <button
          type="button"
          disabled={value.items.length >= 150}
          onClick={() =>
            onChange({
              ...value,
              items: [
                ...value.items,
                {
                  slug: "news-" + crypto.randomUUID(),
                  title: "",
                  date: new Date().toISOString().slice(0, 10),
                  image: "",
                  body: "",
                },
              ],
            })
          }
        >
          + Add news article
        </button>
      </fieldset>
    </div>
  );
}
