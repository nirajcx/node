import axios from "axios";
import { demoAdapter } from "./demo-adapter";
import type { Todo, TodoInput, User } from "./types";
export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta: { requestId: string; timestamp: string };
};
export type ApiFailure = {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details: { field: string; message: string }[] | null;
  };
  meta: { requestId: string; timestamp: string };
};

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  timeout: 10000,
  ...(DEMO_MODE ? { adapter: demoAdapter } : {}),
});
export const authApi = {
  me: () =>
    api
      .get<ApiSuccess<{ user: User }>>("/auth/me")
      .then((r) => r.data.data.user),
  login: (email: string, password: string) =>
    api
      .post<ApiSuccess<{ user: User }>>("/auth/login", { email, password })
      .then((r) => r.data.data.user),
  register: (name: string, email: string, password: string) =>
    api
      .post<ApiSuccess<{ user: User }>>("/auth/register", {
        name,
        email,
        password,
      })
      .then((r) => r.data.data.user),
  logout: () => api.post("/auth/logout"),
};
export const todosApi = {
  list: () =>
    api
      .get<ApiSuccess<{ todos: Todo[] }>>("/todos")
      .then((r) => r.data.data.todos),
  create: (input: TodoInput) =>
    api
      .post<ApiSuccess<{ todo: Todo }>>("/todos", input)
      .then((r) => r.data.data.todo),
  update: (id: string, input: Partial<TodoInput>) =>
    api
      .patch<ApiSuccess<{ todo: Todo }>>(`/todos/${id}`, input)
      .then((r) => r.data.data.todo),
  remove: (id: string) => api.delete(`/todos/${id}`),
};
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error))
    return (
      (typeof error.response?.data?.error?.message === "string"
        ? error.response.data.error.message
        : null) ||
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : error.response
          ? `The request failed (${error.response.status}). Please try again.`
          : "Cannot reach the API. Check your backend and API URL.")
    );
  return "Something went wrong. Please try again.";
}
export function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
