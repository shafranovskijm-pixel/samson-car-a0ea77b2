import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Calendar,
  ListChecks,
  Users,
  Car,
  Wrench,
  Tags,
  UserCog,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Главная", url: "/", icon: Home },
  { title: "Календарь", url: "/calendar", icon: Calendar },
  { title: "Записи по дням", url: "/schedule", icon: ListChecks },
  { title: "Клиенты", url: "/clients", icon: Users },
  { title: "Машины", url: "/cars", icon: Car },
  { title: "Услуги и цены", url: "/services", icon: Wrench },
  { title: "Марки", url: "/brands", icon: Tags },
  { title: "Мастера", url: "/mechanics", icon: UserCog },
];


export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold">
            S
          </div>
          <div className="font-semibold group-data-[collapsible=icon]:hidden">
            Samson Auto
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Разделы</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={pathname === it.url}>
                    <Link to={it.url} className="flex items-center gap-2">
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
