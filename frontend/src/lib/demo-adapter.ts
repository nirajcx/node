import { AxiosError, type AxiosAdapter } from "axios";
import type { Todo, User } from "./types";
const USER_KEY = "dayflow.demo.user";
const TASK_KEY = "dayflow.demo.tasks.";
export const demoAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 220));
  const respond = (
    data: unknown,
    status = 200,
    message = "Request completed successfully.",
  ) => {
    const meta = {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    const envelope =
      status >= 400
        ? {
            success: false,
            data: null,
            error: {
              code: status === 401 ? "UNAUTHENTICATED" : "NOT_FOUND",
              message: (data as { message: string }).message,
              details: null,
            },
            meta,
          }
        : { success: true, data, message, meta };
    const response = {
      data: envelope,
      status,
      statusText: String(status),
      headers: { "x-request-id": meta.requestId },
      config,
    };
    if (status >= 400)
      throw new AxiosError(
        (data as { message: string }).message,
        String(status),
        config,
        null,
        response,
      );
    return response;
  };
  const body =
    typeof config.data === "string"
      ? JSON.parse(config.data)
      : config.data || {};
  const path = config.url || "";
  const method = config.method?.toUpperCase();
  const rawUser = sessionStorage.getItem(USER_KEY);
  const user: User | null = rawUser ? JSON.parse(rawUser) : null;
  if (path === "/auth/login" || path === "/auth/register") {
    // Preview only: no password is stored or verified. Real auth belongs in the backend.
    const email = String(body.email).trim().toLowerCase();
    const nextUser = {
      id: email,
      name: body.name || email.split("@")[0],
      email,
    };
    sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    return respond({ user: nextUser }, path === "/auth/register" ? 201 : 200);
  }
  if (path === "/auth/logout") {
    sessionStorage.removeItem(USER_KEY);
    return respond(null, 200, "Logged out.");
  }
  if (!user) return respond({ message: "Please sign in to continue." }, 401);
  if (path === "/auth/me") return respond({ user });
  const key = TASK_KEY + user.id;
  const stored = localStorage.getItem(key);
  const tasks: Todo[] = stored
    ? JSON.parse(stored)
    : [
        {
          id: crypto.randomUUID(),
          title: "Make room for your next big idea",
          description: "Break it into a few small, achievable steps.",
          completed: false,
          priority: "high",
          dueDate: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          title: "Plan the week ahead",
          description: "A little intention goes a long way.",
          completed: false,
          priority: "medium",
          dueDate: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          title: "Find your flow",
          description: "You have already taken the first step.",
          completed: true,
          priority: "low",
          dueDate: null,
          createdAt: new Date().toISOString(),
        },
      ];
  localStorage.setItem(key, JSON.stringify(tasks));
  if (path === "/todos" && method === "GET") return respond({ todos: tasks });
  if (path === "/todos" && method === "POST") {
    const todo = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify([todo, ...tasks]));
    return respond({ todo }, 201);
  }
  const id = path.split("/")[2];
  const current = tasks.find((t) => t.id === id);
  if (!current) return respond({ message: "Task not found." }, 404);
  if (method === "PATCH") {
    const todo = { ...current, ...body, id: current.id };
    localStorage.setItem(
      key,
      JSON.stringify(tasks.map((t) => (t.id === id ? todo : t))),
    );
    return respond({ todo });
  }
  if (method === "DELETE") {
    localStorage.setItem(key, JSON.stringify(tasks.filter((t) => t.id !== id)));
    return respond(null, 200, "Task deleted.");
  }
  return respond({ message: "Unknown demo endpoint." }, 404);
};
