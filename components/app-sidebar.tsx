"use client"

import * as React from "react"
import {
    Search,
    SquarePen,
    Trash2,
    MessageSquare,
    X,
    MoreHorizontal,
    Pencil,
    Pin,
    PinOff,
    Download,
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
    useSidebar,
} from "@/components/ui/sidebar"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getChatHistory, deleteChat, updateChatMetadata, getChatMessages } from "@/lib/storage"
import type { ChatMetadata } from "@/lib/types"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

export function AppSidebar() {
    return (
        <AppSidebarContent />
    )
}

function AppSidebarContent() {

    const [chats, setChats] = React.useState<ChatMetadata[]>([])
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentChatId = searchParams.get("id")
    const { setOpenMobile, isMobile } = useSidebar()

    const [isSearchOpen, setIsSearchOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [filteredChats, setFilteredChats] = React.useState<ChatMetadata[]>([])

    // Delete Confirmation State
    const [chatToDelete, setChatToDelete] = React.useState<ChatMetadata | null>(null)

    // Menu State
    const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null)

    // Rename State
    const [renamingId, setRenamingId] = React.useState<string | null>(null)
    const [renameName, setRenameName] = React.useState("")

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

    const handleDeleteClick = (chat: ChatMetadata) => {
        setChatToDelete(chat)
        setActiveMenuId(null)
    }

    const handleRenameClick = (chat: ChatMetadata) => {
        setRenamingId(chat.id)
        setRenameName(chat.title)
        setActiveMenuId(null)
    }

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (renamingId && renameName.trim()) {
            updateChatMetadata(renamingId, { title: renameName.trim() })
            setRenamingId(null)
        }
    }

    const handlePinClick = (chat: ChatMetadata) => {
        updateChatMetadata(chat.id, { isPinned: !chat.isPinned })
        setActiveMenuId(null)
    }

    const handleDownloadClick = (chat: ChatMetadata) => {
        const messages = getChatMessages(chat.id)
        if (messages.length === 0) return

        const chatContent = messages
            .map(msg => `${msg.role.toUpperCase()}:\n${msg.content}\n\n---\n\n`)
            .join("")

        const blob = new Blob([chatContent], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        a.download = `tiny-chat-${chat.title}-${timestamp}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setActiveMenuId(null)
    }

    // Close menu on click outside (handled by DropdownMenu now)


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
            </SidebarHeader>

            <SidebarContent className="px-2 mt-2">
                <SidebarGroup className="p-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarActionButton
                                    onClick={() => {
                                        router.push("/")
                                        if (isMobile) setOpenMobile(false)
                                    }}
                                    icon={SquarePen}
                                    label="New chat"
                                    tooltip="New chat (Shift+Cmd+O)"
                                    isActive={!currentChatId}
                                />
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarActionButton
                                    onClick={() => setIsSearchOpen(true)}
                                    icon={Search}
                                    label="Search chats"
                                    tooltip="Search (Cmd+K)"
                                />
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
                                        <Link
                                            href={`/?id=${chat.id}`}
                                            className="relative block group/link"
                                            onClick={() => {
                                                if (isMobile) setOpenMobile(false)
                                            }}
                                        >
                                            {renamingId === chat.id ? (
                                                <form
                                                    onSubmit={handleRenameSubmit}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 mr-8"
                                                >
                                                    <input
                                                        autoFocus
                                                        value={renameName}
                                                        onChange={(e) => setRenameName(e.target.value)}
                                                        onBlur={() => setRenamingId(null)}
                                                        className="w-full h-8 text-sm bg-transparent border border-input rounded px-2 outline-none focus:ring-1 focus:ring-ring text-foreground"
                                                    />
                                                </form>
                                            ) : (
                                                <SidebarMenuButton
                                                    className="text-sm font-normal py-2 h-8 truncate transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 group-data-[collapsible=icon]:hidden px-2 pr-8 data-[active=true]:bg-black/5 dark:data-[active=true]:bg-white/10"
                                                    isActive={currentChatId === chat.id}
                                                    tooltip={chat.title}
                                                >
                                                    <span className="truncate">{chat.title}</span>
                                                </SidebarMenuButton>
                                            )}



                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid place-items-center">
                                                {/* Pinned Icon (Visible when pinned and menu not active, hidden on group hover) */}
                                                {chat.isPinned && activeMenuId !== chat.id && (
                                                    <div className="group-hover/link:hidden text-muted-foreground/70 col-start-1 row-start-1">
                                                        <Pin className="h-3.5 w-3.5 rotate-45" />
                                                    </div>
                                                )}

                                                {/* Menu Button (Visible on group hover or when menu active) */}
                                                <DropdownMenu onOpenChange={(open) => setActiveMenuId(open ? chat.id : null)}>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            className={`col-start-1 row-start-1 p-0 hover:text-foreground transition-colors text-muted-foreground/70 outline-none ${activeMenuId === chat.id ? "opacity-100 text-foreground pointer-events-auto" : "opacity-0 pointer-events-none group-hover/link:opacity-100 group-hover/link:pointer-events-auto"}`}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-48">
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleRenameClick(chat)
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            <span>Rename</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handlePinClick(chat)
                                                            }}
                                                        >
                                                            {chat.isPinned ? (
                                                                <>
                                                                    <PinOff className="h-4 w-4 mr-2" />
                                                                    <span>Unpin</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Pin className="h-4 w-4 mr-2" />
                                                                    <span>Pin chat</span>
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDownloadClick(chat)
                                                            }}
                                                        >
                                                            <Download className="h-4 w-4 mr-2" />
                                                            <span>Download</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteClick(chat)
                                                            }}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </Link>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            {/* Context Menu Portal (Removed - using DropdownMenu) */}

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
                                    if (isMobile) setOpenMobile(false)
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
                                    {`No results found for "${searchQuery}"`}
                                </div>
                            )}


                            {filteredChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left group"
                                    onClick={() => {
                                        router.push(`/?id=${chat.id}`)
                                        setIsSearchOpen(false)
                                        if (isMobile) setOpenMobile(false)
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

interface SidebarActionButtonProps extends React.ComponentProps<typeof SidebarMenuButton> {
    icon: React.ElementType
    label: string
    tooltip?: string
}

function SidebarActionButton({ icon: Icon, label, tooltip, ...props }: SidebarActionButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <SidebarMenuButton
                    className="w-full bg-transparent hover:bg-black/5 dark:hover:bg-white/5 h-10 px-4 rounded-xl transition-all duration-200 font-normal group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:text-foreground"
                    {...props}
                >
                    <Icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{label}</span>
                </SidebarMenuButton>
            </TooltipTrigger>
            {tooltip && <TooltipContent side="right">{tooltip}</TooltipContent>}
        </Tooltip>
    )
}
