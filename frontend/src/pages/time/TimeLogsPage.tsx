import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export function TimeLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState('all');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page, limit, filter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/time-logs?page=${page}&limit=${limit}&filter=${filter}`);
      setLogs(res.data.data);
      if (res.data.meta) {
        setTotalPages(res.data.meta.totalPages);
        setTotalItems(res.data.meta.total);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch time logs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTotalTime = (seconds?: number) => {
    if (!seconds) return 'Active now';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleDownloadCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ['Task Name', 'Started At', 'Ended At', 'Duration (Hours)'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => {
        const taskName = `"${(log.task?.title || 'Unknown Task').replace(/"/g, '""')}"`;
        const start = `"${new Date(log.startedAt).toLocaleString()}"`;
        const end = log.endedAt ? `"${new Date(log.endedAt).toLocaleString()}"` : '"In Progress"';
        const duration = log.durationSeconds ? (log.durationSeconds / 3600).toFixed(2) : '';
        return [taskName, start, end, duration].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `time_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl pb-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Time Logs</h2>
          <p className="text-muted-foreground mt-1">
            A complete history of all your tracked time sessions.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleDownloadCSV} variant="outline" disabled={logs.length === 0 || isLoading}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="flex flex-col space-y-1">
            <CardTitle>Time Entries</CardTitle>
            <CardDescription>
              Showing {logs.length} of {totalItems} logs
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              className="flex h-9 w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="previous_month">Previous Month</option>
            </select>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="flex h-9 w-28 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Clock className="w-12 h-12 mb-4 opacity-20" />
              <p>No time logs found.</p>
              <p className="text-sm">Start a timer on a task to record time.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Ended At</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.task?.title || 'Unknown Task'}
                      </TableCell>
                      <TableCell>
                        {new Date(log.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.endedAt ? new Date(log.endedAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>{formatTotalTime(log.durationSeconds)}</TableCell>
                      <TableCell>
                        {log.endedAt ? (
                          <Badge variant="secondary">Completed</Badge>
                        ) : (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
