"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

type LeaveRequest = {
    id: string;
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
};

const typeColors: Record<string, string> = {
    ANNUAL: "bg-primary text-primary-foreground",
    SICK: "bg-destructive text-destructive-foreground",
    MATERNITY: "bg-blue-500 text-white",
    PATERNITY: "bg-blue-400 text-white",
    UNPAID: "bg-muted text-muted-foreground",
    COMPASSIONATE: "bg-amber-500 text-white",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function LeaveCalendar({ requests }: { requests: LeaveRequest[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const approvedRequests = requests.filter((r) => r.status === "APPROVED" || r.status === "PENDING");

    function getRequestsForDate(date: number) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
        return approvedRequests.filter((r) => r.startDate <= dateStr && r.endDate >= dateStr);
    }

    function prevMonth() {
        setCurrentDate(new Date(year, month - 1, 1));
    }

    function nextMonth() {
        setCurrentDate(new Date(year, month + 1, 1));
    }

    const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const cells = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        cells.push(<div key={`empty-${i}`} className="min-h-[80px] border-t border-l p-1" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dayRequests = getRequestsForDate(d);
        const isToday =
            d === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();
        cells.push(
            <div key={d} className={`min-h-[80px] border-t border-l p-1 ${isToday ? "bg-primary/5" : ""}`}>
                <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {d}
                </span>
                <div className="space-y-0.5 mt-0.5">
                    {dayRequests.slice(0, 3).map((r) => (
                        <div
                            key={r.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${typeColors[r.type] || "bg-muted text-muted-foreground"} ${r.status === "PENDING" ? "opacity-60" : ""}`}
                            title={`${r.employeeName} — ${r.type}${r.status === "PENDING" ? " (pending)" : ""}`}
                        >
                            {r.employeeName.split(" ")[0]}
                        </div>
                    ))}
                    {dayRequests.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{dayRequests.length - 3} more</div>
                    )}
                </div>
            </div>,
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Leave Calendar</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={prevMonth}>
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm font-medium w-36 text-center">{monthLabel}</span>
                        <Button size="icon" variant="ghost" onClick={nextMonth}>
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(typeColors).map(([type, color]) => (
                        <Badge key={type} className={`${color} text-[10px]`}>{type}</Badge>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 border-r border-b">
                    {DAYS.map((day) => (
                        <div key={day} className="border-t border-l p-1 text-center text-xs font-medium text-muted-foreground bg-muted/30">
                            {day}
                        </div>
                    ))}
                    {cells}
                </div>
            </CardContent>
        </Card>
    );
}
