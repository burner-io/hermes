export interface HermesGitPathRequest {
  path: string;
}

export interface HermesGitFileRequest {
  path: string;
  file?: string | null;
}

export interface HermesGitPrListRequest {
  path: string;
  branches?: string[];
  numbers?: number[];
}

export interface HermesGitCommitRequest {
  path: string;
  message: string;
  push?: boolean;
}

export interface HermesGitWorktreeAddRequest {
  path: string;
  name?: string | null;
  branch?: string | null;
  base?: string | null;
  existingBranch?: string | null;
}

export interface HermesGitWorktreeRemoveRequest {
  path: string;
  worktreePath: string;
  force?: boolean;
}

export interface HermesGitBranchSwitchRequest {
  path: string;
  branch: string;
}

export interface HermesGitStatusResponse extends Record<string, unknown> {}
export interface HermesGitReviewListResponse extends Record<string, unknown> {}
export interface HermesGitCommitContextResponse extends Record<string, unknown> {}
export interface HermesGitShipInfoResponse extends Record<string, unknown> {}
export interface HermesGitPrListResponse extends Record<string, unknown> {}

export interface HermesGitApi {
  status(path: string): Promise<HermesGitStatusResponse>;
  worktrees(path: string): Promise<{ worktrees: unknown[]; [key: string]: unknown }>;
  branches(path: string): Promise<{ branches: unknown[]; [key: string]: unknown }>;
  baseBranches(path: string): Promise<{ branches: unknown[]; [key: string]: unknown }>;
  reviewList(input: { path: string; scope?: string; base?: string }): Promise<HermesGitReviewListResponse>;
  reviewDiff(input: { path: string; file: string; scope?: string; base?: string; staged?: boolean }): Promise<{ diff: string; [key: string]: unknown }>;
  fileDiff(path: string, file: string): Promise<{ diff: string; [key: string]: unknown }>;
  commitContext(path: string): Promise<HermesGitCommitContextResponse>;
  revParse(path: string, ref?: string): Promise<{ sha: string; [key: string]: unknown }>;
  shipInfo(path: string): Promise<HermesGitShipInfoResponse>;
  prList(input: HermesGitPrListRequest): Promise<HermesGitPrListResponse>;
  stage(input: HermesGitFileRequest): Promise<unknown>;
  unstage(input: HermesGitFileRequest): Promise<unknown>;
  revert(input: HermesGitFileRequest): Promise<unknown>;
  commit(input: HermesGitCommitRequest): Promise<unknown>;
  push(input: HermesGitPathRequest): Promise<unknown>;
  createPr(input: HermesGitPathRequest): Promise<unknown>;
  addWorktree(input: HermesGitWorktreeAddRequest): Promise<unknown>;
  removeWorktree(input: HermesGitWorktreeRemoveRequest): Promise<unknown>;
  switchBranch(input: HermesGitBranchSwitchRequest): Promise<unknown>;
}
