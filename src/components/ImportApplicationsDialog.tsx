import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STATUSES = ["wishlist", "applied", "interviewing", "offer", "rejected"] as const;

const rowSchema = z.object({
  company: z.string().trim().min(1, { message: "company is required" }).max(120),
  position: z.string().trim().min(1, { message: "position is required" }).max(120),
  status: z.enum(STATUSES).catch("applied"),
  application_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "application_date must be YYYY-MM-DD" })
    .catch(new Date().toISOString().slice(0, 10)),
  notes: z.string().trim().max(2000).optional(),
});

type ParsedRow = z.infer<typeof rowSchema>;

const TEMPLATE = "company,position,status,application_date,notes\nAcme Inc,Frontend Engineer,applied,2026-07-01,Referred by a friend\n";

export function ImportApplicationsDialog() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  function reset() {
    setRows([]);
    setErrors([]);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    const text = await file.text();
    const table = parseCsv(text);
    if (table.length < 2) {
      setRows([]);
      setErrors(["The file needs a header row and at least one data row."]);
      return;
    }
    const header = table[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const required = ["company", "position"];
    const missing = required.filter((c) => !header.includes(c));
    if (missing.length) {
      setRows([]);
      setErrors([`Missing required column(s): ${missing.join(", ")}`]);
      return;
    }

    const valid: ParsedRow[] = [];
    const issues: string[] = [];
    table.slice(1).forEach((cells, i) => {
      const record: Record<string, string> = {};
      header.forEach((key, idx) => {
        record[key] = (cells[idx] ?? "").trim();
      });
      const parsed = rowSchema.safeParse({
        company: record.company,
        position: record.position,
        status: record.status || undefined,
        application_date: record.application_date || undefined,
        notes: record.notes || undefined,
      });
      if (parsed.success) valid.push(parsed.data);
      else issues.push(`Row ${i + 2}: ${parsed.error.issues[0].message}`);
    });

    setRows(valid);
    setErrors(issues);
  }

  const importRows = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be signed in");
      const payload = rows.map((r) => ({
        company: r.company,
        position: r.position,
        status: r.status,
        application_date: r.application_date,
        notes: r.notes || null,
        user_id: userData.user!.id,
      }));
      const { error } = await supabase.from("applications").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Imported ${rows.length} application${rows.length === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setOpen(false);
      reset();
    },
    onError: (error) => toast.error(error.message),
  });

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Import CSV</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import applications from CSV</DialogTitle>
          <DialogDescription>
            Columns: company, position, status, application_date (YYYY-MM-DD), notes. Company and
            position are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            aria-label="CSV file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground"
          />

          {fileName && (
            <p className="text-sm text-muted-foreground">
              {fileName} — {rows.length} valid row{rows.length === 1 ? "" : "s"}
              {errors.length > 0 ? `, ${errors.length} skipped` : ""}
            </p>
          )}

          {errors.length > 0 && (
            <ul className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              {errors.slice(0, 20).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          {rows.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="p-2">Company</th>
                    <th className="p-2">Position</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 25).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2">{r.company}</td>
                      <td className="p-2">{r.position}</td>
                      <td className="p-2 capitalize">{r.status}</td>
                      <td className="p-2">{r.application_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={downloadTemplate}>
            Download template
          </Button>
          <Button
            type="button"
            disabled={rows.length === 0 || importRows.isPending}
            onClick={() => importRows.mutate()}
          >
            {importRows.isPending ? "Importing…" : `Import ${rows.length || ""}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
