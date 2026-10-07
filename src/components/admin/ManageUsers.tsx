
"use client";

import React, { useState, useEffect } from "react";
import {
  getUsersAction,
  addUserAction,
  deleteUserAction,
  approveUserAction,
} from "@/app/actions/dbActions";

import { User } from "@/utils/storage";

import {
  Search,
  Trash2,
  PlusCircle,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";

import { Button } from "../ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

import { Input } from "../ui/input";
import { Label } from "../ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 10;

export default function ManageUsers() {
  const { user: admin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);

  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    id: "",
    email: "",
    password: "",
    role: "student",
  });

  const [isSaving, setIsSaving] = useState(false);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsersAction();
      setUsers(data);
    } catch (err: any) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.name || !newUser.id || !newUser.password || !newUser.role) {
      toast.error("Please fill out required fields");
      return;
    }

    setIsSaving(true);

    try {
      await addUserAction({
        ...newUser,
        profilePic: "",
        isApproved: true,
        department: 'college',
        isBanned: false
      } as User);

      toast.success("User created");

      setNewUser({
        name: "",
        id: "",
        email: "",
        password: "",
        role: "student",
      });

      setAddUserModalOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Error creating user");
    }

    setIsSaving(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserAction(userToDelete.id);
      toast.success(`Deleted ${userToDelete.name}`);
      setUserToDelete(null);
      loadUsers();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!admin) return;
    try {
      await approveUserAction(admin.id, userId);
      toast.success("User account approved and activated.");
      loadUsers();
    } catch {
      toast.error("Approval failed.");
    }
  }

  const handleApproveAll = async () => {
    const pending = users.filter(u => u.isApproved === false);
    if (pending.length === 0) return;
    if (!confirm(`Authorize all ${pending.length} pending registration requests?`)) return;

    setBatchProcessing(true);
    let successCount = 0;
    try {
      for (const u of pending) {
        await approveUserAction(admin!.id, u.id);
        successCount++;
      }
      toast.success(`Batch Success: Activated ${successCount} user accounts.`);
      loadUsers();
    } catch (e) {
      toast.error("Batch processing failed.");
    } finally {
      setBatchProcessing(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = u.name || "";
    const id = u.id || "";
    const email = u.email || "";
    const searchTerm = search.toLowerCase();

    const searchMatch =
      name.toLowerCase().includes(searchTerm) ||
      id.toLowerCase().includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm);

    const roleMatch = roleFilter === "All" || u.role === roleFilter;
    const statusMatch = statusFilter === "All" || 
      (statusFilter === "Pending" && u.isApproved === false) ||
      (statusFilter === "Active" && u.isApproved !== false);

    return searchMatch && roleMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    if (!filteredUsers.length) return;
    const rows = filteredUsers.map((u) => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Status: u.isApproved ? 'Active' : 'Pending'
    }));
    const csv = Object.keys(rows[0]).join(",") + "\n" + rows.map((r) => Object.values(r).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
  };

  const totalUsers = users.length;
  const students = users.filter((u) => u.role === "student").length;
  const teachers = users.filter((u) => u.role === "teacher").length;
  const pending = users.filter((u) => u.isApproved === false).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tighter leading-none uppercase">Identity registry</h2>
          <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em] mt-2 uppercase">
            User management & authorization control
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {pending > 0 && (
            <Button onClick={handleApproveAll} disabled={batchProcessing} className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-[10px] tracking-widest gap-2 shadow-xl uppercase">
              {batchProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve all pending ({pending})
            </Button>
          )}
          <Button onClick={exportCSV} variant="outline" className="h-12 rounded-xl font-black text-[10px] tracking-widest gap-2 uppercase">
            <Download size={16} /> Export CSV
          </Button>
          <Dialog open={isAddUserModalOpen} onOpenChange={setAddUserModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-xl bg-primary text-white font-black text-[10px] tracking-widest gap-2 shadow-xl shadow-primary/20 uppercase">
                <PlusCircle className="h-4 w-4" /> Register identity
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem]">
              <form onSubmit={handleAddNewUser}>
                <DialogHeader><DialogTitle className="text-xl font-black uppercase">Provision new user</DialogTitle></DialogHeader>
                <div className="space-y-4 py-6">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black ml-1 uppercase">Universal ID (USN/EMP)</Label>
                    <Input placeholder="e.g. 25001198310" value={newUser.id} onChange={(e) => setNewUser({ ...newUser, id: e.target.value })} className="h-12 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black ml-1 uppercase">Full name</Label>
                    <Input placeholder="Juan Dela Cruz" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black ml-1 uppercase">Email address</Label>
                    <Input placeholder="juan@school.edu" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black ml-1 uppercase">Initial password</Label>
                    <Input type="password" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black ml-1 uppercase">System role</Label>
                    <Select value={newUser.role} onValueChange={(v: any) => setNewUser({ ...newUser, role: v })}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl font-bold">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="library_admin">Library admin</SelectItem>
                        <SelectItem value="guard">Guard</SelectItem>
                        <SelectItem value="ssc_adviser">SSC adviser</SelectItem>
                        <SelectItem value="ssc_treasurer">SSC treasurer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <DialogClose asChild><Button variant="ghost" className="h-12 rounded-xl font-black text-[10px] uppercase">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSaving} className="h-12 rounded-xl px-8 bg-primary text-white font-black text-[10px] tracking-widest shadow-lg uppercase">
                    {isSaving ? "Provisioning..." : "Commit registration"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border-primary/5 shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground tracking-widest mb-1 uppercase">Global registry</p>
          <div className="text-3xl font-black text-primary">{totalUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-primary/5 shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground tracking-widest mb-1 uppercase">Students</p>
          <div className="text-3xl font-black text-primary">{students}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-primary/5 shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground tracking-widest mb-1 uppercase">Faculty</p>
          <div className="text-3xl font-black text-primary">{teachers}</div>
        </div>
        <div className={`p-6 rounded-[2rem] border-2 shadow-xl cursor-pointer transition-all ${statusFilter === 'Pending' ? 'bg-primary text-white border-primary' : 'bg-primary/5 border-primary/10'}`} onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}>
          <p className={`text-[10px] font-black tracking-widest mb-1 uppercase ${statusFilter === 'Pending' ? 'text-white/70' : 'text-primary'}`}>Pending approval</p>
          <div className={`text-3xl font-black flex items-center gap-2 ${statusFilter === 'Pending' ? 'text-white' : 'text-primary'}`}>
            {pending}
            {pending > 0 && <Clock className="h-6 w-6 animate-pulse" />}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
          <Input placeholder="Search identity by name, ID or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-14 pl-12 rounded-2xl border-primary/5 shadow-lg font-bold text-lg" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v)}>
          <SelectTrigger className="w-[200px] h-14 rounded-2xl border-primary/5 shadow-lg font-black text-[10px] tracking-widest uppercase">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl font-bold">
            <SelectItem value="All">All identities</SelectItem>
            <SelectItem value="student">Students only</SelectItem>
            <SelectItem value="teacher">Faculty only</SelectItem>
            <SelectItem value="admin">Administrators</SelectItem>
            <SelectItem value="library_admin">Library staff</SelectItem>
            <SelectItem value="guard">Campus guards</SelectItem>
            <SelectItem value="ssc_adviser">SSC adviser</SelectItem>
            <SelectItem value="ssc_treasurer">SSC treasurer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-[200px] h-14 rounded-2xl border-primary/5 shadow-lg font-black text-[10px] tracking-widest uppercase">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl font-bold">
            <SelectItem value="All">All access levels</SelectItem>
            <SelectItem value="Pending">Pending only</SelectItem>
            <SelectItem value="Active">Active only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-primary/5 shadow-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-primary/5 border-b border-primary/5">
            <tr>
              <th className="px-8 py-6 text-left text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">Universal ID</th>
              <th className="px-8 py-6 text-left text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">Identity name</th>
              <th className="px-8 py-6 text-left text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">Classification</th>
              <th className="px-8 py-6 text-left text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">Status</th>
              <th className="px-8 py-6 text-right text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">Action control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-20 text-center">
                  <Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" />
                  <p className="mt-4 font-black text-[10px] tracking-widest text-muted-foreground uppercase">Accessing records...</p>
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-20 text-center text-muted-foreground font-bold tracking-widest text-xs opacity-40 uppercase">No matching records found.</td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="px-8 py-6"><span className="font-black text-primary tabular-nums tracking-tighter">{user.id}</span></td>
                  <td className="px-8 py-6">
                    <div className="font-black text-foreground tracking-tight">{user.name}</div>
                    <div className="text-[10px] font-bold text-muted-foreground truncate max-w-[200px] uppercase">{user.email}</div>
                  </td>
                  <td className="px-8 py-6 capitalize">
                    <Badge variant="outline" className="font-black text-[9px] tracking-widest border-primary/10 uppercase">
                      {user.role.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    {user.isApproved === false ? (
                      <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-200 font-black text-[9px] tracking-widest animate-pulse uppercase">
                        Pending approval
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 border-green-200 font-black text-[9px] tracking-widest uppercase">
                        Active access
                      </Badge>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2">
                      {user.isApproved === false && (
                        <Button variant="outline" size="sm" onClick={() => handleApproveUser(user.id)} className="h-10 px-4 rounded-xl border-green-200 text-green-600 hover:bg-green-500 hover:text-white font-black text-[9px] tracking-widest gap-2 uppercase">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} className="h-10 w-10 rounded-xl text-primary hover:bg-primary/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-12 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase">Previous</Button>
          <span className="font-black text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Identity registry page {page} of {totalPages}</span>
          <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="h-12 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase">Next</Button>
        </div>
      )}

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-primary/5 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter text-primary uppercase">Terminate identity</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-bold text-muted-foreground mt-4">
              Ito ay permanenteng pag-alis ng account ni <span className="text-primary underline uppercase">{userToDelete?.name}</span> mula sa global registry. Hindi na maibabalik ang data na ito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-black text-[10px] tracking-widest uppercase">Abort operation</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="h-12 rounded-xl bg-primary text-white font-black text-[10px] tracking-widest shadow-lg shadow-primary/20 uppercase">Confirm termination</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
