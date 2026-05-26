"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/actions/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    match: (pathname: string): boolean => pathname === "/dashboard",
  },
  {
    href: "/jobs",
    label: "Jobs",
    icon: BriefcaseBusiness,
    match: (pathname: string): boolean => pathname.startsWith("/jobs"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle,
    match: (pathname: string): boolean => pathname === "/profile",
  },
];

export function AppShell({ children }: Props) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="min-h-screen bg-base">
        <AppHeader />
        <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-default bg-surface px-4">
      <SidebarTrigger className="mr-3 h-9 w-9 rounded-xl text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary" />
      <Link
        href="/dashboard"
        className="text-base font-semibold text-text-primary md:hidden">
        JobPilot
      </Link>
    </header>
  );
}

function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  function closeMobileSidebar(): void {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-default bg-surface text-text-secondary">
      <SidebarHeader className="border-b border-default px-4 py-4">
        <div className="flex h-8 items-center gap-2">
          <Link
            href="/dashboard"
            onClick={closeMobileSidebar}
            className="min-w-0 truncate text-base font-semibold text-text-primary">
            JobPilot
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item: NavItem) => {
                const Icon = item.icon;
                const isActive = item.match(pathname);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 rounded-xl px-3 text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary",
                        isActive &&
                          "border border-accent-border bg-accent-dim text-accent-text",
                      )}>
                      <Link href={item.href} onClick={closeMobileSidebar}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  disabled
                  tooltip="Settings"
                  className="h-10 rounded-xl px-3 text-text-faint">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <form action={signOut}>
          <SidebarMenuButton
            tooltip="Sign out"
            className="h-9 rounded-xl border border-default bg-elevated px-3 text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary">
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
