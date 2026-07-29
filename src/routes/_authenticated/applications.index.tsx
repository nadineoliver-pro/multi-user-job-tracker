import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/applications/")({
  head: () => ({
    meta: [
      { title: "Applications — Job Tracker" },
      { name: "description", content: "All the job applications you are tracking." },
      { property: "og:title", content: "Applications — Job Tracker" },
      { property: "og:description", content: "All the job applications you are tracking." },
    ],
  }),
  component: ApplicationsPage,
});

export const STATUSES = ["wishlist", "applied", "interviewing", "offer", "rejected"] as const;

const applicationSchema = z.object({
  company: z.string().trim().min(1, { message: "Company is required" }).max(120),
  position: z.string().trim().min(1, { message: "Position is required" }).max(120),
  status: z.enum(STATUSES),
  application_date: z.string().min(1, { message: "Application date is required" }),
  notes: z.string().trim().max(2000).optional(),
});

function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("applied");
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("application_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createApplication = useMutation({
    mutationFn: async (values: z.infer<typeof applicationSchema>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be signed in");
      const { error } = await supabase
        .from("applications")
        .insert({ ...values, notes: values.notes || null, user_id: userData.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application added");
      setCompany("");
      setPosition("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application deleted");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => toast.error(error.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = applicationSchema.safeParse({
      company,
      position,
      status,
      application_date: applicationDate,
      notes,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    createApplication.mutate(parsed.data);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Applications</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add an application</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
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
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={createApplication.isPending}>
                {createApplication.isPending ? "Saving…" : "Add application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li
              key={app.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <Link
                  to="/applications/$id"
                  params={{ id: app.id }}
                  className="font-medium text-foreground hover:underline"
                >
                  {app.position} · {app.company}
                </Link>
                <p className="text-xs text-muted-foreground">Applied {app.application_date}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="capitalize">
                  {app.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteApplication.mutate(app.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
