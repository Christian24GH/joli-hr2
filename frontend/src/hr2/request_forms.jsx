import { hr2, hr2Api } from "@/api/hr2";
import { getUser, getUsers, AUTH_API as api } from "@/api/axios";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast, Toaster } from 'sonner';
import AuthContext from "../context/AuthProvider";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from '@/components/ui/label';
import {
    BriefcaseBusiness,
    Mail, Phone, MapPin, Cake,
    UserRoundPlus, Calendar, Clock, CreditCard,
    GraduationCap, Bell, FileText, TrendingUp,
    CheckCircle, XCircle, AlertCircle, Plus,
    Edit, Download, Upload, User, Users,
    BookOpen, Award, Search, Filter, Trash2,
    UserPlus, X, ShieldUser, Send, Wrench,
    HandCoins, Wallet, Eye, Target,
    ScrollText
} from 'lucide-react';

function ESS() {
    const authContext = useContext(AuthContext);
    const currentUser = authContext?.auth;
    const logout = authContext?.logout;
    const navigate = useNavigate();

    // Utility function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    const [dashboardStats, setDashboardStats] = useState({
        leaveBalance: 15,
        pendingRequests: 2,
        upcomingTrainings: 3,
        completedTrainings: 8
    });

    const [reimbursementRequests, setReimbursementRequests] = useState([]);
    const [reimbursementHistory, setReimbursementHistory] = useState(() => {
        try {
            let saved = localStorage.getItem('hr2_reimbursementHistory');
            const parsed = saved ? JSON.parse(saved) : [];
            console.log('Loaded reimbursement history from localStorage:', parsed);
            return parsed;
        } catch (error) {
            console.error('Error loading reimbursement history from localStorage:', error);
            return [];
        }
    });
    const [reimbursementForm, setReimbursementForm] = useState({
        type: '',
        amount: '',
        date: '',
        description: '',
        receipt: null
    });
    const [reimbursementDialogOpen, setReimbursementDialogOpen] = useState(false);
    const [manageReimbursementDialogOpen, setManageReimbursementDialogOpen] = useState(false);
    const [reimbursementHistoryDialogOpen, setReimbursementHistoryDialogOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    // Dialog state for viewing a receipt
    const [receiptViewDialogOpen, setReceiptViewDialogOpen] = useState(false);

    const [timesheet, setTimesheet] = useState([]);
    const [timesheetAdjustmentRequests, setTimesheetAdjustmentRequests] = useState([]);

    const [leaveRequestHistory, setLeaveRequestHistory] = useState(() => {
        try {
            let saved = localStorage.getItem('hr2_leaveRequestHistory');

            if (!saved) {
                const oldLeaveHistory = localStorage.getItem('leaveRequestHistory');
                if (oldLeaveHistory) {
                    saved = oldLeaveHistory;
                    localStorage.setItem('hr2_leaveRequestHistory', saved);
                    console.log('Migrated leave request history from individual to shared storage');
                }
            }

            const parsed = saved ? JSON.parse(saved) : [];
            console.log('Loaded shared leave request history from localStorage:', parsed);
            console.log('Shared leave request history length:', parsed.length);
            return parsed;
        } catch (error) {
            console.error('Error loading shared leave request history from localStorage:', error);
            return [];
        }
    });

    const [timesheetAdjustmentHistory, setTimesheetAdjustmentHistory] = useState(() => {
        try {
            let saved = localStorage.getItem('hr2_timesheetAdjustmentHistory');

            if (!saved) {
                const oldTimesheetHistory = localStorage.getItem('timesheetAdjustmentHistory');
                if (oldTimesheetHistory) {
                    saved = oldTimesheetHistory;
                    localStorage.setItem('hr2_timesheetAdjustmentHistory', saved);
                    console.log('Migrated timesheet adjustment history from individual to shared storage');
                }
            }

            const parsed = saved ? JSON.parse(saved) : [];
            console.log('Loaded shared timesheet adjustment history from localStorage:', parsed);
            console.log('Shared timesheet adjustment history length:', parsed.length);
            return parsed;
        } catch (error) {
            console.error('Error loading shared timesheet adjustment history from localStorage:', error);
            return [];
        }
    });

    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Leave Request Approved', message: 'Your vacation leave has been approved', date: '2025-09-18', type: 'success' },
        { id: 2, title: 'Training Reminder', message: 'React Development course starts tomorrow', date: '2025-09-17', type: 'info' }
    ]);

    const handleLeaveRequest = async () => {
        if (!leaveForm.type || !leaveForm.start || !leaveForm.end || !leaveForm.reason) {
            toast.error('Please fill in all leave fields.');
            return;
        }

        // Use auth user ID if HR2 employee ID is not available
        const employeeIdToUse = employeeId || currentUser?.id;
        if (!employeeIdToUse) {
            toast.error('User information not loaded. Please refresh the page.');
            return;
        }

        try {
            const leaveData = {
                employee_id: employeeIdToUse,
                type: leaveForm.type,
                start: leaveForm.start,
                end: leaveForm.end,
                reason: leaveForm.reason
            };

            const response = await hr2.leaveRequests.create(leaveData);
            toast.success('Leave request submitted!');
            setLeaveForm({ type: '', start: '', end: '', reason: '' });
            setLeaveRequestDialogOpen(false);
            console.log('About to refresh leave requests after submission, employeeId:', employeeIdToUse);
            await loadLeaveRequests();
            // Dispatch custom event for real-time updates
            window.dispatchEvent(new CustomEvent('leaveRequestSubmitted', { detail: leaveData }));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message || 'Failed to submit leave request');
        }
    };

    const handleCancelLeaveRequest = async (requestId) => {
        if (!confirm('Are you sure you want to cancel this leave request?')) {
            return;
        }

        try {
            await hr2.leaveRequests.delete(requestId);
            toast.success('Leave request cancelled successfully!');
            loadLeaveRequests();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to cancel leave request');
        }
    };

    const openManageRequestDialog = (request) => {
        setCurrentManagingRequest(request);
        setManageRequestForm({
            status: '',
            admin_notes: ''
        });
        setManageRequestDialogOpen(true);
    };

    const handleManageRequest = async () => {
        console.log('handleManageRequest called with status:', manageRequestForm.status);
        console.log('currentManagingRequest:', currentManagingRequest);
        console.log('currentManagingRequest keys:', currentManagingRequest ? Object.keys(currentManagingRequest) : 'null');
        console.log('currentManagingRequest employee:', currentManagingRequest?.employee);
        console.log('isHR2Admin:', isHR2Admin);

        if (!currentManagingRequest || !manageRequestForm.status) {
            toast.error('Please select an action (Accept or Deny)');
            return;
        }

        try {
            await hr2.leaveRequests.updateStatus(currentManagingRequest.id, {
                status: manageRequestForm.status,
                admin_notes: manageRequestForm.admin_notes || null
            });

            if (manageRequestForm.status === 'Approved' || manageRequestForm.status === 'Rejected' || manageRequestForm.status === 'Accepted' || manageRequestForm.status === 'Denied') {
                console.log('Status check passed for leave request. Status:', manageRequestForm.status, 'isHR2Admin:', isHR2Admin);
                const historyEntry = {
                    ...currentManagingRequest,
                    status: manageRequestForm.status,
                    admin_notes: manageRequestForm.admin_notes || null,
                    processed_at: new Date().toISOString(),
                    employee_name: formatName(currentManagingRequest.employee)
                };
                console.log('Adding leave request to history:', historyEntry);
                setLeaveRequestHistory(prev => {
                    const newHistory = [historyEntry, ...prev];
                    console.log('Updated leave request history:', newHistory);
                    return newHistory;
                });

                if (isHR2Admin) {
                    console.log('Removing leave request from main table, current requests:', leaveRequests.length);
                    setLeaveRequests(prev => prev.filter(request => request.id !== currentManagingRequest.id));
                }
            } else {
                console.log('Status check failed for leave request. Status:', manageRequestForm.status);
            }

            toast.success(`Leave request ${manageRequestForm.status.toLowerCase()}ed successfully!`);

            setManageRequestDialogOpen(false);
            setCurrentManagingRequest(null);
            setManageRequestForm({ status: '', admin_notes: '' });

            loadLeaveRequests();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update leave request');
        }
    };

    const openManageTimesheetDialog = (request) => {
        setCurrentManagingRequest(request);
        setManageRequestForm({
            status: '',
            admin_notes: ''
        });
        setManageTimesheetDialogOpen(true);
    };

    const handleManageTimesheetDialog = async () => {
        console.log('handleManageTimesheetDialog called with status:', manageRequestForm.status);
        console.log('currentManagingRequest:', currentManagingRequest);
        console.log('currentManagingRequest keys:', currentManagingRequest ? Object.keys(currentManagingRequest) : 'null');
        console.log('currentManagingRequest employee:', currentManagingRequest?.employee);
        console.log('isHR2Admin:', isHR2Admin);

        if (!currentManagingRequest || !manageRequestForm.status) {
            toast.error('Please select an action (Accept or Deny)');
            return;
        }

        try {
            await hr2.timesheetAdjustments.updateStatus(currentManagingRequest.id, {
                status: manageRequestForm.status,
                admin_notes: manageRequestForm.admin_notes
            });

            if (manageRequestForm.status === 'Approved' || manageRequestForm.status === 'Rejected') {
                console.log('Status check passed for timesheet adjustment dialog. Status:', manageRequestForm.status, 'isHR2Admin:', isHR2Admin);
                const historyEntry = {
                    ...currentManagingRequest,
                    status: manageRequestForm.status,
                    admin_notes: manageRequestForm.admin_notes || null,
                    processed_at: new Date().toISOString(),
                    employee_name: formatName(currentManagingRequest.employee)
                };
                console.log('Adding timesheet adjustment to history from dialog:', historyEntry);
                setTimesheetAdjustmentHistory(prev => {
                    const newHistory = [historyEntry, ...prev];
                    console.log('Updated timesheet adjustment history from dialog:', newHistory);
                    return newHistory;
                });

                if (isHR2Admin) {
                    console.log('Removing timesheet adjustment from main table from dialog, current requests:', timesheetAdjustmentRequests.length);
                    setTimesheetAdjustmentRequests(prev => prev.filter(r => r.id !== currentManagingRequest.id));
                }
            } else {
                console.log('Status check failed for timesheet adjustment dialog. Status:', manageRequestForm.status);
            }

            toast.success(`Timesheet adjustment request ${manageRequestForm.status.toLowerCase()}d successfully`);
            setManageTimesheetDialogOpen(false);
            setCurrentManagingRequest(null);
            setManageRequestForm({ status: '', admin_notes: '' });

            loadTimesheetAdjustmentRequests();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update timesheet adjustment request');
        }
    };

    const handleTimesheetAdjustment = async () => {
        console.log('=== TIMESHEET ADJUSTMENT SUBMISSION TO BACKEND START ===');
        console.log('Form data:', timesheetAdjustmentForm);
        console.log('Employee ID:', employeeId);
        console.log('User roles - isHR2Admin:', isHR2Admin, 'isEmployee:', isEmployee);

        if (!timesheetAdjustmentForm.date || !timesheetAdjustmentForm.newTimeIn || !timesheetAdjustmentForm.newTimeOut || !timesheetAdjustmentForm.reason) {
            console.error('Validation failed: Missing required fields', {
                date: timesheetAdjustmentForm.date,
                newTimeIn: timesheetAdjustmentForm.newTimeIn,
                newTimeOut: timesheetAdjustmentForm.newTimeOut,
                reason: timesheetAdjustmentForm.reason
            });
            toast.error('Please fill in all timesheet adjustment fields.');
            return;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(timesheetAdjustmentForm.date)) {
            console.error('Validation failed: Invalid date format:', timesheetAdjustmentForm.date);
            toast.error('Please select a valid date.');
            return;
        }

        // allow fallback to authenticated user id or stored logged in id when employeeId is missing
        const employeeIdToUse = employeeId || currentUser?.id || loggedInEmployeeId;
        if (!employeeIdToUse || isNaN(parseInt(employeeIdToUse))) {
            console.error('Validation failed: Invalid employee ID:', employeeIdToUse);
            toast.error('Employee information not loaded correctly. Please refresh the page.');
            return;
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timesheetAdjustmentForm.newTimeIn) || !timeRegex.test(timesheetAdjustmentForm.newTimeOut)) {
            console.error('Validation failed: Invalid time format', {
                newTimeIn: timesheetAdjustmentForm.newTimeIn,
                newTimeOut: timesheetAdjustmentForm.newTimeOut
            });
            toast.error('Please enter times in HH:MM format (e.g., 09:00, 17:30).');
            return;
        }

        const startTime = timesheetAdjustmentForm.newTimeIn;
        const endTime = timesheetAdjustmentForm.newTimeOut;
        if (startTime >= endTime) {
            console.error('Validation failed: End time must be after start time');
            toast.error('End time must be after start time.');
            return;
        }

        try {
            const adjustmentData = {
                employee_id: parseInt(employeeIdToUse),
                date: timesheetAdjustmentForm.date,
                new_time_in: timesheetAdjustmentForm.newTimeIn,
                new_time_out: timesheetAdjustmentForm.newTimeOut,
                reason: timesheetAdjustmentForm.reason
            };

            console.log('Submitting timesheet adjustment to backend:', adjustmentData);

            const response = await hr2.timesheetAdjustments.create(adjustmentData);
            console.log('Backend response:', response);

            toast.success('Timesheet adjustment request submitted successfully!');
            setTimesheetAdjustmentForm({ date: '', newTimeIn: '', newTimeOut: '', reason: '' });
            setTimesheetAdjustmentDialogOpen(false);

            loadTimesheetAdjustmentRequests();

            console.log('=== TIMESHEET ADJUSTMENT SUBMISSION TO BACKEND COMPLETE ===');
        } catch (e) {
            console.error('Error submitting timesheet adjustment to backend:', e);
            console.error('Error response:', e.response?.data);
            const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to submit timesheet adjustment';
            toast.error(errorMessage);
        }
    };

    const loadTimesheetAdjustmentRequests = async () => {
        try {
            console.log('Current employeeId:', employeeId);
            console.log('Current userRole:', userRole);
            console.log('isHR2Admin:', isHR2Admin, 'isEmployee:', isEmployee);

            if (isHR2Admin) {
                console.log('Admin view: Loading ONLY PENDING timesheet adjustment requests from backend...');
                const response = await hr2.timesheetAdjustments.getAll();
                const allRequests = response.data || [];
                console.log('All timesheet adjustment requests from backend:', allRequests);

                const pendingRequests = allRequests.filter(request => request.status === 'Pending');
                console.log('Filtered pending timesheet adjustment requests:', pendingRequests);

                pendingRequests.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

                setTimesheetAdjustmentRequests(pendingRequests);
                console.log('HR2 Admin - Final loaded PENDING adjustment requests:', pendingRequests);

                if (allRequests.length > 0) { }
            } else if (employeeId) {
                console.log('Employee view: Loading personal timesheet adjustment requests from backend for employeeId:', employeeId);
                const response = await hr2.timesheetAdjustments.getByEmployee(employeeId);
                const requests = response.data || [];
                setTimesheetAdjustmentRequests(requests);
                console.log('Employee - Loaded saved adjustment requests:', requests);

                await loadEmployeeTimesheet(employeeId);
            } else {
                console.log('No employeeId available, cannot load timesheet adjustment requests');
                setTimesheetAdjustmentRequests([]);
                setTimesheet([]);
            }

            console.log('=== FINISHED LOADING TIMESHEET ADJUSTMENT REQUESTS FROM BACKEND ===');
        } catch (e) {
            console.error('Failed to load timesheet adjustment requests from backend:', e);
            toast.error('Failed to load timesheet adjustment requests from server');
            setTimesheetAdjustmentRequests([]);
        }
    };
    const loadEmployeeTimesheet = async (empId) => {
        try {
            console.log('Loading employee timesheet from backend for:', empId);

            const response = await hr2.timesheetAdjustments.getByEmployee(empId, { status: 'Approved' });
            const approvedAdjustments = response.data || [];

            console.log('Approved adjustments from backend:', approvedAdjustments);

            const timesheetEntries = approvedAdjustments.map(adjustment => ({
                id: adjustment.id,
                date: adjustment.date,
                timeIn: adjustment.new_time_in,
                timeOut: adjustment.new_time_out,
                overtime: calculateOvertime(adjustment.new_time_in, adjustment.new_time_out),
                status: 'Complete',
                approved_at: adjustment.approved_at || adjustment.submitted_at
            }));

            timesheetEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

            console.log('Loaded timesheet entries from approved adjustments:', timesheetEntries);
            setTimesheet(timesheetEntries);

            if (timesheetEntries.length > 0) {
                console.log(`Employee ${empId} has ${timesheetEntries.length} approved timesheet entries`);
            } else {
                console.log(`No approved timesheet entries found for employee ${empId}`);
            }
        } catch (e) {
            console.error('Error loading employee timesheet from backend:', e);
            setTimesheet([]);
        }
    };

    const calculateOvertime = (timeIn, timeOut) => {
        try {
            const [inHours, inMinutes] = timeIn.split(':').map(Number);
            const [outHours, outMinutes] = timeOut.split(':').map(Number);

            const inTotalMinutes = inHours * 60 + inMinutes;
            const outTotalMinutes = outHours * 60 + outMinutes;

            const workedMinutes = outTotalMinutes - inTotalMinutes;
            const regularHours = 8 * 60; // 8 hours = 480 minutes

            if (workedMinutes > regularHours) {
                const overtimeMinutes = workedMinutes - regularHours;
                const overtimeHours = Math.floor(overtimeMinutes / 60);
                const overtimeMins = overtimeMinutes % 60;
                return overtimeHours > 0 ? `${overtimeHours}h ${overtimeMins}m` : `${overtimeMins}m`;
            }

            return '0h';
        } catch (e) {
            console.error('Error calculating overtime:', e);
            return '0h';
        }
    };

    const formatTime12hr = (time24hr) => {
        try {
            if (!time24hr || typeof time24hr !== 'string') {
                return 'N/A';
            }
            const [hours, minutes] = time24hr.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const hours12 = hours % 12 || 12;
            return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
        } catch (e) {
            console.error('Error formatting time:', e);
            return time24hr || 'N/A';
        }
    };

    // Reimbursement functions
    const loadReimbursementRequests = async () => {
        try {
            console.log('loadReimbursementRequests called - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);

            if (isHR2Admin) {
                console.log('Admin view: Loading ONLY PENDING reimbursement requests from backend...');
                const response = await hr2.reimbursements.getAll();
                const allRequests = response.data || [];
                console.log('All reimbursement requests from backend:', allRequests);

                const pendingRequests = allRequests.filter(request => request.status === 'Pending');
                console.log('Filtered pending reimbursement requests:', pendingRequests);

                pendingRequests.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

                setReimbursementRequests(pendingRequests);
                console.log('HR2 Admin - Final loaded PENDING reimbursement requests:', pendingRequests);
            } else if (employeeId) {
                console.log('Employee view: Loading personal reimbursement requests from backend for employeeId:', employeeId);
                const response = await hr2.reimbursements.getByEmployee(employeeId);
                const requests = response.data || [];
                setReimbursementRequests(requests);
                console.log('Employee - Loaded reimbursement requests:', requests);
            } else {
                console.log('No employeeId available, cannot load reimbursement requests');
                setReimbursementRequests([]);
            }

            console.log('=== FINISHED LOADING REIMBURSEMENT REQUESTS FROM BACKEND ===');
        } catch (e) {
            console.error('Failed to load reimbursement requests from backend:', e);
            toast.error('Failed to load reimbursement requests from server');
            setReimbursementRequests([]);
        }
    };

    const handleReimbursementSubmit = async () => {
        console.log('=== REIMBURSEMENT SUBMISSION TO BACKEND START ===');
        console.log('Form data:', reimbursementForm);
        console.log('Employee ID:', employeeId);
        // Validation
        if (!reimbursementForm.type || !reimbursementForm.amount || !reimbursementForm.date || !reimbursementForm.description || !reimbursementForm.receipt) {
            console.error('Validation failed: Missing required fields');
            toast.error('Please fill in all required fields, including uploading a receipt.');
            return;
        }

        // allow fallback to authenticated user id or stored logged in id when employeeId is missing
        const employeeIdToUse = employeeId || currentUser?.id || loggedInEmployeeId;
        if (!employeeIdToUse || isNaN(parseInt(employeeIdToUse))) {
            console.error('Validation failed: Invalid employee ID:', employeeIdToUse);
            toast.error('Employee information not loaded correctly. Please refresh the page.');
            return;
        }

        const amount = parseFloat(reimbursementForm.amount);
        if (isNaN(amount) || amount <= 0) {
            console.error('Validation failed: Invalid amount:', reimbursementForm.amount);
            toast.error('Please enter a valid amount greater than 0.');
            return;
        }

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('employee_id', parseInt(employeeIdToUse));
            formData.append('type', reimbursementForm.type);
            formData.append('amount', amount);
            formData.append('date', reimbursementForm.date);
            formData.append('description', reimbursementForm.description);

            if (reimbursementForm.receipt) {
                formData.append('receipt', reimbursementForm.receipt);
            }

            console.log('Submitting reimbursement to backend with FormData');

            const response = await hr2.reimbursements.create(formData);
            console.log('Backend response:', response);

            toast.success('Reimbursement request submitted successfully!');
            setReimbursementForm({ type: '', amount: '', date: '', description: '', receipt: null });
            setReimbursementDialogOpen(false);
            loadReimbursementRequests();
            // Dispatch custom event for real-time updates
            window.dispatchEvent(new CustomEvent('reimbursementSubmitted', { detail: { employee_id: parseInt(employeeIdToUse) } }));

            console.log('=== REIMBURSEMENT SUBMISSION TO BACKEND COMPLETE ===');
        } catch (e) {
            console.error('Error submitting reimbursement to backend:', e);
            console.error('Error response:', e.response?.data);
            const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to submit reimbursement';
            toast.error(errorMessage);
        }
    };

    const handleManageReimbursement = async (request, status) => {
        console.log('handleManageReimbursement called with request:', request, 'status:', status);
        console.log('Request object keys:', Object.keys(request));
        console.log('Request employee data:', request.employee);
        console.log('isHR2Admin:', isHR2Admin);

        try {
            console.log(`=== UPDATING REIMBURSEMENT REQUEST STATUS TO ${status} ===`);
            console.log('Request:', request);
            const response = await hr2.reimbursements.updateStatus(request.id, { status });
            console.log('Backend update response:', response);

            if (status === 'Approved' || status === 'Rejected') {
                console.log('Status check passed for reimbursement. Status:', status, 'isHR2Admin:', isHR2Admin);
                const historyEntry = {
                    ...request,
                    status: status,
                    admin_notes: null,
                    processed_at: new Date().toISOString(),
                    employee_name: formatName(request.employee)
                };
                console.log('Adding reimbursement to history:', historyEntry);
                setReimbursementHistory(prev => {
                    const newHistory = [historyEntry, ...prev];
                    console.log('Updated reimbursement history:', newHistory);
                    return newHistory;
                });
                if (isHR2Admin) {
                    console.log('Removing reimbursement from main table, current requests:', reimbursementRequests.length);
                    setReimbursementRequests(prev => prev.filter(r => r.id !== request.id));
                }
            } else {
                console.log('Status check failed for reimbursement. Status:', status);
            }
            loadReimbursementRequests();

            toast.success(`Reimbursement request ${status.toLowerCase()}d successfully!`);
            console.log('=== REIMBURSEMENT STATUS UPDATE COMPLETE ===');
        } catch (e) {
            console.error('Failed to update reimbursement request:', e);
            const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to update reimbursement request';
            toast.error(errorMessage);
        }
    };

    const handleCancelReimbursement = async (requestId) => {
        if (!confirm('Are you sure you want to cancel this reimbursement request?')) {
            return;
        }

        try {
            console.log('=== CANCELLING REIMBURSEMENT REQUEST ===');
            console.log('Request ID:', requestId);

            const response = await hr2.reimbursements.delete(requestId);
            console.log('Backend delete response:', response);
            loadReimbursementRequests();

            toast.success('Reimbursement request cancelled successfully!');
            console.log('=== REIMBURSEMENT CANCELLATION COMPLETE ===');
        } catch (e) {
            console.error('Failed to cancel reimbursement request:', e);
            const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to cancel reimbursement request';
            toast.error(errorMessage);
        }
    };

    const openManageReimbursementDialog = (request) => {
        setCurrentManagingRequest(request);
        setManageRequestForm({
            status: '',
            admin_notes: ''
        });
        setManageReimbursementDialogOpen(true);
    };

    const handleManageReimbursementDialog = async () => {
        console.log('handleManageReimbursementDialog called with status:', manageRequestForm.status);
        console.log('currentManagingRequest:', currentManagingRequest);

        if (!currentManagingRequest || !manageRequestForm.status) {
            toast.error('Please select an action (Approve or Reject)');
            return;
        }

        try {
            await hr2.reimbursements.updateStatus(currentManagingRequest.id, {
                status: manageRequestForm.status,
                admin_notes: manageRequestForm.admin_notes
            });

            if (manageRequestForm.status === 'Approved' || manageRequestForm.status === 'Rejected') {
                console.log('Status check passed for reimbursement dialog. Status:', manageRequestForm.status, 'isHR2Admin:', isHR2Admin);
                const historyEntry = {
                    ...currentManagingRequest,
                    status: manageRequestForm.status,
                    admin_notes: manageRequestForm.admin_notes || null,
                    processed_at: new Date().toISOString(),
                    employee_name: formatName(currentManagingRequest.employee)
                };
                console.log('Adding reimbursement to history from dialog:', historyEntry);
                setReimbursementHistory(prev => {
                    const newHistory = [historyEntry, ...prev];
                    console.log('Updated reimbursement history from dialog:', newHistory);
                    return newHistory;
                });
                if (isHR2Admin) {
                    console.log('Removing reimbursement from main table from dialog, current requests:', reimbursementRequests.length);
                    setReimbursementRequests(prev => prev.filter(r => r.id !== currentManagingRequest.id));
                }
            } else {
                console.log('Status check failed for reimbursement dialog. Status:', manageRequestForm.status);
            }

            toast.success(`Reimbursement request ${manageRequestForm.status.toLowerCase()}d successfully`);
            setManageReimbursementDialogOpen(false);
            setCurrentManagingRequest(null);
            setManageRequestForm({ status: '', admin_notes: '' });
            loadReimbursementRequests();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update reimbursement request');
        }
    };

    const loadReimbursementHistory = async () => {
        try {
            console.log('Loading reimbursement history from backend for HR2 Admin');

            const [approvedResponse, rejectedResponse] = await Promise.all([
                hr2.reimbursements.getApproved(),
                hr2.reimbursements.getRejected()
            ]);

            const approvedRequests = approvedResponse.data || [];
            const rejectedRequests = rejectedResponse.data || [];

            const historyData = [...approvedRequests, ...rejectedRequests].map(request => ({
                ...request,
                employee_name: formatName(request.employee),
                processed_at: request.updated_at || request.processed_at
            }));

            console.log('Loaded reimbursement history from backend:', historyData);
            setReimbursementHistory(historyData);

        } catch (error) {
            console.error('Failed to load reimbursement history from backend:', error);
            console.log('Falling back to localStorage for reimbursement history');
        }
    };

    const handleViewReceipt = (request) => {
        if (request.receipt_path) {
            setSelectedReceipt(request);
            setReceiptViewDialogOpen(true);
        } else {
            toast.info('No receipt uploaded for this reimbursement request');
        }
    };
    const handleCancelTimesheetAdjustment = async (requestId) => {
        if (!confirm('Are you sure you want to cancel this timesheet adjustment request?')) {
            return;
        }

        try {
            console.log('=== CANCELLING TIMESHEET ADJUSTMENT REQUEST ===');
            console.log('Request ID:', requestId);

            const response = await hr2.timesheetAdjustments.delete(requestId);
            console.log('Backend delete response:', response);
            loadTimesheetAdjustmentRequests();

            toast.success('Timesheet adjustment request cancelled successfully!');
            console.log('=== TIMESHEET ADJUSTMENT CANCELLATION COMPLETE ===');
        } catch (e) {
            console.error('Failed to cancel timesheet adjustment request:', e);
            const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to cancel timesheet adjustment request';
            toast.error(errorMessage);
        }
    };

    const handleManageTimesheetRequest = async (request, status) => {
        console.log('handleManageTimesheetRequest called with request:', request, 'status:', status);
        console.log('Request object keys:', Object.keys(request));
        console.log('Request employee data:', request.employee);
        console.log('isHR2Admin:', isHR2Admin);

        try {
            console.log(`=== UPDATING TIMESHEET ADJUSTMENT REQUEST STATUS TO ${status} ===`);
            console.log('Request:', request);
            const response = await hr2.timesheetAdjustments.updateStatus(request.id, { status });
            console.log('Backend update response:', response);

            if (status === 'Approved' || status === 'Rejected') {
                console.log('Status check passed for timesheet adjustment. Status:', status, 'isHR2Admin:', isHR2Admin);
                const historyEntry = {
                    ...request,
                    status: status,
                    admin_notes: null,
                    processed_at: new Date().toISOString(),
                    employee_name: formatName(request.employee)
                };
                console.log('Adding timesheet adjustment to history:', historyEntry);
                setTimesheetAdjustmentHistory(prev => {
                    const newHistory = [historyEntry, ...prev];
                    console.log('Updated timesheet adjustment history:', newHistory);
                    return newHistory;
                });
                if (isHR2Admin) {
                    console.log('Removing timesheet adjustment from main table, current requests:', timesheetAdjustmentRequests.length);
                    setTimesheetAdjustmentRequests(prev => prev.filter(r => r.id !== request.id));
                }
            } else {
                console.log('Status check failed for timesheet adjustment. Status:', status);
            }

            if (status === 'Approved') {
                console.log('Request approved - updating employee timesheet for:', request.employee_id);
                await loadEmployeeTimesheet(request.employee_id);
            }

            loadTimesheetAdjustmentRequests();

            toast.success(`Timesheet adjustment request ${status.toLowerCase()}d successfully!`);
            console.log('=== TIMESHEET ADJUSTMENT STATUS UPDATE COMPLETE ===');
        } catch (e) {
            console.error('Failed to update timesheet adjustment request:', e);
            const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to update timesheet adjustment request';
            toast.error(errorMessage);
        }
    };

    const [leaveRequests, setLeaveRequests] = useState([]);
    const [leaveForm, setLeaveForm] = useState({
        type: '',
        start: '',
        end: '',
        reason: ''
    });

    const [employeeId, setEmployeeId] = useState(null);
    const [authUserId, setAuthUserId] = useState(null);
    const loggedInEmployeeId = currentUser?.id || localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : localStorage.getItem('employeeId');
    console.log('Component initialized - currentUser:', currentUser, 'loggedInEmployeeId:', loggedInEmployeeId);
    const [searchId, setSearchId] = useState("");
    const [profile, setProfile] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [userAccounts, setUserAccounts] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const isHR2Admin = userRole === 'HR2 Admin' || userRole === 'hr2_admin' || userRole === 'HR2 Admin';
    const isEmployee = userRole === 'Employee';
    console.log('User role state:', userRole, 'isHR2Admin:', isHR2Admin);
    const [serverStatus, setServerStatus] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Manage leave request dialog state
    const [leaveRequestDialogOpen, setLeaveRequestDialogOpen] = useState(false);
    const [manageRequestDialogOpen, setManageRequestDialogOpen] = useState(false);
    const [manageTimesheetDialogOpen, setManageTimesheetDialogOpen] = useState(false);
    const [currentManagingRequest, setCurrentManagingRequest] = useState(null);
    const [manageRequestForm, setManageRequestForm] = useState({
        status: '',
        admin_notes: ''
    });
    // Manage all requests dialog state
    const [manageAllRequestsDialogOpen, setManageAllRequestsDialogOpen] = useState(false);
    // History dialog states
    const [leaveHistoryDialogOpen, setLeaveHistoryDialogOpen] = useState(false);
    const [timesheetHistoryDialogOpen, setTimesheetHistoryDialogOpen] = useState(false);
    // Timesheet adjustment state
    const [timesheetAdjustmentForm, setTimesheetAdjustmentForm] = useState({
        date: '',
        newTimeIn: '',
        newTimeOut: '',
        reason: ''
    });
    const [timesheetAdjustmentDialogOpen, setTimesheetAdjustmentDialogOpen] = useState(false);

    const checkHR2Service = async () => {
        try {
            await hr2.users.getCombinedEmployees();
            return true;
        } catch (error) {
            console.error('HR2 service check failed:', error);
            toast.error('HR2 service is not available. Please contact administrator.');
            return false;
        }
    };

    const loadAllEmployees = async () => {
        try {
            const response = await hr2.users.getCombinedEmployees();
            const data = response.value || response.data || response;
            if (Array.isArray(data)) {
                setEmployees(data);
                setFilteredEmployees(data);
            } else {
                console.warn('Unexpected response format from combined employees:', response);
                setEmployees([]);
                setFilteredEmployees([]);
            }
        } catch (e) {
            console.log('Combined employees failed, falling back to auth users:', e.message);
            try {
                const users = await getUsers();
                if (Array.isArray(users)) {
                    const employeeData = users.map(user => ({
                        id: user.id,
                        name: user.name || '',
                        email: user.email || '',
                        first_name: user.name?.split(' ')[0] || user.name || '',
                        last_name: user.name?.split(' ').slice(1).join(' ') || '',
                        department: '',
                        position: '',
                        employee_data: null
                    }));
                    setEmployees(employeeData);
                    setFilteredEmployees(employeeData);
                } else {
                    setEmployees([]);
                    setFilteredEmployees([]);
                }
            } catch (fallbackError) {
                console.error('Failed to load any employee data:', fallbackError);
                toast.error('Failed to load employee list. Please check your connection.');
                setEmployees([]);
                setFilteredEmployees([]);
            }
        }
    };

    const loadUserAccounts = async () => {
        try {
            console.log('Loading user accounts from auth API...');
            const users = await getUsers();
            console.log('User accounts loaded:', users);
            if (Array.isArray(users)) {
                const enhancedUsers = users.map(user => ({
                    ...user,
                    first_name: user.first_name || user.name?.split(' ')[0] || user.name || '',
                    last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
                }));
                setUserAccounts(enhancedUsers);
                console.log('Enhanced user accounts set:', enhancedUsers);
            } else {
                console.warn('Unexpected response format from getUsers:', users);
                setUserAccounts([]);
            }
        } catch (error) {
            console.error('Failed to load user accounts:', error);
            console.error('Error details:', error.response?.status, error.response?.data, error.message);

            // Handle authentication errors by logging out
            if (error.response?.status === 401) {
                console.log('Authentication failed, logging out...');
                if (logout) {
                    logout();
                } else {
                    // Fallback: clear auth state manually
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    navigate('/login');
                }
                return;
            }

            // Don't show toast error here - fetchUserRole has fallback logic
            // toast.error('Failed to load user accounts. Please check your connection.');
            setUserAccounts([]);
        }
    };

    const loadLeaveRequests = async () => {
        console.log('loadLeaveRequests called - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);

        try {
            if (isHR2Admin) {
                console.log('User is HR2 Admin, loading ONLY PENDING leave requests for management');
                const response = await hr2.leaveRequests.getAll();
                console.log('getAll response:', response);
                const allRequests = response.data || [];
                const pendingRequests = allRequests.filter(request => request.status === 'Pending');
                console.log('Filtered pending leave requests for admin:', pendingRequests);
                setLeaveRequests(pendingRequests);
                console.log('Loaded pending leave requests for admin:', pendingRequests.length, 'requests');
                return;
            }

            if (employeeId) {
                console.log('Loading employee-specific requests for employeeId:', employeeId);
                const response = await hr2.leaveRequests.getByEmployee(employeeId);
                console.log('getByEmployee response:', response);
                setLeaveRequests(response.data || []);
                console.log('Loaded employee leave requests:', response.data);
                return;
            }

            console.log('No employeeId available, trying to load all requests as fallback');
            const response = await hr2.leaveRequests.getAll();
            console.log('getAll fallback response:', response);
            setLeaveRequests(response.data || []);
            console.log('Loaded all leave requests as fallback:', response.data);

        } catch (error) {
            console.log('Error loading leave requests:', error);

            if (isHR2Admin && employeeId && (error.response?.status === 403 || error.response?.status === 401)) {
                console.log('HR2 Admin access to all requests failed, trying employee-specific requests');
                try {
                    const response = await hr2.leaveRequests.getByEmployee(employeeId);
                    console.log('HR2 Admin fallback getByEmployee response:', response);
                    setLeaveRequests(response.data || []);
                    console.log('Loaded HR2 Admin employee leave requests as fallback:', response.data);
                } catch (fallbackError) {
                    console.log('HR2 Admin fallback also failed:', fallbackError);
                    setLeaveRequests([]);
                }
            } else if (employeeId && (error.response?.status === 403 || error.response?.status === 401)) {
                console.log('Admin access failed, trying employee-specific requests');
                try {
                    const response = await hr2.leaveRequests.getByEmployee(employeeId);
                    console.log('Fallback getByEmployee response:', response);
                    setLeaveRequests(response.data || []);
                    console.log('Loaded employee leave requests as fallback:', response.data);
                } catch (fallbackError) {
                    console.log('Fallback also failed:', fallbackError);
                    setLeaveRequests([]);
                }
            } else {
                setLeaveRequests([]);
            }
        }
    };

    const fetchUserRole = async () => {
        try {
            const userId = currentUser?.id || loggedInEmployeeId;

            console.log('fetchUserRole called - currentUser:', currentUser, 'userId:', userId);
            console.log('userAccounts available:', userAccounts.length, 'employees available:', employees.length);

            if (userId) {
                const user = userAccounts.find(u => String(u.id) === String(userId));
                console.log('Found user in userAccounts:', user);

                if (user && user.role) {
                    setUserRole(user.role);

                    if (user.role === 'HR2 Admin') {
                        console.log('HR2 Admin role detected, loading all timesheet adjustment requests');
                    }
                } else {
                    try {
                        console.log('Fetching user from API for ID:', userId);
                        const userData = await getUser(userId);
                        console.log('User data from API:', userData);

                        if (userData && userData.role) {
                            setUserRole(userData.role);
                            console.log('User role fetched from API:', userData.role);

                            if (userData.role === 'HR2 Admin') {
                                console.log('HR2 Admin role detected from API, loading all timesheet adjustment requests');
                            }
                        } else {
                            setUserRole('Employee');
                            console.log('User role defaulted to Employee - no role in API response');
                        }
                    } catch (apiError) {
                        console.error('Failed to fetch user role from API:', apiError);
                        setUserRole('Employee');
                    }
                }
            } else {
                setUserRole('Employee');
                console.log('User role defaulted to Employee - no user ID');
            }
        } catch (error) {
            console.error('Error determining user role:', error);
            setUserRole('Employee');
        }
    };

    // Load leave request history for HR2 Admin
    const loadLeaveRequestHistory = async () => {
        try {
            console.log('Loading leave request history from backend for HR2 Admin');

            const [approvedResponse, deniedResponse] = await Promise.all([
                hr2.leaveRequests.getApproved(),
                hr2.leaveRequests.getDenied()
            ]);

            const approvedRequests = approvedResponse.data || [];
            const deniedRequests = deniedResponse.data || [];
            const historyData = [...approvedRequests, ...deniedRequests].map(request => ({
                ...request,
                employee_name: formatName(request.employee),
                processed_at: request.updated_at || request.processed_at,
                status: request.status === 'Accepted' ? 'Approved' : request.status === 'Denied' ? 'Rejected' : request.status
            }));

            console.log('Loaded leave request history from backend:', historyData);
            setLeaveRequestHistory(historyData);

        } catch (error) {
            console.error('Failed to load leave request history from backend:', error);
            console.log('Falling back to localStorage for leave request history');
        }
    };

    // Load timesheet adjustment history for HR2 Admin
    const loadTimesheetAdjustmentHistory = async () => {
        try {
            console.log('Loading timesheet adjustment history from backend for HR2 Admin');

            const [approvedResponse, rejectedResponse] = await Promise.all([
                hr2.timesheetAdjustments.getApproved(),
                hr2.timesheetAdjustments.getRejected()
            ]);

            const approvedRequests = approvedResponse.data || [];
            const rejectedRequests = rejectedResponse.data || [];
            const historyData = [...approvedRequests, ...rejectedRequests].map(request => ({
                ...request,
                employee_name: formatName(request.employee),
                processed_at: request.updated_at || request.processed_at
            }));

            console.log('Loaded timesheet adjustment history from backend:', historyData);
            setTimesheetAdjustmentHistory(historyData);

        } catch (error) {
            console.error('Failed to load timesheet adjustment history from backend:', error);
            console.log('Falling back to localStorage for timesheet adjustment history');
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            const serviceAvailable = await checkHR2Service();
            if (!serviceAvailable) {
                setError('HR2 service is not available. Please contact administrator.');
                setLoading(false);
                return;
            }

            await loadAllEmployees();
            await loadUserAccounts();
            setLoading(false);
        };

        initializeApp();
    }, []);

    useEffect(() => {
        if (employees.length > 0) {
            fetchUserRole();
        }
    }, [employees.length]);

    useEffect(() => {
        if (userAccounts.length > 0) {
            fetchUserRole();
        }
    }, [userAccounts.length]);

    useEffect(() => {
        if (currentUser?.id && employees.length > 0) {
            console.log('Loading profile for:', currentUser.id, 'with', employees.length, 'employees loaded');
            // Note: loadProfile is not needed in newfile2.jsx as it's in newfile1.jsx

            // Set employeeId by finding matching employee record
            const matchingEmployee = employees.find(emp => String(emp.id) === String(currentUser.id) || String(emp.user_id) === String(currentUser.id));
            if (matchingEmployee) {
                console.log('Found matching employee record:', matchingEmployee);
                setEmployeeId(matchingEmployee.id);
            } else {
                console.log('No matching employee record found for user ID:', currentUser.id);
                // Fallback: try to find by email
                const employeeByEmail = employees.find(emp => emp.email === currentUser.email);
                if (employeeByEmail) {
                    console.log('Found employee by email:', employeeByEmail);
                    setEmployeeId(employeeByEmail.id);
                } else {
                    console.log('No employee record found, employeeId remains null');
                }
            }
        }
    }, [currentUser?.id, employees.length]);

    useEffect(() => {
        const checkStatus = async () => {
            const status = await checkServerStatus();
            setServerStatus(status);
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    // Auto-refresh data
    useEffect(() => {
        const interval = setInterval(() => {
            if ((employeeId || isHR2Admin) &&
                !leaveRequestDialogOpen &&
                !timesheetAdjustmentDialogOpen &&
                !manageRequestDialogOpen &&
                !manageTimesheetDialogOpen &&
                !manageReimbursementDialogOpen) {
                console.log('Data refreshed automatically');
                loadLeaveRequests();
                loadTimesheetAdjustmentRequests();
                loadReimbursementRequests();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [employeeId, isHR2Admin, leaveRequestDialogOpen, timesheetAdjustmentDialogOpen, manageRequestDialogOpen, manageTimesheetDialogOpen, manageReimbursementDialogOpen]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && (employeeId || isHR2Admin) &&
                !leaveRequestDialogOpen &&
                !timesheetAdjustmentDialogOpen &&
                !manageRequestDialogOpen &&
                !manageTimesheetDialogOpen &&
                !manageReimbursementDialogOpen) {
                console.log('Data refreshed automatically on visibility change');
                loadLeaveRequests();
                loadTimesheetAdjustmentRequests();
                loadReimbursementRequests();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [employeeId, isHR2Admin, leaveRequestDialogOpen, timesheetAdjustmentDialogOpen, manageRequestDialogOpen, manageTimesheetDialogOpen, manageReimbursementDialogOpen]);

    useEffect(() => {
        console.log('useEffect triggered for loadLeaveRequests - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);
        if (employeeId || isHR2Admin) {
            console.log('Calling loadLeaveRequests because employeeId is set or user is HR2 Admin');
            loadLeaveRequests();
        } else {
            console.log('Not calling loadLeaveRequests because neither employeeId nor HR2 Admin role is set');
        }
    }, [employeeId, userRole]);

    useEffect(() => {
        console.log('useEffect triggered for loadTimesheetAdjustmentRequests - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);
        if (employeeId || isHR2Admin) {
            console.log('Calling loadTimesheetAdjustmentRequests because employeeId is set or user is HR2 Admin');
            loadTimesheetAdjustmentRequests();
        } else {
            console.log('Not calling loadTimesheetAdjustmentRequests because neither employeeId nor HR2 Admin role is set');
        }
    }, [employeeId, userRole]);

    useEffect(() => {
        if (isHR2Admin) {
            loadLeaveRequestHistory();
            loadTimesheetAdjustmentHistory();
        }
    }, [isHR2Admin]);

    useEffect(() => {
        console.log('useEffect triggered for loadReimbursementRequests - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);
        if (employeeId || isHR2Admin) {
            console.log('Calling loadReimbursementRequests');
            loadReimbursementRequests();
        }
    }, [employeeId, userRole]);

    useEffect(() => {
        if (isHR2Admin) {
            loadLeaveRequestHistory();
            loadTimesheetAdjustmentHistory();
            loadReimbursementHistory();
        }
    }, [isHR2Admin]);

    // Auto-refresh timesheet adjustment requests
    useEffect(() => {
        if (isHR2Admin) {
            const interval = setInterval(() => {
                loadTimesheetAdjustmentRequests();
            }, 10000); // 10 seconds

            return () => clearInterval(interval);
        }
    }, [isHR2Admin]);

    useEffect(() => {
        const handleTimesheetAdjustmentSubmitted = (event) => {
            console.log('Received timesheet adjustment submission event:', event.detail);
            if (isHR2Admin) {
                console.log('Admin detected - refreshing timesheet adjustment requests');
                loadTimesheetAdjustmentRequests();
            }
        };
        window.addEventListener('timesheetAdjustmentSubmitted', handleTimesheetAdjustmentSubmitted);

        return () => {
            window.removeEventListener('timesheetAdjustmentSubmitted', handleTimesheetAdjustmentSubmitted);
        };
    }, [isHR2Admin]);

    useEffect(() => {
        const handleLeaveRequestSubmitted = (event) => {
            console.log('Received leave request submission event:', event.detail);
            loadLeaveRequests();
        };
        window.addEventListener('leaveRequestSubmitted', handleLeaveRequestSubmitted);

        return () => {
            window.removeEventListener('leaveRequestSubmitted', handleLeaveRequestSubmitted);
        };
    }, []);

    useEffect(() => {
        const handleReimbursementSubmitted = (event) => {
            console.log('Received reimbursement submission event:', event.detail);
            loadReimbursementRequests();
        };
        window.addEventListener('reimbursementSubmitted', handleReimbursementSubmitted);

        return () => {
            window.removeEventListener('reimbursementSubmitted', handleReimbursementSubmitted);
        };
    }, []);

    useEffect(() => {
        try {
            console.log('Saving shared leave request history to localStorage:', leaveRequestHistory);
            localStorage.setItem('hr2_leaveRequestHistory', JSON.stringify(leaveRequestHistory));
            console.log('Shared leave request history saved to localStorage successfully');
        } catch (error) {
            console.error('Error saving shared leave request history to localStorage:', error);
        }
    }, [leaveRequestHistory]);

    useEffect(() => {
        try {
            console.log('Saving shared timesheet adjustment history to localStorage:', timesheetAdjustmentHistory);
            localStorage.setItem('hr2_timesheetAdjustmentHistory', JSON.stringify(timesheetAdjustmentHistory));
            console.log('Shared timesheet adjustment history saved to localStorage successfully');
        } catch (error) {
            console.error('Error saving shared timesheet adjustment history to localStorage:', error);
        }
    }, [timesheetAdjustmentHistory]);

    useEffect(() => {
        try {
            console.log('Saving reimbursement history to localStorage:', reimbursementHistory);
            localStorage.setItem('hr2_reimbursementHistory', JSON.stringify(reimbursementHistory));
            console.log('Reimbursement history saved to localStorage successfully');
        } catch (error) {
            console.error('Error saving reimbursement history to localStorage:', error);
        }
    }, [reimbursementHistory]);

    const formatName = (p) => {
        if (!p) return "";
        let name = p.last_name || "";
        if (p.first_name) name = p.first_name + " " + name;
        return name.trim();
    };

    // CSV Export function
    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) {
            toast.error('No data to export');
            return;
        }

        // Define database table columns for each history type (matching actual database schema)
        const databaseColumns = {
            'leave_request_history': [
                'id', 'employee_id', 'type', 'start', 'end', 'reason', 'status',
                'admin_notes', 'approved_by', 'approved_at', 'created_at', 'updated_at'
            ],
            'timesheet_adjustment_history': [
                'id', 'employee_id', 'date', 'new_time_in', 'new_time_out', 'reason', 'status',
                'admin_notes', 'approved_by', 'approved_at', 'submitted_at', 'created_at', 'updated_at'
            ],
            'reimbursement_history': [
                'id', 'employee_id', 'type', 'amount', 'date', 'description', 'receipt_path', 'status',
                'admin_notes', 'approved_by', 'approved_at', 'submitted_at', 'created_at', 'updated_at'
            ]
        };

        // Use database columns for known history types, otherwise use all available keys
        const headers = databaseColumns[filename] || Object.keys(data[0]);

        // Filter data to only include the columns we want to export
        const filteredData = data.map(row => {
            const filteredRow = {};
            headers.forEach(header => {
                if (row.hasOwnProperty(header)) {
                    filteredRow[header] = row[header];
                } else {
                    // Handle special cases where frontend field names differ from database
                    switch (header) {
                        case 'employee_id':
                            filteredRow[header] = row.employee_id || row.id; // fallback
                            break;
                        case 'approved_at':
                            filteredRow[header] = row.approved_at || row.processed_at || row.updated_at;
                            break;
                        case 'submitted_at':
                            filteredRow[header] = row.submitted_at || row.created_at;
                            break;
                        default:
                            filteredRow[header] = row[header] || '';
                    }
                }
            });
            return filteredRow;
        });

        const csvContent = [
            headers.join(','),
            ...filteredData.map(row =>
                headers.map(header => {
                    const value = row[header];
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exported successfully');
    };

    const checkServerStatus = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8092/api/hr2/employees', {
                method: 'HEAD',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Request Forms...</p>
                </div>
            </div>
        );
    }
    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Request Forms</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <ScrollText className="h-6 w-6 text-primary" />
                            <h1 className="text-lg font-semibold">Request Forms</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 space-y-8">
                {isEmployee && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Column 1: Leave Balance (1) */}
                        <div className="space-y-4">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">{dashboardStats.leaveBalance}</div>
                                    <p className="text-xs text-muted-foreground">Days remaining</p>
                                </CardContent>
                            </Card>

                            {/* Row 2, Column 1: Upcoming Trainings (3) */}
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Upcoming Trainings</CardTitle>
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{dashboardStats.upcomingTrainings}</div>
                                    <p className="text-xs text-muted-foreground">This month</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Column 2: Pending Requests (2) */}
                        <div className="space-y-4">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">{dashboardStats.pendingRequests}</div>
                                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                                </CardContent>
                            </Card>

                            {/* Row 2, Column 2: Completed Trainings (4) */}
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Completed Trainings</CardTitle>
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-600">{dashboardStats.completedTrainings}</div>
                                    <p className="text-xs text-muted-foreground">This year</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Column 3: Competency Profile (5) */}
                        <div className="w-106">
                            <Card className="hover:shadow-md transition-shadow h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        Competency Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Leadership</span>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Advanced</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Technical Skills</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Intermediate</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Communication</span>
                                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">Expert</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Column 5: Recent Timesheet (6) */}
                        <div className="w-106 ml-37">
                            <Card className="hover:shadow-md transition-shadow w-full h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-green-600" />
                                        {isHR2Admin ? 'Timesheet Adjustments' : 'Recent Timesheet'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isHR2Admin ? (
                                        <div className="space-y-3 max-h-48 overflow-y-auto">
                                            {timesheetAdjustmentRequests.length > 0 ? (
                                                timesheetAdjustmentRequests.slice(0, 3).map((request) => (
                                                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">
                                                                {request.employee ? `${request.employee.first_name} ${request.employee.last_name}` : 'Unknown Employee'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {new Date(request.date).toLocaleDateString()} • {request.new_time_in} - {request.new_time_out}
                                                            </div>
                                                            <Badge variant={
                                                                request.status === 'Approved' ? 'default' :
                                                                    request.status === 'Rejected' ? 'destructive' :
                                                                        'secondary'
                                                            } className="text-xs mt-1">
                                                                {request.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {request.status === 'Pending' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleManageTimesheetRequest(request, 'Approved')}
                                                                        className="bg-green-600 hover:bg-green-700 text-white h-6 px-2"
                                                                    >
                                                                        ✓
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleManageTimesheetRequest(request, 'Rejected')}
                                                                        className="h-6 px-2"
                                                                    >
                                                                        ✗
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-muted-foreground text-sm">
                                                    No adjustment requests yet
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {timesheet.slice(0, 3).map((entry) => (
                                                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                    <div>
                                                        <div className="text-sm font-medium">{entry.date}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {entry.timeIn} - {entry.timeOut}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium">{entry.overtime}</div>
                                                        <Badge variant={entry.status === 'Complete' ? 'default' : 'secondary'} className="text-xs">
                                                            {entry.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Leave Request | Timesheet Adjustments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Leave Requests Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Send className="w-5 h-5 text-orange-600" />
                                        Leave Requests
                                    </CardTitle>
                                </div>
                                <div className="flex gap-2">
                                    {/* {isHR2Admin && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                console.log('Opening leave history dialog');
                                                console.log('Current leaveRequestHistory:', leaveRequestHistory);
                                                console.log('leaveRequestHistory length:', leaveRequestHistory.length);
                                                setLeaveHistoryDialogOpen(true);
                                            }}
                                            className="gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            History
                                        </Button>
                                    )} */}
                                    {/* <Dialog open={leaveRequestDialogOpen} onOpenChange={setLeaveRequestDialogOpen}>
                                        {isEmployee && (
                                            <DialogTrigger asChild>
                                                <Button className="gap-2" onClick={() => setLeaveRequestDialogOpen(true)}>
                                                    <Plus className="w-4 h-4" />
                                                    New Leave Request
                                                </Button>
                                            </DialogTrigger>
                                        )}
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Submit Leave Request</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="leaveType">Leave Type</Label>
                                                    <Select value={leaveForm.type} onValueChange={(value) => setLeaveForm(f => ({ ...f, type: value }))}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select leave type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Vacation">Vacation Leave</SelectItem>
                                                            <SelectItem value="Sick">Sick Leave</SelectItem>
                                                            <SelectItem value="Emergency">Emergency Leave</SelectItem>
                                                            <SelectItem value="Personal">Personal Leave</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="startDate">Start Date</Label>
                                                        <Input
                                                            id="startDate"
                                                            type="date"
                                                            value={leaveForm.start}
                                                            onChange={(e) => setLeaveForm(f => ({ ...f, start: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="endDate">End Date</Label>
                                                        <Input
                                                            id="endDate"
                                                            type="date"
                                                            value={leaveForm.end}
                                                            onChange={(e) => setLeaveForm(f => ({ ...f, end: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="reason">Reason</Label>
                                                    <textarea
                                                        id="reason"
                                                        placeholder="Please provide a reason for your leave request"
                                                        value={leaveForm.reason}
                                                        onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleLeaveRequest}>Submit Request</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog> */}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-85 overflow-y-auto rounded-md p-2">
                                {Array.isArray(leaveRequests) && leaveRequests.length > 0 ? (
                                    leaveRequests.map((request) => (
                                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium">{request.type}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(request.start).toLocaleDateString()} - {new Date(request.end).toLocaleDateString()}
                                                </div>
                                                {request.reason && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {request.reason}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    request.status === 'Accepted' ? 'default' :
                                                        request.status === 'Denied' ? 'destructive' :
                                                            'secondary'
                                                }>
                                                    {request.status}
                                                </Badge>
                                                {request.status === 'Pending' && isHR2Admin && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openManageRequestDialog(request)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    ><Wrench className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {request.status === 'Pending' && !isHR2Admin && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelLeaveRequest(request.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                        No leave requests submitted yet
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timesheet Adjustments */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    Timesheet Adjustments
                                </CardTitle>
                                <div className="flex gap-2">
                                    {/* {isHR2Admin && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                console.log('Opening timesheet history dialog');
                                                console.log('Current timesheetAdjustmentHistory:', timesheetAdjustmentHistory);
                                                console.log('timesheetAdjustmentHistory length:', timesheetAdjustmentHistory.length);
                                                setTimesheetHistoryDialogOpen(true);
                                            }}
                                            className="gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            History
                                        </Button>
                                    )} */}
                                    {/* {!isHR2Admin && (
                                        <Dialog open={timesheetAdjustmentDialogOpen} onOpenChange={setTimesheetAdjustmentDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="default" size="sm">
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Request Adjustment
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Timesheet Adjustment Request</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="adjustmentDate">Date</Label>
                                                        <Input
                                                            id="adjustmentDate"
                                                            type="date"
                                                            value={timesheetAdjustmentForm.date}
                                                            onChange={(e) => setTimesheetAdjustmentForm(f => ({ ...f, date: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="newTimeIn">New Time In</Label>
                                                            <Input
                                                                id="newTimeIn"
                                                                type="time"
                                                                value={timesheetAdjustmentForm.newTimeIn}
                                                                onChange={(e) => setTimesheetAdjustmentForm(f => ({ ...f, newTimeIn: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="newTimeOut">New Time Out</Label>
                                                            <Input
                                                                id="newTimeOut"
                                                                type="time"
                                                                value={timesheetAdjustmentForm.newTimeOut}
                                                                onChange={(e) => setTimesheetAdjustmentForm(f => ({ ...f, newTimeOut: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="adjustmentReason">Reason</Label>
                                                        <textarea
                                                            id="adjustmentReason"
                                                            placeholder="Please explain the reason for this adjustment"
                                                            value={timesheetAdjustmentForm.reason}
                                                            onChange={(e) => setTimesheetAdjustmentForm(f => ({ ...f, reason: e.target.value }))}
                                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleTimesheetAdjustment}>Submit Request</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )} */}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-4 max-h-85 overflow-y-auto rounded-md p-2">
                                {timesheetAdjustmentRequests.length > 0 ? (
                                    timesheetAdjustmentRequests.map((request) => (
                                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {isHR2Admin ? `Requested by ${request.employee ? `${request.employee.first_name} ${request.employee.last_name}` : 'Unknown Employee'}` : 'Adjustment Request'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Date: {new Date(request.date).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Requested Time: {formatTime12hr(request.new_time_in || request.newTimeIn)} - {formatTime12hr(request.new_time_out || request.newTimeOut)}
                                                </div>

                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Reason: {request.reason}
                                                </div>


                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    request.status === 'Approved' ? 'default' :
                                                        request.status === 'Rejected' ? 'destructive' :
                                                            'secondary'
                                                }>
                                                    {request.status}
                                                </Badge>
                                                {request.status === 'Pending' && isHR2Admin && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openManageTimesheetDialog(request)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    ><Wrench className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {request.status === 'Pending' && !isHR2Admin && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelTimesheetAdjustment(request.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {isHR2Admin ? 'No timesheet adjustment requests from employees yet' : 'No timesheet adjustment requests submitted yet'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Expense Reimbursements */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-green-600" />
                                    Expense Reimbursements
                                </CardTitle>
                            </div>
                            <div className="flex gap-2">
                                {/* {isHR2Admin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            console.log('Opening reimbursement history dialog');
                                            console.log('Current reimbursementHistory:', reimbursementHistory);
                                            console.log('reimbursementHistory length:', reimbursementHistory.length);
                                            setReimbursementHistoryDialogOpen(true);
                                        }}
                                        className="gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        History
                                    </Button>
                                )} */}
                                {/* {!isHR2Admin && (
                                    <Dialog open={reimbursementDialogOpen} onOpenChange={setReimbursementDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="gap-2">
                                                <Plus className="w-4 h-4" />
                                                New Expense
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Submit Expense Reimbursement</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="expenseType">Expense Type</Label>
                                                    <Select value={reimbursementForm.type} onValueChange={(value) => setReimbursementForm(f => ({ ...f, type: value }))}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select expense type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Travel">Travel</SelectItem>
                                                            <SelectItem value="Meals">Meals</SelectItem>
                                                            <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                                                            <SelectItem value="Training">Training</SelectItem>
                                                            <SelectItem value="Transportation">Transportation</SelectItem>
                                                            <SelectItem value="Other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="expenseAmount">Amount</Label>
                                                    <Input
                                                        id="expenseAmount"
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={reimbursementForm.amount}
                                                        onChange={(e) => setReimbursementForm(f => ({ ...f, amount: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="expenseDate">Date</Label>
                                                    <Input
                                                        id="expenseDate"
                                                        type="date"
                                                        value={reimbursementForm.date}
                                                        onChange={(e) => setReimbursementForm(f => ({ ...f, date: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="expenseDescription">Description</Label>
                                                    <textarea
                                                        id="expenseDescription"
                                                        placeholder="Describe the expense"
                                                        value={reimbursementForm.description}
                                                        onChange={(e) => setReimbursementForm(f => ({ ...f, description: e.target.value }))}
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="receiptUpload">Receipt (Required)</Label>
                                                    <Input
                                                        id="receiptUpload"
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => setReimbursementForm(f => ({ ...f, receipt: e.target.files[0] }))}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleReimbursementSubmit}>Submit Expense</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )} */}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-85 overflow-y-auto rounded-md p-2">
                            {reimbursementRequests.length > 0 ? (
                                reimbursementRequests.map((request) => (
                                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {isHR2Admin ? `Requested by ${request.employee ? `${request.employee.first_name} ${request.employee.last_name}` : 'Unknown Employee'}` : request.type}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {isHR2Admin ? `Type: ${request.type}` : ''}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Date: {new Date(request.date).toLocaleDateString()}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Amount: ₱{parseFloat(request.amount).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {request.description}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                request.status === 'Approved' ? 'default' :
                                                    request.status === 'Rejected' ? 'destructive' :
                                                        'secondary'
                                            }>
                                                {request.status}
                                            </Badge>
                                            {isEmployee && request.receipt_path && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewReceipt(request)}
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    title="View Receipt"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {request.status === 'Pending' && isHR2Admin && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openManageReimbursementDialog(request)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                ><Wrench className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {request.status === 'Pending' && !isHR2Admin && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCancelReimbursement(request.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {isHR2Admin ? 'No reimbursement requests from employees yet' : 'No reimbursement requests submitted yet'}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Managing Leave Request Dialog */}
            <Dialog open={manageRequestDialogOpen} onOpenChange={setManageRequestDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Leave Request</DialogTitle>
                    </DialogHeader>
                    {currentManagingRequest && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Request Details</h4>
                                <div className="space-y-1 text-sm">
                                    <div><strong>Employee:</strong> {currentManagingRequest.employee?.first_name} {currentManagingRequest.employee?.last_name}</div>
                                    <div><strong>Type:</strong> {currentManagingRequest.type}</div>
                                    <div><strong>Duration:</strong> {new Date(currentManagingRequest.start).toLocaleDateString()} - {new Date(currentManagingRequest.end).toLocaleDateString()}</div>
                                    <div><strong>Reason:</strong> {currentManagingRequest.reason || 'Not provided'}</div>
                                    <div><strong>Status:</strong> <Badge variant="secondary">{currentManagingRequest.status}</Badge></div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="manageAction">Action</Label>
                                    <Select
                                        value={manageRequestForm.status}
                                        onValueChange={(value) => setManageRequestForm(f => ({ ...f, status: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Accepted">Accept Request</SelectItem>
                                            <SelectItem value="Denied">Deny Request</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                                    <textarea
                                        id="adminNotes"
                                        placeholder="Add any notes or comments about this decision"
                                        value={manageRequestForm.admin_notes}
                                        onChange={(e) => setManageRequestForm(f => ({ ...f, admin_notes: e.target.value }))}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setManageRequestDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleManageRequest} disabled={!manageRequestForm.status}>
                            {manageRequestForm.status === 'Accepted' ? 'Accept Request' :
                                manageRequestForm.status === 'Denied' ? 'Deny Request' : 'Update Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Managing Leave Requests Dialog */}
            <Dialog open={manageAllRequestsDialogOpen} onOpenChange={setManageAllRequestsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage All Leave Requests</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {Array.isArray(leaveRequests) && leaveRequests.filter(r => r.status === 'Pending').length > 0 ? (
                            <div className="space-y-4">
                                {leaveRequests.filter(r => r.status === 'Pending').map((request) => (
                                    <div key={request.id} className="p-4 border rounded-lg bg-muted/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium">
                                                        {request.employee?.first_name} {request.employee?.last_name}
                                                    </div>
                                                    <Badge variant="outline">{request.type}</Badge>
                                                    <Badge variant="secondary">{request.status}</Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    <div><strong>Department:</strong> {request.employee?.department || 'Not specified'}</div>
                                                    <div><strong>Email:</strong> {request.employee?.email}</div>
                                                    <div><strong>Duration:</strong> {new Date(request.start).toLocaleDateString()} - {new Date(request.end).toLocaleDateString()}</div>
                                                    <div><strong>Reason:</strong> {request.reason || 'Not provided'}</div>
                                                    <div><strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setCurrentManagingRequest(request);
                                                        setManageRequestForm({ status: 'Accepted', admin_notes: '' });
                                                        setManageAllRequestsDialogOpen(false);
                                                        setManageRequestDialogOpen(true);
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setCurrentManagingRequest(request);
                                                        setManageRequestForm({ status: 'Denied', admin_notes: '' });
                                                        setManageAllRequestsDialogOpen(false);
                                                        setManageRequestDialogOpen(true);
                                                    }}
                                                >
                                                    Deny
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setCurrentManagingRequest(request);
                                                        setManageRequestForm({ status: '', admin_notes: '' });
                                                        setManageAllRequestsDialogOpen(false);
                                                        setManageRequestDialogOpen(true);
                                                    }}
                                                >
                                                    Review
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No pending leave requests to manage
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setManageAllRequestsDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Managing Timesheet Adjustment Dialog */}
            <Dialog open={manageTimesheetDialogOpen} onOpenChange={setManageTimesheetDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Timesheet Adjustment Request</DialogTitle>
                    </DialogHeader>
                    {currentManagingRequest && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Request Details</h4>
                                <div className="space-y-1 text-sm">
                                    <div><strong>Employee:</strong> {currentManagingRequest.employee?.first_name} {currentManagingRequest.employee?.last_name}</div>
                                    <div><strong>Date:</strong> {new Date(currentManagingRequest.date).toLocaleDateString()}</div>
                                    <div><strong>Requested Time:</strong> {formatTime12hr(currentManagingRequest.new_time_in || currentManagingRequest.newTimeIn)} - {formatTime12hr(currentManagingRequest.new_time_out || currentManagingRequest.newTimeOut)}</div>
                                    <div><strong>Reason:</strong> {currentManagingRequest.reason || 'Not provided'}</div>
                                    <div><strong>Status:</strong> <Badge variant="secondary">{currentManagingRequest.status}</Badge></div>
                                    <div><strong>Submitted:</strong> {new Date(currentManagingRequest.submitted_at).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="manageTimesheetAction">Action</Label>
                                    <Select
                                        value={manageRequestForm.status}
                                        onValueChange={(value) => setManageRequestForm(f => ({ ...f, status: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Approved">Approve Request</SelectItem>
                                            <SelectItem value="Rejected">Reject Request</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="manageTimesheetNotes">Admin Notes (Optional)</Label>
                                    <textarea
                                        id="manageTimesheetNotes"
                                        placeholder="Add any notes or comments..."
                                        value={manageRequestForm.admin_notes}
                                        onChange={(e) => setManageRequestForm(f => ({ ...f, admin_notes: e.target.value }))}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setManageTimesheetDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleManageTimesheetDialog} disabled={!manageRequestForm.status}>
                                    {manageRequestForm.status === 'Approved' ? 'Approve' : manageRequestForm.status === 'Rejected' ? 'Reject' : 'Submit'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Managing Reimbursement Dialog */}
            <Dialog open={manageReimbursementDialogOpen} onOpenChange={setManageReimbursementDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Reimbursement Request</DialogTitle>
                    </DialogHeader>
                    {currentManagingRequest && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Request Details</h4>
                                <div className="space-y-1 text-sm">
                                    <div><strong>Employee:</strong> {currentManagingRequest.employee?.first_name} {currentManagingRequest.employee?.last_name}</div>
                                    <div><strong>Type:</strong> {currentManagingRequest.type}</div>
                                    <div><strong>Amount:</strong> ₱{parseFloat(currentManagingRequest.amount).toFixed(2)}</div>
                                    <div><strong>Date:</strong> {new Date(currentManagingRequest.date).toLocaleDateString()}</div>
                                    <div><strong>Description:</strong> {currentManagingRequest.description || 'Not provided'}</div>
                                    <div><strong>Status:</strong> <Badge variant="secondary">{currentManagingRequest.status}</Badge></div>
                                    <div><strong>Submitted:</strong> {new Date(currentManagingRequest.submitted_at).toLocaleDateString()}</div>
                                    {currentManagingRequest.receipt_path && (
                                        <div className="mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewReceipt(currentManagingRequest)}
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-2"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Receipt
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="manageReimbursementAction">Action</Label>
                                    <Select
                                        value={manageRequestForm.status}
                                        onValueChange={(value) => setManageRequestForm(f => ({ ...f, status: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Approved">Approve Request</SelectItem>
                                            <SelectItem value="Rejected">Reject Request</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="manageReimbursementNotes">Admin Notes (Optional)</Label>
                                    <textarea
                                        id="manageReimbursementNotes"
                                        placeholder="Add any notes or comments..."
                                        value={manageRequestForm.admin_notes}
                                        onChange={(e) => setManageRequestForm(f => ({ ...f, admin_notes: e.target.value }))}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setManageReimbursementDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleManageReimbursementDialog} disabled={!manageRequestForm.status}>
                                    {manageRequestForm.status === 'Approved' ? 'Approve' : manageRequestForm.status === 'Rejected' ? 'Reject' : 'Submit'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Leave Request History Dialog */}
            <Dialog open={leaveHistoryDialogOpen} onOpenChange={setLeaveHistoryDialogOpen}>
                <DialogContent
                    className="w-[95vw] max-w-none max-h-[80vh] overflow-y-auto"
                    style={{ width: '95vw', maxWidth: 'none' }}
                >
                    <DialogHeader>
                        <DialogTitle>Leave Request History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                Total Records: {leaveRequestHistory.length}
                            </div>
                            <Button
                                onClick={() => exportToCSV(leaveRequestHistory, 'leave_request_history')}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">Employee</TableHead>
                                        <TableHead className="min-w-[100px]">Leave Type</TableHead>
                                        <TableHead className="min-w-[100px]">Start Date</TableHead>
                                        <TableHead className="min-w-[100px]">End Date</TableHead>
                                        <TableHead className="min-w-[80px]">Status</TableHead>
                                        <TableHead className="min-w-[150px]">Reason</TableHead>
                                        <TableHead className="min-w-[150px]">Admin Notes</TableHead>
                                        <TableHead className="min-w-[120px]">Processed Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaveRequestHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No history records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        leaveRequestHistory.map((request, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{request.employee_name || 'N/A'}</TableCell>
                                                <TableCell>{request.type}</TableCell>
                                                <TableCell>{formatDate ? formatDate(request.start) : 'N/A'}</TableCell>
                                                <TableCell>{formatDate ? formatDate(request.end) : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={request.status === 'Approved' ? 'default' : 'destructive'}>
                                                        {request.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{request.reason}</TableCell>
                                                <TableCell>{request.admin_notes || 'N/A'}</TableCell>
                                                <TableCell>{formatDate(request.processed_at || request.updated_at)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Timesheet Adjustment History Dialog */}
            <Dialog open={timesheetHistoryDialogOpen} onOpenChange={setTimesheetHistoryDialogOpen}>
                <DialogContent
                    className="w-[95vw] max-w-none max-h-[80vh] overflow-y-auto"
                    style={{ width: '95vw', maxWidth: 'none' }}
                >
                    <DialogHeader>
                        <DialogTitle>Timesheet Adjustment History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                Total Records: {timesheetAdjustmentHistory.length}
                            </div>
                            <Button
                                onClick={() => exportToCSV(timesheetAdjustmentHistory, 'timesheet_adjustment_history')}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">Employee</TableHead>
                                        <TableHead className="min-w-[100px]">Date</TableHead>
                                        <TableHead className="min-w-[120px]">Requested Time In</TableHead>
                                        <TableHead className="min-w-[120px]">Requested Time Out</TableHead>
                                        <TableHead className="min-w-[80px]">Status</TableHead>
                                        <TableHead className="min-w-[150px]">Reason</TableHead>
                                        <TableHead className="min-w-[150px]">Admin Notes</TableHead>
                                        <TableHead className="min-w-[120px]">Processed Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {timesheetAdjustmentHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                                No history records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        timesheetAdjustmentHistory.map((request, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{request.employee_name || 'N/A'}</TableCell>
                                                <TableCell>{formatDate(request.date)}</TableCell>
                                                <TableCell>{formatTime12hr(request.newTimeIn || request.new_time_in)}</TableCell>
                                                <TableCell>{formatTime12hr(request.newTimeOut || request.new_time_out)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={request.status === 'Approved' ? 'default' : 'destructive'}>
                                                        {request.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{request.reason}</TableCell>
                                                <TableCell>{request.admin_notes || 'N/A'}</TableCell>
                                                <TableCell>{formatDate(request.processed_at || request.updated_at)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reimbursement History Dialog */}
            <Dialog open={reimbursementHistoryDialogOpen} onOpenChange={setReimbursementHistoryDialogOpen}>
                <DialogContent
                    className="w-[95vw] max-w-none max-h-[80vh] overflow-y-auto"
                    style={{ width: '95vw', maxWidth: 'none' }}
                >
                    <DialogHeader>
                        <DialogTitle>Reimbursement History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                Total Records: {reimbursementHistory.length}
                            </div>
                            <Button
                                onClick={() => exportToCSV(reimbursementHistory, 'reimbursement_history')}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">Employee</TableHead>
                                        <TableHead className="min-w-[100px]">Expense Type</TableHead>
                                        <TableHead className="min-w-[80px]">Amount</TableHead>
                                        <TableHead className="min-w-[100px]">Date</TableHead>
                                        <TableHead className="min-w-[80px]">Status</TableHead>
                                        <TableHead className="min-w-[150px]">Description</TableHead>
                                        <TableHead className="min-w-[150px]">Admin Notes</TableHead>
                                        <TableHead className="min-w-[120px]">Processed Date</TableHead>
                                        <TableHead className="min-w-[80px]">Receipt</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reimbursementHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                                No history records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reimbursementHistory.map((request, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{request.employee_name || 'N/A'}</TableCell>
                                                <TableCell>{request.type}</TableCell>
                                                <TableCell>₱{parseFloat(request.amount).toFixed(2)}</TableCell>
                                                <TableCell>{formatDate(request.date)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={request.status === 'Approved' ? 'default' : 'destructive'}>
                                                        {request.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{request.description}</TableCell>
                                                <TableCell>{request.admin_notes || 'N/A'}</TableCell>
                                                <TableCell>{formatDate(request.processed_at || request.updated_at)}</TableCell>
                                                <TableCell>
                                                    {request.receipt_path && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewReceipt(request)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            title="View Receipt"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Receipt Dialog */}
            <Dialog open={receiptViewDialogOpen} onOpenChange={setReceiptViewDialogOpen}>
                <DialogContent className="w-screen max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>View Receipt</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedReceipt && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <strong>Expense Type:</strong> {selectedReceipt.type}
                                    </div>
                                    <div>
                                        <strong>Amount:</strong> ₱{parseFloat(selectedReceipt.amount).toFixed(2)}
                                    </div>
                                    <div>
                                        <strong>Date:</strong> {formatDate(selectedReceipt.date)}
                                    </div>
                                    <div>
                                        <strong>Status:</strong>
                                        <Badge variant={selectedReceipt.status === 'Approved' ? 'default' : selectedReceipt.status === 'Rejected' ? 'destructive' : 'secondary'} className="ml-2">
                                            {selectedReceipt.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <strong>Description:</strong> {selectedReceipt.description}
                                </div>

                                {/* Receipt Display */}
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <h4 className="font-medium mb-2">Receipt File</h4>
                                    {selectedReceipt.receipt_path ? (
                                        <div className="space-y-2">
                                            {selectedReceipt.receipt_path.toLowerCase().endsWith('.pdf') ? (
                                                <div className="text-center">
                                                    <FileText className="w-16 h-16 mx-auto text-red-500 mb-2" />
                                                    <p className="text-sm text-muted-foreground mb-2">PDF Document</p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            const urls = [
                                                                `${hr2.backendBase}/storage/${selectedReceipt.receipt_path}`,
                                                                `http://127.0.0.1:8092/storage/${selectedReceipt.receipt_path}`,
                                                                `http://localhost:8092/storage/${selectedReceipt.receipt_path}`
                                                            ];
                                                            // Try to open in new tab with fallback URLs
                                                            for (const url of urls) {
                                                                try {
                                                                    window.open(url, '_blank');
                                                                    break;
                                                                } catch (error) {
                                                                    console.error('Failed to open:', url, error);
                                                                }
                                                            }
                                                        }}
                                                        className="gap-2"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download PDF
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <img
                                                        src={`${hr2.backendBase}/storage/${selectedReceipt.receipt_path}`}
                                                        alt="Receipt"
                                                        className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
                                                        onError={(e) => {
                                                            console.error('Primary URL failed:', e.target.src);
                                                            const altUrls = [
                                                                `${hr2.backendBase}/storage/app/public/reimbursements/${selectedReceipt.receipt_path}`,
                                                                `http://127.0.0.1:8092/storage/${selectedReceipt.receipt_path}`,
                                                                `http://localhost:8092/storage/${selectedReceipt.receipt_path}`
                                                            ];

                                                            let tried = 0;
                                                            const tryNextUrl = () => {
                                                                if (tried < altUrls.length) {
                                                                    e.target.src = altUrls[tried];
                                                                    console.log('Trying alternative URL:', altUrls[tried]);
                                                                    tried++;
                                                                } else {
                                                                    console.error('All URLs failed');
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'block';
                                                                }
                                                            };

                                                            tryNextUrl();
                                                        }}
                                                        onLoad={() => console.log('Image loaded successfully')}
                                                    />
                                                    <div style={{ display: 'none' }} className="text-center py-8">
                                                        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                                                        <p className="text-sm text-muted-foreground mb-2">Unable to preview image</p>
                                                        <p className="text-xs text-gray-500 mb-2">File: {selectedReceipt.receipt_path}</p>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                const urls = [
                                                                    `${hr2.backendBase}/storage/${selectedReceipt.receipt_path}`,
                                                                    `http://127.0.0.1:8092/storage/${selectedReceipt.receipt_path}`,
                                                                    `http://localhost:8092/storage/${selectedReceipt.receipt_path}`
                                                                ];
                                                                for (const url of urls) {
                                                                    try {
                                                                        window.open(url, '_blank');
                                                                        break;
                                                                    } catch (error) {
                                                                        console.error('Failed to open:', url, error);
                                                                    }
                                                                }
                                                            }}
                                                            className="gap-2 mt-2"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Download File
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <FileText className="w-16 h-16 mx-auto mb-2" />
                                            No receipt file available
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Toaster position="bottom-right" />
        </div>
    );
};
export default ESS;