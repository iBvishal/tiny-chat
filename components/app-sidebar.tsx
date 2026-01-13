"use client"

import * as React from "react"
import {
    Search,
    SquarePen,
    MessageSquareDashed,
    Trash2,
    MessageSquare,
    X,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getChatHistory, deleteChat, ChatMetadata } from "@/lib/storage"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

export function AppSidebar() {
    const [chats, setChats] = React.useState<ChatMetadata[]>([])
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentChatId = searchParams.get("id")

    const [isSearchOpen, setIsSearchOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [filteredChats, setFilteredChats] = React.useState<ChatMetadata[]>([])

    // Delete Confirmation State
    const [chatToDelete, setChatToDelete] = React.useState<ChatMetadata | null>(null)

    const loadChats = React.useCallback(() => {
        setChats(getChatHistory())
    }, [])

    React.useEffect(() => {
        if (searchQuery.trim()) {
            setFilteredChats(chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())))
        } else {
            setFilteredChats(chats)
        }
    }, [searchQuery, chats])

    // Handle keyboard shortcuts
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsSearchOpen((open) => !open)
            }
            if (e.key === "o" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
                e.preventDefault()
                router.push("/")
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [router])

    React.useEffect(() => {
        loadChats()
        window.addEventListener("chats_updated", loadChats)
        return () => window.removeEventListener("chats_updated", loadChats)
    }, [loadChats])

    const handleDeleteClick = (e: React.MouseEvent, chat: ChatMetadata) => {
        e.preventDefault()
        e.stopPropagation()
        setChatToDelete(chat)
    }

    const confirmDelete = () => {
        if (chatToDelete) {
            deleteChat(chatToDelete.id)
            if (currentChatId === chatToDelete.id) {
                router.push("/")
            }
            setChatToDelete(null)
        }
    }

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="px-2 py-4 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
                <SidebarTrigger className="h-10 w-10 text-foreground hover:bg-muted [&_svg]:size-5 ml-1 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:mx-auto" />
                <div className="group-data-[collapsible=icon]:hidden">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SidebarMenuButton
                                size="default"
                                className="h-10 w-10 p-0 flex items-center justify-center transition-colors hover:bg-muted"
                                onClick={() => setIsSearchOpen(true)}
                            >
                                <Search className="h-5 w-5" />
                            </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">Search (Cmd+K)</TooltipContent>
                    </Tooltip>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2 mt-2">
                <SidebarGroup className="p-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem className="flex items-center gap-2">
                                <Link href="/" className="flex-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton
                                                className="w-full bg-transparent hover:bg-black/5 dark:hover:bg-white/5 h-10 px-4 rounded-xl transition-all duration-200 font-normal group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:text-foreground"
                                                isActive={!currentChatId}
                                            >
                                                <SquarePen className="h-5 w-5" />
                                                <span className="group-data-[collapsible=icon]:hidden">New chat</span>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">New chat (Shift+Cmd+O)</TooltipContent>
                                    </Tooltip>
                                </Link>

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
                                                className="text-sm font-normal py-2 h-8 truncate transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 group-data-[collapsible=icon]:hidden px-2 pr-8 data-[active=true]:bg-black/5 dark:data-[active=true]:bg-white/10"
                                                isActive={currentChatId === chat.id}
                                                tooltip={chat.title}
                                            >
                                                <span className="truncate">{chat.title}</span>
                                            </SidebarMenuButton>

                                            {/* Gradient fade for delete button area */}
                                            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-sidebar via-sidebar/80 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none rounded-r-md" />

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, chat)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-all text-muted-foreground/70 hover:text-destructive z-10"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">Delete chat</TooltipContent>
                                            </Tooltip>
                                        </Link>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            {/* Search Modal */}
            {isSearchOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/5 backdrop-blur-[2px]"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsSearchOpen(false)
                    }}
                >
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border rounded-xl shadow-2xl p-0 animate-in fade-in-0 zoom-in-95 duration-200">
                        {/* Search Input Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/50"
                                placeholder="Search chats..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setIsSearchOpen(false)
                                }}
                            />
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <span className="text-xs px-1.5 py-0.5 rounded border bg-muted font-mono mr-1">ESC</span>
                                <X className="h-4 w-4 inline-block" />
                            </button>
                        </div>

                        {/* Search Results */}
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {/* New Chat Option */}
                            <button
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left group"
                                onClick={() => {
                                    router.push("/")
                                    setIsSearchOpen(false)
                                }}
                            >
                                <div className="h-8 w-8 rounded-full bg-muted group-hover:bg-background border flex items-center justify-center">
                                    <SquarePen className="h-4 w-4" />
                                </div>
                                <span className="font-medium">New chat</span>
                            </button>

                            {filteredChats.length > 0 && (
                                <div className="mt-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    History
                                </div>
                            )}

                            {filteredChats.length === 0 && searchQuery && (
                                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                                    No results found for "{searchQuery}"
                                </div>
                            )}


                            {filteredChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left group"
                                    onClick={() => {
                                        router.push(`/?id=${chat.id}`)
                                        setIsSearchOpen(false)
                                    }}
                                >
                                    <div className="h-8 w-8 rounded-full bg-muted/50 group-hover:bg-background border flex items-center justify-center shrink-0">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{chat.title}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {new Date(chat.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {chatToDelete && (
                <div
                    className="fixed inset-0 z-[60] bg-black/5 backdrop-blur-[2px] flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setChatToDelete(null)
                    }}
                >
                    <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in-0 zoom-in-95 duration-200 space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg leading-none tracking-tight">Delete chat?</h3>
                            <p className="text-sm text-muted-foreground">
                                This will permanently delete <strong>{chatToDelete.title}</strong>.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setChatToDelete(null)}
                                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Sidebar>
    )
}
