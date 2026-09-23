import { useEffect } from "react";
import { X } from "lucide-react";
import "./VideoDialog.css";

type VideoDialogProps = {
  video: string;
  description?: string;
  onClose: () => void;
};

export function VideoDialog({
  video,
  description,
  onClose,
}: VideoDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="video-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Customer testimonial video"
      onClick={onClose}
    >
      <div
        className="video-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          className="video-dialog-close"
          onClick={onClose}
          aria-label="Close video"
        >
          <X size={28} />
        </button>

        {/* VIDEO PLAYER */}
        <div className="video-dialog-player">
          <iframe
            src={`https://www.youtube.com/embed/${video}?autoplay=1&rel=0`}
            title="Customer testimonial video"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />

          {/* SAME DESCRIPTION */}
          {description && (
            <div className="video-description-overlay">
              <div className="video-description-content">
                <p>{description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}