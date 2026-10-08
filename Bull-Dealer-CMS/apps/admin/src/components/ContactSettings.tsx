import { Fields } from "./Fields";
import { MediaField } from "./MediaField";

export function ContactSettings({ section, value, template, media, onChange, onUploadingChange }: {
  section: string; value: any; template: any; media: any[];
  onChange: (value: any) => void; onUploadingChange: (busy: boolean) => void;
}) {
  const shared = { media, onUploadingChange };
  if (section === "contact") return (
    <div className="purpose-editor"><section className="editor-card contact-banner-card">
      <h3>Page banner</h3>
      <div className="field"><label htmlFor="field-contact.banner">Banner</label>
        <MediaField {...shared} id="field-contact.banner" label="Banner" value={value.banner} allowRemove={false} onChange={banner => onChange({ ...value, banner })} />
      </div>
      <label className="field" htmlFor="field-contact.bannerAlt">Alt tag
        <input id="field-contact.bannerAlt" type="text" maxLength={500} value={value.bannerAlt || ""} onChange={e => onChange({ ...value, bannerAlt: e.target.value })} />
      </label>
    </section></div>
  );
  if (section === "locations") {
    const first = value.items?.[0] || template.items[0];
    return <div className="purpose-editor"><section className="editor-card">
      <h3>Dealer location</h3>
      <label className="field" htmlFor="field-contactLocation.mapUrl">Google Maps embed link
        <input id="field-contactLocation.mapUrl" type="url" value={first.mapUrl || ""} onChange={e => onChange({ ...value, enabled: true, items: [{ ...first, enabled: true, title: "Dealer location", mapUrl: e.target.value }] })} />
      </label>
      <Fields {...shared} path="contactLocation" value={first}
        template={{ name: "", address: "", phone: "", email: "" }}
        onChange={next => onChange({ ...value, enabled: true, items: [{ ...next, enabled: true, title: "Dealer location" }] })} />
    </section></div>;
  }
  return <div className="purpose-editor"><section className="editor-card">
    <h3>Follow us</h3>
    <Fields {...shared} path="social" variant="contact-social" value={value} template={{ items: template.items }} onChange={next => onChange({ ...next, enabled: true })} />
  </section></div>;
}
