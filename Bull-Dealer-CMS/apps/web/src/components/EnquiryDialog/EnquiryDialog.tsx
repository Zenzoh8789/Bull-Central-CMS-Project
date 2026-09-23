import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { actions } from "../../store/uiSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useContent } from "../../services/useContent";
import { EnquiryForm } from "../EnquiryForm/EnquiryForm";
import "./EnquiryDialog.css";
export function EnquiryDialog() {
  const dispatch = useAppDispatch();
  const selected = useAppSelector((s) => s.ui.selectedProduct);
  const dialog = useRef<HTMLDialogElement>(null);
  const { contact: c } = useContent();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, []);
  return (
    <dialog
      aria-label={c.heading}
      ref={dialog}
      onCancel={() => dispatch(actions.closeEnquiry())}
      onClick={(e) => {
        if (e.target === dialog.current) dispatch(actions.closeEnquiry());
      }}
    >
      <button
        className="close"
        aria-label="Close enquiry"
        onClick={() => dispatch(actions.closeEnquiry())}
      >
        <X />
      </button>
      <h2>{c.heading}</h2>
      <p>{c.intro}</p>
      <EnquiryForm selected={selected} />
    </dialog>
  );
}
