import { useCallback } from "react";
import { useSearchParams, useOutletContext, Navigate } from "react-router-dom";
import {
  contentSections,
  type EditorState,
} from "../components/contentSections";
import { SectionWorkspace } from "../components/SectionWorkspace";
import type { WorkspaceContext } from "../components/WorkspaceContext";
export function Content() {
  const ctx = useOutletContext<WorkspaceContext>();
  const [params] = useSearchParams();
  const update = useCallback(
    (state: EditorState) => ctx.setEditorState(state),
    [ctx.setEditorState],
  );
  const section = contentSections.find(
    (s) => s.key === params.get("section") && s.key !== "branding",
  )?.key;
  if (!section) return <Navigate to="/content?section=seo" replace />;
  const canEdit = !ctx.locationMode || Boolean(ctx.dealerId);
  return (
    <div className="content-workspace">
      {canEdit ? (
        <SectionWorkspace
          key={ctx.dealerId + ":" + section}
          section={section}
          layer={ctx.dealerId ? "OVERRIDE" : "COMMON"}
          owner={ctx.dealerId}
          onStateChange={update}
        />
      ) : (
        <p className="notice">
          Choose a dealer below the location filters to edit its content.
        </p>
      )}
    </div>
  );
}
