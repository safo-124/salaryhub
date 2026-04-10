"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#06b6d4"];


export function TenantGrowthChart({ data }: { data: { month: string; tenants: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="tenants" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function EmployeeGrowthChart({ data }: { data: { month: string; employees: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip />
                <Line type="monotone" dataKey="employees" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function RevenueByPlanChart({ data }: { data: { plan: string; revenue: number; count: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="plan" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip formatter={(value) => `GHS ${Number(value).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function StatusDistributionChart({ data }: { data: { status: string; count: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                    label={({ name, value }) => `${name} (${value})`}
                >
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
