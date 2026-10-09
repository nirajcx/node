"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Circle,
  CircleCheck,
  Clock3,
  Layers2,
  LayoutGrid,
  ListTodo,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  authApi,
  DEMO_MODE,
  errorMessage,
  isUnauthorized,
  todosApi,
} from "@/lib/api";
import type { Todo, TodoInput, User } from "@/lib/types";
type Filter = "all" | "today" | "upcoming" | "completed";
const emptyTask: TodoInput = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: null,
  completed: false,
};
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("newest");
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<TodoInput>(emptyTask);
  const [deleting, setDeleting] = useState<Todo | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const me = await authApi.me();
        const list = await todosApi.list();
        if (active) {
          setUser(me);
          setTasks(list);
        }
      } catch (e) {
        if (active) {
          if (isUnauthorized(e)) router.replace("/login");
          else setError(errorMessage(e));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [router, retry]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(id);
  }, [notice]);
  if (loading)
    return (
      <div className="full-state">
        <Loader2 className="animate-spin" />
        <p>Getting your day ready…</p>
      </div>
    );
  if (!user)
    return (
      <div className="full-state">
        <Layers2 />
        <h1>Let’s get you connected.</h1>
        <p role="alert">{error || "Taking you to sign in…"}</p>
        <Button onClick={() => setRetry((r) => r + 1)}>Try again</Button>
        <Button variant="outline" onClick={() => router.replace("/login")}>
          Go to sign in
        </Button>
      </div>
    );
  const today = localDate();
  const complete = tasks.filter((t) => t.completed).length;
  const counts = {
    all: tasks.length,
    today: tasks.filter((t) => !t.completed && t.dueDate === today).length,
    upcoming: tasks.filter(
      (t) => !t.completed && t.dueDate && t.dueDate > today,
    ).length,
    completed: complete,
  };
  const shown = tasks
    .filter((t) => {
      const matches =
        filter === "all" ||
        (filter === "completed"
          ? t.completed
          : filter === "today"
            ? !t.completed && t.dueDate === today
            : !t.completed && !!t.dueDate && t.dueDate > today);
      return (
        matches &&
        (priority === "all" || t.priority === priority) &&
        `${t.title} ${t.description}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    })
    .sort((a, b) =>
      sort === "priority"
        ? { high: 0, medium: 1, low: 2 }[a.priority] -
          { high: 0, medium: 1, low: 2 }[b.priority]
        : sort === "due"
          ? (a.dueDate || "9999").localeCompare(b.dueDate || "9999")
          : b.createdAt.localeCompare(a.createdAt),
    );
  function fail(e: unknown) {
    if (isUnauthorized(e)) router.replace("/login");
    else setError(errorMessage(e));
  }
  function openTask(task?: Todo) {
    setEditing(task?.id || null);
    setForm(
      task
        ? {
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
            completed: task.completed,
          }
        : { ...emptyTask },
    );
    setError("");
    setEditor(true);
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const input = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      };
      const task = editing
        ? await todosApi.update(editing, input)
        : await todosApi.create(input);
      setTasks((prev) =>
        editing
          ? prev.map((t) => (t.id === task.id ? task : t))
          : [task, ...prev],
      );
      setEditor(false);
      setNotice(editing ? "Task updated." : "A new step, added.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(task: Todo) {
    setPending((p) => [...p, task.id]);
    setError("");
    try {
      const next = await todosApi.update(task.id, {
        completed: !task.completed,
      });
      setTasks((p) => p.map((t) => (t.id === task.id ? next : t)));
      setNotice(
        next.completed ? "One more thing, done. Nice work!" : "Task reopened.",
      );
    } catch (e) {
      fail(e);
    } finally {
      setPending((p) => p.filter((id) => id !== task.id));
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await todosApi.remove(deleting.id);
      setTasks((p) => p.filter((t) => t.id !== deleting.id));
      setDeleting(null);
      setNotice("Task deleted.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await authApi.logout();
      router.replace("/login");
    } catch (e) {
      fail(e);
      setBusy(false);
    }
  }
  const nav = [
    { id: "all" as const, label: "All tasks", icon: LayoutGrid },
    { id: "today" as const, label: "Today", icon: CalendarDays },
    { id: "upcoming" as const, label: "Upcoming", icon: Clock3 },
    { id: "completed" as const, label: "Completed", icon: CircleCheck },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Layers2 size={21} />
          </span>
          dayflow<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-tag">
          <span>{user.name[0]?.toUpperCase()}</span>
          <div>
            Personal workspace<small>Just for you</small>
          </div>
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav aria-label="Task views">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`nav-item ${filter === id ? "active" : ""}`}
              aria-current={filter === id ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              <small>{counts[id]}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="calm-card">
            <Sparkles size={22} />
            <h3>A little every day.</h3>
            <p>Progress is a collection of small things done well.</p>
            <span>
              You’ve got this <ArrowUpRight size={14} />
            </span>
          </div>
          <button
            className="profile"
            onClick={logout}
            disabled={busy}
            aria-label="Sign out"
          >
            <span className="avatar">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <span>
              {user.name}
              <small>Sign out</small>
            </span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div>
            <span className="breadcrumb">My workspace</span>
            <span className="slash">/</span>
            <span>{nav.find((n) => n.id === filter)?.label}</span>
          </div>
          <span className="date-label">
            <CalendarDays size={15} />
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </header>
        <div className="dashboard">
          <section className="page-heading">
            <div>
              <span className="eyebrow">MAKE SPACE FOR WHAT MATTERS</span>
              <h1>
                Your day, in focus<span>.</span>
              </h1>
              <p>
                Hey {user.name.split(" ")[0]}, let’s turn a little intention
                into progress.
              </p>
            </div>
            <Button onClick={() => openTask()}>
              <Plus size={17} /> New task
            </Button>
          </section>
          {DEMO_MODE && (
            <div className="demo-strip">
              <span>
                <span className="status-dot" />
                Demo workspace
              </span>
              <span>
                Saved in this browser · Connect your backend whenever you’re
                ready.
              </span>
            </div>
          )}
          <section className="stats" aria-label="Task summary">
            <div className="stat">
              <span className="stat-icon violet">
                <ListTodo size={20} />
              </span>
              <div>
                <span>Total tasks</span>
                <strong>
                  {tasks.length}
                  <small>on your list</small>
                </strong>
              </div>
            </div>
            <div className="stat">
              <span className="stat-icon amber">
                <Clock3 size={20} />
              </span>
              <div>
                <span>In progress</span>
                <strong>
                  {tasks.length - complete}
                  <small>one step at a time</small>
                </strong>
              </div>
            </div>
            <div className="stat">
              <span className="stat-icon green">
                <CheckCheck size={20} />
              </span>
              <div>
                <span>Completed</span>
                <strong>
                  {complete}
                  <small>little wins</small>
                </strong>
              </div>
            </div>
          </section>
          <section className="task-section">
            <div className="section-heading">
              <h2>
                {nav.find((n) => n.id === filter)?.label}
                <span>{shown.length}</span>
              </h2>
              <div className="view-hint">
                <ListTodo size={15} /> List view
              </div>
            </div>
            <div className="toolbar">
              <div className="search-wrap">
                <Search size={17} />
                <Input
                  aria-label="Search tasks"
                  placeholder="Search your tasks…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="filter-controls">
                <div className="select-wrap">
                  <select
                    aria-label="Filter by priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="all">All priorities</option>
                    <option value="high">High priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="low">Low priority</option>
                  </select>
                  <ChevronDown size={14} />
                </div>
                <div className="select-wrap">
                  <select
                    aria-label="Sort tasks"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="due">Due date</option>
                    <option value="priority">Priority</option>
                  </select>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
            {error && !editor && !deleting && (
              <div className="error-banner" role="alert">
                {error}
                <button onClick={() => setError("")} aria-label="Dismiss error">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="task-list">
              {shown.length === 0 ? (
                <div className="empty-state">
                  <span>
                    <Layers2 size={28} />
                  </span>
                  <h3>
                    {query || priority !== "all"
                      ? "No matching tasks."
                      : filter === "completed"
                        ? "Your wins will live here."
                        : "A little room to begin."}
                  </h3>
                  <p>
                    {query || priority !== "all"
                      ? "Try another search or clear your filters."
                      : "Every big thing starts with one small task."}
                  </p>
                  {query || priority !== "all" ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery("");
                        setPriority("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => openTask()}>
                      <Plus size={16} /> Add a task
                    </Button>
                  )}
                </div>
              ) : (
                shown.map((task) => (
                  <article
                    className={`task-row ${task.completed ? "done" : ""}`}
                    key={task.id}
                  >
                    <button
                      className="task-check"
                      onClick={() => toggle(task)}
                      disabled={pending.includes(task.id)}
                      aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
                      aria-pressed={task.completed}
                    >
                      {pending.includes(task.id) ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : task.completed ? (
                        <Check size={14} />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>
                    <div className="task-copy">
                      <button
                        className="task-title"
                        onClick={() => openTask(task)}
                        disabled={pending.includes(task.id)}
                      >
                        {task.title}
                      </button>
                      {task.description && <p>{task.description}</p>}
                      <div className="task-meta">
                        <span className={`priority ${task.priority}`}>
                          <i />
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span
                            className={`due-date ${task.dueDate < today && !task.completed ? "overdue" : ""}`}
                          >
                            <CalendarDays size={12} />
                            {task.dueDate === today
                              ? "Today"
                              : new Date(
                                  task.dueDate + "T00:00:00",
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                            {task.dueDate < today && !task.completed
                              ? " · Overdue"
                              : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="task-actions">
                      <button
                        aria-label={`Edit ${task.title}`}
                        onClick={() => openTask(task)}
                        disabled={pending.includes(task.id)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="delete-action"
                        aria-label={`Delete ${task.title}`}
                        onClick={() => {
                          setError("");
                          setDeleting(task);
                        }}
                        disabled={pending.includes(task.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
            <button className="quick-add" onClick={() => openTask()}>
              <Plus size={17} /> Add another task
              <span>Make your next move</span>
            </button>
          </section>
          <footer className="dashboard-footer">
            <span>
              <span className="status-dot" />
              {complete} of {tasks.length} tasks complete
            </span>
            <div className="progress-track">
              <span
                style={{
                  width: `${tasks.length ? (complete / tasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span>Small steps. Real progress.</span>
          </footer>
        </div>
      </main>
      <Dialog
        open={editor}
        onOpenChange={(open) => {
          if (!busy) setEditor(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "A little fine-tuning." : "What’s your next step?"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details of your task."
                : "Give your idea a place to start."}
            </DialogDescription>
          </DialogHeader>
          <form className="task-form" onSubmit={save}>
            <label>
              Task title
              <Input
                autoFocus
                required
                maxLength={160}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What would you like to get done?"
              />
            </label>
            <label>
              Description <span className="optional">optional</span>
              <Textarea
                maxLength={2000}
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="A few details to keep you on track…"
              />
            </label>
            <div className="form-columns">
              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as Todo["priority"],
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                Due date <span className="optional">optional</span>
                <Input
                  type="date"
                  value={form.dueDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value || null })
                  }
                />
              </label>
            </div>
            {error && (
              <p className="error-banner" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-buttons">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditor(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !form.title.trim()}>
                {busy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : editing ? (
                  "Save changes"
                ) : (
                  "Create task"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be removed permanently. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-buttons">
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={busy}
            >
              Keep task
            </Button>
            <Button variant="destructive" onClick={remove} disabled={busy}>
              {busy ? "Deleting…" : "Delete task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {notice && (
        <div className="toast" role="status">
          <CircleCheck size={18} />
          {notice}
        </div>
      )}
    </div>
  );
}
