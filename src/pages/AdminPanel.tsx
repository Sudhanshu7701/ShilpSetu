import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users, ShieldCheck, Package, ShoppingBag, BarChart3,
  CheckCircle, XCircle, TrendingUp, FileText, Eye, Clock, Crown, Zap, MessageSquare,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

interface ProfileRow {
  user_id: string;
  full_name: string;
  region: string | null;
  is_verified: boolean | null;
  avatar_url: string | null;
  specialties: string[] | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface VerificationRow {
  id: string;
  artisan_id: string;
  document_type: string;
  document_url: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  artisan_name?: string;
  artisan_avatar?: string | null;
}

interface CustomerRow {
  user_id: string;
  full_name: string;
  region: string | null;
  avatar_url: string | null;
  created_at: string;
  email?: string;
  subscription_tier?: string;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const COLORS = ["hsl(0, 45%, 33%)", "hsl(40, 58%, 55%)", "hsl(220, 28%, 22%)", "hsl(30, 20%, 90%)", "hsl(0, 84%, 60%)", "hsl(40, 60%, 75%)", "hsl(220, 25%, 35%)"];

const TIER_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  free: { label: "Free", icon: MessageSquare, color: "bg-muted text-muted-foreground" },
  normal: { label: "Plus", icon: Zap, color: "bg-primary/20 text-primary" },
  premium: { label: "Pro", icon: Crown, color: "bg-secondary/20 text-secondary" },
};

const AdminPanel = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [artisans, setArtisans] = useState<ProfileRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [stats, setStats] = useState({ users: 0, artisans: 0, products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [reviewingDoc, setReviewingDoc] = useState<VerificationRow | null>(null);
  const [docSignedUrl, setDocSignedUrl] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [updatingTier, setUpdatingTier] = useState<string | null>(null);

  useEffect(() => { if (user && role === "admin") fetchData(); }, [user, role]);

  const fetchData = async () => {
    setLoading(true);
    const { data: roleData } = await supabase.from("user_roles").select("user_id").eq("role", "artisan");
    const artisanIds = roleData?.map((r) => r.user_id) || [];

    if (artisanIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", artisanIds).order("created_at", { ascending: false });
      if (profiles) setArtisans(profiles);
    }

    const [usersRes, productsRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id, total_amount, status, created_at"),
    ]);

    const allOrders = ordersRes.data || [];
    setOrders(allOrders);
    setStats({
      users: usersRes.count || 0, artisans: artisanIds.length,
      products: productsRes.count || 0, orders: allOrders.length,
      revenue: allOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
    });

    // Fetch verification requests & customers
    await Promise.all([
      fetchVerificationRequests(artisanIds),
      fetchCustomers(),
    ]);

    setLoading(false);
  };

  const fetchCustomers = async () => {
    // Get all customer role users
    const { data: customerRoles } = await supabase.from("user_roles").select("user_id").eq("role", "customer");
    const customerIds = customerRoles?.map((r) => r.user_id) || [];
    if (customerIds.length === 0) { setCustomers([]); return; }

    const [profilesRes, subsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, region, avatar_url, created_at").in("user_id", customerIds),
      supabase.from("subscriptions").select("user_id, tier").in("user_id", customerIds),
    ]);

    const subMap = new Map((subsRes.data || []).map((s) => [s.user_id, s.tier]));
    setCustomers(
      (profilesRes.data || []).map((p) => ({
        ...p,
        subscription_tier: (subMap.get(p.user_id) as string) || "free",
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    );
  };

  const handleGrantSubscription = async (userId: string, newTier: string) => {
    setUpdatingTier(userId);
    const { error } = await supabase.from("subscriptions").upsert({
      user_id: userId,
      tier: newTier as any,
      started_at: new Date().toISOString(),
      expires_at: newTier === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "user_id" });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: `Subscription updated to ${TIER_LABELS[newTier]?.label || newTier}` });
      setCustomers((prev) => prev.map((c) => c.user_id === userId ? { ...c, subscription_tier: newTier } : c));
    }
    setUpdatingTier(null);
  };

  const fetchVerificationRequests = async (artisanIds?: string[]) => {
    const { data: requests } = await supabase
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requests && requests.length > 0) {
      const ids = [...new Set((requests as any[]).map((r) => r.artisan_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      setVerificationRequests((requests as any[]).map((r) => ({
        ...r,
        artisan_name: profileMap.get(r.artisan_id)?.full_name || "Unknown",
        artisan_avatar: profileMap.get(r.artisan_id)?.avatar_url,
      })));
    } else {
      setVerificationRequests([]);
    }
  };

  const openDocReview = async (req: VerificationRow) => {
    setReviewingDoc(req);
    setAdminNotes(req.admin_notes || "");

    // Get signed URL for the document
    const { data } = await supabase.storage
      .from("verification-docs")
      .createSignedUrl(req.document_url, 300); // 5 min
    setDocSignedUrl(data?.signedUrl || null);
  };

  const handleVerificationDecision = async (decision: "approved" | "rejected") => {
    if (!reviewingDoc) return;
    setProcessing(true);

    // Update verification request
    const { error: reqError } = await supabase
      .from("verification_requests")
      .update({
        status: decision,
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user!.id,
      } as any)
      .eq("id", reviewingDoc.id);

    if (reqError) {
      toast({ variant: "destructive", title: "Error", description: reqError.message });
      setProcessing(false);
      return;
    }

    // If approved, set is_verified on profile
    if (decision === "approved") {
      await supabase.from("profiles").update({ is_verified: true }).eq("user_id", reviewingDoc.artisan_id);

      // Send notification to artisan
      await supabase.from("notifications").insert({
        user_id: reviewingDoc.artisan_id,
        title: "Identity Verified! 🎉",
        message: "Congratulations! Your identity has been verified. You can now add products and start selling on LoomLive.",
        type: "verification",
        link: "/dashboard/artisan",
      });
    } else {
      await supabase.from("notifications").insert({
        user_id: reviewingDoc.artisan_id,
        title: "Verification Update",
        message: adminNotes || "Your verification request needs attention. Please resubmit your documents.",
        type: "verification",
        link: "/dashboard/artisan",
      });
    }

    toast({ title: decision === "approved" ? "Artisan verified ✓" : "Verification rejected" });
    setReviewingDoc(null);
    setDocSignedUrl(null);
    setAdminNotes("");
    setProcessing(false);

    // Refresh data
    fetchData();
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_verified: !currentStatus }).eq("user_id", userId);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); }
    else { toast({ title: currentStatus ? "Verification removed" : "Artisan verified ✓" }); setArtisans((prev) => prev.map((a) => (a.user_id === userId ? { ...a, is_verified: !currentStatus } : a))); }
  };

  // Chart data
  const getMonthlyRevenue = () => {
    const monthly: Record<string, number> = {};
    orders.forEach((o) => {
      const month = new Date(o.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      monthly[month] = (monthly[month] || 0) + Number(o.total_amount);
    });
    return Object.entries(monthly).slice(-6).map(([month, revenue]) => ({ month, revenue }));
  };

  const getOrdersByStatus = () => {
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  const getOrdersTrend = () => {
    const daily: Record<string, number> = {};
    orders.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      daily[day] = (daily[day] || 0) + 1;
    });
    return Object.entries(daily).slice(-14).map(([day, count]) => ({ day, count }));
  };

  const pendingVerifications = verificationRequests.filter((r) => r.status === "pending");

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 text-center py-20">
          <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h1 className="font-display text-2xl text-foreground">Admin Access Required</h1>
          <p className="text-sm text-muted-foreground mt-2">You need admin privileges to access this page.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Platform management & analytics</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {[
              { icon: Users, label: "Total Users", value: stats.users, color: "text-primary" },
              { icon: ShieldCheck, label: "Artisans", value: stats.artisans, color: "text-secondary" },
              { icon: Package, label: "Products", value: stats.products, color: "text-primary" },
              { icon: ShoppingBag, label: "Orders", value: stats.orders, color: "text-secondary" },
              { icon: TrendingUp, label: "Revenue", value: formatINR(stats.revenue), color: "text-secondary" },
            ].map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg p-5 border border-border shadow-card">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="verification" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="verification" className="relative">
                Verification
                {pendingVerifications.length > 0 && (
                  <span className="ml-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {pendingVerifications.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="artisans">Artisans</TabsTrigger>
            </TabsList>

            {/* Verification Tab */}
            <TabsContent value="verification" className="space-y-4">
              {verificationRequests.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg text-foreground">No verification requests yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Artisan verification requests will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {verificationRequests.map((req) => (
                    <div key={req.id} className={`bg-card rounded-lg border p-4 flex items-center gap-4 ${req.status === "pending" ? "border-accent/50" : "border-border"}`}>
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                        {req.artisan_avatar ? <img src={req.artisan_avatar} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center font-display font-bold text-sm text-muted-foreground">{req.artisan_name?.[0] || "A"}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{req.artisan_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.document_type.toUpperCase()} · {new Date(req.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <Badge className={`text-xs border-0 shrink-0 ${
                        req.status === "pending" ? "bg-accent/20 text-accent" :
                        req.status === "approved" ? "bg-secondary/20 text-secondary" :
                        "bg-destructive/20 text-destructive"
                      }`}>
                        {req.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {req.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {req.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => openDocReview(req)} className="shrink-0 min-h-[40px]">
                        <Eye className="h-4 w-4 mr-1" /> Review
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Monthly Revenue</h3>
                  {getMonthlyRevenue().length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={getMonthlyRevenue()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 20%, 85%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 15%, 45%)" }} />
                        <YAxis tick={{ fontSize: 12, fill: "hsl(220, 15%, 45%)" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => [formatINR(value), "Revenue"]} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(30, 20%, 85%)", background: "hsl(30, 30%, 97%)" }} />
                        <Bar dataKey="revenue" fill="hsl(40, 58%, 55%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No revenue data yet</div>
                  )}
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Orders Trend (Last 14 Days)</h3>
                  {getOrdersTrend().length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={getOrdersTrend()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 20%, 85%)" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(220, 15%, 45%)" }} />
                        <YAxis tick={{ fontSize: 12, fill: "hsl(220, 15%, 45%)" }} />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(30, 20%, 85%)", background: "hsl(30, 30%, 97%)" }} />
                        <Line type="monotone" dataKey="count" stroke="hsl(0, 45%, 33%)" strokeWidth={2} dot={{ fill: "hsl(0, 45%, 33%)" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No order data yet</div>
                  )}
                </div>

                <div className="bg-card rounded-lg border border-border p-6 lg:col-span-2">
                  <h3 className="font-display font-semibold text-foreground mb-4">Orders by Status</h3>
                  {getOrdersByStatus().length > 0 ? (
                    <div className="flex items-center gap-8">
                      <ResponsiveContainer width="50%" height={250}>
                        <PieChart>
                          <Pie data={getOrdersByStatus()} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                            {getOrdersByStatus().map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(30, 20%, 85%)", background: "hsl(30, 30%, 97%)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2">
                        {getOrdersByStatus().map((s, i) => (
                          <div key={s.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm text-foreground capitalize">{s.name.replace("_", " ")}</span>
                            <span className="text-sm text-muted-foreground">({s.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No order data yet</div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-4">
              {customers.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg text-foreground">No customers registered yet</p>
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Customer</th>
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Region</th>
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Joined</th>
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Subscription</th>
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Change Plan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((c) => {
                          const tierInfo = TIER_LABELS[c.subscription_tier || "free"] || TIER_LABELS.free;
                          const TierIcon = tierInfo.icon;
                          return (
                            <tr key={c.user_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0">
                                    {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                      <div className="w-full h-full flex items-center justify-center font-display font-bold text-sm text-muted-foreground">{c.full_name?.[0] || "?"}</div>}
                                  </div>
                                  <span className="font-medium text-foreground text-sm">{c.full_name || "Unnamed"}</span>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">{c.region || "—"}</td>
                              <td className="p-4 text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                              <td className="p-4">
                                <Badge className={`text-xs border-0 gap-1 ${tierInfo.color}`}>
                                  <TierIcon className="h-3 w-3" />
                                  {tierInfo.label}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Select
                                  value={c.subscription_tier || "free"}
                                  onValueChange={(val) => handleGrantSubscription(c.user_id, val)}
                                  disabled={updatingTier === c.user_id}
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="normal">Plus</SelectItem>
                                    <SelectItem value="premium">Pro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Artisans Tab */}
            <TabsContent value="artisans" className="space-y-4">
              {artisans.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg text-foreground">No artisans registered yet</p>
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Artisan</th>
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Region</th>
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Specialties</th>
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Joined</th>
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                          <th className="text-left text-xs font-medium text-muted-foreground p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {artisans.map((a) => (
                          <tr key={a.user_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0">
                                  {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                    <div className="w-full h-full flex items-center justify-center font-display font-bold text-sm text-muted-foreground">{a.full_name[0]}</div>}
                                </div>
                                <span className="font-medium text-foreground text-sm">{a.full_name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{a.region || "—"}</td>
                            <td className="p-4">
                              <div className="flex gap-1 flex-wrap">
                                {a.specialties?.slice(0, 2).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>) || <span className="text-sm text-muted-foreground">—</span>}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                            <td className="p-4">
                              {a.is_verified ? (
                                <Badge className="bg-secondary/20 text-secondary border-0 text-xs gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground text-xs gap-1"><XCircle className="h-3 w-3" /> Pending</Badge>
                              )}
                            </td>
                            <td className="p-4">
                              <Button size="sm" variant={a.is_verified ? "outline" : "default"} onClick={() => toggleVerification(a.user_id, !!a.is_verified)} className="text-xs">
                                {a.is_verified ? "Revoke" : "Verify"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Review Dialog */}
      <Dialog open={!!reviewingDoc} onOpenChange={(o) => { if (!o) { setReviewingDoc(null); setDocSignedUrl(null); setAdminNotes(""); } }}>
        <DialogContent className="bg-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Review Verification Document</DialogTitle>
          </DialogHeader>
          {reviewingDoc && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                  {reviewingDoc.artisan_avatar ? <img src={reviewingDoc.artisan_avatar} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center font-display font-bold text-sm text-muted-foreground">{reviewingDoc.artisan_name?.[0]}</div>}
                </div>
                <div>
                  <p className="font-medium text-foreground">{reviewingDoc.artisan_name}</p>
                  <p className="text-xs text-muted-foreground">{reviewingDoc.document_type.toUpperCase()} · Submitted {new Date(reviewingDoc.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <Badge className={`ml-auto text-xs border-0 ${
                  reviewingDoc.status === "pending" ? "bg-accent/20 text-accent" :
                  reviewingDoc.status === "approved" ? "bg-secondary/20 text-secondary" :
                  "bg-destructive/20 text-destructive"
                }`}>
                  {reviewingDoc.status.charAt(0).toUpperCase() + reviewingDoc.status.slice(1)}
                </Badge>
              </div>

              {/* Document Preview */}
              <div className="rounded-lg border border-border overflow-hidden bg-muted">
                {docSignedUrl ? (
                  reviewingDoc.document_url.endsWith(".pdf") ? (
                    <div className="p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <a href={docSignedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        Open PDF Document →
                      </a>
                    </div>
                  ) : (
                    <img src={docSignedUrl} alt="Verification document" className="w-full max-h-[400px] object-contain" />
                  )
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">Loading document...</div>
                )}
              </div>

              {/* Admin Notes */}
              {reviewingDoc.status === "pending" && (
                <>
                  <div>
                    <Label>Admin Notes (optional)</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about the verification decision..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleVerificationDecision("approved")}
                      disabled={processing}
                      className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 min-h-[44px]"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Verify
                    </Button>
                    <Button
                      onClick={() => handleVerificationDecision("rejected")}
                      disabled={processing}
                      variant="outline"
                      className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground min-h-[44px]"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </>
              )}

              {reviewingDoc.admin_notes && reviewingDoc.status !== "pending" && (
                <div className="p-3 rounded-md bg-muted/50 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm text-foreground">{reviewingDoc.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminPanel;
