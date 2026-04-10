"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";

type PayrollData = {
    period: string;
    gross: number;
    net: number;
    tax: number;
    employees: number;
};

type ChartItem = { name: string; value: number };

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function fmtGHS(n: number) {
    if (n >= 1000) return `GHS ${(n / 1000).toFixed(0)}k`;
    return `GHS ${n.toFixed(0)}`;
}

export function PayrollChart({ data }: { data: PayrollData[] }) {
    if (data.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payroll Trends</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={fmtGHS} tick={{ fontSize: 12 }} />
                        <Tooltip
                            formatter={(value) => `GHS ${Number(value).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`}
                        />
                        <Legend />
                        <Bar dataKey="gross" name="Gross Pay" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="net" name="Net Pay" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="tax" name="PAYE Tax" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function LeaveTypeChart({ data }: { data: ChartItem[] }) {
    if (data.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leave by Type</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                        >
                            {data.map((_, i) => (
                                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
