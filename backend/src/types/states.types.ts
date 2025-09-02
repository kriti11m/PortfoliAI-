export type UserState = {
  step: string; // e.g., "collect_name", "collect_role"
  data: {
    name?: string;
    role?: string;
    skills?: string[];
  };
};
