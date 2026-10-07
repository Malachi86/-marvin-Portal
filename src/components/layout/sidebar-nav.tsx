
"use client";

import { 
  LayoutDashboard, 
  History, 
  Users, 
  Settings, 
  LogOut,
  CalendarDays,
  UserCircle,
  Calendar as CalendarIcon,
  PlusCircle,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import { getAuth } from "@/firebase";

export function AppSidebar() {
  const pathname = usePathname();
  const { profile } = useUser();
  const auth = getAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Profile", href: "/profile", icon: UserCircle },
  ];

  if (profile?.role === "teacher") {
    navItems.push(
      { name: "Add Subject", href: "/teacher/add-subject", icon: PlusCircle },
    );
  }

  if (profile?.role === "student") {
    navItems.push(
      { name: "Attendance History", href: "/logs", icon: History },
    );
  }

  const adminItems = profile?.role === "admin" ? [
    { name: "Teacher Management", href: "/admin", icon: Users },
    { name: "All Subjects", href: "/dashboard", icon: BookOpen },
    { name: "School Config", href: "/settings", icon: Settings },
  ] : [];

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="border-b py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-lg font-bold tracking-tight text-primary leading-tight">AMS:AMACC</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">Management v1.0</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary/60 font-bold px-4">Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className="px-4 hover:bg-accent/50 group">
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 transition-colors ${pathname === item.href ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                      <span className={`font-medium ${pathname === item.href ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary/60 font-bold px-4">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className="px-4 hover:bg-accent/50 group">
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 transition-colors ${pathname === item.href ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                        <span className={`font-medium ${pathname === item.href ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-4 bg-accent/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={profile?.profilePic} />
            <AvatarFallback className="bg-primary text-white font-bold">{profile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <p className="text-sm font-bold leading-none truncate text-foreground">{profile?.name || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">{profile?.role || "Role"}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-accent" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
