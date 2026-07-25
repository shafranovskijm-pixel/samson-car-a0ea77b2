import { t as cn } from "./utils-C_uf36nf.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { t as ConfirmProvider } from "./ConfirmDialog-ClPPfBvs.js";
import { a as logout, r as isLoggedIn } from "./authGate-Bd0wCx6i.js";
import { t as Route$8 } from "./settings-E4KsAyWP.js";
import { t as Route$9 } from "./calendar-D4VfzyeD.js";
import { t as Route$10 } from "./calculator-BebDG-hB.js";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, redirect, useRouter, useRouterState } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider, useIsMutating, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Calculator, Calendar, Clock, GripVertical, ListChecks, LogOut, PanelLeft, RefreshCw, Settings, UserCog, Users, Wallet, Wifi, WifiOff, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Toaster, toast } from "sonner";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
//#region src/styles.css?url
var styles_default = "./assets/styles-CSFIjWaN.css";
//#endregion
//#region src/lib/lovable-error-reporting.ts
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
//#endregion
//#region src/hooks/use-mobile.tsx
var MOBILE_BREAKPOINT = 768;
function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState(void 0);
	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		mql.addEventListener("change", onChange);
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		return () => mql.removeEventListener("change", onChange);
	}, []);
	return !!isMobile;
}
//#endregion
//#region src/components/ui/separator.tsx
var Separator = React.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx(SeparatorPrimitive.Root, {
	ref,
	decorative,
	orientation,
	className: cn("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className),
	...props
}));
Separator.displayName = SeparatorPrimitive.Root.displayName;
//#endregion
//#region src/components/ui/sheet.tsx
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Overlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [/* @__PURE__ */ jsx(SheetOverlay, {}), /* @__PURE__ */ jsxs(SheetPrimitive.Content, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ jsxs(SheetPrimitive.Close, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ jsx(X, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
//#endregion
//#region src/components/ui/skeleton.tsx
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: cn("animate-pulse rounded-md bg-primary/10", className),
		...props
	});
}
//#endregion
//#region src/components/ui/tooltip.tsx
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(TooltipPrimitive.Portal, { children: /* @__PURE__ */ jsx(TooltipPrimitive.Content, {
	ref,
	sideOffset,
	className: cn("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)", className),
	...props
}) }));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
//#endregion
//#region src/components/ui/sidebar.tsx
var SIDEBAR_COOKIE_NAME = "sidebar_state";
var SIDEBAR_COOKIE_MAX_AGE = 3600 * 24 * 7;
var SIDEBAR_WIDTH = "16rem";
var SIDEBAR_WIDTH_MOBILE = "18rem";
var SIDEBAR_WIDTH_ICON = "3rem";
var SIDEBAR_KEYBOARD_SHORTCUT = "b";
var SidebarContext = React.createContext(null);
function useSidebar() {
	const context = React.useContext(SidebarContext);
	if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
	return context;
}
var SidebarProvider = React.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
	const isMobile = useIsMobile();
	const [openMobile, setOpenMobile] = React.useState(false);
	const [_open, _setOpen] = React.useState(defaultOpen);
	const open = openProp ?? _open;
	const setOpen = React.useCallback((value) => {
		const openState = typeof value === "function" ? value(open) : value;
		if (setOpenProp) setOpenProp(openState);
		else _setOpen(openState);
		document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
	}, [setOpenProp, open]);
	const toggleSidebar = React.useCallback(() => {
		return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
	}, [
		isMobile,
		setOpen,
		setOpenMobile
	]);
	React.useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				toggleSidebar();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [toggleSidebar]);
	const state = open ? "expanded" : "collapsed";
	const contextValue = React.useMemo(() => ({
		state,
		open,
		setOpen,
		isMobile,
		openMobile,
		setOpenMobile,
		toggleSidebar
	}), [
		state,
		open,
		setOpen,
		isMobile,
		openMobile,
		setOpenMobile,
		toggleSidebar
	]);
	return /* @__PURE__ */ jsx(SidebarContext.Provider, {
		value: contextValue,
		children: /* @__PURE__ */ jsx(TooltipProvider, {
			delayDuration: 0,
			children: /* @__PURE__ */ jsx("div", {
				style: {
					"--sidebar-width": SIDEBAR_WIDTH,
					"--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
					...style
				},
				className: cn("group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar", className),
				ref,
				...props,
				children
			})
		})
	});
});
SidebarProvider.displayName = "SidebarProvider";
var Sidebar = React.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
	const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
	if (collapsible === "none") return /* @__PURE__ */ jsx("div", {
		className: cn("flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground", className),
		ref,
		...props,
		children
	});
	if (isMobile) return /* @__PURE__ */ jsx(Sheet, {
		open: openMobile,
		onOpenChange: setOpenMobile,
		...props,
		children: /* @__PURE__ */ jsxs(SheetContent, {
			"data-sidebar": "sidebar",
			"data-mobile": "true",
			className: "w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
			style: { "--sidebar-width": SIDEBAR_WIDTH_MOBILE },
			side,
			children: [/* @__PURE__ */ jsxs(SheetHeader, {
				className: "sr-only",
				children: [/* @__PURE__ */ jsx(SheetTitle, { children: "Sidebar" }), /* @__PURE__ */ jsx(SheetDescription, { children: "Displays the mobile sidebar." })]
			}), /* @__PURE__ */ jsx("div", {
				className: "flex h-full w-full flex-col",
				children
			})]
		})
	});
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: "group peer hidden text-sidebar-foreground md:block",
		"data-state": state,
		"data-collapsible": state === "collapsed" ? collapsible : "",
		"data-variant": variant,
		"data-side": side,
		children: [/* @__PURE__ */ jsx("div", { className: cn("relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear", "group-data-[collapsible=offcanvas]:w-0", "group-data-[side=right]:rotate-180", variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)") }), /* @__PURE__ */ jsx("div", {
			className: cn("fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex", side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]", variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l", className),
			...props,
			children: /* @__PURE__ */ jsx("div", {
				"data-sidebar": "sidebar",
				className: "flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow",
				children
			})
		})]
	});
});
Sidebar.displayName = "Sidebar";
var SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
	const { toggleSidebar } = useSidebar();
	return /* @__PURE__ */ jsxs(Button, {
		ref,
		"data-sidebar": "trigger",
		variant: "ghost",
		size: "icon",
		className: cn("h-7 w-7", className),
		onClick: (event) => {
			onClick?.(event);
			toggleSidebar();
		},
		...props,
		children: [/* @__PURE__ */ jsx(PanelLeft, {}), /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: "Toggle Sidebar"
		})]
	});
});
SidebarTrigger.displayName = "SidebarTrigger";
var SidebarRail = React.forwardRef(({ className, ...props }, ref) => {
	const { toggleSidebar } = useSidebar();
	return /* @__PURE__ */ jsx("button", {
		ref,
		"data-sidebar": "rail",
		"aria-label": "Toggle Sidebar",
		tabIndex: -1,
		onClick: toggleSidebar,
		title: "Toggle Sidebar",
		className: cn("absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex", "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize", "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize", "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar", "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2", "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2", className),
		...props
	});
});
SidebarRail.displayName = "SidebarRail";
var SidebarInset = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("main", {
		ref,
		className: cn("relative flex w-full flex-1 flex-col bg-background", "md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow", className),
		...props
	});
});
SidebarInset.displayName = "SidebarInset";
var SidebarInput = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx(Input, {
		ref,
		"data-sidebar": "input",
		className: cn("h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring", className),
		...props
	});
});
SidebarInput.displayName = "SidebarInput";
var SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("div", {
		ref,
		"data-sidebar": "header",
		className: cn("flex flex-col gap-2 p-2", className),
		...props
	});
});
SidebarHeader.displayName = "SidebarHeader";
var SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("div", {
		ref,
		"data-sidebar": "footer",
		className: cn("flex flex-col gap-2 p-2", className),
		...props
	});
});
SidebarFooter.displayName = "SidebarFooter";
var SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx(Separator, {
		ref,
		"data-sidebar": "separator",
		className: cn("mx-2 w-auto bg-sidebar-border", className),
		...props
	});
});
SidebarSeparator.displayName = "SidebarSeparator";
var SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("div", {
		ref,
		"data-sidebar": "content",
		className: cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden", className),
		...props
	});
});
SidebarContent.displayName = "SidebarContent";
var SidebarGroup = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("div", {
		ref,
		"data-sidebar": "group",
		className: cn("relative flex w-full min-w-0 flex-col p-2", className),
		...props
	});
});
SidebarGroup.displayName = "SidebarGroup";
var SidebarGroupLabel = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "div", {
		ref,
		"data-sidebar": "group-label",
		className: cn("flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0", className),
		...props
	});
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";
var SidebarGroupAction = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		ref,
		"data-sidebar": "group-action",
		className: cn("absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "after:absolute after:-inset-2 after:md:hidden", "group-data-[collapsible=icon]:hidden", className),
		...props
	});
});
SidebarGroupAction.displayName = "SidebarGroupAction";
var SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	"data-sidebar": "group-content",
	className: cn("w-full text-sm", className),
	...props
}));
SidebarGroupContent.displayName = "SidebarGroupContent";
var SidebarMenu = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("ul", {
	ref,
	"data-sidebar": "menu",
	className: cn("flex w-full min-w-0 flex-col gap-1", className),
	...props
}));
SidebarMenu.displayName = "SidebarMenu";
var SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("li", {
	ref,
	"data-sidebar": "menu-item",
	className: cn("group/menu-item relative", className),
	...props
}));
SidebarMenuItem.displayName = "SidebarMenuItem";
var sidebarMenuButtonVariants = cva("peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring cursor-pointer transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0", {
	variants: {
		variant: {
			default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
			outline: "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]"
		},
		size: {
			default: "h-8 text-sm",
			sm: "h-7 text-xs",
			lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var SidebarMenuButton = React.forwardRef(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
	const Comp = asChild ? Slot : "button";
	const { isMobile, state } = useSidebar();
	const button = /* @__PURE__ */ jsx(Comp, {
		ref,
		"data-sidebar": "menu-button",
		"data-size": size,
		"data-active": isActive,
		className: cn(sidebarMenuButtonVariants({
			variant,
			size
		}), className),
		...props
	});
	if (!tooltip) return button;
	if (typeof tooltip === "string") tooltip = { children: tooltip };
	return /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
		asChild: true,
		children: button
	}), /* @__PURE__ */ jsx(TooltipContent, {
		side: "right",
		align: "center",
		hidden: state !== "collapsed" || isMobile,
		...tooltip
	})] });
});
SidebarMenuButton.displayName = "SidebarMenuButton";
var SidebarMenuAction = React.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		ref,
		"data-sidebar": "menu-action",
		className: cn("absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0", "after:absolute after:-inset-2 after:md:hidden", "peer-data-[size=sm]/menu-button:top-1", "peer-data-[size=default]/menu-button:top-1.5", "peer-data-[size=lg]/menu-button:top-2.5", "group-data-[collapsible=icon]:hidden", showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0", className),
		...props
	});
});
SidebarMenuAction.displayName = "SidebarMenuAction";
var SidebarMenuBadge = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	"data-sidebar": "menu-badge",
	className: cn("pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground", "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground", "peer-data-[size=sm]/menu-button:top-1", "peer-data-[size=default]/menu-button:top-1.5", "peer-data-[size=lg]/menu-button:top-2.5", "group-data-[collapsible=icon]:hidden", className),
	...props
}));
SidebarMenuBadge.displayName = "SidebarMenuBadge";
var SidebarMenuSkeleton = React.forwardRef(({ className, showIcon = false, ...props }, ref) => {
	const width = React.useMemo(() => {
		return `${Math.floor(Math.random() * 40) + 50}%`;
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		ref,
		"data-sidebar": "menu-skeleton",
		className: cn("flex h-8 items-center gap-2 rounded-md px-2", className),
		...props,
		children: [showIcon && /* @__PURE__ */ jsx(Skeleton, {
			className: "size-4 rounded-md",
			"data-sidebar": "menu-skeleton-icon"
		}), /* @__PURE__ */ jsx(Skeleton, {
			className: "h-4 max-w-(--skeleton-width) flex-1",
			"data-sidebar": "menu-skeleton-text",
			style: { "--skeleton-width": width }
		})]
	});
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";
var SidebarMenuSub = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("ul", {
	ref,
	"data-sidebar": "menu-sub",
	className: cn("mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5", "group-data-[collapsible=icon]:hidden", className),
	...props
}));
SidebarMenuSub.displayName = "SidebarMenuSub";
var SidebarMenuSubItem = React.forwardRef(({ ...props }, ref) => /* @__PURE__ */ jsx("li", {
	ref,
	...props
}));
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
var SidebarMenuSubButton = React.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "a", {
		ref,
		"data-sidebar": "menu-sub-button",
		"data-size": size,
		"data-active": isActive,
		className: cn("flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground", "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground", size === "sm" && "text-xs", size === "md" && "text-sm", "group-data-[collapsible=icon]:hidden", className),
		...props
	});
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";
//#endregion
//#region src/components/AppSidebar.tsx
var DEFAULT_ITEMS = [
	{
		title: "Калькулятор",
		url: "/calculator",
		icon: Calculator
	},
	{
		title: "Календарь",
		url: "/calendar",
		icon: Calendar
	},
	{
		title: "Записи по дням",
		url: "/schedule",
		icon: ListChecks
	},
	{
		title: "Статистика",
		url: "/stats",
		icon: BarChart3
	},
	{
		title: "Расходы",
		url: "/expenses",
		icon: Wallet
	},
	{
		title: "Клиенты",
		url: "/clients",
		icon: Users
	},
	{
		title: "Мастера",
		url: "/mechanics",
		icon: UserCog
	},
	{
		title: "Настройки",
		url: "/settings",
		icon: Settings
	}
];
var STORAGE_KEY = "sidebar-order-v1";
function orderItems(order) {
	const byUrl = new Map(DEFAULT_ITEMS.map((i) => [i.url, i]));
	const result = [];
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
function AppSidebar() {
	const pathname = useRouterState({ select: (r) => r.location.pathname });
	const [items, setItems] = useState(DEFAULT_ITEMS);
	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) setItems(orderItems(parsed));
		} catch {}
	}, []);
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		setItems((prev) => {
			const oldIndex = prev.findIndex((i) => i.url === active.id);
			const newIndex = prev.findIndex((i) => i.url === over.id);
			if (oldIndex === -1 || newIndex === -1) return prev;
			const next = arrayMove(prev, oldIndex, newIndex);
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map((i) => i.url)));
			} catch {}
			return next;
		});
	};
	return /* @__PURE__ */ jsxs(Sidebar, {
		collapsible: "icon",
		children: [/* @__PURE__ */ jsx(SidebarHeader, {
			className: "px-3 py-4",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold",
					children: "S"
				}), /* @__PURE__ */ jsx("div", {
					className: "font-semibold group-data-[collapsible=icon]:hidden",
					children: "Samson Auto"
				})]
			})
		}), /* @__PURE__ */ jsx(SidebarContent, { children: /* @__PURE__ */ jsxs(SidebarGroup, { children: [/* @__PURE__ */ jsx(SidebarGroupLabel, { children: "Разделы" }), /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx(DndContext, {
			sensors,
			collisionDetection: closestCenter,
			onDragEnd: handleDragEnd,
			children: /* @__PURE__ */ jsx(SortableContext, {
				items: items.map((i) => i.url),
				strategy: verticalListSortingStrategy,
				children: /* @__PURE__ */ jsx(SidebarMenu, { children: items.map((it) => /* @__PURE__ */ jsx(SortableRow, {
					item: it,
					active: pathname === it.url
				}, it.url)) })
			})
		}) })] }) })]
	});
}
function SortableRow({ item, active }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.url });
	return /* @__PURE__ */ jsx(SidebarMenuItem, {
		ref: setNodeRef,
		style: {
			transform: CSS.Transform.toString(transform),
			transition,
			opacity: isDragging ? .5 : 1
		},
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1",
			children: [/* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": "Перетащить",
				className: "flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground/60 hover:text-foreground active:cursor-grabbing touch-none group-data-[collapsible=icon]:hidden",
				...attributes,
				...listeners,
				children: /* @__PURE__ */ jsx(GripVertical, { className: "h-4 w-4" })
			}), /* @__PURE__ */ jsx(SidebarMenuButton, {
				asChild: true,
				isActive: active,
				className: "flex-1",
				children: /* @__PURE__ */ jsxs(Link, {
					to: item.url,
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(item.icon, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", { children: item.title })]
				})
			})]
		})
	});
}
//#endregion
//#region src/components/ui/sonner.tsx
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ jsx(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
//#endregion
//#region src/components/UssuriyskClock.tsx
function UssuriyskClock() {
	const [now, setNow] = useState(null);
	useEffect(() => {
		setNow(/* @__PURE__ */ new Date());
		const t = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => clearInterval(t);
	}, []);
	const text = useMemo(() => now ? new Intl.DateTimeFormat("ru-RU", {
		timeZone: "Asia/Vladivostok",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		weekday: "short",
		day: "2-digit",
		month: "short"
	}).format(now) : "", [now]);
	return /* @__PURE__ */ jsxs("div", {
		className: "hidden items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1 text-xs sm:flex",
		children: [/* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5 text-red-600" }), /* @__PURE__ */ jsxs("div", {
			className: "leading-tight",
			children: [/* @__PURE__ */ jsx("div", {
				className: "text-[9px] uppercase tracking-wider text-muted-foreground",
				children: "Уссурийск"
			}), /* @__PURE__ */ jsx("div", {
				className: "font-mono font-semibold tabular-nums min-w-[14ch]",
				children: text || "\xA0"
			})]
		})]
	});
}
//#endregion
//#region src/components/OnlineStatus.tsx
function OnlineStatus() {
	const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
	const pendingMutations = useIsMutating();
	const qc = useQueryClient();
	useEffect(() => {
		const on = () => {
			setOnline(true);
			toast.success("Соединение восстановлено — синхронизация...");
			qc.resumePausedMutations().then(() => qc.invalidateQueries());
		};
		const off = () => {
			setOnline(false);
			toast.warning("Оффлайн-режим. Изменения будут отправлены при подключении.");
		};
		window.addEventListener("online", on);
		window.addEventListener("offline", off);
		return () => {
			window.removeEventListener("online", on);
			window.removeEventListener("offline", off);
		};
	}, [qc]);
	const syncNow = () => {
		qc.resumePausedMutations().then(() => qc.invalidateQueries());
		toast.info("Синхронизация...");
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-1.5",
		children: [/* @__PURE__ */ jsxs("div", {
			className: `hidden sm:flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${online ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`,
			title: online ? "Онлайн" : "Оффлайн — работаем локально",
			children: [
				online ? /* @__PURE__ */ jsx(Wifi, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(WifiOff, { className: "h-3 w-3" }),
				/* @__PURE__ */ jsx("span", { children: online ? "Онлайн" : "Оффлайн" }),
				pendingMutations > 0 && /* @__PURE__ */ jsx("span", {
					className: "ml-1 rounded-full bg-background/50 px-1.5",
					children: pendingMutations
				})
			]
		}), /* @__PURE__ */ jsx(Button, {
			variant: "ghost",
			size: "icon",
			title: "Синхронизировать сейчас",
			onClick: syncNow,
			disabled: !online,
			children: /* @__PURE__ */ jsx(RefreshCw, { className: `h-4 w-4 ${pendingMutations > 0 ? "animate-spin" : ""}` })
		})]
	});
}
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Страница не найдена"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "На главную"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	useEffect(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold",
					children: "Ошибка загрузки страницы"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: error.message
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: /* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
						children: "Повторить"
					})
				})
			]
		})
	});
}
var Route$7 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Samson Auto — CRM" },
			{
				name: "description",
				content: "Внутренняя CRM автосервиса Samson: календарь, клиенты, машины, услуги."
			},
			{
				property: "og:title",
				content: "Samson Auto — CRM"
			},
			{
				name: "twitter:title",
				content: "Samson Auto — CRM"
			},
			{
				property: "og:description",
				content: "Внутренняя CRM автосервиса Samson: календарь, клиенты, машины, услуги."
			},
			{
				name: "twitter:description",
				content: "Внутренняя CRM автосервиса Samson: календарь, клиенты, машины, услуги."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6c58db5-2e88-4ad7-9ef6-00e454d34867/id-preview-b2094c8d--ddf217c8-3d5f-4fe6-9180-c8a9b5a16136.lovable.app-1784187173735.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6c58db5-2e88-4ad7-9ef6-00e454d34867/id-preview-b2094c8d--ddf217c8-3d5f-4fe6-9180-c8a9b5a16136.lovable.app-1784187173735.png"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "ru",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$7.useRouteContext();
	const router = useRouter();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [authed, setAuthed] = useState(null);
	useEffect(() => {
		setAuthed(isLoggedIn());
	}, [pathname]);
	const isLoginRoute = pathname === "/login";
	return /* @__PURE__ */ jsx(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ jsxs(ConfirmProvider, { children: [authed === null ? /* @__PURE__ */ jsx("div", { className: "min-h-screen" }) : !authed && !isLoginRoute ? /* @__PURE__ */ jsx(RedirectToLogin, {}) : isLoginRoute ? /* @__PURE__ */ jsx(Outlet, {}) : /* @__PURE__ */ jsx(SidebarProvider, { children: /* @__PURE__ */ jsxs("div", {
			className: "flex min-h-screen w-full overflow-x-hidden",
			children: [/* @__PURE__ */ jsx(AppSidebar, {}), /* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ jsxs("header", {
					className: "flex h-12 items-center gap-2 border-b bg-background px-2 sm:gap-3 sm:px-3",
					children: [
						/* @__PURE__ */ jsx(SidebarTrigger, {}),
						/* @__PURE__ */ jsxs("div", {
							className: "truncate text-sm font-medium",
							children: [/* @__PURE__ */ jsx("span", {
								className: "sm:hidden",
								children: "Samson Auto"
							}), /* @__PURE__ */ jsx("span", {
								className: "hidden sm:inline",
								children: "Samson Auto — CRM"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ml-auto flex items-center gap-2",
							children: [
								/* @__PURE__ */ jsx(OnlineStatus, {}),
								/* @__PURE__ */ jsx(UssuriyskClock, {}),
								/* @__PURE__ */ jsx(Button, {
									variant: "ghost",
									size: "icon",
									title: "Выйти",
									onClick: () => {
										logout();
										setAuthed(false);
										router.navigate({ to: "/login" });
									},
									children: /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" })
								})
							]
						})
					]
				}), /* @__PURE__ */ jsx("main", {
					className: "min-w-0 flex-1 overflow-x-hidden overflow-y-auto",
					children: /* @__PURE__ */ jsx(Outlet, {})
				})]
			})]
		}) }), /* @__PURE__ */ jsx(Toaster$1, {})] })
	});
}
function RedirectToLogin() {
	const router = useRouter();
	useEffect(() => {
		router.navigate({ to: "/login" });
	}, [router]);
	return /* @__PURE__ */ jsx("div", { className: "min-h-screen" });
}
//#endregion
//#region src/routes/stats.tsx
var $$splitComponentImporter$5 = () => import("./stats-DGp6xxDU.js");
var Route$6 = createFileRoute("/stats")({
	ssr: false,
	head: () => ({ meta: [{ title: "Статистика — Samson Auto CRM" }, {
		name: "description",
		content: "Сводка по автосервису и дебиторка."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
//#endregion
//#region src/routes/schedule.tsx
var $$splitComponentImporter$4 = () => import("./schedule-BioLKsTZ.js");
var Route$5 = createFileRoute("/schedule")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
//#endregion
//#region src/routes/mechanics.tsx
var $$splitComponentImporter$3 = () => import("./mechanics-rjGqnBXa.js");
var Route$4 = createFileRoute("/mechanics")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
//#endregion
//#region src/routes/login.tsx
var $$splitComponentImporter$2 = () => import("./login-CgBR0QSB.js");
var Route$3 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
//#endregion
//#region src/routes/expenses.tsx
var $$splitComponentImporter$1 = () => import("./expenses-Bb5zLhzH.js");
var Route$2 = createFileRoute("/expenses")({
	ssr: false,
	head: () => ({ meta: [{ title: "Расходы — Samson Auto CRM" }, {
		name: "description",
		content: "Оборот, прибыль, ЗП мастеров и авансы."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
//#endregion
//#region src/routes/clients.tsx
var $$splitComponentImporter = () => import("./clients-BaT2hLbb.js");
var Route$1 = createFileRoute("/clients")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routes/index.tsx
var Route = createFileRoute("/")({ beforeLoad: () => {
	throw redirect({ to: "/calculator" });
} });
//#endregion
//#region src/routeTree.gen.ts
var StatsRoute = Route$6.update({
	id: "/stats",
	path: "/stats",
	getParentRoute: () => Route$7
});
var SettingsRoute = Route$8.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$7
});
var ScheduleRoute = Route$5.update({
	id: "/schedule",
	path: "/schedule",
	getParentRoute: () => Route$7
});
var MechanicsRoute = Route$4.update({
	id: "/mechanics",
	path: "/mechanics",
	getParentRoute: () => Route$7
});
var LoginRoute = Route$3.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$7
});
var ExpensesRoute = Route$2.update({
	id: "/expenses",
	path: "/expenses",
	getParentRoute: () => Route$7
});
var ClientsRoute = Route$1.update({
	id: "/clients",
	path: "/clients",
	getParentRoute: () => Route$7
});
var CalendarRoute = Route$9.update({
	id: "/calendar",
	path: "/calendar",
	getParentRoute: () => Route$7
});
var CalculatorRoute = Route$10.update({
	id: "/calculator",
	path: "/calculator",
	getParentRoute: () => Route$7
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$7
	}),
	CalculatorRoute,
	CalendarRoute,
	ClientsRoute,
	ExpensesRoute,
	LoginRoute,
	MechanicsRoute,
	ScheduleRoute,
	SettingsRoute,
	StatsRoute
};
var routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/lib/offlineCache.ts
var CACHE_KEY = "samson-crm-query-cache-v1";
function makeQueryClient() {
	return new QueryClient({ defaultOptions: {
		queries: {
			staleTime: 1e3 * 60,
			gcTime: 1e3 * 60 * 60 * 24 * 7,
			retry: 2,
			refetchOnWindowFocus: false,
			networkMode: "offlineFirst"
		},
		mutations: {
			networkMode: "online",
			retry: 3
		}
	} });
}
function attachOfflinePersistence(client) {
	if (typeof window === "undefined") return;
	try {
		persistQueryClient({
			queryClient: client,
			persister: createSyncStoragePersister({
				storage: window.localStorage,
				key: CACHE_KEY,
				throttleTime: 1e3
			}),
			maxAge: 1e3 * 60 * 60 * 24 * 30
		});
	} catch (e) {
		console.warn("[offline] persist failed", e);
	}
}
//#endregion
//#region src/router.tsx
var getRouter = () => {
	const queryClient = makeQueryClient();
	attachOfflinePersistence(queryClient);
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
