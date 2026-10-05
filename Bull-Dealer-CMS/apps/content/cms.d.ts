export type ContentLayer = "COMMON" | "GROUP" | "DEALER" | "OVERRIDE";
export interface DraftSaveRequest {
  layer: ContentLayer;
  ownerId: number;
  section: string;
  document: unknown;
  expectedRevision: number;
  removeOverride?: boolean;
}
export interface DraftSaveResponse {
  id: number;
  layer: ContentLayer;
  owner_id: number;
  section_key: string;
  document: unknown;
  revision: number;
  published: boolean;
  publishError?: string;
}
