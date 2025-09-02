// backend/src/types/states.types.ts
export type ConversationStep =
  | "collect_name"
  | "collect_role"
  | "collect_skills"
  | "collect_bio"
  | "collect_projects"
  | "await_github_username"
  | "adding_project"
  | "completed"
  | "building";

export type ProfileData = {
  name?: string;
  role?: string;
  skills?: string[];
  bio?: string;
  githubUsername?: string;
  projects?: Array<{ title: string; description?: string; url?: string }>;
};

export type UserState = {
  step: ConversationStep;
  data: ProfileData;
  createdAt?: string;
  updatedAt?: string;
};
