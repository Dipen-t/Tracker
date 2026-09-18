import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ActiveTimer } from '@/components/time/ActiveTimer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, CheckCircle2, ListTodo, Target } from 'lucide-react';
import { 
  Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  Line, LineChart, PieChart, Pie, Cell, Legend
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingTimer, setLoadingTimer] = useState(true);
  const [isStoppingTimer, setIsStoppingTimer] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryRes, analyticsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/analytics')
      ]);
      setSummary(summaryRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTimer = async () => {
    try {
      const res = await api.get('/time/active');
      setActiveTimer(res.data.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingTimer(false);
    }
  };

  const fetchAll = () => {
    fetchData();
    fetchActiveTimer();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    
    const handleTimerEvent = () => fetchAll();
    window.addEventListener('timer-stopped', handleTimerEvent);
    window.addEventListener('timer-started', handleTimerEvent);
    
    return () => {
      window.removeEventListener('timer-stopped', handleTimerEvent);
      window.removeEventListener('timer-started', handleTimerEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    setIsStoppingTimer(true);
    try {
      await api.post(`/tasks/${activeTimer.taskId}/time/stop`);
      toast.success('Timer stopped');
      setActiveTimer(null);
      fetchAll();
      window.dispatchEvent(new Event('timer-stopped'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to stop timer');
    } finally {
      setIsStoppingTimer(false);
    }
  };

  const formatTotalTime = (seconds: number) => {
    if (!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Analytics Overview</span>
          <span className="text-muted-foreground text-sm">{todayDateStr}</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight mt-2">Daily Summary & Analysis</h2>
        {!loading && (
          <p className="text-muted-foreground mt-1">
            You've tracked {formatTotalTime(summary?.totalTimeToday || 0)} today.
          </p>
        )}
      </div>

      {!loadingTimer && activeTimer && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Currently Working</h3>
          <ActiveTimer timer={activeTimer} onStop={handleStopTimer} isLoading={isStoppingTimer} />
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Tracked Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{formatTotalTime(summary?.totalTimeToday || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Worked On</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.tasksWorkedOnToday || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.completedTasksToday || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending / In Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.pendingOrInProgress || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Bento Box */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
        </div>
      ) : analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: This Week vs Last Week Performance */}
          <Card className="col-span-1 shadow-sm border-muted/60 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">This Week vs Last Week</CardTitle>
              <CardDescription>Hours tracked per day</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pl-0 pb-4 min-h-[300px]">
              <ChartContainer config={{ 
                thisWeek: { label: "This Week", color: "#3b82f6" }, // blue-500
                lastWeek: { label: "Last Week", color: "#94a3b8" }  // slate-400
              }} className="h-full w-full aspect-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.performanceComparison} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="dayName" tickLine={false} axisLine={false} tickMargin={8} className="text-xs fill-muted-foreground" />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs fill-muted-foreground" />
                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} content={<ChartTooltipContent />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                    <Line type="monotone" dataKey="lastWeek" name="Last Week" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="thisWeek" name="This Week" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Task Status Breakdown */}
          <Card className="col-span-1 shadow-sm border-muted/60 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Task Status Breakdown</CardTitle>
              <CardDescription>Distribution of your tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center min-h-[300px]">
              {analytics.statusDistribution && analytics.statusDistribution.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full aspect-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.statusDistribution} cx="50%" cy="50%" innerRadius={75} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                        {analytics.statusDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<ChartTooltipContent />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <Target className="h-8 w-8 opacity-20" />
                  No tasks found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 3: Time Distribution by Task */}
          <Card className="col-span-1 shadow-sm border-muted/60 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Top Tasks by Time</CardTitle>
              <CardDescription>Most time-consuming tasks (Last 7 Days)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pl-0 pb-4 min-h-[300px]">
              {analytics.timeByTask && analytics.timeByTask.length > 0 ? (
                <ChartContainer config={{ hours: { label: "Hours Tracked", color: "#8b5cf6" } }} className="h-full w-full aspect-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.timeByTask} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} className="text-xs fill-muted-foreground" />
                      <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} className="text-xs fill-foreground font-medium" width={75} />
                      <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} content={<ChartTooltipContent />} />
                      <Bar dataKey="hours" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <Clock className="h-8 w-8 opacity-20" />
                  No time logged recently
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 4: Task Completion Trend */}
          <Card className="col-span-1 shadow-sm border-muted/60 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Task Completion Velocity</CardTitle>
              <CardDescription>Tasks finished over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pl-0 pb-4 min-h-[300px]">
              <ChartContainer config={{ completed: { label: "Completed Tasks", color: "#10b981" } }} className="h-full w-full aspect-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.completionTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} className="text-xs fill-muted-foreground" />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs fill-muted-foreground" allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} content={<ChartTooltipContent />} />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
