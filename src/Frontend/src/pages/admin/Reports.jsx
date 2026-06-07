import React, { useState, useEffect } from 'react';
import { 
  Card, CardBody, Button, Input, 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Select, SelectItem, Tabs, Tab, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Spinner
} from '@heroui/react';
import { 
  FileText, Download, Filter, Search, Calendar, 
  Activity, Users, FileCheck, AlertCircle, MoreVertical,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

import { adminDashboardApiServices } from '../../services/Admin/AdminDashboardApi';
import { teamLeaderApiServices } from '../../services/TeamLeader/TeamLeaderApi';

const statusColorMap = {
  "Approved": "success",
  "Pending": "warning",
  "Reviewed": "primary",
  "Rejected": "danger",
};

const healthColorMap = {
  "Stable": "success",
  "Critical": "danger",
  "Observation": "warning",
  "Improving": "primary"
};

export default function Reports() {
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [activitySummary, setActivitySummary] = useState({
    totalReports: 0,
    reportsToday: 0,
    pendingNotifications: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch Dashboard stats to get System Statistics
      const dashboardRes = await adminDashboardApiServices.getDashboardData();
      if (dashboardRes.data && dashboardRes.data.succeeded) {
        const stats = dashboardRes.data.data.statistics;
        setActivitySummary({
          totalReports: stats.totalReports || stats.TotalReports || 0,
          reportsToday: stats.reportsToday || stats.ReportsToday || 0,
          pendingNotifications: stats.pendingNotifications || stats.PendingNotifications || 0, 
          activeUsers: stats.activeUsers || stats.ActiveUsers || 0
        });
      }

      // Fetch Approval History
      let historyReports = [];
      try {
        const reportsRes = await teamLeaderApiServices.getApprovalHistory();
        if (reportsRes.data && reportsRes.data.succeeded) {
          historyReports = Array.isArray(reportsRes.data.data) ? reportsRes.data.data : [];
        }
      } catch(e) { console.error("Error fetching history:", e); }

      // Fetch Pending Reports
      let pendingReports = [];
      try {
        const pendingRes = await teamLeaderApiServices.getPendingReports();
        if (pendingRes.data && pendingRes.data.succeeded) {
          const payload = pendingRes.data.data;
          pendingReports = Array.isArray(payload) ? payload : (payload.items || payload.data || []);
        }
      } catch(e) { console.error("Error fetching pending:", e); }

      // Combine both lists
      const allReportsRaw = [...pendingReports, ...historyReports];

      // Map DTO to our UI format
      const mappedReports = allReportsRaw.map((r) => {
        const rawId = r.id || r.Id || r.reportId || r.ReportId;
        const rawDate = r.reportDate || r.ReportDate;
        const status = r.status || r.Status || r.approvalStatus || r.ApprovalStatus || "Pending";
        
        return {
          id: `REP-${rawId}`,
          date: rawDate?.split('T')[0] || rawDate || "Unknown Date",
          elderly: r.elderlyName || r.ElderlyName,
          caregiver: r.employeeName || r.EmployeeName,
          approvedBy: r.approvedBy || r.ApprovedBy || r.approvedByName || r.ApprovedByName || "Pending",
          approvedDate: (r.approvedDate || r.ApprovedDate) ? (r.approvedDate || r.ApprovedDate).split('T')[0] : "-",
          status: status
        };
      });
      setReports(mappedReports);
    } catch (error) {
      console.error("Failed to fetch reports data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.elderly.toLowerCase().includes(filterValue.toLowerCase()) || 
                          report.caregiver.toLowerCase().includes(filterValue.toLowerCase()) ||
                          report.id.toLowerCase().includes(filterValue.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    // Logic to export data
    alert("Exporting reports to CSV...");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" label="Loading Reports & Analytics..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <FileText className="w-8 h-8" />
            </div>
            System Reports & Analytics
          </h1>
          <p className="text-gray-500 mt-1 ml-1">Comprehensive overview of operational and clinical data</p>
        </div>
        <div className="flex gap-3">
          <Button 
            color="primary" 
            startContent={<Download className="w-4 h-4" />}
            onPress={handleExport}
            className="shadow-md shadow-blue-500/20"
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-5 flex flex-row items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Total Reports Submitted</p>
              <p className="text-3xl font-bold text-gray-900">{activitySummary.totalReports}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <FileCheck className="w-6 h-6" />
            </div>
          </CardBody>
          <div className="px-5 pb-4 flex items-center text-sm">
            <ArrowUpRight className="w-4 h-4 text-success mr-1" />
            <span className="text-success font-medium">+12%</span>
            <span className="text-gray-400 ml-2">vs last week</span>
          </div>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-5 flex flex-row items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Reports Today</p>
              <p className="text-3xl font-bold text-gray-900">{activitySummary.reportsToday}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
              <Activity className="w-6 h-6" />
            </div>
          </CardBody>
          <div className="px-5 pb-4 flex items-center text-sm">
            <ArrowUpRight className="w-4 h-4 text-success mr-1" />
            <span className="text-success font-medium">+5%</span>
            <span className="text-gray-400 ml-2">vs last week</span>
          </div>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-5 flex flex-row items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Pending Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{activitySummary.pendingNotifications}</p>
            </div>
            <div className="w-12 h-12 bg-danger-50 rounded-full flex items-center justify-center text-danger-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardBody>
          <div className="px-5 pb-4 flex items-center text-sm">
            <ArrowDownRight className="w-4 h-4 text-success mr-1" />
            <span className="text-success font-medium">-2</span>
            <span className="text-gray-400 ml-2">vs last week</span>
          </div>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-5 flex flex-row items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">{activitySummary.activeUsers}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
          </CardBody>
          <div className="px-5 pb-4 flex items-center text-sm">
            <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
              Optimal
            </span>
            <span className="text-gray-400 ml-2">coverage</span>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-sm">
        <CardBody className="p-6">
          <div className="mb-6 flex items-center space-x-2 text-blue-600">
            <FileText className="w-5 h-5" />
            <h2 className="text-xl font-bold">Clinical Reports</h2>
          </div>
          {/* Table Filters */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                  <Input
                    isClearable
                    className="w-full md:max-w-[400px]"
                    placeholder="Search by ID, Resident, or Caregiver..."
                    startContent={<Search className="text-gray-400 w-4 h-4" />}
                    value={filterValue}
                    onValueChange={setFilterValue}
                    variant="bordered"
                  />
                  <div className="flex gap-3 w-full md:w-auto">
                    <Select 
                      className="w-full md:w-48"
                      variant="bordered"
                      placeholder="Status"
                      startContent={<Filter className="w-4 h-4 text-gray-400" />}
                      selectedKeys={[statusFilter]}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <SelectItem key="all" value="all">All Statuses</SelectItem>
                      <SelectItem key="approved" value="Approved">Approved</SelectItem>
                      <SelectItem key="pending" value="Pending">Pending</SelectItem>
                      <SelectItem key="rejected" value="Rejected">Rejected</SelectItem>
                    </Select>
                  </div>
                </div>

                {/* Reports Table */}
                <Table 
                  aria-label="Clinical Reports Table"
                  classNames={{
                    wrapper: "shadow-none border border-gray-100 rounded-xl p-0",
                    th: "bg-gray-50 text-gray-600 font-semibold text-sm py-4",
                    td: "py-4 border-b border-gray-50"
                  }}
                >
                  <TableHeader>
                    <TableColumn>REPORT ID</TableColumn>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>RESIDENT</TableColumn>
                    <TableColumn>CAREGIVER</TableColumn>
                    <TableColumn>REVIEWED BY</TableColumn>
                    <TableColumn>REVIEW DATE</TableColumn>
                    <TableColumn>APPROVAL STATUS</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No reports found matching your criteria.">
                    {filteredReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-900">{report.id}</TableCell>
                        <TableCell className="text-gray-600">{report.date}</TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{report.elderly}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-600">{report.caregiver}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-600">{report.approvedBy}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-600 font-mono text-sm">{report.approvedDate}</div>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" color={statusColorMap[report.status] || "default"} variant="flat" className="font-medium">
                            {report.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
        </CardBody>
      </Card>

    </div>
  );
}
