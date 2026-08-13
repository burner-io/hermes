/**
 * Native Hermes Project contracts.
 *
 * IMPORTANT: this surface is version-gated. It exists on the reviewed Hermes
 * `main` snapshot but must not be assumed on older/deployed Hermes instances.
 * It is not an application-level Project abstraction.
 */
export interface HermesProjectFolder {
  path: string;
  label: string | null;
  is_primary: boolean;
  added_at: number;
  [key: string]: unknown;
}

export interface HermesProjectInfo {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  board_slug: string | null;
  primary_path: string | null;
  archived: boolean;
  created_at: number;
  folders: HermesProjectFolder[];
  [key: string]: unknown;
}

export interface HermesProjectsPayload {
  projects: HermesProjectInfo[];
  active_id: string | null;
  [key: string]: unknown;
}
