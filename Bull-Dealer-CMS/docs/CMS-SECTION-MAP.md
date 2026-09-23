# Website audit and editable section map

Base: user-supplied Arnnchive.zip. Audited all first-party page templates (index.php, contact.php, header.php, footer.php), Asset/JS/script.js, inline interactions, CSS/responsive CSS, links, form fields, assets and default.php. PHP is treated as reference content, never executed. The ZIP includes PHPMailer/mail.php infrastructure; credentials and executable mail settings are not imported into CMS content.

## Pages and exclusions

- index.php: complete dealer home.
- contact.php: contact banner, six-field enquiry form, dealer card, three map/contact blocks, shared footer.
- header.php/footer.php: shared desktop/mobile navigation and footer.
- default.php: Hostinger setup placeholder, not a dealer-facing page; intentionally not published.
- Product detail, corporate About, Media, Career, Service Support and Privacy destinations are external manufacturer links in the original archive. Their labels/URLs are editable; their external website bodies are outside this archive. Local product summary routes already added are retained.
- No independent Gallery, Downloads, blog detail or admin page exists in the archive. Gallery and Downloads are additional optional CMS sections from the requirements, disabled initially so the original design stays intact.

## Editable coverage

| CMS section key | Original area | Editable fields | Default scope |
|---|---|---|---|
| seo | head/favicon | Title, description, canonical, social image, favicon | Dealer |
| branding | header | BULL logo, dealer logo, alt text, name | Dealer |
| navigation | header/mobile | Utility links, main link labels, product-menu label, mobile links | Common |
| banners | #banner | All three slides, image, alt, link, order, autoplay, delay, scroll label | Common |
| statistics | banner-details | All five icons, values, suffixes/labels, order | Common |
| about | #innovation | Heading, full text, image, alt, read-more label/URL | Dealer |
| products | menu + equipment | All four products, title, category, images, description, manufacturer URL, menu visibility/order/label/image | Common |
| equipment | #construct, #cons-title-main | Both headings, subtitles, descriptions, background, visibility | Common |
| service | #customers | Services & Spare Parts heading, banner, alt, destination | Common |
| testimonials | #customer | Heading, six thumbnails, YouTube video IDs, order, visibility | Common |
| news | #news | Heading, three article images/titles/dates/links, ordering | Common |
| contact | #cont-banner/#cont-form | Banner, form title/intro/button/success message, six field labels/placeholders/required flags, consent copy | Common |
| dealerContact | contact card + footer | Name, authorisation caption, logo, address, phone, email, directions URL | Dealer |
| locations | contact three blocks | Dealer location, North India office, Plant 2; titles/name/address/phone/email/map URL; visibility/order | Dealer |
| social | contact/footer | Follow heading, description, Instagram/Facebook/YouTube links and labels | Dealer |
| footer | footer | Three link groups, contact heading, copyright, footer image/alt | Common |
| whatsapp | floating action | Enabled, destination phone, prefilled message, accessible label | Dealer |
| pageLayout | home/section dots | Section order, section visibility, section navigation labels | Dealer |
| gallery | additional requirement | Enabled, heading, image/alt/caption list | Dealer |
| downloads | additional requirement | Enabled, heading, document titles/PDF URLs | Common |

The section registry is the source for CMS editors and validation. No raw HTML/JavaScript editors are provided. Media and link URL schemes are checked; YouTube IDs and map hosts are constrained.

## Known source inconsistencies

The ZIP dealer logo/footer/about identify Orange Automobile, while the first contact map identifies BR Enterprises. The existing user-approved preview is Tara Auto Hub. Retain Tara's identity. Orange and the mismatched BR location are preserved in the audit references, not activated as additional dealers until their correct domain and contact identity are supplied. Do not copy the embedded Google API key; use keyless maps or an explicitly configured account integration.

## Publishing contract

Drafts never change live pages. Common, Group and Dealer are inherited content layers; explicit Dealer Override has highest priority. Whole sections are the override unit, clearly shown in the editor. Publishing stores an immutable revision snapshot per resolved active dealer in one database transaction. All/Group/Selected/Single determine recipients independently of the layer being published. Normal inherited updates preserve explicit overrides. Removing an override is a separate deliberate publish action and reveals the latest underlying layer. Scope membership is resolved and shown in a publish preview, then revalidated on commit. History records actor, revision, target selection, affected dealers and overrides preserved. Publishing uses optimistic revision checks to reject stale drafts.

## Module verification plan

1. Archive import/section registry: coverage, valid defaults, no unrecognised sections.
2. MySQL schema/authentication: migration, sessions, role checks, dealer isolation.
3. Dealer/group management: unique domains, membership, active/inactive recipients.
4. Draft editing: all section forms, revision conflict handling, field validation.
5. Publishing: all four targets, inheritance, override preservation/removal, atomic rollback, 130-dealer batch.
6. Public renderer: each section consumes resolved published content without redesign; full contact page restored.
7. Admin UI: login, dashboard, dealers/groups, common/dealer/override editors, preview/publish/history, media/enquiries.
8. End-to-end: publish, reload selected dealer domain, confirm isolation and persistence after restart.

Handwritten requirements: only the pasted CMS brief and website screenshots are available at audit time; additional handwritten material is awaiting user clarification.
