"use client";

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
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getThread } from "@/lib/chat-tree";
import { downloadChat } from "@/lib/download";
import { deleteChat, listChats, loadChat, onChatsChanged, updateChatMeta } from "@/lib/storage";
import type { ChatMetadata } from "@/lib/types";

export function AppSidebar() {
  return <AppSidebarContent />;
}

function AppSidebarContent() {
  const [chats, setChats] = React.useState<ChatMetadata[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentChatId = searchParams.get("id");
  const { setOpenMobile, isMobile } = useSidebar();

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Delete Confirmation State
  const [chatToDelete, setChatToDelete] = React.useState<ChatMetadata | null>(null);

  // Menu State
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  // Rename State
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameName, setRenameName] = React.useState("");

  const filteredChats = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return query ? chats.filter((c) => c.title.toLowerCase().includes(query)) : chats;
  }, [searchQuery, chats]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
      if (e.key === "o" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        router.push("/");
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router]);

  // Load the list, and reload it whenever a chat is saved, changed or deleted.
  React.useEffect(() => {
    const loadChats = () => void listChats().then(setChats);
    loadChats();
    return onChatsChanged(loadChats);
  }, []);

  const handleDeleteClick = (chat: ChatMetadata) => {
    setChatToDelete(chat);
    setActiveMenuId(null);
  };

  const handleRenameClick = (chat: ChatMetadata) => {
    setRenamingId(chat.id);
    setRenameName(chat.title);
    setActiveMenuId(null);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingId && renameName.trim()) {
      void updateChatMeta(renamingId, { title: renameName.trim() });
      setRenamingId(null);
    }
  };

  const handlePinClick = (chat: ChatMetadata) => {
    void updateChatMeta(chat.id, { isPinned: !chat.isPinned });
    setActiveMenuId(null);
  };

  const handleDownloadClick = async (chat: ChatMetadata) => {
    setActiveMenuId(null);
    const loaded = await loadChat(chat.id);
    if (loaded) {
      downloadChat(loaded.meta.title, getThread(loaded.data.messages, loaded.data.leafId));
    }
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      void deleteChat(chatToDelete.id);
      if (currentChatId === chatToDelete.id) {
        router.push("/");
      }
      setChatToDelete(null);
    }
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between px-2 py-4 group-data-[collapsible=icon]:justify-center">
        <SidebarTrigger className="ml-1 h-10 w-10 text-foreground group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:ml-0 hover:bg-muted [&_svg]:size-5" />
      </SidebarHeader>

      <SidebarContent className="mt-2 px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarActionButton
                  onClick={() => {
                    router.push("/");
                    if (isMobile) setOpenMobile(false);
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
                <SidebarMenuItem className="mb-2 px-2 group-data-[collapsible=icon]:hidden">
                  <div className="text-xs font-semibold tracking-wider text-muted-foreground/60 uppercase">
                    Recent
                  </div>
                </SidebarMenuItem>
                {chats.map((chat) => (
                  <SidebarMenuItem key={chat.id} className="group/item">
                    <Link
                      href={`/?id=${chat.id}`}
                      className="group/link relative block"
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      {renamingId === chat.id ? (
                        <form
                          onSubmit={handleRenameSubmit}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-8 flex-1"
                        >
                          <input
                            autoFocus
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                            onBlur={() => setRenamingId(null)}
                            className="h-8 w-full rounded border border-input bg-transparent px-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                          />
                        </form>
                      ) : (
                        <SidebarMenuButton
                          className="h-8 truncate px-2 py-2 pr-8 text-sm font-normal transition-all duration-200 group-data-[collapsible=icon]:hidden hover:bg-black/5 data-[active=true]:bg-black/5 dark:hover:bg-white/5 dark:data-[active=true]:bg-white/10"
                          isActive={currentChatId === chat.id}
                          tooltip={chat.title}
                        >
                          <span className="truncate">{chat.title}</span>
                        </SidebarMenuButton>
                      )}

                      <div className="absolute top-1/2 right-2 z-10 grid -translate-y-1/2 place-items-center">
                        {/* Pinned Icon (Visible when pinned and menu not active, hidden on group hover) */}
                        {chat.isPinned && activeMenuId !== chat.id && (
                          <div className="col-start-1 row-start-1 text-muted-foreground/70 group-hover/link:hidden">
                            <Pin className="h-3.5 w-3.5 rotate-45" />
                          </div>
                        )}

                        {/* Menu Button (Visible on group hover or when menu active) */}
                        <DropdownMenu
                          onOpenChange={(open) => setActiveMenuId(open ? chat.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`col-start-1 row-start-1 p-0 text-muted-foreground/70 transition-colors outline-none hover:text-foreground ${activeMenuId === chat.id ? "pointer-events-auto text-foreground opacity-100" : "pointer-events-none opacity-0 group-hover/link:pointer-events-auto group-hover/link:opacity-100"}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameClick(chat);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinClick(chat);
                              }}
                            >
                              {chat.isPinned ? (
                                <>
                                  <PinOff className="mr-2 h-4 w-4" />
                                  <span>Unpin</span>
                                </>
                              ) : (
                                <>
                                  <Pin className="mr-2 h-4 w-4" />
                                  <span>Pin chat</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDownloadClick(chat);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              <span>Download</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(chat);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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
            if (e.target === e.currentTarget) setIsSearchOpen(false);
          }}
        >
          <div className="fixed top-1/2 left-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 animate-in rounded-xl border bg-card p-0 shadow-2xl duration-200 fade-in-0 zoom-in-95">
            {/* Search Input Header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                className="flex-1 border-none bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsSearchOpen(false);
                }}
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="mr-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                  ESC
                </span>
                <X className="inline-block h-4 w-4" />
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {/* New Chat Option */}
              <button
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                onClick={() => {
                  router.push("/");
                  setIsSearchOpen(false);
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted group-hover:bg-background">
                  <SquarePen className="h-4 w-4" />
                </div>
                <span className="font-medium">New chat</span>
              </button>

              {filteredChats.length > 0 && (
                <div className="mt-2 mb-1 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  History
                </div>
              )}

              {filteredChats.length === 0 && searchQuery && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {`No results found for "${searchQuery}"`}
                </div>
              )}

              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                  onClick={() => {
                    router.push(`/?id=${chat.id}`);
                    setIsSearchOpen(false);
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted/50 group-hover:bg-background">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{chat.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/5 p-4 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setChatToDelete(null);
          }}
        >
          <div className="w-full max-w-sm animate-in space-y-4 rounded-xl border bg-card p-6 shadow-2xl duration-200 fade-in-0 zoom-in-95">
            <div className="space-y-2">
              <h3 className="text-lg leading-none font-semibold tracking-tight">Delete chat?</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete <strong>{chatToDelete.title}</strong>.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setChatToDelete(null)}
                className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="text-destructive-foreground rounded-md bg-destructive px-4 py-2 text-sm font-medium transition-colors hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}

interface SidebarActionButtonProps extends React.ComponentProps<typeof SidebarMenuButton> {
  icon: React.ElementType;
  label: string;
  tooltip?: string;
}

function SidebarActionButton({ icon: Icon, label, tooltip, ...props }: SidebarActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarMenuButton
          className="h-10 w-full rounded-xl bg-transparent px-4 font-normal transition-all duration-200 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
          {...props}
        >
          <Icon className="h-5 w-5" />
          <span className="group-data-[collapsible=icon]:hidden">{label}</span>
        </SidebarMenuButton>
      </TooltipTrigger>
      {tooltip && <TooltipContent side="right">{tooltip}</TooltipContent>}
    </Tooltip>
  );
}
