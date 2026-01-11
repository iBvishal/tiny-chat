"use client"

import * as React from "react"
import {
    Search,
    SquarePen,
    MessageSquareDashed,
    Trash2,
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
import { getChatHistory, deleteChat, ChatMetadata } from "@/lib/storage"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

export function AppSidebar() {
    const [chats, setChats] = React.useState<ChatMetadata[]>([])
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentChatId = searchParams.get("id")

    const loadChats = React.useCallback(() => {
        setChats(getChatHistory())
    }, [])

    React.useEffect(() => {
        loadChats()
        window.addEventListener("chats_updated", loadChats)
        return () => window.removeEventListener("chats_updated", loadChats)
    }, [loadChats])

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.preventDefault()
        e.stopPropagation()
        deleteChat(id)
        if (currentChatId === id) {
            router.push("/")
        }
    }

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="p-4 flex flex-row items-center justify-between">
                <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:bg-sidebar-accent" />
                <div className="group-data-[collapsible=icon]:hidden">
                    <SidebarMenuButton size="default" tooltip="Search" className="h-8 w-8 p-0 flex items-center justify-center transition-colors hover:bg-sidebar-accent">
                        <Search className="h-5 w-5" />
                    </SidebarMenuButton>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2 mt-2">
                <SidebarGroup className="p-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem className="flex items-center gap-2">
                                <Link href="/" className="flex-1">
                                    <SidebarMenuButton
                                        className="w-full bg-muted/40 hover:bg-muted/60 h-10 px-4 rounded-xl transition-all duration-200 font-medium border border-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent hover:scale-[1.02] active:scale-[0.98]"
                                        tooltip="New chat"
                                        isActive={!currentChatId}
                                    >
                                        <SquarePen className="h-5 w-5" />
                                        <span className="group-data-[collapsible=icon]:hidden">New chat</span>
                                    </SidebarMenuButton>
                                </Link>
                                <div className="group-data-[collapsible=icon]:hidden">
                                    <SidebarMenuButton
                                        size="default"
                                        className="h-10 w-10 border border-muted-foreground/20 rounded-xl flex items-center justify-center p-0 transition-all duration-200 hover:bg-muted/80 hover:scale-[1.05] active:scale-[0.95]"
                                        tooltip="Temporary chat"
                                    >
                                        <MessageSquareDashed className="h-5 w-5" />
                                    </SidebarMenuButton>
                                </div>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {chats.length > 0 && (
                    <SidebarGroup className="mt-8">
                        <SidebarGroupContent>
                            <SidebarMenu className="space-y-0.5">
                                <SidebarMenuItem className="group-data-[collapsible=icon]:hidden px-2 mb-2">
                                    <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                        Recent
                                    </div>
                                </SidebarMenuItem>
                                {chats.map((chat) => (
                                    <SidebarMenuItem key={chat.id} className="group/item">
                                        <Link href={`/?id=${chat.id}`} className="relative block">
                                            <SidebarMenuButton
                                                className="text-sm font-normal py-2 h-auto truncate transition-colors hover:bg-muted/50 group-data-[collapsible=icon]:hidden px-2 pr-8"
                                                isActive={currentChatId === chat.id}
                                                tooltip={chat.title}
                                            >
                                                <span className="truncate">{chat.title}</span>
                                            </SidebarMenuButton>
                                            <button
                                                onClick={(e) => handleDelete(e, chat.id)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1 hover:bg-muted rounded-md transition-all text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </Link>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
        </Sidebar>
    )
}
