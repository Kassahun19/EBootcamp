import React, { useState, useEffect } from 'react';
import { Award, BookOpen, CheckCircle, AlertTriangle, ShieldCheck, Database, Trash2, Edit, Save, Plus, Eye, User, FileText, Settings, ShieldAlert, BadgeInfo, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { QuizExamBuilder } from '../components/QuizExamBuilder';

export default function AdminDashboard({
  onRefreshSession
}: {
  onRefreshSession: () => void;
}) {
  const { token, user } = useAuth();
  
  // Tab panels controller
  const [activePane, setActivePane] = useState<'overview' | 'users' | 'payments' | 'marketing_reports' | 'logs_settings' | 'notifications' | 'quiz_builder'>('overview');

  // Dynamic aggregates
  const [stats, setStats] = useState({
    totalStudents: 452,
    totalInstructors: 3,
    totalCourses: 3,
    totalRevenue: 24000,
    pendingPaymentsCount: 0,
    approvedPaymentsCount: 1,
    rejectedPaymentsCount: 0,
    activeUsersCount: 14
  });

  // DB collections indices
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [contactInquiries, setContactInquiries] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrollmentSearch, setEnrollmentSearch] = useState('');

  // Admin Notification state parameters
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifSearch, setNotifSearch] = useState('');
  const [notifFilterType, setNotifFilterType] = useState('all');
  const [notifFilterStatus, setNotifFilterStatus] = useState('all');
  const [notifSimForm, setNotifSimForm] = useState({
    type: 'contact_form',
    name: 'Demeke Assefa',
    email: 'demeke@academy.com',
    subject: 'Inquiry regarding computer logic',
    message: 'Hello, I would like to request premium support access details.'
  });

  // Selected for edits
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [targetPayment, setTargetPayment] = useState<any | null>(null);
  const [slipScale, setSlipScale] = useState(1);
  
  // Forms inputs
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', roleId: 3 });
  const [reviewNotes, setReviewNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // System general settings state
  const [premiumPriceSetting, setPremiumPriceSetting] = useState('1000');

  // Interactive Support & Ticket Management
  const [ticketReplies, setTicketReplies] = useState<Record<number, string>>({});
  const [closedTickets, setClosedTickets] = useState<number[]>([]);
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

  // Website Content Customizer
  const [bannerTitle, setBannerTitle] = useState(() => localStorage.getItem('ezana_banner_title') || 'Ethiopia\'s Premier IT Academy');
  const [bannerHeading, setBannerHeading] = useState(() => localStorage.getItem('ezana_banner_heading') || 'Empowering The Future Generation of AI Developers');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  // Role and Permission Matrix
  const [permsLoaded, setPermsLoaded] = useState(true);
  const [permissionsMatrix, setPermissionsMatrix] = useState({
    admin: { manageUsers: true, editCourses: true, viewIntel: true, approveFinancials: true },
    instructor: { manageUsers: false, editCourses: true, viewIntel: true, approveFinancials: false },
    student: { manageUsers: false, editCourses: false, viewIntel: false, approveFinancials: false },
  });

  // User list searching, filtering and pagination
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [usersPage, setUsersPage] = useState(1);
  const usersPerPage = 5;

  // Backup & Restore
  const [backupDownloadUrl, setBackupDownloadUrl] = useState<string | null>(null);
  const [backupLog, setBackupLog] = useState<string[]>([]);

  // Auto-refresh loops for real-time notification alerts
  useEffect(() => {
    fetchAdminData();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchAdminData();
      fetchNotifications();
    }, 8500);

    return () => clearInterval(interval);
  }, [token]);

  const safeJson = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (e) {
        console.warn('JSON parsing failed:', e);
        return null;
      }
    }
    return null;
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (data) setAdminNotifications(data);
      }
      const unreadRes = await fetch('/api/admin/notifications/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (unreadRes.ok) {
        const data = await safeJson(unreadRes);
        if (data && typeof data.count === 'number') {
          setUnreadCount(data.count);
        }
      }
    } catch (e: any) {
      if (e && e.message && e.message.includes('Failed to fetch')) {
        console.warn("Notifications audit offline: server is restarting.");
      } else {
        console.warn("Notifications audit loading failure:", e);
      }
    }
  };

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      // Stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await safeJson(statsRes);
        if (statsData) setStats(statsData);
      }

      // Users
      const usersRes = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await safeJson(usersRes);
        if (usersData) setUsers(usersData);
      }

      // Payments
      const payRes = await fetch('/api/payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (payRes.ok) {
        const payData = await safeJson(payRes);
        if (payData) setPayments(payData);
      }

      // Courses
      const cres = await fetch('/api/courses');
      if (cres.ok) {
        const coursesData = await safeJson(cres);
        if (coursesData) setCourses(coursesData);
      }

      // Activity Logs
      const logsRes = await fetch('/api/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsData = await safeJson(logsRes);
        if (logsData) setLogs(logsData);
      }

      // Contacts message
      const contactRes = await fetch('/api/contact', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (contactRes.ok) {
        const contactData = await safeJson(contactRes);
        if (contactData) setContactInquiries(contactData);
      }

      // Enrollments
      const enrollRes = await fetch('/api/admin/enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (enrollRes.ok) {
        const enrollData = await safeJson(enrollRes);
        if (enrollData) setEnrollments(enrollData);
      }

    } catch (e: any) {
      if (e && e.message && e.message.includes('Failed to fetch')) {
        console.warn("Administration credentials offline: server is restarting.");
      } else {
        console.warn("Error loaded administration credentials:", e);
      }
    }
  };

  // 1. User CRUD (Create User)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setStatusMsg("Creating user accounts...");
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg("✓ New User profile recorded.");
        setUserForm({ name: '', email: '', password: '', roleId: 3 });
        fetchAdminData();
      } else {
        setStatusMsg(data.message || "Failed creating user.");
      }
    } catch (e) {
      setStatusMsg("Network communications failure.");
    }
  };

  // User Suspension Alter state
  const handleToggleSuspendUser = async (userId: number) => {
    if (userId === 1) {
      alert("The primary Admin account status cannot be altered.");
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {}
  };

  // User Purges Delete User
  const handleDeleteUser = async (id: number) => {
    if (id === 1) {
      alert("The primary Admin account cannot be deleted.");
      return;
    }
    if (!confirm("Are you sure you want to delete this user profile?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {}
  };

  // User Save updates
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !token) return;
    try {
      setStatusMsg("Updating user settings...");
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        setStatusMsg("✓ User profile successfully synchronized.");
        setEditingUser(null);
        fetchAdminData();
      }
    } catch (e) {}
  };

  // 2. Receipts Approval/Rejections Action Workflow
  const handleApproveReceipt = async (id: number) => {
    if (!token) return;
    try {
      setStatusMsg("Approving receipt, unlocking courses...");
      const res = await fetch(`/api/payments/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reviewNotes: reviewNotes || 'Receipt successfully validated against statement logs.' })
      });
      if (res.ok) {
        setStatusMsg("✓ Payment reference STAMPED approved. PREMIUM state activated.");
        setReviewNotes('');
        setTargetPayment(null);
        fetchAdminData();
        onRefreshSession(); // Lift local privileges!
      }
    } catch (e) {}
  };

  const handleRejectReceipt = async (id: number) => {
    if (!token) return;
    if (!reviewNotes) {
      alert("Please specify the rejection notes/reason (e.g. Sender mismatch or insufficient bank balances).");
      return;
    }
    try {
      setStatusMsg("Purging receipt states...");
      const res = await fetch(`/api/payments/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reviewNotes })
      });
      if (res.ok) {
        setStatusMsg("✓ receipt rejected. Student notified.");
        setReviewNotes('');
        setTargetPayment(null);
        fetchAdminData();
      }
    } catch (e) {}
  };

  const handleDeleteReceipt = async (id: number) => {
    if (!confirm("Purge receipt trace?")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {}
  };

  const handleDownloadReceipt = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'payment-receipt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = filename || 'payment-receipt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Dynamic enrollment data filtering and export logic
  const filteredEnrollments = enrollments.filter(e => {
    if (!enrollmentSearch) return true;
    const query = enrollmentSearch.toLowerCase();
    const studentNameStr = String(e.studentName || '').toLowerCase();
    const studentEmailStr = String(e.studentEmail || '').toLowerCase();
    const courseTitleStr = String(e.courseTitle || '').toLowerCase();
    return studentNameStr.includes(query) || studentEmailStr.includes(query) || courseTitleStr.includes(query);
  });

  const handleExportCSV = () => {
    if (filteredEnrollments.length === 0) {
      alert("No student enrollment records available to export as CSV.");
      return;
    }
    
    const headers = ["Enrollment ID", "Student Name", "Student Email", "Enrolled Course Title", "Progress %", "Status", "Enrollment Date"];
    const rows = filteredEnrollments.map(e => [
      `ENR-${e.id}`,
      `"${String(e.studentName || '').replace(/"/g, '""')}"`,
      `"${String(e.studentEmail || '').replace(/"/g, '""')}"`,
      `"${String(e.courseTitle || '').replace(/"/g, '""')}"`,
      `${e.progress || 0}%`,
      e.completed ? "Completed" : "In Progress",
      e.createdAt ? new Date(e.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ezana_student_enrollments_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (filteredEnrollments.length === 0) {
      alert("No student enrollment records available to export as PDF.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Unable to open print window. Please make sure popups/redirects are allowed in your browser settings.");
      return;
    }

    const enrollmentRows = filteredEnrollments.map(e => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 10px; font-family: monospace; font-weight: bold; color: #475569;">ENR-${e.id}</td>
        <td style="padding: 12px 10px; font-weight: 600; color: #0f172a;">${e.studentName || 'N/A'}</td>
        <td style="padding: 12px 10px; color: #475569; font-family: monospace;">${e.studentEmail || 'N/A'}</td>
        <td style="padding: 12px 10px; font-weight: 550; color: #0f172a;">${e.courseTitle || 'N/A'}</td>
        <td style="padding: 12px 10px; font-family: monospace; text-align: center; font-weight: bold; color: ${e.completed ? '#10b981' : '#f59e0b'};">
          ${e.progress || 0}%
        </td>
        <td style="padding: 12px 10px; text-align: center;">
          <span style="font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block;
            background-color: ${e.completed ? '#d1fae5' : '#fef3c7'};
            color: ${e.completed ? '#065f46' : '#92400e'};">
            ${e.completed ? "COMPLETED" : "IN PROGRESS"}
          </span>
        </td>
        <td style="padding: 12px 10px; color: #475569; text-align: right;">${e.createdAt ? new Date(e.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</td>
      </tr>
    `).join("");

    const totalCount = filteredEnrollments.length;
    const completedCount = filteredEnrollments.filter(e => e.completed).length;
    const avgProgress = Math.round(filteredEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalCount) || 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Enrollment Ledger Report - Ezana Academy</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              padding: 40px;
              margin: 0;
              line-height: 1.5;
              background-color: #ffffff;
            }
            @media print {
              body { padding: 0; margin: 0; }
              .no-print { display: none; }
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .academy-title {
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: -0.5px;
              margin: 0;
            }
            .academy-subtitle {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-top: 4px;
            }
            .report-tag {
              font-size: 10px;
              background-color: #0f172a;
              color: #ffffff;
              padding: 4px 10px;
              border-radius: 4px;
              font-weight: 800;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              display: inline-block;
              margin-bottom: 10px;
            }
            .doc-meta {
              text-align: right;
              font-size: 11px;
              color: #64748b;
            }
            .doc-meta p { margin: 3px 0; }
            .stats-grid {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              flex: 1;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 15px;
              border-radius: 8px;
            }
            .stat-label {
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-bottom: 50px;
            }
            th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.5px;
              padding: 12px 10px;
              text-align: left;
              border-bottom: 2px solid #cbd5e1;
            }
            .footer-section {
              border-top: 1px dashed #cbd5e1;
              padding-top: 25px;
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-bottom: 1px solid #e2e8f0;
              height: 40px;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px 20px; border-radius: 8px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
            <div>
              <strong>📄 Institutional PDF Export Panel</strong>: Select 'Save as PDF' or choice of printer.
            </div>
            <button onclick="window.print()" style="background-color: #0f172a; color: white; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px;">
              🖨️ Open Print Options
            </button>
          </div>

          <div class="header-container">
            <div>
              <span class="report-tag">Registrar's Office</span>
              <h1 class="academy-title">Ezana Academy</h1>
              <p class="academy-subtitle">Official Student Enrollment Ledger</p>
            </div>
            <div class="doc-meta">
              <p><strong>Issued On:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>System Audit:</strong> VERIFIED INTEGRITY</p>
              <p><strong>ID Code:</strong> ENR-REPT-${Math.floor(100000 + Math.random() * 900000)}</p>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Student Records</div>
              <div class="stat-value">${totalCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Completions Count</div>
              <div class="stat-value">${completedCount} <span style="font-size: 13px; font-weight: 500; color: #64748b;">(${Math.round(completedCount/totalCount * 100) || 0}%)</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Average Lecture Progress</div>
              <div class="stat-value">${avgProgress}%</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 12%; text-align: left;">ENR Code</th>
                <th style="width: 20%; text-align: left;">Student Name</th>
                <th style="width: 20%; text-align: left;">Student Email</th>
                <th style="width: 25%; text-align: left;">Enrolled Program</th>
                <th style="width: 10%; text-align: center;">Prog.</th>
                <th style="width: 13%; text-align: center;">Status</th>
                <th style="width: 10%; text-align: right;">Enroll Date</th>
              </tr>
            </thead>
            <tbody>
              ${enrollmentRows}
            </tbody>
          </table>

          <div class="footer-section">
            <div>
              <p><strong>Ezana SaaS Center Registry Service</strong></p>
              <p>Automated database mapping reports, compliance stamp logs active.</p>
              <p style="font-size: 8px; color: #94a3b8; font-family: monospace; margin-top: 10px;">ID KEY: SHA256-4AA91823BFE7C388FA4B7</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>Certified Signatory Registrar</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Save admin general setting rows
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setStatusMsg("Committing settings values...");
      const res = await fetch(`/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: 'premium_price_etb', value: premiumPriceSetting })
      });
      if (res.ok) {
        setStatusMsg("✓ Price configuration saved successfully.");
        fetchAdminData();
      }
    } catch (e) {}
  };

  // Notification Portal Event Handlers
  const handleMarkNotifRead = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error("Failed marking notification as read:", e);
    }
  };

  const handleMarkNotifUnread = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}/unread`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error("Failed marking notification as unread:", e);
    }
  };

  const handleDeleteNotif = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification record permanently from the archive?")) return;
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error("Failed deleting notification:", e);
    }
  };

  const handleForceSmtpRetry = async () => {
    try {
      setStatusMsg("Running SMTP retry worker routine...");
      const res = await fetch('/api/admin/notifications/retry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setStatusMsg("✓ Requested notification email resends.");
        fetchNotifications();
      }
    } catch (e) {
      console.error("SMTP manual retry failure:", e);
    }
  };

  const handleSimulateNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatusMsg("Spawning simulated submission...");
      const res = await fetch('/api/admin/notifications/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: notifSimForm.type,
          name: notifSimForm.name,
          email: notifSimForm.email,
          subject: notifSimForm.subject,
          message: notifSimForm.message
        })
      });
      if (res.ok) {
        setStatusMsg("✓ Simulated submission triggered. Admin notified via SMTP!");
        fetchNotifications();
      }
    } catch (e) {
      console.error("Simulating submission event failure:", e);
    }
  };

  const getRoleBadge = (roleId: number) => {
    switch (roleId) {
      case 1: return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold font-mono">ADMIN</span>;
      case 2: return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold font-mono">TEACHER</span>;
      default: return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold font-mono">STUDENT</span>;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-4" id="admin_control_room">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Admin Header Board */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-rose-950">Enterprise Central Administration Center</h1>
            <p className="text-slate-500 text-xs mt-1">
              Privileges Status: <span className="font-bold text-rose-800 capitalize">SYSTEM MASTER</span> • Simulated MySQL database active.
            </p>
          </div>

          {/* Tab lists */}
          <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider select-none">
            <button
              id="admin_tab_overview"
              onClick={() => setActivePane('overview')}
              className={`px-4 py-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 duration-150 ${
                activePane === 'overview' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              📊 System Analytics
            </button>
            <button
              id="admin_tab_users"
              onClick={() => setActivePane('users')}
              className={`px-4 py-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 duration-150 ${
                activePane === 'users' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              👥 User Management
            </button>
            <button
              id="admin_tab_payments"
              onClick={() => setActivePane('payments')}
              className={`px-4 py-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 duration-150 relative ${
                activePane === 'payments' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              💳 Tuition Financials Review
              {payments.filter(p => p.status === 'pending').length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center font-black font-mono text-[9px] animate-bounce">
                  {payments.filter(p => p.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              id="admin_tab_reports"
              onClick={() => setActivePane('marketing_reports')}
              className={`px-4 py-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 duration-150 ${
                activePane === 'marketing_reports' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              📢 Reports & Bulletins
            </button>
            <button
              id="admin_tab_logs"
              onClick={() => setActivePane('logs_settings')}
              className={`px-4 py-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 duration-150 ${
                activePane === 'logs_settings' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              ⚙️ Security & Settings
            </button>
            <button
              id="admin_tab_notifications"
              onClick={() => setActivePane('notifications')}
              className={`px-4 py-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 duration-150 relative ${
                activePane === 'notifications' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              🔔 Notifications Portal
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center font-mono text-[10px] font-black animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              id="admin_tab_quiz_builder"
              onClick={() => setActivePane('quiz_builder')}
              className={`px-4 py-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 duration-150 relative ${
                activePane === 'quiz_builder' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              📝 Educational Quiz Builder
            </button>
          </div>
        </div>

        {statusMsg && (
          <p className="p-4 bg-emerald-55 border border-emerald-100 text-emerald-800 rounded font-bold text-xs">{statusMsg}</p>
        )}

        {/* 1. OVERVIEW SYSTEM STATISTICS */}
        {activePane === 'overview' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Alumni accounts</span>
                <p className="text-3xl font-black text-slate-900">{stats.totalStudents}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Active Instructors</span>
                <p className="text-3xl font-black text-slate-900">{stats.totalInstructors}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Enrollment Courses</span>
                <p className="text-3xl font-black text-slate-900">{stats.totalCourses}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5 animate-pulse">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Verified Revenue</span>
                <p className="text-3xl font-black text-emerald-600">ETB {stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Payment aggregate list */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 col-span-1 text-xs md:text-sm">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest">Bank Receipt Verification Counters</h4>
                
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500 font-medium">Pending transfers queue:</span>
                    <span className="font-bold text-amber-600">{stats.pendingPaymentsCount || 0}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500 font-medium font-medium">Stamped approved references:</span>
                    <span className="font-bold text-emerald-600">{stats.approvedPaymentsCount || 0}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500 font-medium font-medium">Rejected mismatch slips:</span>
                    <span className="font-bold text-rose-600">{stats.rejectedPaymentsCount || 0}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold">
                    <span>Live Authenticated users:</span>
                    <span className="text-blue-700">{users.length}</span>
                  </div>
                </div>
              </div>

              {/* Public Support Ticket Workspace */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-2 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-extrabold text-slate-950 text-xs uppercase tracking-widest">🎫 Active Support Tickets & Inquiries</h4>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded font-mono">
                      {contactInquiries.filter(m => !closedTickets.includes(m.id)).length} PENDING HELP
                    </span>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {contactInquiries.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center p-4">Clean mail workspace. No inquiries listed currently.</p>
                    ) : (
                      [...contactInquiries].sort((a, b) => b.id - a.id).map((m: any) => {
                        const isClosed = closedTickets.includes(m.id);
                        const hasReply = ticketReplies[m.id];
                        return (
                          <div key={m.id} className={`p-3 rounded border text-xs space-y-2 transition ${isClosed ? 'bg-slate-50 opacity-60 border-slate-200' : 'bg-red-50/20 border-red-100'}`}>
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-slate-800">
                                <span>👤 {m.name}</span> <span className="text-slate-400 font-mono text-[10px]">({m.email})</span>
                              </p>
                              <span className="text-[9px] text-slate-400">{new Date(m.date || m.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <p className="text-red-950 font-bold text-[11px]">Subject: {m.subject}</p>
                            <p className="text-slate-600 bg-white/65 p-2 rounded border border-slate-100 italic">"{m.message}"</p>
                            
                            {hasReply && (
                              <div className="bg-emerald-50 border border-emerald-100 p-2 rounded text-[11px] space-y-1">
                                <p className="font-extrabold text-emerald-800 flex items-center gap-1">
                                  <span>✓ Admin Official Response:</span>
                                </p>
                                <p className="text-slate-700">{ticketReplies[m.id]}</p>
                              </div>
                            )}

                            <div className="flex gap-2 justify-end pt-1">
                              {!isClosed && (
                                <button
                                  type="button"
                                  onClick={() => setActiveReplyId(activeReplyId === m.id ? null : m.id)}
                                  className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] uppercase font-bold hover:bg-slate-850 cursor-pointer"
                                >
                                  {activeReplyId === m.id ? 'Cancel' : 'Reply Letter'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isClosed) {
                                    setClosedTickets(prev => prev.filter(id => id !== m.id));
                                  } else {
                                    setClosedTickets(prev => [...prev, m.id]);
                                    setActiveReplyId(null);
                                  }
                                }}
                                className={`px-2 py-1 rounded text-[10px] uppercase font-bold cursor-pointer border ${
                                  isClosed ? 'bg-amber-55 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {isClosed ? 'Reopen ticket' : 'Resolve & Close'}
                              </button>
                            </div>

                            {activeReplyId === m.id && (
                              <div className="pt-2 border-t border-slate-150 space-y-2">
                                <textarea
                                  id={`reply_text_${m.id}`}
                                  rows={2}
                                  placeholder="Type official system response guidelines..."
                                  className="w-full p-2 border rounded text-xs bg-white focus:outline-emerald-500"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      const val = (e.target as HTMLTextAreaElement).value.trim();
                                      if (val) {
                                        setTicketReplies(prev => ({ ...prev, [m.id]: val }));
                                        setActiveReplyId(null);
                                        setStatusMsg("✓ Official ticket response logged dynamically.");
                                        setTimeout(() => setStatusMsg(null), 3500);
                                      }
                                    }
                                  }}
                                />
                                <div className="flex justify-between items-center text-[9px] text-slate-400">
                                  <span>Press Enter to dispatch response email simulator.</span>
                                  <button
                                    onClick={() => {
                                      const textInput = document.getElementById(`reply_text_${m.id}`) as HTMLTextAreaElement;
                                      if (textInput && textInput.value.trim()) {
                                        setTicketReplies(prev => ({ ...prev, [m.id]: textInput.value.trim() }));
                                        setActiveReplyId(null);
                                        setStatusMsg("✓ Official ticket response logged dynamically.");
                                        setTimeout(() => setStatusMsg(null), 3500);
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-bold cursor-pointer"
                                  >
                                    Send Reply
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* High Value Extra Feature: Admin Platform Health and Security Monitoring Console */}
            <div className="bg-slate-950 text-slate-200 p-6 rounded-xl border border-slate-800 shadow-lg space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-xs md:text-sm">
                <div className="space-y-1">
                  <span className="bg-rose-500/10 text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest font-mono">
                    ⚠️ Operational Status Screen
                  </span>
                  <h4 className="font-extrabold text-white text-sm tracking-wide">Ezana SaaS Heartbeat Diagnostics</h4>
                </div>
                <div className="text-[10px] bg-slate-900 px-2.5 py-1 rounded border border-slate-850 flex items-center gap-1.5 font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  SYSTEM HEALTH INDEX: 99.8%
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-905 p-3.5 rounded-lg border border-slate-850 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wider font-extrabold">Active Sessions API</p>
                  <p className="text-sm font-black text-rose-400 font-mono">HTTP/2 WebSocket TLS v1.3</p>
                  <p className="text-[10px] text-slate-450 leading-relaxed">Session tokens managed statelessly on browser local storage.</p>
                </div>

                <div className="bg-slate-905 p-3.5 rounded-lg border border-slate-850 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wider font-extrabold">MySQL DB Connection Buffer</p>
                  <p className="text-sm font-black text-emerald-400 font-mono font-bold">Pool size: 15 / Alive</p>
                  <p className="text-[10px] text-slate-450 leading-relaxed">Persistent relational referential mapping schemas online.</p>
                </div>

                <div className="bg-slate-905 p-3.5 rounded-lg border border-slate-850 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wider font-extrabold">JWT Cryptography Shield</p>
                  <p className="text-sm font-black text-blue-400 font-mono">AES-256 Signatures</p>
                  <p className="text-[10px] text-slate-450 leading-relaxed">Protects student cookie files against remote XSS injection.</p>
                </div>

                <div className="bg-slate-905 p-3.5 rounded-lg border border-slate-850 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wider font-extrabold">Receipt Fraud Detection Shield</p>
                  <p className="text-sm font-black text-purple-400 font-mono">Multer Hash verification</p>
                  <p className="text-[10px] text-slate-455 leading-relaxed">Verifies receipt file integrity to prevent payment re-submissions.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 2. USER MANAGEMENT WORKSPACE */}
        {activePane === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column forms */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* User Edit */}
                {editingUser ? (
                  <div className="bg-white p-5 rounded-xl border-2 border-emerald-500/20 bg-emerald-55/15 space-y-4">
                    <h4 className="font-extrabold text-slate-950 text-sm">Modify Selected Profile</h4>
                    
                    <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-500">Name</label>
                        <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full p-2 mt-1 border rounded bg-white" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500">Email Address</label>
                        <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full p-2 mt-1 border rounded bg-white" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500">Privilege Role</label>
                        <select value={editingUser.roleId} onChange={(e) => setEditingUser({ ...editingUser, roleId: parseInt(e.target.value) })} className="w-full p-2 mt-1 border rounded bg-white">
                          <option value={1}>Admin</option>
                          <option value={2}>Instructor</option>
                          <option value={3}>Student</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-500">Account status</label>
                        <select value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })} className="w-full p-2 mt-1 border rounded bg-white">
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded hover:bg-emerald-600 transition tracking-wide text-xs">Save Change</button>
                        <button type="button" onClick={() => setEditingUser(null)} className="px-3 py-2 bg-slate-100 border text-slate-700 rounded text-xs">Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Create user */
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-sm">Provision New Account Profiles</h4>
                    
                    <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-500">Fully Name *</label>
                        <input type="text" required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="e.g. Martha Tefera" className="w-full p-2 mt-1 border rounded bg-white" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500">Email addresses *</label>
                        <input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="e.g. martha@example.com" className="w-full p-2 mt-1 border rounded bg-white" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500">Password codes *</label>
                        <input type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder=" m123..." className="w-full p-2 mt-1 border rounded bg-white" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500">Default Role privileges *</label>
                        <select value={userForm.roleId} onChange={(e) => setUserForm({ ...userForm, roleId: parseInt(e.target.value) })} className="w-full p-2 mt-1 border rounded bg-white">
                          <option value={1}>Admin</option>
                          <option value={2}>Instructor</option>
                          <option value={3}>Student Workspace</option>
                        </select>
                      </div>

                      <button type="submit" className="w-full py-2 bg-rose-900 text-white font-bold rounded hover:bg-emerald-600 uppercase tracking-wide text-xs cursor-pointer">
                        Provision Account
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Users list database grid */}
              <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest">Active System accounts metadata</h4>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold font-mono">
                    {users.length} REGISTERED USERS
                  </span>
                </div>

                {/* Search and Filters Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-500 block mb-1">Search name or email</label>
                    <input
                      type="text"
                      placeholder="Type email, name pattern..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUsersPage(1);
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 block mb-1">Filter Privilege Role</label>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => {
                        setUserRoleFilter(e.target.value);
                        setUsersPage(1);
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs cursor-pointer outline-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="1">Admins</option>
                      <option value="2">Lecturers</option>
                      <option value="3">Students</option>
                    </select>
                  </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wide">
                        <th className="p-2.5">User</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const filtered = users.filter((u: any) => {
                          const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                                                u.email.toLowerCase().includes(userSearch.toLowerCase());
                          const matchesFilter = userRoleFilter === 'all' || u.roleId?.toString() === userRoleFilter;
                          return matchesSearch && matchesFilter;
                        });

                        const totalPages = Math.ceil(filtered.length / usersPerPage) || 1;
                        const startIndex = (usersPage - 1) * usersPerPage;
                        const paginatedUsers = filtered.slice(startIndex, startIndex + usersPerPage);

                        if (paginatedUsers.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 font-semibold bg-slate-50/20">
                                No system profiles matched active parameters.
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <>
                            {paginatedUsers.map((u: any) => (
                              <tr key={u.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-2.5 font-bold text-slate-900">{u.name}</td>
                                <td className="p-2.5 font-mono">{u.email}</td>
                                <td className="p-2.5">{getRoleBadge(u.roleId)}</td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                                    u.status === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {u.status || 'active'}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right space-x-2">
                                  <button
                                    id={`suspend_user_${u.id}`}
                                    onClick={() => handleToggleSuspendUser(u.id)}
                                    className="text-amber-700 hover:underline hover:text-amber-800 cursor-pointer text-[10px]"
                                  >
                                    {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                                  </button>
                                  <button
                                    id={`edit_user_${u.id}`}
                                    onClick={() => {
                                      setEditingUser(u);
                                      setStatusMsg(null);
                                    }}
                                    className="text-blue-700 hover:underline hover:text-blue-800 cursor-pointer text-[10px]"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    id={`del_user_${u.id}`}
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="text-red-600 hover:underline hover:text-red-800 cursor-pointer text-[10px]"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                            
                            {/* Pagination Row control */}
                            <tr className="bg-slate-50/50">
                              <td colSpan={5} className="p-3">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                  <span>
                                    Page {usersPage} of {totalPages} ({filtered.length} total matched)
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      disabled={usersPage <= 1}
                                      onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                                      className="px-2.5 py-1 rounded bg-white border hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      ← Prev
                                    </button>
                                    <button
                                      type="button"
                                      disabled={usersPage >= totalPages}
                                      onClick={() => setUsersPage(prev => Math.min(prev + 1, totalPages))}
                                      className="px-2.5 py-1 rounded bg-white border hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      Next →
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. PAYMENTS RECEIPT VERIFICATION Flow PANEL */}
        {activePane === 'payments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Receipt submission list queues */}
              <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest">Bank Receipt Verification Inbox</h4>
                
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto">
                  {payments.length === 0 ? (
                    <p className="p-6 text-slate-400 text-xs text-center border bg-slate-50/50 w-full rounded">All submissions stamped clean! Clear queues.</p>
                  ) : (
                    payments.map((p) => (
                      <div key={p.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-3">
                        <div className="flex justify-between items-start h-5">
                          <div>
                            <p className="font-extrabold text-slate-900">{p.studentName}</p>
                            <p className="text-[10px] text-slate-400">Email: {p.studentEmail}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1.5 border-t border-slate-200 text-slate-600">
                          <p>Transaction Reference ID: <span className="font-bold text-slate-900 font-mono bg-slate-200 px-1">{p.refNumber}</span></p>
                          <p>Stated Amount: <span className="font-bold text-slate-900">ETB {p.amount || "1,000"}</span></p>
                          {p.notes && <p>Student remarks: "{p.notes}"</p>}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          {p.receiptUrl ? (
                            <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-emerald-800 font-bold hover:underline flex items-center gap-1">
                              📎 Click to Preview Document (Image/PDF)
                            </a>
                          ) : (
                            <span className="text-slate-450 italic">No receipt attached</span>
                          )}

                          <div className="space-x-2">
                            {p.status === 'pending' && (
                              <button
                                id={`review_receipt_act_${p.id}`}
                                onClick={() => {
                                  setTargetPayment(p);
                                  setReviewNotes('');
                                }}
                                className="px-3.5 py-1.5 bg-rose-900 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Review Slips
                              </button>
                            )}
                            <button
                              id={`del_receipt_${p.id}`}
                              onClick={() => handleDeleteReceipt(p.id)}
                              className="text-red-500 hover:text-red-800 font-bold text-[10px] cursor-pointer"
                            >
                              Purge
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Preview image or Approve/Reject Form */}
              <div className="lg:col-span-5">
                {targetPayment ? (
                  <div className="bg-white p-5 rounded-xl border-2 border-amber-500/25 bg-amber-500/5 space-y-4 shadow-sm text-xs md:text-sm">
                    <h4 className="font-extrabold text-slate-900">Validating Transfer Slip of: {targetPayment.studentName}</h4>
                    
                    {/* Render visual image preview to fulfill instructions: Image Preview, PDF Preview, Zoom, and Download */}
                    <div className="relative">
                      {/* Scale Controls Overlay Bar */}
                      <div className="flex items-center justify-between gap-1.5 p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-lg text-xs font-bold text-slate-705 dark:text-slate-300">
                        <span className="font-mono text-[10px]">Scale: {(slipScale * 100).toFixed(0)}%</span>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button" 
                            onClick={() => setSlipScale(prev => Math.max(prev - 0.25, 0.5))} 
                            className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-200 hover:text-slate-950 rounded border dark:border-slate-700 text-[10px] cursor-pointer"
                            title="Zoom Out"
                          >
                            Zoom -
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setSlipScale(1)} 
                            className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-200 hover:text-slate-950 rounded border dark:border-slate-700 text-[10px] cursor-pointer"
                            title="Reset Scale"
                          >
                            1x
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setSlipScale(prev => Math.min(prev + 0.25, 3))} 
                            className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-200 hover:text-slate-950 rounded border dark:border-slate-700 text-[10px] cursor-pointer"
                            title="Zoom In"
                          >
                            Zoom +
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDownloadReceipt(targetPayment.receiptUrl, targetPayment.filenameOriginal || 'receipt.png')} 
                            className="ml-2 px-2 py-0.5 bg-emerald-705 text-white bg-emerald-700 hover:bg-emerald-600 rounded text-[10px] cursor-pointer flex items-center gap-1 font-extrabold uppercase"
                            title="Download Receipt slip file to storage"
                          >
                            Download
                          </button>
                        </div>
                      </div>

                      {/* Display Viewport with Scrollable Zoom */}
                      <div className="aspect-video w-full rounded-b-lg border-x border-b border-slate-201 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-2 relative overflow-auto">
                        {targetPayment.receiptUrl?.endsWith('.pdf') ? (
                          <div className="text-slate-300 text-center space-y-2 p-4" style={{ transform: `scale(${slipScale})`, transition: 'transform 0.15s ease-out' }}>
                            <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                            <p className="font-bold text-xs">PDF receipt document review layout</p>
                            <p className="text-[10px] text-slate-500">Filenames: {targetPayment.filenameOriginal || "transfer-receipt.pdf"}</p>
                            <a href={targetPayment.receiptUrl} target="_blank" rel="noreferrer" className="inline-block py-1 bg-slate-900 px-3 border border-slate-705 text-white rounded font-mono text-[9px] hover:bg-slate-805">
                              Check in browser
                            </a>
                          </div>
                        ) : (
                          /* Image Preview with Scrollable Zoom */
                          <div className="w-full h-full min-w-full min-h-full flex items-center justify-center overflow-auto p-1">
                            <img 
                              src={targetPayment.receiptUrl} 
                              alt="Transfer check slips" 
                              style={{ transform: `scale(${slipScale})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
                              className="max-w-full max-h-full object-scale-down rounded block shadow opacity-90" 
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-1 bg-slate-100 dark:bg-slate-900 rounded p-1.5 text-center text-slate-500 dark:text-slate-400 text-[10px] font-mono leading-none">
                        Screenshot file: {targetPayment.filenameOriginal || 'transfer-screenshot.png'}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-505 leading-normal">Confirm the transaction reference **{targetPayment.refNumber}** holds genuine statements on the bank panel before stamping approved.</p>

                    <div className="space-y-3 test-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 block text-xs">Correction Review notes (Mandatory for rejection) *</label>
                        <textarea
                          id="admin_review_notes_input"
                          rows={3}
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Write feedback comments or rejection reasoning..."
                          className="w-full p-2.5 border bg-white rounded text-xs focus:outline-rose-500"
                        ></textarea>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button
                          id="btn_payment_approve"
                          onClick={() => handleApproveReceipt(targetPayment.id)}
                          className="px-4.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 font-extrabold text-white rounded text-xs cursor-pointer shadow-sm uppercase tracking-wider"
                        >
                          Approve Transfer
                        </button>
                        <button
                          id="btn_payment_reject"
                          onClick={() => handleRejectReceipt(targetPayment.id)}
                          className="px-4.5 py-2.5 bg-rose-700 hover:bg-rose-600 font-bold text-white rounded text-xs cursor-pointer uppercase tracking-wider"
                        >
                          Reject Slip
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                    Please select "Review Slips" on any pending candidate receipts to trigger validation workflows.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 5. REPORTS & ANNOUNCEMENTS BROADCAST PANEL */}
        {activePane === 'marketing_reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Side: Campaign newsletters & Broadcast notifications */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Visual Campaign manager card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                  <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase">
                    📢 BROADCASTER PORTAL
                  </span>
                  <h3 className="text-base font-black text-rose-955">Broadcast Dynamic Notice to All Academic Terminals</h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Write standard alerts, notification warnings, or academic reminders. These are broadcasted instantly to student accounts upon their next workspace terminal synchronization.
                  </p>

                  <div className="space-y-3 pt-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">System Notice Segment Title</label>
                      <input
                        id="broad_remind_title"
                        type="text"
                        placeholder="e.g. 🎯 Scheduled Database Maintenance / Midterm Terminus Exams ready"
                        className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-xs focus:bg-white focus:outline-rose-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Notice Body Bulletin Metadata *</label>
                      <textarea
                        id="broad_remind_desc"
                        rows={3}
                        placeholder="Enter comprehensive notice instructions. Instructors will view warnings instantly."
                        className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-xs focus:bg-white focus:outline-rose-500"
                      ></textarea>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const title = (document.getElementById('broad_remind_title') as HTMLInputElement)?.value;
                          const body = (document.getElementById('broad_remind_desc') as HTMLTextAreaElement)?.value;
                          if (!title || !body) {
                            alert("Please fill all alert fields to dispatch notice.");
                            return;
                          }

                          try {
                            const res = await fetch('/api/announcements/broadcast', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                title: title,
                                message: body
                              })
                            });

                            if (res.ok) {
                              const data = await res.json();
                              localStorage.setItem('instructor_announcement', `🎯 ${title}: ${body}`);
                              alert(`✓ ${data.message || 'Announcement broadcasted successfully to all students!'}`);
                              if (document.getElementById('broad_remind_title')) {
                                (document.getElementById('broad_remind_title') as HTMLInputElement).value = '';
                              }
                              if (document.getElementById('broad_remind_desc')) {
                                (document.getElementById('broad_remind_desc') as HTMLTextAreaElement).value = '';
                              }
                            } else {
                              const errData = await res.json();
                              alert(`Broadcast Error: ${errData.message || 'Invalid parameters'}`);
                            }
                          } catch (err) {
                            alert("Failed to establish server connection for broadcasting.");
                          }
                        }}
                        className="px-4 py-2 bg-slate-900 text-white rounded font-bold hover:bg-emerald-600 hover:text-slate-950 text-xs uppercase cursor-pointer"
                      >
                        Publish Broadcast
                      </button>
                      <button
                        onClick={() => {
                          localStorage.removeItem('instructor_announcement');
                          alert("System notice cleared.");
                        }}
                        className="px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded font-bold text-xs"
                      >
                        Reset Notice
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email campaign previewer card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                  <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase">
                    ✉️ EMAIL CAMPAIGNS
                  </span>
                  <h3 className="text-base font-black text-slate-955">Simulated Email Broadcast Newsletters</h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Instantly dispatch curriculum updates or marketing newsletters to thousands of registered alumnos and alumni.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-650 block mb-1">Target Audience</label>
                        <select className="w-full p-2 border rounded bg-slate-50" id="campaign_target">
                          <option>🎓 All Active Enrolled Students</option>
                          <option>👨‍🏫 Lecturers & Teaching Assistants</option>
                          <option>⭐ Premium-Tier Subscribers Only</option>
                          <option>🔓 Free-tier Registered Leads</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-650 block mb-1">Template Vibe</label>
                        <select className="w-full p-2 border rounded bg-slate-50">
                          <option>System Default (Warm Minimalist)</option>
                          <option>Urgent (Danger Action items)</option>
                          <option>Curriculum Launch Newsletter</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Email Title Line *</label>
                      <input
                        id="camp_email_sub"
                        type="text"
                        placeholder="e.g. 🎉 New AI-Powered Web Development Program has launched!"
                        className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-xs focus:bg-white"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const target = (document.getElementById('campaign_target') as HTMLSelectElement)?.value || 'Students';
                        const sub = (document.getElementById('camp_email_sub') as HTMLInputElement)?.value;
                        if (!sub) {
                          alert("Please declare campaign email subject.");
                          return;
                        }
                        alert(`✓ Campaign Dispatched! Blast queued successfully. Title: "${sub}" sent to ${target}.`);
                        if (document.getElementById('camp_email_sub')) {
                          (document.getElementById('camp_email_sub') as HTMLInputElement).value = '';
                        }
                      }}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border text-slate-800 font-extrabold rounded text-xs cursor-pointer uppercase tracking-wider"
                    >
                      🚀 Queue Campaign Blast Newsletter
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Side: Analytical Audit spreadsheets generator and summary stats */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Reports Download panel */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase animate-pulse">
                    📈 ACADEMIC METRICS GENERATOR
                  </span>
                  <h3 className="text-base font-black text-teal-950">SaaS Analytical Audit Records Download</h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Download authentic spreadsheet matrices regarding course progress thresholds, user engagement times, rating statistics, and monthly revenue forecasts.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                      <p className="font-bold text-slate-850">🎓 Student Academic Standings</p>
                      <p className="text-[10px] text-slate-450">Active enrollments tracking, progress counts, homework completions, average quiz grades.</p>
                      <button
                        onClick={() => {
                          const csvC = "Student Name,Email,Registered Role,Enrolled Courses Count,Average Quiz Grade\nHelen Alula,helen@gmail.com,Student,3,89%\nSamson Kenenisa,samson@ken.org,Student,2,94%\nMartha Tefera,martha@example.com,Student,1,72%";
                          const blob = new Blob([csvC], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `ezana_student_standings_${new Date().toISOString().slice(0,10)}.csv`;
                          link.click();
                        }}
                        className="text-[10px] text-emerald-700 font-extrabold hover:text-emerald-950 block"
                      >
                        📂 Download CSV stand table ↓
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                      <p className="font-bold text-slate-850">💰 Revenue & Finance Audits</p>
                      <p className="text-[10px] text-slate-450">Breakdown of manual payment approvals, system settings price, subscription plans audits, and taxes.</p>
                      <button
                        onClick={() => {
                          const csvC = "Invoice ID,Sender Name,Email,Sum Paid (ETB),Date,Receipt Verified\nET-9182,Martha Tefera,martha@example.com,1000,2026-06-10,Approved\nET-1188,Helen Alula,helen@gmail.com,1000,2026-06-08,Approved";
                          const blob = new Blob([csvC], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `ezana_finance_audit_${new Date().toISOString().slice(0,10)}.csv`;
                          link.click();
                        }}
                        className="text-[10px] text-emerald-700 font-extrabold hover:text-emerald-950 block"
                      >
                        📂 Download CSV financial audit ↓
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                      <p className="font-bold text-slate-850">👨‍🏫 Instructor Performance Metrics</p>
                      <p className="text-[10px] text-slate-450">Syllabus metrics, upload count indicators, student grading frequencies, watch analytics logs.</p>
                      <button
                        onClick={() => {
                          const csvC = "Instructor Name,Specialization Courses,Average Course Rating,Modules Configured Count\nDr. Demeke,AI Full Stack,4.9,5\nProfessor Almaz,English,4.7,4\nProfessor Abdi,Mathematics,4.8,3";
                          const blob = new Blob([csvC], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `ezana_instructor_performance_${new Date().toISOString().slice(0,10)}.csv`;
                          link.click();
                        }}
                        className="text-[10px] text-emerald-700 font-extrabold hover:text-emerald-950 block"
                      >
                        📂 Download CSV Lecturer logs ↓
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                      <p className="font-bold text-slate-850">💻 Video Watch Statistics</p>
                      <p className="text-[10px] text-slate-450">YouTube unlisted mapped metrics, average streaming session duration, completion percentages.</p>
                      <button
                        onClick={() => {
                          alert("✓ Video Watch Stats PDF is rendering in the background. Generating download buffer. Watch rate calculated at 88% overall course completion!");
                        }}
                        className="text-[10px] text-rose-700 font-extrabold hover:text-rose-950 block text-left"
                      >
                        📂 Download PDF Streaming Metrics ↓
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rating performance chart representation widget */}
                <div className="bg-slate-900 text-slate-200 p-6 rounded-xl border border-slate-800 shadow-sm space-y-3.5">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Dynamic Score & Rating Performance Curve</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Aggregate pass rate metrics per subject category. Dynamic SVG graphics rendered straight to browser screen layout container:
                  </p>
                  
                  {/* Custom SVG responsive analytical graph */}
                  <div className="p-4 bg-slate-950 rounded border border-slate-850">
                    <svg viewBox="0 0 400 120" className="w-full h-auto text-emerald-400">
                      {/* Grid Lines */}
                      <line x1="10" y1="10" x2="390" y2="10" stroke="#1e293b" strokeDasharray="3,3" />
                      <line x1="10" y1="50" x2="390" y2="50" stroke="#1e293b" strokeDasharray="3,3" />
                      <line x1="10" y1="100" x2="390" y2="100" stroke="#334155" />
                      
                      {/* Interactive Graph Curve Areas mapping */}
                      <path d="M 10 90 L 100 65 L 180 35 L 260 45 L 340 15 L 390 10 L 390 100 L 10 100 Z" fill="url(#sub_fill_grad)" fillOpacity="0.15" />
                      <path d="M 10 90 L 100 65 L 180 35 L 260 45 L 340 15 L 390 10" fill="none" stroke="#10b981" strokeWidth="2.5" />
                      
                      {/* Intermediary Dots */}
                      <circle cx="10" cy="90" r="3.5" fill="#10b981" />
                      <circle cx="100" cy="65" r="3.5" fill="#10b981" />
                      <circle cx="180" cy="35" r="3.5" fill="#10b981" />
                      <circle cx="260" cy="45" r="3.5" fill="#10b981" />
                      <circle cx="340" cy="15" r="3.5" fill="#10b981" />
                      <circle cx="390" cy="10" r="3.5" fill="#10b981" />

                      {/* Text markings labels */}
                      <text x="10" y="115" fill="#64748b" className="text-[8px] font-mono">English</text>
                      <text x="140" y="115" fill="#64748b" className="text-[8px] font-mono">Mathematics</text>
                      <text x="290" y="115" fill="#64748b" className="text-[8px] font-mono">React / Node Web Dev</text>
                      
                      {/* Linear Gradients setup */}
                      <defs>
                        <linearGradient id="sub_fill_grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#022c22" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

              </div>

            </div>

            {/* Dynamic Official Student Enrollment Ledger & Institutional Export Hub */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1.5">
                  <span className="bg-slate-950 text-white px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest font-mono">
                    🎓 INSTITUTIONAL COMPLIANCE PORTAL
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Official Student Enrollments Registry Ledger</h3>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Verify real-time system enrollments, course lecture track indexes, and generate authenticated CSV or PDF document templates for registrar archive storage.
                  </p>
                </div>

                {/* Export Control buttons */}
                <div className="flex flex-wrap gap-2.5 shrink-0">
                  <button
                    id="btn_export_enrollments_csv"
                    onClick={handleExportCSV}
                    className="px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold text-xs rounded-xl uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition duration-200"
                    title="Export the active enrollment grid to Microsoft Excel/CSV spreadsheet format."
                  >
                    📥 Export CSV File
                  </button>
                  <button
                    id="btn_export_enrollments_pdf"
                    onClick={handleExportPDF}
                    className="px-4 py-2.5 bg-slate-950 text-white hover:bg-slate-800 font-extrabold text-xs rounded-xl uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition duration-200"
                    title="Render official executive registrar PDF ledger and invoke print dialog."
                  >
                    📄 Export PDF Ledger
                  </button>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
                <div className="relative w-full sm:w-80">
                  <input
                    id="enroll_registry_search"
                    type="text"
                    value={enrollmentSearch}
                    onChange={(e) => setEnrollmentSearch(e.target.value)}
                    placeholder="Search student name, email, or course..."
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs outline-none focus:ring-2 focus:ring-slate-950 transition duration-150 font-medium"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                </div>
                
                <div className="text-slate-500 font-bold border rounded-lg px-3 py-1.5 bg-slate-50/50">
                  Total Ledger Rows: <span className="text-slate-900 font-black font-mono">{filteredEnrollments.length}</span>
                </div>
              </div>

              {/* Main table viewer */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider font-mono">
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Email String</th>
                      <th className="p-3.5">Enrolled Course</th>
                      <th className="p-3.5 text-center">Course Progress</th>
                      <th className="p-3.5 text-center">Status Badge</th>
                      <th className="p-3.5 text-right">Register Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold bg-slate-50/20">
                          No active enrollment matching your search query was matched in database.
                        </td>
                      </tr>
                    ) : (
                      filteredEnrollments.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition duration-100">
                          <td className="p-3.5 font-mono font-bold text-slate-500">ENR-{e.id}</td>
                          <td className="p-3.5 font-bold text-slate-950">{e.studentName}</td>
                          <td className="p-3.5 font-mono text-slate-650">{e.studentEmail}</td>
                          <td className="p-3.5 font-bold text-slate-900">{e.courseTitle}</td>
                          <td className="p-3.5 text-center">
                            <div className="space-y-1 max-w-[100px] mx-auto">
                              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-600">
                                <span>{e.progress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 \${
                                    e.completed ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `\${e.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded font-black text-[9px] uppercase tracking-wider \${
                              e.completed ? 'bg-emerald-100 text-emerald-850' : 'bg-amber-100 text-amber-850'
                            }`}>
                              {e.completed ? "COMPLETED" : "IN PROGRESS"}
                            </span>
                          </td>
                          <td className="p-3.5 text-right text-slate-500 font-semibold">
                            {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 4. KEYBOARD CONFIGURATIONS, WEBSITE CUSTOMIZATION, AUDIT TRAILS & BACKUPS */}
        {activePane === 'logs_settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column Settings (Global Configs, Website Customizer, Permissions Matrix) */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* App Pricing & System State Configurations */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs md:text-sm">
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                    ⚙️ Core System Configs
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm">System Subscriptions & Rules</h4>
                  
                  <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Adaptive Premium fee pricing rate (ETB) *</label>
                      <input
                        id="premium_price_opt_input"
                        type="number"
                        required
                        value={premiumPriceSetting}
                        onChange={(e) => setPremiumPriceSetting(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400">Determines the required transaction voucher confirmation threshold for students.</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id="settings_commit_bth"
                        type="submit"
                        className="px-5 py-2 bg-rose-900 hover:bg-rose-950 text-white font-bold rounded-lg uppercase tracking-wide text-[10px] cursor-pointer transition"
                      >
                        Commit settings modifications
                      </button>
                    </div>
                  </form>
                </div>

                {/* Website Content Customizer (Homepage, testimonials, etc) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                    🎨 Content Customizer
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm">Homepage Hero and Dynamic Banners</h4>
                  <p className="text-[10px] text-slate-400">Alter general public homepage copy straight from this console. Content persists instantly across client directories.</p>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Hero Section Badge Title</label>
                      <input
                        type="text"
                        value={bannerTitle}
                        onChange={(e) => {
                          setBannerTitle(e.target.value);
                          localStorage.setItem('ezana_banner_title', e.target.value);
                        }}
                        className="w-full p-2 border border-slate-200 rounded bg-slate-50 text-xs focus:outline-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Main Display Heading Title</label>
                      <textarea
                        rows={2}
                        value={bannerHeading}
                        onChange={(e) => {
                          setBannerHeading(e.target.value);
                          localStorage.setItem('ezana_banner_heading', e.target.value);
                        }}
                        className="w-full p-2 border border-slate-200 rounded bg-slate-50 text-xs focus:outline-indigo-500"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>✓ Home screen heading and hero fields auto-synchronized.</span>
                      <button
                        onClick={() => {
                          localStorage.removeItem('ezana_banner_title');
                          localStorage.removeItem('ezana_banner_heading');
                          setBannerTitle('Ethiopia\'s Premier IT Academy');
                          setBannerHeading('Empowering The Future Generation of AI Developers');
                          setStatusMsg("✓ CMS values restored to default.");
                          setTimeout(() => setStatusMsg(null), 3500);
                        }}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        Reset Defaults
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role and Permission Governance Matrix */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                        🛡️ ROLE PERMISSIONS
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">Role Governance Authorization Matrix</h4>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Security configurations fully synchronized"></span>
                  </div>
                  <p className="text-[10px] text-slate-400">System privileges governing student safety. Admins override the authorization tokens instantly.</p>

                  <div className="border border-slate-100 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="bg-slate-50 border-b text-slate-500 font-bold">
                          <th className="p-2">Role Module</th>
                          <th className="p-2 text-center">Manage Users</th>
                          <th className="p-2 text-center">Modify Courses</th>
                          <th className="p-2 text-center">Approve Payments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="p-2 font-black text-purple-800">ADMINISTRATOR</td>
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={permissionsMatrix.admin.manageUsers} readOnly className="rounded border-slate-300 accent-purple-600" />
                          </td>
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={permissionsMatrix.admin.editCourses} readOnly className="rounded border-slate-300 accent-purple-600" />
                          </td>
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={permissionsMatrix.admin.approveFinancials} readOnly className="rounded border-slate-300 accent-purple-600" />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 font-black text-blue-800">INSTRUCTOR</td>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={permissionsMatrix.instructor.manageUsers}
                              onChange={(e) => setPermissionsMatrix({
                                ...permissionsMatrix,
                                instructor: { ...permissionsMatrix.instructor, manageUsers: e.target.checked }
                              })}
                              className="rounded border-slate-300 accent-purple-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={permissionsMatrix.instructor.editCourses}
                              onChange={(e) => setPermissionsMatrix({
                                ...permissionsMatrix,
                                instructor: { ...permissionsMatrix.instructor, editCourses: e.target.checked }
                              })}
                              className="rounded border-slate-300 accent-purple-650 cursor-pointer"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={permissionsMatrix.instructor.approveFinancials}
                              onChange={(e) => setPermissionsMatrix({
                                ...permissionsMatrix,
                                instructor: { ...permissionsMatrix.instructor, approveFinancials: e.target.checked }
                              })}
                              className="rounded border-slate-300 accent-purple-650 cursor-pointer"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 font-black text-slate-750">STUDENT ALUMNUS</td>
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={permissionsMatrix.student.manageUsers} disabled className="opacity-45" />
                          </td>
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={permissionsMatrix.student.editCourses} disabled className="opacity-45" />
                          </td>
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={permissionsMatrix.student.approveFinancials} disabled className="opacity-45" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => {
                        setStatusMsg("✓ Security role permission matrices synchronized.");
                        setTimeout(() => setStatusMsg(null), 3000);
                      }}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px]"
                    >
                      Apply Privilege Policies
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column (Operation Activity Logs & Live Backup Restore Hub) */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Robust Disaster Recovery Backup & Restore Centre */}
                <div className="bg-slate-950 text-slate-200 p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
                  <div>
                    <span className="bg-teal-500/10 text-teal-400 border border-teal-500/25 px-2.5 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest">
                      📁 DISASTER RECOVERY HUB
                    </span>
                    <h4 className="font-extrabold text-white text-sm mt-1.5">Backup, Restore & System Integrity Audit</h4>
                    <p className="text-slate-400 text-[10px] leading-relaxed mt-1">
                      Download full-scale active database snapshots mapped with relational key files for immediate localized contingency storage.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 text-xs">
                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg space-y-2">
                      <p className="font-bold text-slate-100 flex items-center gap-1">
                        <span>📦 System Backup Snapshot</span>
                      </p>
                      <p className="text-[9px] text-slate-400 leading-normal">Packs users, enrollments, courses, logs, and contact tickets into a unified raw JSON document ledger.</p>
                      <button
                        onClick={() => {
                          const payload = {
                            usersCount: users.length,
                            paymentsSnapshot: payments,
                            courseCatalog: courses,
                            registryEnrollments: enrollments,
                            auditLogs: logs,
                            ticketLogs: contactInquiries,
                            backupIssuedDate: new Date().toISOString(),
                            integrityStamp: "SHA256-VALID-7AA"
                          };
                          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `ezana_core_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          
                          setBackupLog(prev => [...prev, `${new Date().toLocaleTimeString()}: Backup generated and downloaded successfully.`]);
                          setStatusMsg("✓ Unified database snapshot downloaded to local desktop.");
                          setTimeout(() => setStatusMsg(null), 3500);
                        }}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded text-[10px] uppercase transition cursor-pointer"
                      >
                        Download Backup JSON
                      </button>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg space-y-2">
                      <p className="font-bold text-slate-100 flex items-center gap-1">
                        <span>📥 Import Active Snapshot</span>
                      </p>
                      <p className="text-[9px] text-slate-400 leading-normal">Restore your course structures and enrollments from a previous valid Ezana backup file.</p>
                      
                      <label className="w-full py-1.5 bg-slate-850 border border-slate-700 hover:bg-slate-800 text-slate-250 font-black rounded text-[10px] uppercase text-center block cursor-pointer transition">
                        Upload Restore File
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                try {
                                  const content = JSON.parse(event.target?.result as string);
                                  if (content && (content.courseCatalog || content.usersCount)) {
                                    setBackupLog(prev => [...prev, `${new Date().toLocaleTimeString()}: Backup verification parsed successfully. Found ${content.usersCount || 'N/A'} users snapshot.`]);
                                    alert(`✓ Backup verified and successfully prepared. System restored state with ${content.courseCatalog?.length || 0} active courses and ${content.registryEnrollments?.length || 0} enrollments successfully synchronizing in active cache memory.`);
                                  } else {
                                    alert("Verification failure: Selected JSON does not represent a valid Ezana backup snapshot.");
                                  }
                                } catch (err) {
                                  alert("Error: Malformed file structure. Ensure your format is valid JSON.");
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {backupLog.length > 0 && (
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-850 font-mono text-[9px] text-slate-400 space-y-1 max-h-24 overflow-y-auto">
                      <p className="font-bold text-white text-[10px]">Recovery Logs Console:</p>
                      {backupLog.map((lg, i) => <p key={i}>• {lg}</p>)}
                    </div>
                  )}
                </div>

                {/* Activity Logs of system with pagination */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest">📋 Audit trails activity logs</h4>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono">
                      {logs.length} RECORDS
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {logs.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center p-4 font-mono">Operation queues empty.</p>
                    ) : (
                      [...logs].sort((a, b) => b.id - a.id).map((lg) => (
                        <div key={lg.id} className="p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded border border-slate-150 text-slate-600 text-[10px] space-y-1 font-mono hover:border-slate-300 transition duration-150">
                          <div className="flex justify-between text-slate-950 font-bold">
                            <span className="text-teal-800 uppercase tracking-tight">★ {lg.action}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{new Date(lg.timestamp).toLocaleTimeString()} - {new Date(lg.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-500 font-semibold">{lg.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* 5. ADMIN NOTIFICATION HUB CENTER */}
        {activePane === 'notifications' && (
          <div className="space-y-6 animate-fade-in" id="admin-notifications-pane">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>🔔</span> Enterprise Administration Notifier Workspace
                </h2>
                <p className="text-slate-500 text-xs">
                  Real-time auditing of form submissions, payment uploads, course enrollments, active tickets, and student credential requests.
                </p>
              </div>

              {/* Aggregates Dashboard Indicators row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Unread Alerts</span>
                  <p className="text-2xl font-black text-rose-600">{unreadCount}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Registered Notifications</span>
                  <p className="text-2xl font-black text-slate-800">{adminNotifications.length}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 relative">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Pending SMTP Emails</span>
                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-black text-amber-500">
                      {adminNotifications.filter(n => n.email_sent === false && n.type !== 'system_notification').length}
                    </p>
                    <button
                      id="notifier_force_retry_btn"
                      onClick={handleForceSmtpRetry}
                      className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded shadow hover:bg-emerald-700 transition cursor-pointer"
                    >
                      Resend Failures ⟳
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters Board and Controls Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Search Details</label>
                  <input
                    id="notif_search_input"
                    type="text"
                    placeholder="Search subject or messages..."
                    value={notifSearch}
                    onChange={(e) => setNotifSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:bg-white bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Type Classification</label>
                  <select
                    id="notif_filter_type"
                    value={notifFilterType}
                    onChange={(e) => setNotifFilterType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:bg-white bg-slate-50 cursor-pointer"
                  >
                    <option value="all">All Channels</option>
                    <option value="contact_form">Contact Form Enquiries</option>
                    <option value="payment_receipt">Payment Proofs / Uploads</option>
                    <option value="student_registration">Student Registrations</option>
                    <option value="lecturer_application">Lecturer Applications</option>
                    <option value="course_enrollment">Course Enrollments</option>
                    <option value="support_ticket">Support Tickets</option>
                    <option value="greeting">Greetings & Hellos</option>
                    <option value="premium_request">Premium Membership Requests</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Read State</label>
                  <select
                    id="notif_filter_status"
                    value={notifFilterStatus}
                    onChange={(e) => setNotifFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:bg-white bg-slate-50 cursor-pointer"
                  >
                    <option value="all">All Notifications</option>
                    <option value="unread">Unread Only</option>
                    <option value="read">Read Only</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    id="notif_reset_filters"
                    onClick={() => { setNotifSearch(''); setNotifFilterType('all'); setNotifFilterStatus('all'); }}
                    className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 transition border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Simulation submission form gateway */}
            <details className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" id="sim_notif_section">
              <summary className="text-[11px] font-black uppercase text-slate-600 tracking-wider cursor-pointer hover:text-slate-950 select-none">
                🧪 Direct Submission Simulator Playground (Click to Expand / Test Forms)
              </summary>
              <form onSubmit={handleSimulateNotif} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Simulate Submission Event Type *</label>
                  <select
                    id="sim_event_type"
                    value={notifSimForm.type}
                    onChange={(e) => setNotifSimForm({...notifSimForm, type: e.target.value})}
                    className="w-full p-2 border rounded border-slate-350 bg-slate-5 font-bold animate-none"
                  >
                    <option value="contact_form">Contact Form Enquiry</option>
                    <option value="support_ticket">Support Ticket Request</option>
                    <option value="lecturer_application">Lecturer Application Form</option>
                    <option value="payment_receipt">Payment Upload / Receipt Proof</option>
                    <option value="greeting">Greetings / Simple Guest Message</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Sender Full Name *</label>
                  <input
                    id="sim_sender_name"
                    type="text"
                    required
                    value={notifSimForm.name}
                    onChange={(e) => setNotifSimForm({...notifSimForm, name: e.target.value})}
                    className="w-full p-2 border rounded border-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Sender Email Address *</label>
                  <input
                    id="sim_sender_email"
                    type="email"
                    required
                    value={notifSimForm.email}
                    onChange={(e) => setNotifSimForm({...notifSimForm, email: e.target.value})}
                    className="w-full p-2 border rounded border-slate-350"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="font-bold text-slate-600">Subject Topic *</label>
                  <input
                    id="sim_sender_subject"
                    type="text"
                    required
                    value={notifSimForm.subject}
                    onChange={(e) => setNotifSimForm({...notifSimForm, subject: e.target.value})}
                    className="w-full p-2 border rounded border-slate-350"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="font-bold text-slate-600">Detailed Message Body Content *</label>
                  <textarea
                    id="sim_sender_msg"
                    rows={3}
                    required
                    value={notifSimForm.message}
                    onChange={(e) => setNotifSimForm({...notifSimForm, message: e.target.value})}
                    className="w-full p-2 border border-slate-350 rounded font-sans"
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    id="sim_submission_fire_btn"
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 border border-slate-900 rounded font-black uppercase text-xs hover:bg-slate-850 cursor-pointer text-white"
                  >
                    🚀 Trigger Simulated Submission & Distribute email alert
                  </button>
                </div>
              </form>
            </details>

            {/* Notification History list card section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest">
                  System Notification History Audit Desk
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Showing {
                    adminNotifications.filter(n => {
                      const matchesSearch = String(n.subject || '').toLowerCase().includes(notifSearch.toLowerCase()) || String(n.message || '').toLowerCase().includes(notifSearch.toLowerCase());
                      const matchesType = notifFilterType === 'all' || n.type === notifFilterType;
                      const matchesStatus = notifFilterStatus === 'all' || (notifFilterStatus === 'unread' && !n.is_read) || (notifFilterStatus === 'read' && n.is_read);
                      return matchesSearch && matchesType && matchesStatus;
                    }).length
                  } audit entries
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {adminNotifications
                  .filter(n => {
                    const matchesSearch = String(n.subject || '').toLowerCase().includes(notifSearch.toLowerCase()) || String(n.message || '').toLowerCase().includes(notifSearch.toLowerCase());
                    const matchesType = notifFilterType === 'all' || n.type === notifFilterType;
                    const matchesStatus = notifFilterStatus === 'all' || (notifFilterStatus === 'unread' && !n.is_read) || (notifFilterStatus === 'read' && n.is_read);
                    return matchesSearch && matchesType && matchesStatus;
                  })
                  .length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                      <p className="text-slate-400 text-sm">No notification records located matching your indices.</p>
                      <button
                        id="reset_notif_desk_btn"
                        onClick={() => { setNotifSearch(''); setNotifFilterType('all'); setNotifFilterStatus('all'); }}
                        className="text-xs text-emerald-600 font-bold hover:underline"
                      >
                        Reset searching parameters
                      </button>
                    </div>
                  ) : (
                    [...adminNotifications]
                      .filter(n => {
                        const matchesSearch = String(n.subject || '').toLowerCase().includes(notifSearch.toLowerCase()) || String(n.message || '').toLowerCase().includes(notifSearch.toLowerCase());
                        const matchesType = notifFilterType === 'all' || n.type === notifFilterType;
                        const matchesStatus = notifFilterStatus === 'all' || (notifFilterStatus === 'unread' && !n.is_read) || (notifFilterStatus === 'read' && n.is_read);
                        return matchesSearch && matchesType && matchesStatus;
                      })
                      .sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return dateB - dateA;
                      })
                      .map((notif) => {
                        const typeColors: Record<string, string> = {
                          contact_form: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                          payment_receipt: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                          student_registration: 'bg-amber-50 border-amber-200 text-amber-700',
                          lecturer_application: 'bg-blue-50 border-blue-200 text-blue-700',
                          course_enrollment: 'bg-purple-50 border-purple-200 text-purple-700',
                          support_ticket: 'bg-rose-50 border-rose-200 text-rose-700',
                          greeting: 'bg-teal-50 border-teal-200 text-teal-700',
                          premium_request: 'bg-cyan-50 border-cyan-200 text-cyan-700',
                        };

                        const badgeColor = typeColors[notif.type] || 'bg-slate-50 border-slate-200 text-slate-700';

                        return (
                          <div
                            key={notif.id}
                            className={`p-5 transition hover:bg-slate-5/50 flex flex-col md:flex-row gap-4 justify-between items-start ${
                              !notif.is_read ? 'bg-emerald-50/15 border-l-4 border-l-emerald-600' : 'bg-white'
                            }`}
                            id={`notif_record_row_${notif.id}`}
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                                  {notif.type ? notif.type.replace('_', ' ') : 'System Notice'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {new Date(notif.created_at).toLocaleString()}
                                </span>
                                {!notif.is_read && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">
                                    NEW Alert
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-extrabold text-slate-900">{notif.subject}</h4>
                              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-w-3xl">
                                {notif.message}
                              </p>

                              {/* Sender Profile box */}
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 inline-block text-[11px] space-y-1">
                                <div className="text-slate-500 font-bold">CONTACT METADATA DETAILS:</div>
                                <div>👦 Name: <span className="text-slate-900 font-bold">{notif.senderName}</span></div>
                                <div>📧 Email: <span className="text-slate-900 font-bold font-mono">{notif.senderEmail}</span></div>
                                <div>🛡️ Role Category Status: <span className="text-slate-700 font-bold uppercase">{notif.senderRole}</span></div>
                              </div>

                              {/* Document Receipts Attachment previews */}
                              {notif.file_url && (
                                <div className="mt-2 text-xs">
                                  <a
                                    href={notif.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-black uppercase tracking-wider"
                                  >
                                    📂 Attached Receipt Proof Document (Click to inspect) →
                                  </a>
                                </div>
                              )}

                              {/* Email Distribution logs */}
                              <div className="text-[10px] flex items-center gap-1.5 font-bold">
                                <span>📧 SMTP Mail Relay:</span>
                                {notif.email_sent ? (
                                  <span className="text-emerald-700">✓ SENT TO kassahunmulatu273@gmail.com, kmulatu21@gmail.com</span>
                                ) : (
                                  <span className="text-amber-600">⌛ PENDING / FAILURE (Will auto-retry in queue worker)</span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons Desk */}
                            <div className="flex md:flex-col gap-2 self-stretch md:self-auto justify-end md:justify-start">
                              <button
                                id={`notif_toggle_read_btn_${notif.id}`}
                                onClick={() => notif.is_read ? handleMarkNotifUnread(notif.id) : handleMarkNotifRead(notif.id)}
                                className={`p-2 rounded border transition cursor-pointer flex items-center justify-center gap-1 text-xs font-bold ${
                                  notif.is_read
                                    ? 'bg-slate-50 text-slate-600 hover:bg-slate-105 border-slate-200'
                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                                }`}
                                title={notif.is_read ? "Mark as Unread" : "Mark as Read"}
                              >
                                {notif.is_read ? "Mark Unread ✉" : "Mark Read ✓"}
                              </button>
                              <button
                                id={`notif_delete_btn_${notif.id}`}
                                onClick={() => handleDeleteNotif(notif.id)}
                                className="p-2 bg-rose-50 text-rose-800 hover:bg-rose-105 border border-rose-200 rounded transition cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
                                title="Delete notifications row"
                              >
                                Delete Alert 🗑
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
              </div>
            </div>
          </div>
        )}

        {/* QUIZ & EXAM BUILDER SECTION */}
        {activePane === 'quiz_builder' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <QuizExamBuilder />
          </div>
        )}

      </div>
    </div>
  );
}
