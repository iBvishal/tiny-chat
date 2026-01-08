"use client"

import * as React from "react"
import {
    Search,
    SquarePen,
    MessageSquareDashed,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupContent,
    SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppSidebar() {
    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="p-4 flex flex-row items-center justify-between">
                <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:bg-sidebar-accent" />
                <div className="group-data-[collapsible=icon]:hidden">
                    <SidebarMenuButton size="default" tooltip="Search" className="h-8 w-8 p-0 flex items-center justify-center">
                        <Search className="h-5 w-5" />
                    </SidebarMenuButton>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-4 mt-2">
                <SidebarGroup className="p-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem className="flex items-center gap-2">
                                <SidebarMenuButton
                                    className="flex-1 bg-muted/40 hover:bg-muted/60 h-10 px-4 rounded-xl transition-colors font-medium border border-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent"
                                    tooltip="New chat"
                                >
                                    <SquarePen className="h-5 w-5" />
                                    <span className="group-data-[collapsible=icon]:hidden">New chat</span>
                                </SidebarMenuButton>
                                <div className="group-data-[collapsible=icon]:hidden">
                                    <SidebarMenuButton
                                        size="default"
                                        className="h-10 w-10 border border-muted-foreground/20 rounded-xl flex items-center justify-center p-0"
                                        tooltip="Temporary chat"
                                    >
                                        <MessageSquareDashed className="h-5 w-5" />
                                    </SidebarMenuButton>
                                </div>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
