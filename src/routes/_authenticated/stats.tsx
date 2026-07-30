import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Briefcase, CheckCircle2, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({
    meta: [
      { title: "Stats & Analytics — Job Tracker" },
      { name: "description", content: "Analytics and insights into your job search progress." },
      { property: "og:title", content: "Stats & Analytics — Job Tracker" },
      { property: "og:description", content: "Analytics and insights into your job search progress." },
    ],
  }),
  component: StatsPage,
});

const STATUS_COLORS: Record<string, string> = {
  wishlist: "#94a3b8", // Slate
  applied: "#3b82f6", // Blue
  interviewing: "#a855f7", // Purple
  offer: "#22c55e", // Green
  rejected: "#ef4444", // Red
};

const STATUS_LABELS: Record<string, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

function StatsPage() {
  const { data: applications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("application_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data;
    },
  });

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalApps = applications.length;
    const activeApps = applications.filter(
      (a) => a.status === "applied" || a.status === "interviewing"
    ).length;
    const interviewingOrOfferCount = applications.filter(
      (a) => a.status === "interviewing" || a.status === "offer"
    ).length;
    const interviewRate = totalApps > 0 ? Math.round((interviewingOrOfferCount / totalApps) * 100) : 0;
    const offerCount = applications.filter((a) => a.status === "offer").length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.done).length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalApps,
      activeApps,
      interviewRate,
      offerCount,
      totalTasks,
      completedTasks,
      taskCompletionRate,
    };
  }, [applications, tasks]);

  // Donut Chart Data (Status distribution)
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {
      wishlist: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    };
    applications.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++;
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        color: STATUS_COLORS[status] || "#64748b",
      }));
  }, [applications]);

  // Bar Chart Data (Applications per Month)
  const monthlyChartData = useMemo(() => {
    const monthlyMap: Record<string, number> = {};

    applications.forEach((a) => {
      if (!a.application_date) return;
      const date = new Date(a.application_date);
      if (isNaN(date.getTime())) return;
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
    });

    return Object.entries(monthlyMap).map(([month, count]) => ({
      month,
      applications: count,
    }));
  }, [applications]);

  const isLoading = isLoadingApps || isLoadingTasks;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stats & Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your job search progress, interview performance, and task completion metrics.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading stats data...</p>
      ) : applications.length === 0 ? (
        <Card className="p-8 text-center">
          <CardTitle className="text-lg">No application data yet</CardTitle>
          <CardDescription className="mt-2">
            Start adding job applications to view your stats, response rates, and activity trends.
          </CardDescription>
        </Card>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Applications
                </CardTitle>
                <Briefcase className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalApps}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.activeApps} currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Interview Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.interviewRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Reached interviewing or offer stage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Job Offers
                </CardTitle>
                <Award className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.offerCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Offers received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Task Completion
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.taskCompletionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.completedTasks} of {metrics.totalTasks} tasks completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Visualization Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Donut Chart: Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Application Status Breakdown</CardTitle>
                <CardDescription>Distribution across pipeline stages</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} applications`, "Count"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart: Monthly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Application Velocity</CardTitle>
                <CardDescription>Applications submitted per month</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tickLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`${value} submitted`, "Applications"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
