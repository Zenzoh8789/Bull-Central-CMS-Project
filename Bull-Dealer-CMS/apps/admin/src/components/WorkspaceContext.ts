import type { EditorState } from "./contentSections";
export type WorkspaceContext = {
  setEditorState: (s: EditorState) => void;
  dealers: any[];
  dealerId: number;
  chooseDealer: (id: number) => void;
  region: string;
  district: string;
  locationMode: boolean;
  setLocationFilter: (mode: boolean, state?: string, district?: string) => void;
};
