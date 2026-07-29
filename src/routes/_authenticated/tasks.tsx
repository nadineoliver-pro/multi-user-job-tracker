import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Job Tracker" },
      { name: "description", content: "Every follow-up task across your job applications." },
      { property: "og:title", content: "Tasks — Job Tracker" },
      {
        property: "og:description",
        content: "Every follow-up task across your job applications.",
      },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, applications(company, position)")
        .order("done")
        .order("due_date", { nullsFirst: false });
      if (error) throw error;
      return data;
    },
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tasks yet — add one from an{" "}
          <Link to="/applications" className="underline">
            application
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
            >
              <Checkbox
                checked={task.done}
                onCheckedChange={(checked) =>
                  toggleTask.mutate({ taskId: task.id, done: checked === true })
                }
              />
              <div>
                <span className={task.done ? "text-muted-foreground line-through" : ""}>
                  {task.title}
                </span>
                <p className="text-xs text-muted-foreground">
                  <Link
                    to="/applications/$id"
                    params={{ id: task.application_id }}
                    className="hover:underline"
                  >
                    {task.applications?.position} · {task.applications?.company}
                  </Link>
                  {task.due_date ? ` · due ${task.due_date}` : ""}
                </p>
              </div>
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
    </div>
  );
}
