
"use client";

import { useState } from "react";
import { Search, Download, Filter, FileText } from "lucide-react";
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const historyData = [
  { id: "101", date: "2024-05-20", student: "Alice Thompson", class: "10-A", status: "Present", time: "08:05 AM" },
  { id: "102", date: "2024-05-20", student: "Bob Wilson", class: "10-A", status: "Present", time: "08:12 AM" },
  { id: "103", date: "2024-05-20", student: "Charlie Davis", class: "10-A", status: "Absent", time: "-" },
  { id: "104", date: "2024-05-20", student: "Diana Prince", class: "10-A", status: "Late", time: "08:45 AM" },
  { id: "105", date: "2024-05-19", student: "Alice Thompson", class: "10-A", status: "Present", time: "07:58 AM" },
  { id: "106", date: "2024-05-19", student: "Bob Wilson", class: "10-A", status: "Absent", time: "-" },
  { id: "107", date: "2024-05-19", student: "Charlie Davis", class: "10-A", status: "Present", time: "08:10 AM" },
];

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = historyData.filter(log => 
    log.student.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.date.includes(searchTerm)
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="font-headline text-xl font-bold">Attendance Logs</h1>
        </header>

        <main className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by student or date..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
              <Button variant="outline" className="flex-1 md:flex-none gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                History Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Marking Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.date}</TableCell>
                      <TableCell>{log.student}</TableCell>
                      <TableCell>{log.class}</TableCell>
                      <TableCell className="text-muted-foreground">{log.time}</TableCell>
                      <TableCell>
                        {log.status === 'Present' && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Present</Badge>
                        )}
                        {log.status === 'Absent' && (
                          <Badge variant="destructive">Absent</Badge>
                        )}
                        {log.status === 'Late' && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Late</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No logs found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
