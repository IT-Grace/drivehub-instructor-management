import {
  Calendar,
  Users,
  DollarSign,
  LayoutDashboard,
  GraduationCap,
  UserCircle,
  Settings,
  Car,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  // Navigation items based on role
  const getNavigationItems = () => {
    const commonItems = [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
    ];

    if (user.role === "student") {
      return [
        ...commonItems,
        {
          title: "My Lessons",
          url: "/lessons",
          icon: Calendar,
        },
        {
          title: "My Progress",
          url: "/progress",
          icon: GraduationCap,
        },
        {
          title: "Payments",
          url: "/payments",
          icon: DollarSign,
        },
      ];
    }

    if (user.role === "instructor") {
      return [
        ...commonItems,
        {
          title: "Schedule",
          url: "/schedule",
          icon: Calendar,
        },
        {
          title: "Students",
          url: "/students",
          icon: Users,
        },
        {
          title: "Earnings",
          url: "/earnings",
          icon: DollarSign,
        },
      ];
    }

    if (user.role === "super_admin") {
      return [
        ...commonItems,
        {
          title: "Users",
          url: "/users",
          icon: UserCircle,
        },
        {
          title: "Lessons",
          url: "/all-lessons",
          icon: Calendar,
        },
        {
          title: "Payments",
          url: "/all-payments",
          icon: DollarSign,
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
        },
      ];
    }

    return commonItems;
  };

  const items = getNavigationItems();
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">DriveHub</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <a href={item.url} className="hover-elevate active-elevate-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImageUrl || undefined} className="object-cover" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user.role.replace("_", " ")}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
