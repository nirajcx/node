export type User = { id: string; name: string; email: string };
export type Todo = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
};
export type TodoInput = Omit<Todo, "id" | "createdAt">;
