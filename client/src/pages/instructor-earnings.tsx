import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import type { Lesson, Payment } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

export default function InstructorEarningsPage() {
  const { isAuthenticated } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  // Fetch instructor's lessons
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/instructor/lessons"],
    enabled: isAuthenticated,
  });

  // Fetch instructor's payments/earnings
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<
    Payment[]
  >({
    queryKey: ["/api/instructor/earnings"],
    enabled: isAuthenticated,
  });

  // Mock hourly rate - in real implementation this would come from instructor profile
  const hourlyRate = 45;

  const calculateEarnings = (period: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (period) {
      case "week":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay()
        );
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(parseInt(selectedYear), 0, 1);
        endDate = new Date(parseInt(selectedYear), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const completedLessons = lessons.filter((lesson) => {
      if (lesson.status !== "completed" || !lesson.scheduledAt) return false;
      const lessonDate = new Date(lesson.scheduledAt);
      return lessonDate >= startDate && lessonDate <= endDate;
    });

    const totalHours = completedLessons.reduce(
      (sum, lesson) => sum + (lesson.duration || 60) / 60,
      0
    );
    const totalEarnings = totalHours * hourlyRate;

    return {
      totalEarnings,
      totalHours,
      totalLessons: completedLessons.length,
      averagePerLesson:
        completedLessons.length > 0
          ? totalEarnings / completedLessons.length
          : 0,
    };
  };

  const getMonthlyEarnings = () => {
    const monthlyData = [];
    const currentYear = parseInt(selectedYear);

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0);

      const monthLessons = lessons.filter((lesson) => {
        if (lesson.status !== "completed" || !lesson.scheduledAt) return false;
        const lessonDate = new Date(lesson.scheduledAt);
        return lessonDate >= startDate && lessonDate <= endDate;
      });

      const totalHours = monthLessons.reduce(
        (sum, lesson) => sum + (lesson.duration || 60) / 60,
        0
      );
      const earnings = totalHours * hourlyRate;

      monthlyData.push({
        month: startDate.toLocaleDateString("en-US", { month: "short" }),
        earnings,
        hours: totalHours,
        lessons: monthLessons.length,
      });
    }

    return monthlyData;
  };

  const getRecentPayments = () => {
    return payments
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 10);
  };

  const getTotalEarningsAllTime = () => {
    return payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  };

  const getPendingEarnings = () => {
    return payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  };

  if (lessonsLoading || paymentsLoading) {
    return <div className="p-8">Loading earnings data...</div>;
  }

  const currentEarnings = calculateEarnings(selectedPeriod);
  const monthlyData = getMonthlyEarnings();
  const recentPayments = getRecentPayments();
  const totalEarnings = getTotalEarningsAllTime();
  const pendingEarnings = getPendingEarnings();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Earnings</h1>
        <p className="text-muted-foreground">
          Track your income and lesson statistics
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-4 mb-8">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        {selectedPeriod === "year" && (
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedPeriod === "week"
                ? "This Week"
                : selectedPeriod === "month"
                ? "This Month"
                : `Year ${selectedYear}`}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${currentEarnings.totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentEarnings.totalHours.toFixed(1)} hours •{" "}
              {currentEarnings.totalLessons} lessons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pendingEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${hourlyRate}</div>
            <p className="text-xs text-muted-foreground">Per hour</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Lessons This Week</span>
                    <span className="font-medium">
                      {calculateEarnings("week").totalLessons}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hours This Week</span>
                    <span className="font-medium">
                      {calculateEarnings("week").totalHours.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Week Earnings</span>
                    <span className="font-medium">
                      ${calculateEarnings("week").totalEarnings.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average per Lesson</span>
                    <span className="font-medium">
                      ${currentEarnings.averagePerLesson.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lesson Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Completed</span>
                    <span className="font-medium">
                      {lessons.filter((l) => l.status === "completed").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Scheduled</span>
                    <span className="font-medium">
                      {lessons.filter((l) => l.status === "scheduled").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-medium">
                      {lessons.length > 0
                        ? Math.round(
                            (lessons.filter((l) => l.status === "completed")
                              .length /
                              lessons.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Duration</span>
                    <span className="font-medium">
                      {lessons.length > 0
                        ? Math.round(
                            lessons.reduce(
                              (sum, l) => sum + (l.duration || 60),
                              0
                            ) / lessons.length
                          )
                        : 60}{" "}
                      min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {month.month}
                      </TableCell>
                      <TableCell>{month.lessons}</TableCell>
                      <TableCell>{month.hours.toFixed(1)}</TableCell>
                      <TableCell className="font-medium">
                        ${month.earnings.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="font-bold">
                      {monthlyData.reduce((sum, m) => sum + m.lessons, 0)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {monthlyData
                        .reduce((sum, m) => sum + m.hours, 0)
                        .toFixed(1)}
                    </TableCell>
                    <TableCell className="font-bold">
                      $
                      {monthlyData
                        .reduce((sum, m) => sum + m.earnings, 0)
                        .toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.createdAt
                          ? new Date(payment.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.paymentMethod?.replace("_", " ") || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "paid" ? "default" : "outline"
                          }
                          className="flex items-center gap-1 w-fit"
                        >
                          {payment.status === "paid" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {payment.description || "Lesson payment"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
