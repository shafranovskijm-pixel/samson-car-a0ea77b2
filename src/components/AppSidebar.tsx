import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Calendar,
  ListChecks,
  Calculator,
  Users,
  UserCog,
  Settings,
  GripVertical,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

type Item = { title: string; url: string; icon: LucideIcon };

const DEFAULT_ITEMS: Item[] = [
  { title: "Калькулятор", url: "/calculator", icon: Calculator },
  { title: "Календарь", url: "/calendar", icon: Calendar },
  { title: "Записи по дням", url: "/schedule", icon: ListChecks },
  { title: "Статистика", url: "/stats", icon: BarChart3 },
  { title: "Клиенты", url: "/clients", icon: Users },
  { title: "Мастера", url: "/mechanics", icon: UserCog },
  { title: "Настройки калькулятора", url: "/settings", icon: Settings },
];

const STORAGE_KEY = "sidebar-order-v1";

function orderItems(order: string[]): Item[] {
  const byUrl = new Map(DEFAULT_ITEMS.map((i) => [i.url, i]));
  const result: Item[] = [];
  order.forEach((url) => {
    const it = byUrl.get(url);
    if (it) {
      result.push(it);
      byUrl.delete(url);
    }
  });
  byUrl.forEach((it) => result.push(it));
  return result;
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        setItems(orderItems(parsed));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.url === active.id);
      const newIndex = prev.findIndex((i) => i.url === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map((i) => i.url)));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.url)}
                strategy={verticalListSortingStrategy}
              >
                <SidebarMenu>
                  {items.map((it) => (
                    <SortableRow
                      key={it.url}
                      item={it}
                      active={pathname === it.url}
                    />
                  ))}
                </SidebarMenu>
              </SortableContext>
            </DndContext>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function SortableRow({ item, active }: { item: Item; active: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.url });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Перетащить"
          className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground/60 hover:text-foreground active:cursor-grabbing touch-none group-data-[collapsible=icon]:hidden"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <SidebarMenuButton asChild isActive={active} className="flex-1">
          <Link to={item.url} className="flex items-center gap-2">
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </div>
    </SidebarMenuItem>
  );
}
