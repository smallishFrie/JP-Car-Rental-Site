"use client";

import { useEffect, useMemo, useState } from "react";
import { BookingRecord } from "@/lib/booking-model";
import { CarRecord } from "@/lib/cars";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Props = {
  bookings: BookingRecord[];
  cars: CarRecord[];
};

type ChartTheme = {
  text: string;
  textMuted: string;
  border: string;
  surface: string;
  accent: string;
  positive: string;
  negative: string;
};

const FALLBACK_THEME: ChartTheme = {
  text: "#1d1d1f",
  textMuted: "#6e6e73",
  border: "rgba(0, 0, 0, 0.12)",
  surface: "#ffffff",
  accent: "#0066cc",
  positive: "#34c759",
  negative: "#ff453a",
};

function readChartTheme(): ChartTheme {
  if (typeof window === "undefined") {
    return FALLBACK_THEME;
  }
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

  return {
    text: read("--text", FALLBACK_THEME.text),
    textMuted: read("--text-muted", FALLBACK_THEME.textMuted),
    border: read("--border-strong", FALLBACK_THEME.border),
    surface: read("--bg-elevated", FALLBACK_THEME.surface),
    accent: read("--accent", FALLBACK_THEME.accent),
    positive: "#34c759",
    negative: "#ff453a",
  };
}

function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK_THEME);

  useEffect(() => {
    setTheme(readChartTheme());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setTheme(readChartTheme());
    mq.addEventListener("change", update);

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });

    return () => {
      mq.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  return theme;
}

function formatCurrency(amount: number): string {
  return `\u20B1${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function AdminAnalytics({ bookings, cars }: Props) {
  const theme = useChartTheme();

  const kpis = useMemo(() => {
    let revenue = 0;
    let monthRevenue = 0;
    let activeUpcoming = 0;
    let cancellations = 0;
    const bookedCarIds = new Set<string>();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    for (const booking of bookings) {
      const total = Number(booking.total_price || 0);
      const isRevenue = booking.payment_status === "paid" && booking.status !== "canceled";

      if (isRevenue) {
        revenue += total;
        const created = new Date(booking.created_at).getTime();
        if (created >= monthStart) {
          monthRevenue += total;
        }
      }
      if (booking.status === "active" || booking.status === "upcoming") {
        activeUpcoming++;
        if (booking.car_id) {
          bookedCarIds.add(booking.car_id);
        }
      }
      if (booking.status === "canceled" || booking.status === "cancel_requested") {
        cancellations++;
      }
    }

    const totalDecisions = bookings.filter((b) => b.status !== "pending").length;
    const cancellationRate = totalDecisions > 0 ? (cancellations / totalDecisions) * 100 : 0;
    const availableCars = Math.max(0, cars.length - bookedCarIds.size);

    return {
      revenue,
      monthRevenue,
      activeUpcoming,
      cancellations,
      cancellationRate,
      availableCars,
      bookedCarsCount: bookedCarIds.size,
      totalCars: cars.length,
      totalBookings: bookings.length,
    };
  }, [bookings, cars]);

  const revenueData = useMemo(() => {
    const buckets = new Map<string, { date: string; sortKey: number; amount: number; bookings: number }>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        sortKey: d.getTime(),
        amount: 0,
        bookings: 0,
      });
    }
    for (const booking of bookings) {
      if (booking.payment_status !== "paid" || booking.status === "canceled") continue;
      const key = new Date(booking.created_at).toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.amount += Number(booking.total_price || 0);
      bucket.bookings++;
    }
    return Array.from(buckets.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [bookings]);

  const popularCarsData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const booking of bookings) {
      if (booking.car_id && booking.status !== "canceled") {
        counts[booking.car_id] = (counts[booking.car_id] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([carId, count]) => {
        const car = cars.find((c) => c.id === carId);
        return {
          name: car?.name || "Removed vehicle",
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [bookings, cars]);

  const fleetStatusData = useMemo(() => {
    return [
      { name: "Available", value: kpis.availableCars },
      { name: "Booked", value: kpis.bookedCarsCount },
    ];
  }, [kpis]);

  const tooltipContentStyle = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    color: theme.text,
  };
  const tooltipLabelStyle = { color: theme.text };
  const tooltipItemStyle = { color: theme.text };

  return (
    <div className="admin-analytics">
      <div className="admin-kpi-grid">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(kpis.revenue)}
          sublabel={`${formatCurrency(kpis.monthRevenue)} this month`}
        />
        <KpiCard
          label="Active & Upcoming"
          value={String(kpis.activeUpcoming)}
          sublabel={`${kpis.totalBookings} all-time bookings`}
        />
        <KpiCard
          label="Fleet Availability"
          value={`${kpis.availableCars} / ${kpis.totalCars}`}
          sublabel={`${kpis.bookedCarsCount} cars currently booked`}
        />
        <KpiCard
          label="Cancellations"
          value={String(kpis.cancellations)}
          sublabel={`${kpis.cancellationRate.toFixed(1)}% of resolved bookings`}
        />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card admin-chart-card-wide">
          <header className="admin-chart-header">
            <h3>Revenue (last 30 days)</h3>
            <p>Paid, non-canceled bookings.</p>
          </header>
          <div className="admin-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={theme.border} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: theme.textMuted, fontSize: 12 }}
                  stroke={theme.border}
                />
                <YAxis
                  tick={{ fill: theme.textMuted, fontSize: 12 }}
                  stroke={theme.border}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                  width={70}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  cursor={{ stroke: theme.accent, strokeOpacity: 0.2 }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={theme.accent}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: theme.accent, stroke: theme.surface, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-chart-card">
          <header className="admin-chart-header">
            <h3>Most popular cars</h3>
            <p>Top 5 by total bookings.</p>
          </header>
          <div className="admin-chart-body">
            {popularCarsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={popularCarsData}
                  layout="vertical"
                  margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid stroke={theme.border} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fill: theme.textMuted, fontSize: 12 }}
                    stroke={theme.border}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: theme.textMuted, fontSize: 12 }}
                    stroke={theme.border}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={{ fill: theme.accent, fillOpacity: 0.08 }}
                  />
                  <Bar dataKey="count" fill={theme.accent} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="admin-chart-empty">No bookings yet.</p>
            )}
          </div>
        </div>

        <div className="admin-chart-card">
          <header className="admin-chart-header">
            <h3>Fleet availability</h3>
            <p>Right now across the active fleet.</p>
          </header>
          <div className="admin-chart-body">
            {kpis.totalCars > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke={theme.surface}
                    strokeWidth={2}
                  >
                    <Cell fill={theme.positive} />
                    <Cell fill={theme.negative} />
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ color: theme.textMuted, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="admin-chart-empty">No cars in the fleet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="admin-kpi-card">
      <p className="admin-kpi-label">{label}</p>
      <p className="admin-kpi-value">{value}</p>
      {sublabel ? <p className="admin-kpi-sublabel">{sublabel}</p> : null}
    </div>
  );
}
