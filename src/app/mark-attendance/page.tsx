
"use client";

import { useState } from "react";
import { Check, X, Clock, Search, Filter } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const students = [
  { id: "1", name: "Alice Thompson", class: "Grade 10-A", avatar: "https://picsum.photos/seed/a1/50/50" },
  { id: "2", name: "Bob Wilson", class: "Grade 10-A", avatar: "https://picsum.photos/seed/b1/50/50" },
  { id: "3", name: "Charlie Davis", class: "Grade 10-A", avatar: "https://picsum.photos/seed/c1/50/50" },
  { id: "4", name: "Diana Prince", class: "Grade 10-A", avatar: "https://picsum.photos/seed/d1/50/50" },
  { id: "5", name: "Ethan Hunt", class: "Grade 10-A", avatar: "https://picsum.photos/seed/e1/50/50" },
];

export default function MarkAttendancePage() {
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late' | null>>({});
  const { toast } = useToast();

  const handleMark = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = () => {
    const markedCount = Object.values(attendance).filter(v => v !== null).length;
    toast({
      title: "Attendance Saved",
      description: `Successfully marked attendance for ${markedCount} students.`,
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <h1 className="font-headline text-xl font-bold">Mark Attendance</h1>
        </header>

        <main className="p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-9" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 text-sm font-normal">
                Session: Morning Assembly
              </Badge>
              <Button onClick={saveAttendance}>Save All</Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Students - Grade 10-A</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Student</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.class}</div>
                      </TableCell>
                      <TableCell>
                        {attendance[student.id] === 'present' && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Present</Badge>
                        )}
                        {attendance[student.id] === 'absent' && (
                          <Badge variant="destructive">Absent</Badge>
                        )}
                        {attendance[student.id] === 'late' && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Late</Badge>
                        )}
                        {!attendance[student.id] && (
                          <span className="text-xs text-muted-foreground italic">Not marked</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant={attendance[student.id] === 'present' ? "default" : "outline"} 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleMark(student.id, 'present')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant={attendance[student.id] === 'late' ? "secondary" : "outline"} 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleMark(student.id, 'late')}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant={attendance[student.id] === 'absent' ? "destructive" : "outline"} 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleMark(student.id, 'absent')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
