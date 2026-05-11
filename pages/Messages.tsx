import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, MessageCircle, Crown } from "lucide-react";

interface Conversation {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  last_message: string;
  last_at: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean | null;
  created_at: string;
}

// Per-order message limits by tier
const ORDER_MSG_LIMITS: Record<string, number> = { free: 3, normal: 20, premium: Infinity };
// Character limits by tier (0 = unlimited)
const CHAR_LIMITS: Record<string, number> = { free: 0, normal: 200, premium: 0 };

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const { tier } = useSubscription();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const orderMsgLimit = ORDER_MSG_LIMITS[tier] || 3;
  const charLimit = CHAR_LIMITS[tier] || 0;

  // Count messages sent by the current user in this conversation (per-order context)
  const sentCount = messages.filter((m) => m.sender_id === user?.id).length;
  const isLimited = sentCount >= orderMsgLimit && tier !== "premium";
  const remainingMsgs = Math.max(0, orderMsgLimit - sentCount);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => { if (user) fetchConversations(); }, [user]);

  useEffect(() => {
    if (selectedUser && user) {
      fetchMessages(selectedUser);
      markAsRead(selectedUser);
      const channel = supabase
        .channel(`messages-${selectedUser}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          const msg = payload.new as Message;
          if ((msg.sender_id === user.id && msg.receiver_id === selectedUser) || (msg.sender_id === selectedUser && msg.receiver_id === user.id)) {
            setMessages((prev) => [...prev, msg]);
            if (msg.sender_id === selectedUser) markAsRead(selectedUser);
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedUser, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchConversations = async () => {
    const { data: msgs } = await supabase
      .from("messages").select("*")
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
      .order("created_at", { ascending: false });
    if (!msgs) return;
    const convMap = new Map<string, { last_message: string; last_at: string; unread: number }>();
    msgs.forEach((m) => {
      const otherId = m.sender_id === user!.id ? m.receiver_id : m.sender_id;
      if (!convMap.has(otherId)) convMap.set(otherId, { last_message: m.content, last_at: m.created_at, unread: 0 });
      if (m.receiver_id === user!.id && !m.is_read) convMap.get(otherId)!.unread++;
    });
    const otherIds = Array.from(convMap.keys());
    if (otherIds.length === 0) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", otherIds);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    const convos: Conversation[] = otherIds.map((id) => {
      const c = convMap.get(id)!;
      const p = profileMap.get(id);
      return { user_id: id, full_name: p?.full_name || "User", avatar_url: p?.avatar_url || null, ...c };
    });
    setConversations(convos.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()));
  };

  const fetchMessages = async (otherId: string) => {
    const { data } = await supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user!.id})`)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const markAsRead = async (otherId: string) => {
    await supabase.from("messages").update({ is_read: true }).eq("sender_id", otherId).eq("receiver_id", user!.id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Enforce character limit for Plus tier
    if (charLimit > 0 && value.length > charLimit) return;
    setNewMessage(value);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;
    if (isLimited) return;

    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: selectedUser, content: newMessage.trim() });
    setNewMessage("");
    fetchConversations();
  };

  const selectConvo = (c: Conversation) => { setSelectedUser(c.user_id); setSelectedConvo(c); };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString("en-IN", { weekday: "short" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 h-screen flex">
        {/* Conversation List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col ${selectedUser ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-display text-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1">Message an artisan from their product page to start a conversation.</p>
              </div>
            ) : conversations.map((c) => (
              <button key={c.user_id} onClick={() => selectConvo(c)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left ${selectedUser === c.user_id ? "bg-muted/50" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                  {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center font-display font-bold text-muted-foreground">{c.full_name[0]}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm truncate">{c.full_name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(c.last_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{c.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedUser ? "flex" : "hidden md:flex"}`}>
          {selectedUser && selectedConvo ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
                <button onClick={() => { setSelectedUser(null); setSelectedConvo(null); }} className="md:hidden text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                  {selectedConvo.avatar_url ? <img src={selectedConvo.avatar_url} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center font-display font-bold text-xs text-muted-foreground">{selectedConvo.full_name[0]}</div>}
                </div>
                <span className="font-medium text-foreground text-sm">{selectedConvo.full_name}</span>
                {tier !== "premium" && (
                  <Badge variant="outline" className="ml-auto text-[10px] border-primary text-primary">
                    {remainingMsgs} msg{remainingMsgs !== 1 ? "s" : ""} left
                  </Badge>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const isMine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                        {m.image_url && <img src={m.image_url} alt="" className="rounded-lg mb-2 max-w-[200px]" />}
                        <p>{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatTime(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input with limit warning */}
              {isLimited ? (
                <div className="p-4 border-t border-border bg-card text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    You've used all {orderMsgLimit} messages for this conversation.
                  </p>
                  <Link to="/plans">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Crown className="h-3.5 w-3.5 mr-1" /> Upgrade Plan
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={sendMessage} className="p-4 border-t border-border bg-card">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder={charLimit > 0 ? `Type a message (max ${charLimit} chars)...` : "Type a message..."}
                        className="flex-1 pr-16"
                      />
                      {charLimit > 0 && (
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${newMessage.length >= charLimit ? "text-destructive" : "text-muted-foreground"}`}>
                          {newMessage.length}/{charLimit}
                        </span>
                      )}
                    </div>
                    <Button type="submit" size="icon" disabled={!newMessage.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <div>
                <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-display text-lg text-foreground">Select a conversation</p>
                <p className="text-sm text-muted-foreground mt-1">Choose from your existing conversations or start a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
