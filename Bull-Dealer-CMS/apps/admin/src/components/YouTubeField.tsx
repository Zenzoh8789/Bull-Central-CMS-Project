import { useState } from "react";
import { youtubeId } from "@bull/content/editing";
export function YouTubeField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [input, setInput] = useState(
    value ? `https://www.youtube.com/watch?v=${value}` : "",
  );
  return (
    <div className="field">
      <label htmlFor={id}>YouTube video or embed link</label>
      <input
        id={id}
        required
        value={input}
        placeholder="Paste a YouTube link or iframe embed"
        onChange={(event) => {
          const raw = event.target.value;
          const parsed = youtubeId(raw);
          setInput(raw);
          event.target.setCustomValidity(
            parsed
              ? ""
              : "Enter a valid YouTube video, Shorts, embed link or iframe.",
          );
          onChange(parsed || raw);
        }}
      />
      <small>
        Watch links, Shorts and YouTube iframe embeds are supported.
      </small>
    </div>
  );
}
