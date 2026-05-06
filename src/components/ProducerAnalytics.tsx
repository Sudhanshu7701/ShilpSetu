import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, IndianRupee, Percent, BarChart3, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from "recharts";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface ProducerAnalyticsProps {
  orders: Order[];
}

const PRODUCER_CUT = 0.92;
const PLATFORM_CUT = 0.08;

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const COLORS = ["hsl(40, 58%, 55%)", "hsl(0, 45%, 33%)", "hsl(220, 28%, 22%)", "hsl(280, 60%, 50%)"];

const ProducerAnalytics = ({ orders }: ProducerAnalyticsProps) => {
  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
    const producerEarnings = totalRevenue * PRODUCER_CUT;
    const platformFees = totalRevenue * PLATFORM_CUT;
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Monthly revenue (last 6 months)
    const monthlyData: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      monthlyData[key] = 0;
    }
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      if (key in monthlyData) monthlyData[key] += Number(o.total_amount) * PRODUCER_CUT;
    });
    const monthlyChart = Object.entries(monthlyData).map(([month, earnings]) => ({ month, earnings: Math.round(earnings) }));

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    const statusChart = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return { totalRevenue, producerEarnings, platformFees, deliveredOrders: deliveredOrders.length, avgOrderValue, monthlyChart, statusChart };
  }, [orders]);

  const stats = [
    { icon: IndianRupee, label: "Your Earnings (92%)", value: formatINR(analytics.producerEarnings), color: "text-secondary" },
    { icon: Percent, label: "Platform Fee (8%)", value: formatINR(analytics.platformFees), color: "text-muted-foreground" },
    { icon: TrendingUp, label: "Avg. Order Value", value: formatINR(analytics.avgOrderValue), color: "text-primary" },
    { icon: BarChart3, label: "Delivered Orders", value: analytics.deliveredOrders.toString(), color: "text-secondary" },
  ];

  return (
    <div className="space-y-6">
      {/* Profit Model Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-secondary/20 to-primary/10 rounded-lg p-5 border border-secondary/30">
        <div className="flex items-center gap-2 mb-2">
          <IndianRupee className="h-5 w-5 text-secondary" />
          <h3 className="font-display font-bold text-foreground text-lg">92% Producer Profit Model</h3>
        </div>
        <p className="text-sm text-muted-foreground">You keep 92% of every sale. Only 8% goes to platform maintenance — no hidden fees, no middlemen.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-lg p-4 border border-border shadow-card">
            <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
            <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Earnings */}
        <div className="bg-card rounded-lg p-5 border border-border shadow-card">
          <h4 className="font-display font-semibold text-foreground mb-4">Monthly Earnings (Your 92%)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.monthlyChart}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220, 15%, 45%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(220, 15%, 45%)" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [formatINR(value), "Earnings"]} />
              <Bar dataKey="earnings" fill="hsl(40, 58%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-card rounded-lg p-5 border border-border shadow-card">
          <h4 className="font-display font-semibold text-foreground mb-4">Order Status Breakdown</h4>
          {analytics.statusChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RPieChart>
                <Pie data={analytics.statusChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {analytics.statusChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No order data yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProducerAnalytics;
