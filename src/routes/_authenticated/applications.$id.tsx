import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["wishlist", "applied", "interviewing", "offer", "rejected"] as const;

export const Route = createFileRoute("/_authenticated/applications/$id")({
  head: () => ({
    meta: [
      { title: "Application details — Job Tracker" },
      { name: "description", content: "Edit an application and manage its follow-up tasks." },
      { property: "og:title", content: "Application details — Job Tracker" },
      {
        property: "og:description",
        content: "Edit an application and manage its follow-up tasks.",
      },
    ],
  }),
  component: ApplicationDetail,
});

const applicationSchema = z.object({
  company: z.string().trim().min(1, { message: "Company is required" }).max(120),
  position: z.string().trim().min(1, { message: "Position is required" }).max(120),
  status: z.enum(STATUSES),
  application_date: z.string().min(1, { message: "Application date is required" }),
  notes: z.string().trim().max(2000).optional(),
});

const taskSchema = z.object({
  title: z.string().trim().min(1, { message: "Task title is required" }).max(200),
  due_date: z.string().optional(),
});

function ApplicationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: application, isLoading } = useQuery({
    queryKey: ["applications", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("application_id", id)
        .order("done")
        .order("due_date", { nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    company: "",
    position: "",
    status: "applied" as (typeof STATUSES)[number],
    application_date: "",
    notes: "",
  });
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  useEffect(() => {
    if (application) {
      setForm({
        company: application.company,
        position: application.position,
        status: application.status,
        application_date: application.application_date,
        notes: application.notes ?? "",
      });
    }
  }, [application]);

  const updateApplication = useMutation({
    mutationFn: async (values: z.infer<typeof applicationSchema>) => {
      const { error } = await supabase
        .from("applications")
        .update({ ...values, notes: values.notes || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application updated");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const createTask = useMutation({
    mutationFn: async (values: z.infer<typeof taskSchema>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be signed in");
      const { error } = await supabase.from("tasks").insert({
        title: values.title,
        due_date: values.due_date || null,
        application_id: id,
        user_id: userData.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task added");
      setTaskTitle("");
      setTaskDue("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ taskId, done }: { taskId: string; done: boolean }) => {
      const { error } = await supabase.from("tasks").update({ done }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (error) => toast.error(error.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteApplication = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application deleted");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      navigate({ to: "/applications" });
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!application)
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Application not found.</p>
        <Link to="/applications" className="text-sm underline">
          Back to applications
        </Link>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {application.position} · {application.company}
        </h1>
        <Button variant="outline" size="sm" onClick={() => deleteApplication.mutate()}>
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = applicationSchema.safeParse(form);
              if (!parsed.success) {
                toast.error(parsed.error.issues[0].message);
                return;
              }
              updateApplication.mutate(parsed.data);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Application date</Label>
              <Input
                id="date"
                type="date"
                value={form.application_date}
                onChange={(e) => setForm({ ...form, application_date: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={updateApplication.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = taskSchema.safeParse({ title: taskTitle, due_date: taskDue });
              if (!parsed.success) {
                toast.error(parsed.error.issues[0].message);
                return;
              }
              createTask.mutate(parsed.data);
            }}
          >
            <div className="min-w-48 flex-1 space-y-2">
              <Label htmlFor="task-title">Task</Label>
              <Input
                id="task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={createTask.isPending}>
              Add task
            </Button>
          </form>

          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-md border border-border p-3"
                >
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={(checked) =>
                      toggleTask.mutate({ taskId: task.id, done: checked === true })
                    }
                  />
                  <span
                    className={
                      task.done ? "text-muted-foreground line-through" : "text-foreground"
                    }
                  >
                    {task.title}
                  </span>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">due {task.due_date}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => deleteTask.mutate(task.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
