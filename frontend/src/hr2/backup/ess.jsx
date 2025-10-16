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
import AuthContext from "../../context/AuthProvider";
import { useContext } from "react";
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
    HandCoins, Wallet, Eye
} from 'lucide-react';

function ESS() {
    const authContext = useContext(AuthContext);
    const currentUser = authContext?.auth;
    
    // Add new state for ESS features
    const [dashboardStats, setDashboardStats] = useState({
        leaveBalance: 15,
        pendingRequests: 2,
        upcomingTrainings: 3,
        completedTrainings: 8
    });
    
    // Add mock data for ESS features
    const [reimbursements, setReimbursements] = useState([
        { id: 1, type: 'Travel', amount: 1250, status: 'Pending', date: '2025-09-15', receipt: 'receipt1.pdf' },
        { id: 2, type: 'Meals', amount: 450, status: 'Approved', date: '2025-09-10', receipt: 'receipt2.pdf' }
    ]);
    
    // Reimbursement state management
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
    const [receiptViewDialogOpen, setReceiptViewDialogOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    
    const [timesheet, setTimesheet] = useState([]);
    const [timesheetAdjustmentRequests, setTimesheetAdjustmentRequests] = useState([]);
    
    // History data states with localStorage persistence (shared across HR2 Admins)
    const [leaveRequestHistory, setLeaveRequestHistory] = useState(() => {
        try {
            // Use shared key for all HR2 Admins
            let saved = localStorage.getItem('hr2_leaveRequestHistory');
            
            // Migrate data from old individual keys to shared keys
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
            // Use shared key for all HR2 Admins
            let saved = localStorage.getItem('hr2_timesheetAdjustmentHistory');
            
            // Migrate data from old individual keys to shared keys
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
    });    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Leave Request Approved', message: 'Your vacation leave has been approved', date: '2025-09-18', type: 'success' },
        { id: 2, title: 'Training Reminder', message: 'React Development course starts tomorrow', date: '2025-09-17', type: 'info' }
    ]);

    const handleLeaveRequest = async () => {
        if (!leaveForm.type || !leaveForm.start || !leaveForm.end || !leaveForm.reason) {
            toast.error('Please fill in all leave fields.');
            return;
        }
        
        if (!employeeId) {
            toast.error('Employee information not loaded. Please refresh the page.');
            return;
        }
        
        try {
            const leaveData = {
                employee_id: employeeId,
                type: leaveForm.type,
                start: leaveForm.start,
                end: leaveForm.end,
                reason: leaveForm.reason
            };
            
            const response = await hr2.leaveRequests.create(leaveData);
            toast.success('Leave request submitted!');
            setLeaveForm({ type: '', start: '', end: '', reason: '' });
            setLeaveRequestDialogOpen(false); // Close the dialog
            // Refresh leave requests list
            console.log('About to refresh leave requests after submission, employeeId:', employeeId);
            await loadLeaveRequests();
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
            // Refresh leave requests list
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

            // Add to history and remove from main table if approved or denied
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
                
                // Remove from main table immediately for better UX
                if (isHR2Admin) {
                    console.log('Removing leave request from main table, current requests:', leaveRequests.length);
                    setLeaveRequests(prev => prev.filter(request => request.id !== currentManagingRequest.id));
                }
            } else {
                console.log('Status check failed for leave request. Status:', manageRequestForm.status);
            }

            toast.success(`Leave request ${manageRequestForm.status.toLowerCase()}ed successfully!`);
            
            // Close dialog and reset state
            setManageRequestDialogOpen(false);
            setCurrentManagingRequest(null);
            setManageRequestForm({ status: '', admin_notes: '' });
            
            // Refresh leave requests to ensure data consistency
            loadLeaveRequests();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update leave request');
        }
    };

    // Timesheet adjustment management functions
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

            // Add to history and remove from main table if approved or rejected
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
                
                // Remove from main table immediately for better UX
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
            
            // Refresh timesheet adjustment requests
            loadTimesheetAdjustmentRequests();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update timesheet adjustment request');
        }
    };

    // Timesheet adjustment functions
    const handleTimesheetAdjustment = async () => {
        console.log('=== TIMESHEET ADJUSTMENT SUBMISSION TO BACKEND START ===');
        console.log('Form data:', timesheetAdjustmentForm);
        console.log('Employee ID:', employeeId);
        console.log('User roles - isHR2Admin:', isHR2Admin, 'isEmployee:', isEmployee);

        // Enhanced validation
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

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(timesheetAdjustmentForm.date)) {
            console.error('Validation failed: Invalid date format:', timesheetAdjustmentForm.date);
            toast.error('Please select a valid date.');
            return;
        }

        if (!employeeId || isNaN(parseInt(employeeId))) {
            console.error('Validation failed: Invalid employee ID:', employeeId);
            toast.error('Employee information not loaded correctly. Please refresh the page.');
            return;
        }

        // Validate time format (ensure HH:MM format)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timesheetAdjustmentForm.newTimeIn) || !timeRegex.test(timesheetAdjustmentForm.newTimeOut)) {
            console.error('Validation failed: Invalid time format', {
                newTimeIn: timesheetAdjustmentForm.newTimeIn,
                newTimeOut: timesheetAdjustmentForm.newTimeOut
            });
            toast.error('Please enter times in HH:MM format (e.g., 09:00, 17:30).');
            return;
        }

        // Ensure end time is after start time
        const startTime = timesheetAdjustmentForm.newTimeIn;
        const endTime = timesheetAdjustmentForm.newTimeOut;
        if (startTime >= endTime) {
            console.error('Validation failed: End time must be after start time');
            toast.error('End time must be after start time.');
            return;
        }

        try {
            const adjustmentData = {
                employee_id: parseInt(employeeId),
                date: timesheetAdjustmentForm.date,
                new_time_in: timesheetAdjustmentForm.newTimeIn,
                new_time_out: timesheetAdjustmentForm.newTimeOut,
                reason: timesheetAdjustmentForm.reason
            };

            console.log('Submitting timesheet adjustment to backend:', adjustmentData);

            // Submit to backend API
            const response = await hr2.timesheetAdjustments.create(adjustmentData);
            console.log('Backend response:', response);

            toast.success('Timesheet adjustment request submitted successfully!');
            setTimesheetAdjustmentForm({ date: '', newTimeIn: '', newTimeOut: '', reason: '' });
            setTimesheetAdjustmentDialogOpen(false);

            // Reload requests to show the new one
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
                // For HR2 Admin, load ONLY PENDING timesheet adjustment requests for management
                console.log('Admin view: Loading ONLY PENDING timesheet adjustment requests from backend...');
                const response = await hr2.timesheetAdjustments.getAll();
                const allRequests = response.data || [];
                console.log('All timesheet adjustment requests from backend:', allRequests);

                // Filter to show only pending requests in the main table
                const pendingRequests = allRequests.filter(request => request.status === 'Pending');
                console.log('Filtered pending timesheet adjustment requests:', pendingRequests);

                // Sort by submitted date (newest first)
                pendingRequests.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

                setTimesheetAdjustmentRequests(pendingRequests);
                console.log('HR2 Admin - Final loaded PENDING adjustment requests:', pendingRequests);

                if (allRequests.length > 0) {}
            } else if (employeeId) {
                // For regular employees, load only their own requests via API
                console.log('Employee view: Loading personal timesheet adjustment requests from backend for employeeId:', employeeId);
                const response = await hr2.timesheetAdjustments.getByEmployee(employeeId);
                const requests = response.data || [];
                setTimesheetAdjustmentRequests(requests);
                console.log('Employee - Loaded saved adjustment requests:', requests);
                
                // Also load/populate the employee's actual timesheet from approved adjustments
                await loadEmployeeTimesheet(employeeId);
            } else {
                console.log('No employeeId available, cannot load timesheet adjustment requests');
                setTimesheetAdjustmentRequests([]);
                setTimesheet([]); // Clear timesheet if no requests
            }

            console.log('=== FINISHED LOADING TIMESHEET ADJUSTMENT REQUESTS FROM BACKEND ===');
        } catch (e) {
            console.error('Failed to load timesheet adjustment requests from backend:', e);
            toast.error('Failed to load timesheet adjustment requests from server');
            // Fallback to empty state
            setTimesheetAdjustmentRequests([]);
        }
    };    // Function to load/populate employee's actual timesheet from approved adjustments
    const loadEmployeeTimesheet = async (empId) => {
        try {
            console.log('Loading employee timesheet from backend for:', empId);

            // Load approved timesheet adjustments from backend
            const response = await hr2.timesheetAdjustments.getByEmployee(empId, { status: 'Approved' });
            const approvedAdjustments = response.data || [];

            console.log('Approved adjustments from backend:', approvedAdjustments);

            // Convert approved adjustments to timesheet entries
            const timesheetEntries = approvedAdjustments.map(adjustment => ({
                id: adjustment.id,
                date: adjustment.date,
                timeIn: adjustment.new_time_in,
                timeOut: adjustment.new_time_out,
                overtime: calculateOvertime(adjustment.new_time_in, adjustment.new_time_out),
                status: 'Complete', // Approved adjustments become completed timesheet entries
                approved_at: adjustment.approved_at || adjustment.submitted_at
            }));

            // Sort by date (newest first)
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
            // Fallback to empty timesheet
            setTimesheet([]);
        }
    };

    // Helper function to calculate overtime (basic calculation)
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

    // Helper function to convert 24hr time to 12hr format
    const formatTime12hr = (time24hr) => {
        try {
            if (!time24hr || typeof time24hr !== 'string') {
                return 'N/A';
            }
            const [hours, minutes] = time24hr.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
            return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
        } catch (e) {
            console.error('Error formatting time:', e);
            return time24hr || 'N/A'; // Return original if error, or N/A if undefined
        }
    };

    // Reimbursement functions
    const loadReimbursementRequests = async () => {
        try {
            console.log('loadReimbursementRequests called - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);

            if (isHR2Admin) {
                // For HR2 Admin, load ONLY PENDING reimbursement requests for management
                console.log('Admin view: Loading ONLY PENDING reimbursement requests from backend...');
                const response = await hr2.reimbursements.getAll();
                const allRequests = response.data || [];
                console.log('All reimbursement requests from backend:', allRequests);

                // Filter to show only pending requests in the main table
                const pendingRequests = allRequests.filter(request => request.status === 'Pending');
                console.log('Filtered pending reimbursement requests:', pendingRequests);

                // Sort by submitted date (newest first)
                pendingRequests.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

                setReimbursementRequests(pendingRequests);
                console.log('HR2 Admin - Final loaded PENDING reimbursement requests:', pendingRequests);
            } else if (employeeId) {
                // For regular employees, load only their own requests via API
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
            // Fallback to empty state
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

        if (!employeeId || isNaN(parseInt(employeeId))) {
            console.error('Validation failed: Invalid employee ID:', employeeId);
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
            formData.append('employee_id', parseInt(employeeId));
            formData.append('type', reimbursementForm.type);
            formData.append('amount', amount);
            formData.append('date', reimbursementForm.date);
            formData.append('description', reimbursementForm.description);
            
            // Add receipt file if provided
            if (reimbursementForm.receipt) {
                formData.append('receipt', reimbursementForm.receipt);
            }

            console.log('Submitting reimbursement to backend with FormData');

            // Submit to backend API with FormData
            const response = await hr2.reimbursements.create(formData);
            console.log('Backend response:', response);

            toast.success('Reimbursement request submitted successfully!');
            setReimbursementForm({ type: '', amount: '', date: '', description: '', receipt: null });
            setReimbursementDialogOpen(false);

            // Reload requests to show the new one
            loadReimbursementRequests();

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

            // Update the request status via backend API
            const response = await hr2.reimbursements.updateStatus(request.id, { status });
            console.log('Backend update response:', response);

            // Add to history and remove from main table if approved or rejected
            if (status === 'Approved' || status === 'Rejected') {
                console.log('Status check passed for reimbursement. Status:', status, 'isHR2Admin:', isHR2Admin);
                const historyEntry = {
                    ...request,
                    status: status,
                    admin_notes: null, // Reimbursements don't have admin notes in this implementation
                    processed_at: new Date().toISOString(),
                    employee_name: formatName(request.employee)
                };
                console.log('Adding reimbursement to history:', historyEntry);
                setReimbursementHistory(prev => {
                    const newHistory = [historyEntry, ...prev];
                    console.log('Updated reimbursement history:', newHistory);
                    return newHistory;
                });

                // Remove from main table immediately for better UX
                if (isHR2Admin) {
                    console.log('Removing reimbursement from main table, current requests:', reimbursementRequests.length);
                    setReimbursementRequests(prev => prev.filter(r => r.id !== request.id));
                }
            } else {
                console.log('Status check failed for reimbursement. Status:', status);
            }

            // Reload all requests to reflect the changes
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

            // Delete the request via backend API
            const response = await hr2.reimbursements.delete(requestId);
            console.log('Backend delete response:', response);

            // Reload requests to reflect the changes
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

            // Add to history and remove from main table if approved or rejected
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

                // Remove from main table immediately for better UX
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

            // Refresh reimbursement requests
            loadReimbursementRequests();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update reimbursement request');
        }
    };

    const loadReimbursementHistory = async () => {
        try {
            console.log('Loading reimbursement history from backend for HR2 Admin');
            
            // Load both approved and rejected requests
            const [approvedResponse, rejectedResponse] = await Promise.all([
                hr2.reimbursements.getApproved(),
                hr2.reimbursements.getRejected()
            ]);
            
            const approvedRequests = approvedResponse.data || [];
            const rejectedRequests = rejectedResponse.data || [];
            
            // Combine and format the history data
            const historyData = [...approvedRequests, ...rejectedRequests].map(request => ({
                ...request,
                employee_name: formatName(request.employee),
                processed_at: request.updated_at || request.processed_at
            }));
            
            console.log('Loaded reimbursement history from backend:', historyData);
            setReimbursementHistory(historyData);
            
        } catch (error) {
            console.error('Failed to load reimbursement history from backend:', error);
            // Fallback to localStorage if backend fails
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
    };    // Timesheet adjustment management functions
    const handleCancelTimesheetAdjustment = async (requestId) => {
        if (!confirm('Are you sure you want to cancel this timesheet adjustment request?')) {
            return;
        }

        try {
            console.log('=== CANCELLING TIMESHEET ADJUSTMENT REQUEST ===');
            console.log('Request ID:', requestId);

            // Delete the request via backend API
            const response = await hr2.timesheetAdjustments.delete(requestId);
            console.log('Backend delete response:', response);

            // Reload requests to reflect the changes
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

            // Update the request status via backend API
            const response = await hr2.timesheetAdjustments.updateStatus(request.id, { status });
            console.log('Backend update response:', response);

            // Add to history and remove from main table if approved or rejected
            if (status === 'Approved' || status === 'Rejected') {
                console.log('Status check passed for timesheet adjustment. Status:', status, 'isHR2Admin:', isHR2Admin);
                const historyEntry = {
                    ...request,
                    status: status,
                    admin_notes: null, // Timesheet adjustments don't have admin notes in this implementation
                    processed_at: new Date().toISOString(),
                    employee_name: formatName(request.employee)
                };
                console.log('Adding timesheet adjustment to history:', historyEntry);
                setTimesheetAdjustmentHistory(prev => {
                    const newHistory = [historyEntry, ...prev];
                    console.log('Updated timesheet adjustment history:', newHistory);
                    return newHistory;
                });
                
                // Remove from main table immediately for better UX
                if (isHR2Admin) {
                    console.log('Removing timesheet adjustment from main table, current requests:', timesheetAdjustmentRequests.length);
                    setTimesheetAdjustmentRequests(prev => prev.filter(r => r.id !== request.id));
                }
            } else {
                console.log('Status check failed for timesheet adjustment. Status:', status);
            }

            // If approving a request, update the employee's timesheet
            if (status === 'Approved') {
                console.log('Request approved - updating employee timesheet for:', request.employee_id);
                // Reload the employee's timesheet with the new approved entry
                await loadEmployeeTimesheet(request.employee_id);
            }

            // Reload all requests to reflect the changes
            loadTimesheetAdjustmentRequests();

            toast.success(`Timesheet adjustment request ${status.toLowerCase()}d successfully!`);
            console.log('=== TIMESHEET ADJUSTMENT STATUS UPDATE COMPLETE ===');
        } catch (e) {
            console.error('Failed to update timesheet adjustment request:', e);
            const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to update timesheet adjustment request';
            toast.error(errorMessage);
        }
    };

    // Leave requests state (must be at the top so it's always defined)
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
    const isHR2Admin = userRole === 'HR2 Admin';
    const isEmployee = userRole === 'Employee';
    console.log('User role state:', userRole, 'isHR2Admin:', isHR2Admin);
    const [serverStatus, setServerStatus] = useState(false);

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        department: "",
        position: "",
        email: "",
        phone: "",
        address: "",
        birthday: "",
        civil_status: "",
        emergency_contact: "",
        hire_date: "",
        manager: "",
        employee_status: "Active",
        profile_photo_url: "",
    });

    const [newAccountForm, setNewAccountForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        roles: "Employee",
    });

    const [editAccountForm, setEditAccountForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        role: "Employee",
        original_email: "",
    });
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogData, setDialogData] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editAccountDialogOpen, setEditAccountDialogOpen] = useState(false);
    const [currentEditingUser, setCurrentEditingUser] = useState(null);

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

    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 10;
    const totalPages = Math.ceil((Array.isArray(filteredEmployees) ? filteredEmployees.length : 0) / employeesPerPage);

    const checkHR2Service = async () => {
        try {
            // Simple health check by trying to get combined employees
            await hr2.users.getCombinedEmployees();
            return true;
        } catch (error) {
            console.error('HR2 service check failed:', error);
            toast.error('HR2 service is not available. Please contact administrator.');
            return false;
        }
    };

    const loadProfile = async (userId) => {
        if (!userId) {
            setProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        console.log('Loading profile for user ID:', userId, 'Employees loaded:', employees.length);

        // Clear previous data immediately
        setProfile(null);
        setForm({
            first_name: "",
            last_name: "",
            department: "",
            position: "",
            email: "",
            phone: "",
            address: "",
            birthday: "",
            civil_status: "",
            emergency_contact: "",
            hire_date: "",
            manager: "",
            employee_status: "Active",
            profile_photo_url: "",
            roles: "",
        });

        try {
            // First try to find the user in combined employees to get the correct employee ID
            console.log('Employees array:', employees);
            const user = employees.find(u => String(u.id) === String(userId));
            console.log('Found user for ID', userId, ':', user);
            console.log('Found user:', user);

            if (user && user.employee_data) {
                // User has employee data, use the employee ID
                const employeeId = user.employee_data.id;
                console.log('Found employee data for user', userId, '-> employee ID:', employeeId);

                try {
                    // Try to get employee data from HR2 service using employee ID
                    const employeeResponse = await hr2.employees.getById(employeeId);
                    const employeeData = employeeResponse.data;
                    console.log('Got employee data from HR2:', employeeData);

                    const profileData = {
                        id: employeeData.id,
                        first_name: employeeData.first_name || '',
                        last_name: employeeData.last_name || '',
                        email: employeeData.email || '',
                        department: employeeData.department || '',
                        position: employeeData.position || '',
                        phone: employeeData.phone || '',
                        address: employeeData.address || '',
                        birthday: employeeData.birthday || '',
                        civil_status: employeeData.civil_status || '',
                        emergency_contact: employeeData.emergency_contact || '',
                        hire_date: employeeData.hire_date || '',
                        manager: employeeData.manager || '',
                        employee_status: employeeData.employee_status || 'Active',
                        profile_photo_url: employeeData.profile_photo_url || '',
                        roles: employeeData.roles || '',
                    };

                    setProfile(profileData);
                    setForm(profileData);
                    setEmployeeId(employeeId);
                    setAuthUserId(userId); // Store the auth user ID
                    console.log('Loaded profile for employee:', employeeId, 'auth user:', userId, profileData);
                    setLoading(false);
                    return;
                } catch (employeeError) {
                    console.log('Employee API failed, using combined employee data:', employeeError.message);
                }
            }

            // Fallback: Use combined employee data if available
            if (user) {
                console.log('Using combined employee data for user:', userId);
                const profileData = {
                    id: user.id,
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    email: user.email || '',
                    department: user.employee_data?.department || user.department || '',
                    position: user.employee_data?.position || user.position || '',
                    phone: user.employee_data?.phone || user.phone || '',
                    address: user.employee_data?.address || user.address || '',
                    birthday: user.employee_data?.birthday || user.birthday || '',
                    civil_status: user.employee_data?.civil_status || user.civil_status || '',
                    emergency_contact: user.employee_data?.emergency_contact || user.emergency_contact || '',
                    hire_date: user.employee_data?.hire_date || user.hire_date || '',
                    manager: user.employee_data?.manager || user.manager || '',
                    employee_status: user.employee_data?.employee_status || user.employee_status || 'Active',
                    profile_photo_url: user.employee_data?.profile_photo_url || user.profile_photo_url || '',
                    roles: user.employee_data?.roles || user.roles || '',
                };

                setProfile(profileData);
                setForm(profileData);
                setEmployeeId(user.employee_data?.id || user.id);
                console.log('Loaded profile from combined data for user:', userId, 'employeeId set to:', user.employee_data?.id || user.id);
                setLoading(false);
                return;
            }

            // If employees not loaded yet, wait and retry
            if (employees.length === 0) {
                console.log('Employees not loaded yet, waiting...');
                // Wait a bit and retry
                setTimeout(() => loadProfile(userId), 1000);
                return;
            }

            // If no profile found, show message
            console.log('No profile found for user:', userId);
            toast.error('Profile not found. Please contact HR administrator.');
            setProfile(null);
            setLoading(false);

        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile. Please try again.');
            setProfile(null);
            setLoading(false);
        }
    };

    const loadAllEmployees = async () => {
        try {
            // Try combined employees first
            const response = await hr2.users.getCombinedEmployees();
            // Extract the value array from the response
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
            // Fallback to auth users and create temporary employee objects
            try {
                const users = await getUsers();
                if (Array.isArray(users)) {
                    // Transform users into employee-like objects
                    const employeeData = users.map(user => ({
                        id: user.id,
                        name: user.name || '',
                        email: user.email || '',
                        first_name: user.name?.split(' ')[0] || user.name || '',
                        last_name: user.name?.split(' ').slice(1).join(' ') || '',
                        department: '',
                        position: '',
                        employee_data: null // No employee record yet
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
            const users = await getUsers();
            if (Array.isArray(users)) {
                // Enhance user accounts with name components for consistent display
                const enhancedUsers = users.map(user => ({
                    ...user,
                    first_name: user.first_name || user.name?.split(' ')[0] || user.name || '',
                    last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
                }));
                setUserAccounts(enhancedUsers);
            } else {
                console.warn('Unexpected response format from getUsers:', users);
                setUserAccounts([]);
            }
        } catch (error) {
            console.error('Failed to load user accounts:', error);
            toast.error('Failed to load user accounts. Please check your connection.');
            setUserAccounts([]);
        }
    };

    const loadLeaveRequests = async () => {
        console.log('loadLeaveRequests called - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);
        
        try {
            // If user is HR2 Admin, load ONLY PENDING leave requests for management
            if (isHR2Admin) {
                console.log('User is HR2 Admin, loading ONLY PENDING leave requests for management');
                const response = await hr2.leaveRequests.getAll();
                console.log('getAll response:', response);
                const allRequests = response.data || [];
                // Filter to show only pending requests in the main table
                const pendingRequests = allRequests.filter(request => request.status === 'Pending');
                console.log('Filtered pending leave requests for admin:', pendingRequests);
                setLeaveRequests(pendingRequests);
                console.log('Loaded pending leave requests for admin:', pendingRequests.length, 'requests');
                return;
            }
            
            // If user is Employee and has employeeId, load employee-specific requests
            if (employeeId) {
                console.log('Loading employee-specific requests for employeeId:', employeeId);
                const response = await hr2.leaveRequests.getByEmployee(employeeId);
                console.log('getByEmployee response:', response);
                setLeaveRequests(response.data || []);
                console.log('Loaded employee leave requests:', response.data);
                return;
            }
            
            // Fallback: try to load all requests if no employeeId
            console.log('No employeeId available, trying to load all requests as fallback');
            const response = await hr2.leaveRequests.getAll();
            console.log('getAll fallback response:', response);
            setLeaveRequests(response.data || []);
            console.log('Loaded all leave requests as fallback:', response.data);
            
        } catch (error) {
            console.log('Error loading leave requests:', error);
            
            // If HR2 Admin gets access denied, they might need employee-specific access
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
            // Get current user info from auth context
            const userId = currentUser?.id || loggedInEmployeeId;

            console.log('fetchUserRole called - currentUser:', currentUser, 'userId:', userId);
            console.log('userAccounts available:', userAccounts.length, 'employees available:', employees.length);

            if (userId) {
                // Get the user's role from the auth system
                const user = userAccounts.find(u => String(u.id) === String(userId));
                console.log('Found user in userAccounts:', user);

                if (user && user.role) {
                    // Use the role from the auth system
                    setUserRole(user.role);
                    console.log('User role set to:', user.role);
                    
                    // If user is HR2 Admin, load all timesheet adjustment requests
                    if (user.role === 'HR2 Admin') {
                        console.log('HR2 Admin role detected, loading all timesheet adjustment requests');
                        loadTimesheetAdjustmentRequests();
                    }
                } else {
                    // If we can't find the user in userAccounts, try to get it from the API
                    try {
                        console.log('Fetching user from API for ID:', userId);
                        const userData = await getUser(userId);
                        console.log('User data from API:', userData);

                        if (userData && userData.role) {
                            setUserRole(userData.role);
                            console.log('User role fetched from API:', userData.role);
                            
                            // If user is HR2 Admin, load all timesheet adjustment requests
                            if (userData.role === 'HR2 Admin') {
                                console.log('HR2 Admin role detected from API, loading all timesheet adjustment requests');
                                loadTimesheetAdjustmentRequests();
                            }
                        } else {
                            // Default fallback
                            setUserRole('Employee');
                            console.log('User role defaulted to Employee - no role in API response');
                        }
                    } catch (apiError) {
                        console.error('Failed to fetch user role from API:', apiError);
                        setUserRole('Employee'); // fallback
                    }
                }
            } else {
                // Default fallback
                setUserRole('Employee');
                console.log('User role defaulted to Employee - no user ID');
            }
        } catch (error) {
            console.error('Error determining user role:', error);
            setUserRole('Employee'); // fallback
        }
    };

    // Load leave request history for HR2 Admin (shared across all admins)
    const loadLeaveRequestHistory = async () => {
        try {
            console.log('Loading leave request history from backend for HR2 Admin');
            
            // Load both approved and denied requests
            const [approvedResponse, deniedResponse] = await Promise.all([
                hr2.leaveRequests.getApproved(),
                hr2.leaveRequests.getDenied()
            ]);
            
            const approvedRequests = approvedResponse.data || [];
            const deniedRequests = deniedResponse.data || [];
            
            // Combine and format the history data
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
            // Fallback to localStorage if backend fails
            console.log('Falling back to localStorage for leave request history');
        }
    };

    // Load timesheet adjustment history for HR2 Admin (shared across all admins)
    const loadTimesheetAdjustmentHistory = async () => {
        try {
            console.log('Loading timesheet adjustment history from backend for HR2 Admin');
            
            // Load both approved and rejected requests
            const [approvedResponse, rejectedResponse] = await Promise.all([
                hr2.timesheetAdjustments.getApproved(),
                hr2.timesheetAdjustments.getRejected()
            ]);
            
            const approvedRequests = approvedResponse.data || [];
            const rejectedRequests = rejectedResponse.data || [];
            
            // Combine and format the history data
            const historyData = [...approvedRequests, ...rejectedRequests].map(request => ({
                ...request,
                employee_name: formatName(request.employee),
                processed_at: request.updated_at || request.processed_at
            }));
            
            console.log('Loaded timesheet adjustment history from backend:', historyData);
            setTimesheetAdjustmentHistory(historyData);
            
        } catch (error) {
            console.error('Failed to load timesheet adjustment history from backend:', error);
            // Fallback to localStorage if backend fails
            console.log('Falling back to localStorage for timesheet adjustment history');
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            // Check HR2 service availability first
            const serviceAvailable = await checkHR2Service();
            if (!serviceAvailable) {
                setError('HR2 service is not available. Please contact administrator.');
                setLoading(false);
                return;
            }

            // Load data if service is available
            await loadAllEmployees();
            await loadUserAccounts();
            // loadLeaveRequests will be called when employeeId is set
            setLoading(false);
        };

        initializeApp();
    }, []);

    // Determine user role after employees are loaded
    useEffect(() => {
        if (employees.length > 0) {
            fetchUserRole();
        }
    }, [employees.length]);

    // Also determine user role after user accounts are loaded
    useEffect(() => {
        if (userAccounts.length > 0) {
            fetchUserRole();
        }
    }, [userAccounts.length]);

    // Load profile on component mount or when user changes
    useEffect(() => {
        if (currentUser?.id && employees.length > 0) {
            console.log('Loading profile for:', currentUser.id, 'with', employees.length, 'employees loaded');
            loadProfile(currentUser.id);
        }
    }, [currentUser?.id, employees.length]);

    // Check server status periodically
    useEffect(() => {
        const checkStatus = async () => {
            const status = await checkServerStatus();
            setServerStatus(status);
        };

        // Check immediately
        checkStatus();

        // Check every 30 seconds
        const interval = setInterval(checkStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    // Auto-refresh data every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Only auto-refresh if user has access and no dialogs are open
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
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [employeeId, isHR2Admin, leaveRequestDialogOpen, timesheetAdjustmentDialogOpen, manageRequestDialogOpen, manageTimesheetDialogOpen, manageReimbursementDialogOpen]);

    // Auto-refresh when window becomes visible again
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

    // Load leave requests when employee ID or user role is available
    useEffect(() => {
        console.log('useEffect triggered for loadLeaveRequests - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);
        if (employeeId || isHR2Admin) {
            console.log('Calling loadLeaveRequests because employeeId is set or user is HR2 Admin');
            loadLeaveRequests();
        } else {
            console.log('Not calling loadLeaveRequests because neither employeeId nor HR2 Admin role is set');
        }
    }, [employeeId, userRole]);

    // Load timesheet adjustment requests when employee ID or user role is available
    useEffect(() => {
        console.log('useEffect triggered for loadTimesheetAdjustmentRequests - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);
        if (employeeId || isHR2Admin) {
            console.log('Calling loadTimesheetAdjustmentRequests because employeeId is set or user is HR2 Admin');
            loadTimesheetAdjustmentRequests();
        } else {
            console.log('Not calling loadTimesheetAdjustmentRequests because neither employeeId nor HR2 Admin role is set');
        }
    }, [employeeId, userRole]);

    // Load history data for HR2 Admin
    useEffect(() => {
        if (isHR2Admin) {
            loadLeaveRequestHistory();
            loadTimesheetAdjustmentHistory();
        }
    }, [isHR2Admin]);

    // Persist history data to localStorage (shared across HR2 Admins)
    useEffect(() => {
        try {
            console.log('Saving shared leave request history to localStorage:', leaveRequestHistory);
            // Use shared key for all HR2 Admins
            localStorage.setItem('hr2_leaveRequestHistory', JSON.stringify(leaveRequestHistory));
            console.log('Shared leave request history saved to localStorage successfully');
        } catch (error) {
            console.error('Error saving shared leave request history to localStorage:', error);
        }
    }, [leaveRequestHistory]);

    useEffect(() => {
        try {
            console.log('Saving shared timesheet adjustment history to localStorage:', timesheetAdjustmentHistory);
            // Use shared key for all HR2 Admins
            localStorage.setItem('hr2_timesheetAdjustmentHistory', JSON.stringify(timesheetAdjustmentHistory));
            console.log('Shared timesheet adjustment history saved to localStorage successfully');
        } catch (error) {
            console.error('Error saving shared timesheet adjustment history to localStorage:', error);
        }
    }, [timesheetAdjustmentHistory]);

    // Persist reimbursement history to localStorage
    useEffect(() => {
        try {
            console.log('Saving reimbursement history to localStorage:', reimbursementHistory);
            localStorage.setItem('hr2_reimbursementHistory', JSON.stringify(reimbursementHistory));
            console.log('Reimbursement history saved to localStorage successfully');
        } catch (error) {
            console.error('Error saving reimbursement history to localStorage:', error);
        }
    }, [reimbursementHistory]);

    // Auto-refresh timesheet adjustment requests for admin every 10 seconds
    useEffect(() => {
        if (isHR2Admin) {
            const interval = setInterval(() => {
                loadTimesheetAdjustmentRequests();
            }, 10000); // 10 seconds

            return () => clearInterval(interval);
        }
    }, [isHR2Admin]);

    // Listen for timesheet adjustment submissions from employees
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

    // Load reimbursement requests when employee ID or user role is available
    useEffect(() => {
        console.log('useEffect triggered for loadReimbursementRequests - employeeId:', employeeId, 'userRole:', userRole, 'isHR2Admin:', isHR2Admin);
        if (employeeId || isHR2Admin) {
            console.log('Calling loadReimbursementRequests');
            loadReimbursementRequests();
        }
    }, [employeeId, userRole]);

    // Load history data for HR2 Admin
    useEffect(() => {
        if (isHR2Admin) {
            loadLeaveRequestHistory();
            loadTimesheetAdjustmentHistory();
            loadReimbursementHistory();
        }
    }, [isHR2Admin]);

    const formatName = (p) => {
        if (!p) return "";
        let name = p.last_name || "";
        if (p.first_name) name = p.first_name + " " + name;
        return name.trim();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${month}-${day}-${year}`;
        } catch (error) {
            return 'N/A';
        }
    };

    // CSV Export function
    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes in CSV
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

    const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const handleNewAccountFormChange = (e) => {
        const { name, value } = e.target;
        setNewAccountForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditAccountFormChange = (e) => {
        const { name, value } = e.target;
        setEditAccountForm(prev => ({ ...prev, [name]: value }));
    };

    const openEditAccountDialog = (user) => {
        // Store reference to the user being edited
        setCurrentEditingUser(user);
        
        // Get name information from employee_data if available, otherwise parse name
        let firstName = '';
        let lastName = '';
        
        if (user.employee_data) {
            firstName = user.employee_data.first_name || '';
            lastName = user.employee_data.last_name || '';
        } else {
            // Fallback: parse the full name
            const nameParts = (user.name || '').trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        }
        
        setEditAccountForm({
            first_name: firstName,
            last_name: lastName,
            email: user.email || '',
            role: user.role || 'Employee',
            original_email: user.email || '', // Store original email for comparison
        });
        setEditAccountDialogOpen(true);
    };

    const handleCreateAccount = async () => {
        setSaving(true);
        setError("");

        try {
            if (!newAccountForm.first_name || !newAccountForm.last_name || !newAccountForm.email || !newAccountForm.password) {
                toast.error('Please fill in all required fields.');
                return;
            }

            // Create combined name for auth system
            const fullName = [newAccountForm.first_name, newAccountForm.last_name].filter(Boolean).join(' ').trim();

            // Prepare registration data for auth service
            const registrationData = {
                name: fullName,
                email: newAccountForm.email,
                password: newAccountForm.password,
                role: newAccountForm.roles
            };

            // Register the user account through auth service
            const response = await api.post('/register', registrationData);

            // Create corresponding HR2 employee record
            const employeeData = {
                first_name: newAccountForm.first_name,
                last_name: newAccountForm.last_name,
                email: newAccountForm.email,
                roles: newAccountForm.roles,
                hire_date: new Date().toISOString().split('T')[0], // Set hire date to today
                employee_status: 'Active'
            };

            try {
                await hr2.employees.create(employeeData);
                console.log('HR2 employee record created successfully');
            } catch (hr2Error) {
                console.error('Failed to create HR2 employee record:', hr2Error);
                // Don't fail the whole operation, but log the error
                toast.warning('Account created but HR2 employee record may not be synced. Please contact administrator.');
            }

            toast.success("Account created successfully!");
            setNewAccountForm({ first_name: "", last_name: "", email: "", password: "", roles: "Employee" });

            // Refresh both user accounts and employee lists
            await loadUserAccounts();
            await loadAllEmployees();
            const errorMessage = error.response?.data?.message ||
                               error.response?.data?.error ||
                               error.message ||
                               'Failed to create account';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleEditAccount = async (userId) => {
        // Validate that we're editing the correct user
        if (!currentEditingUser || String(currentEditingUser.id) !== String(userId)) {
            toast.error('Edit session mismatch. Please try again.');
            setEditAccountDialogOpen(false);
            return;
        }
        
        setSaving(true);
        try {
            if (!editAccountForm.first_name || !editAccountForm.last_name || !editAccountForm.role) {
                toast.error('Please fill in all required fields.');
                return;
            }

            // Email is required if it's being changed
            if (editAccountForm.email !== editAccountForm.original_email && !editAccountForm.email) {
                toast.error('Please provide an email address.');
                return;
            }

            // Create combined name for auth system
            const fullName = [editAccountForm.first_name, editAccountForm.last_name].filter(Boolean).join(' ').trim();

            const updateData = {
                name: fullName,
                role: editAccountForm.role
            };

            // Only include email if it has changed
            if (editAccountForm.email !== editAccountForm.original_email) {
                updateData.email = editAccountForm.email;
            }

            console.log('Sending update data to auth API:', updateData);

            // Update user account through auth service
            await api.put(`/users/${userId}`, updateData);

            // Also update corresponding HR2 employee record
            try {
                // Find the corresponding employee ID from combined employees data
                const combinedEmployee = employees.find(emp => String(emp.id) === String(userId));
                const employeeId = combinedEmployee?.employee_data?.id || combinedEmployee?.id;
                
                if (employeeId) {
                    const hr2UpdateData = {
                        first_name: editAccountForm.first_name,
                        last_name: editAccountForm.last_name,
                        email: editAccountForm.email,
                        roles: editAccountForm.role
                    };

                    await hr2.employees.update(employeeId, hr2UpdateData);
                    console.log('HR2 employee record updated successfully');
                }
            } catch (hr2Error) {
                console.error('HR2 sync failed:', hr2Error);
                // Don't fail the account update
            }

            toast.success('Account updated successfully!');

            // Close the dialog and clear editing state
            setEditAccountDialogOpen(false);
            setCurrentEditingUser(null);
            setEditAccountForm({
                first_name: "",
                last_name: "",
                email: "",
                role: "Employee",
                original_email: "",
            });

            // Refresh both user accounts and employee lists
            await loadUserAccounts();
            await loadAllEmployees();
            
            // If editing the current user's account, reload their profile
            if (String(userId) === String(currentUser?.id)) {
                await loadProfile(currentUser?.id);
            }
        } catch (error) {
            console.error('Error updating account:', error);
            
            // Handle 422 validation errors specifically
            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors || error.response?.data;
                if (typeof validationErrors === 'object') {
                    // Show specific field errors
                    const errorMessages = Object.values(validationErrors).flat();
                    toast.error(errorMessages.join(', ') || 'Validation failed');
                } else {
                    toast.error(error.response?.data?.message || 'Validation failed');
                }
            } else {
                toast.error(error.response?.data?.message || 'Failed to update account');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async (userId) => {
        if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        try {
            await api.delete(`/users/${userId}`);
            toast.success('Account deleted successfully!');
            
            // Also deactivate corresponding HR2 employee record
            try {
                // Find the corresponding employee ID from combined employees data
                const combinedEmployee = employees.find(emp => String(emp.id) === String(userId));
                const employeeId = combinedEmployee?.employee_data?.id || combinedEmployee?.id;
                
                if (employeeId) {
                    // Instead of deleting, mark as inactive to preserve data
                    await hr2.employees.update(employeeId, { employee_status: 'Inactive' });
                    console.log('HR2 employee record marked as inactive');
                }
            } catch (hr2Error) {
                console.error('HR2 deactivation failed:', hr2Error);
                // Don't fail the account deletion
            }

            // Refresh both user accounts and employee lists
            await loadUserAccounts();
            await loadAllEmployees();
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error(error.response?.data?.message || 'Failed to delete account');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateEmployee = async () => {
        setSaving(true);

        try {
            const data = { ...form };
            delete data.profile_photo_url;

            const cleanedData = {};
            Object.keys(data).forEach(key => {
                const value = data[key];
                // Always include required fields, even if empty
                if (key === 'first_name' || key === 'last_name' || key === 'email') {
                    cleanedData[key] = value || '';
                } else if (value !== "" || key === 'roles') {
                    cleanedData[key] = value;
                }
            });

            // Ensure required fields are present
            if (!cleanedData.first_name) {
                cleanedData.first_name = form.first_name || '';
            }
            if (!cleanedData.last_name) {
                cleanedData.last_name = form.last_name || '';
            }
            if (!cleanedData.email) {
                cleanedData.email = form.email || '';
            }

            // Prepare auth data for name, email, role
            const nameParts = [cleanedData.first_name, cleanedData.last_name].filter(Boolean);
            const authData = {};

            const fullName = nameParts.join(' ').trim();
            if (fullName) {
                authData.name = fullName;
            }

            if (cleanedData.email && cleanedData.email.trim()) {
                authData.email = cleanedData.email.trim();
            }

            if (cleanedData.roles && cleanedData.roles.trim()) {
                authData.role = cleanedData.roles.trim();
            }

            // Prepare HR2 data (keep first_name and last_name for HR2 database)
            const hr2Data = { ...cleanedData };
            // Only remove auth-specific fields, keep first_name and last_name for HR2
            delete hr2Data.roles; // Remove roles as it's stored as 'role' in auth

            console.log('Sending auth data:', authData);
            console.log('Sending hr2 data:', hr2Data);
            console.log('Employee ID:', employeeId);

            // Get current auth user ID
            let currentAuthUserId = authUserId;
            if (!currentAuthUserId) {
                try {
                    const currentUser = await getUser();
                    currentAuthUserId = currentUser.id;
                    console.log('Got current auth user ID:', currentAuthUserId);
                } catch (userError) {
                    console.error('Failed to get current user:', userError);
                    toast.error('Unable to identify current user for update');
                    setSaving(false);
                    return;
                }
            }

            // Update auth user only if there's data to update
            if (Object.keys(authData).length > 0) {
                try {
                    await hr2.users.updateUser(currentAuthUserId, authData);
                    console.log('Auth update successful');
                } catch (authError) {
                    console.error('Auth update failed:', authError);

                    // Check if the error is about email being taken
                    const errorMessage = authError.response?.data?.message ||
                                       authError.response?.data?.error ||
                                       authError.message || '';

                    // If email is taken, it might be the same user's email - continue with HR2 update
                    if (errorMessage.toLowerCase().includes('email has been taken') ||
                        errorMessage.toLowerCase().includes('email already exists') ||
                        errorMessage.toLowerCase().includes('duplicate entry')) {
                        console.log('Email validation error detected, continuing with HR2 update only');
                        toast.warning('Email validation issue detected. Updating employee record only.');
                    } else {
                        // For other auth errors, still return early
                        toast.error('Failed to update user information: ' + errorMessage);
                        return;
                    }
                }
            } else {
                console.log('No auth data to update');
            }

            let response;
            let updateSuccessful = false;
            const employeeIdToUse = employeeId || currentUser?.id;
            
            if (!employeeIdToUse) {
                toast.error('Employee ID not available. Please refresh the page and try again.');
                setSaving(false);
                return;
            }
            
            try {
                // Try to update existing employee in hr2
                console.log('Attempting to update employee with ID:', employeeIdToUse);
                response = await hr2.employees.update(employeeIdToUse, hr2Data);
                console.log('HR2 Update successful:', response);
                updateSuccessful = true;
            } catch (updateError) {
                console.log('Update error caught:', updateError.response?.status);

                // If update fails with 404, try to create new employee
                if (updateError.response?.status === 404) {
                    console.log('Employee not found, creating new employee record...');

                    try {
                        const createData = {
                            ...hr2Data,
                            auth_user_id: currentAuthUserId, // Link to the auth user
                            user_id: currentAuthUserId, // Also include user_id for compatibility
                            first_name: cleanedData.first_name || 'Unknown',
                            last_name: cleanedData.last_name || 'User',
                            email: cleanedData.email || '',
                            department: hr2Data.department || 'General',
                            position: hr2Data.position || 'Employee',
                            hire_date: hr2Data.hire_date || new Date().toISOString().split('T')[0], // Use provided hire_date or default to today
                            employee_status: hr2Data.employee_status || 'Active'
                        };

                        console.log('Creating employee with data:', createData);
                        response = await hr2.employees.create(createData);
                        console.log('Employee created successfully:', response);
                        toast.success('Employee profile created successfully.');
                        updateSuccessful = true;
                        
                        // Update the employeeId state with the new employee ID
                        if (response.data && response.data.id) {
                            setEmployeeId(response.data.id);
                        }
                    } catch (createError) {
                        console.error('Failed to create employee:', createError);
                        const errorMsg = createError.response?.data?.message ||
                                       createError.response?.data?.error ||
                                       'Failed to create employee profile.';
                        toast.error(errorMsg);
                        setSaving(false);
                        return;
                    }
                } else {
                    // For other errors, show the error
                    const errorMsg = updateError.response?.data?.message ||
                                   updateError.response?.data?.error ||
                                   'Failed to update employee profile.';
                    toast.error(errorMsg);
                    setSaving(false);
                    return;
                }
            }

            // Show success message only if we actually updated something
            if (updateSuccessful) {
                toast.success('Employee profile updated successfully.');
            }
            await loadAllEmployees();
            await loadUserAccounts();
            // Reload profile with the employee ID we used (or the newly created one)
            await loadProfile(employeeIdToUse);
            setDialogOpen(false);
            setIsEditing(false);
            setDialogData(null);
        } catch (e) {
            console.error('Update error:', e);
            const errorMessage = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to update employee';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleAddEmployee = async () => {
        setSaving(true);
        try {
            // Get form data from the dialog inputs
            const firstName = document.getElementById('firstName')?.value || '';
            const lastName = document.getElementById('lastName')?.value || '';
            const email = document.getElementById('email')?.value || '';
            const department = document.querySelector('[name="department"]')?.value || '';
            const position = document.getElementById('position')?.value || '';
            const hireDate = document.getElementById('hireDate')?.value || '';

            // Create employee data
            const employeeData = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                department: department,
                position: position,
                hire_date: hireDate,
                employee_status: 'Active'
            };

            // Create the employee
            const response = await hr2.employees.create(employeeData);
            toast.success('Employee added successfully.');
            
            // Reload employees list
            await loadAllEmployees();
            
            // Close dialog
            setDialogOpen(false);
        } catch (error) {
            console.error('Error adding employee:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add employee';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleEditEmployee = async (employeeId) => {
        setSaving(true);
        try {
            const firstName = document.getElementById('editFirstName')?.value || '';
            const lastName = document.getElementById('editLastName')?.value || '';
            const email = document.getElementById('editEmail')?.value || '';
            const department = document.querySelector('[name="editDepartment"]')?.value || '';
            const position = document.getElementById('editPosition')?.value || '';

            if (!firstName || !lastName || !email || !department || !position) {
                toast.error('Please fill in all required fields.');
                return;
            }

            const updatedData = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                department: department,
                position: position
            };

            await hr2.employees.update(employeeId, updatedData);
            toast.success('Employee updated successfully!');
            
            // Refresh employee list
            await loadAllEmployees();
        } catch (error) {
            console.error('Error updating employee:', error);
            toast.error(error.response?.data?.message || 'Failed to update employee');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveEmployee = async (employeeId) => {
        if (!confirm('Are you sure you want to remove this employee? This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        try {
            await hr2.employees.delete(employeeId);
            toast.success('Employee removed successfully!');
            
            // Refresh employee list
            await loadAllEmployees();
        } catch (error) {
            console.error('Error removing employee:', error);
            toast.error(error.response?.data?.message || 'Failed to remove employee');
        } finally {
            setSaving(false);
        }
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

    const handleRemove = async (id) => {
        if (!window.confirm(`Are you sure you want to delete employee with ID ${id}?`)) {
            return;
        }

        // Check server status first
        const isServerRunning = await checkServerStatus();
        if (!isServerRunning) {
            toast.error('HR2 server is not responding. Please start the server first.');
            toast.info('Run: cd hr2 && php artisan serve --port=8092', { autoClose: 8000 });
            return;
        }

        try {
            setSaving(true);
            await hr2.employees.delete(id);
            await loadAllEmployees();
            toast.success(`Employee with ID ${id} has been removed.`);
        } catch (e) {
            console.error('Delete employee error:', e);
            const errorMessage = e.response?.data?.message ||
                               e.response?.data?.error ||
                               (e.response?.status === 404 ? 'Employee not found or server is not responding. Please check if the HR2 server is running.' : 'Failed to delete employee');
            toast.error(errorMessage);

            // If it's a 404 error, provide additional guidance
            if (e.response?.status === 404) {
                setTimeout(() => {
                    toast.info('Make sure the HR2 Laravel server is running on port 8092', { autoClose: 5000 });
                }, 2000);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSearch = () => {
        if (searchId.trim()) {
            const query = searchId.toLowerCase().trim();
            const results = employees.filter(emp => {
                const id = emp.id ? emp.id.toString() : '';
                const name = formatName(emp).toLowerCase();
                const department = (emp.employee_data?.department || emp.department || '').toLowerCase();
                const position = (emp.employee_data?.position || emp.position || '').toLowerCase();
                const email = (emp.email || '').toLowerCase();
                const role = (emp.roles || '').toLowerCase();

                return id.includes(query) ||
                       name.includes(query) ||
                       department.includes(query) ||
                       position.includes(query) ||
                       email.includes(query) ||
                       role.includes(query);
            });
            setFilteredEmployees(results);
        } else {
            setFilteredEmployees(employees);
        }
        setCurrentPage(1);
    };

    const handleLeaveAction = async (leaveId, action) => {
        try {
            await hr2.leaveRequests.update(leaveId, { status: action });
            toast.success(`Leave request ${action.toLowerCase()}.`);
            // Refresh leave requests
            const updatedRequests = await hr2.leaveRequests.getAll();
            setLeaveRequests(updatedRequests);
        } catch (e) {
            toast.error(`Failed to ${action.toLowerCase()} leave request.`);
        }
    };

    const handleUpdateClick = (empId) => {
        console.log('Editing employee:', empId);
        
        // Ensure no account editing session is active
        if (currentEditingUser) {
            toast.error('Please finish the current account editing session first.');
            return;
        }
        
        // Reset form and profile first
        setForm({
            first_name: "",
            last_name: "",
            department: "",
            position: "",
            email: "",
            phone: "",
            address: "",
            birthday: "",
            civil_status: "",
            emergency_contact: "",
            hire_date: "",
            manager: "",
            employee_status: "Active",
            profile_photo_url: "",
            roles: "",
        });
        setProfile(null);
        setEmployeeId(empId);

        // Load the profile data
        loadProfile(empId);

        // Open dialog
        setDialogOpen(true);
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            try {
                setSaving(true);
                
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('profile_photo', selectedFile);
                
                // Get current employee ID (use logged in user's ID)
                const currentEmployeeId = currentUser?.id || employeeId;
                
                if (!currentEmployeeId) {
                    toast.error('Unable to identify user for photo upload');
                    return;
                }
                
                // Upload photo to HR2 service
                const response = await hr2.employees.uploadPhoto(currentEmployeeId, formData);
                
                if (response.profile_photo_url) {
                    // Update the form state with the new photo URL
                    setForm(f => ({ ...f, profile_photo_url: response.profile_photo_url }));
                    
                    // Also update the profile state if it exists
                    if (profile) {
                        setProfile(prev => ({ ...prev, profile_photo_url: response.profile_photo_url }));
                    }
                    
                    toast.success('Profile photo updated successfully!');
                } else {
                    toast.error('Failed to upload profile photo');
                }
                
            } catch (error) {
                console.error('Photo upload error:', error);
                toast.error('Failed to upload profile photo');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleDiscard = () => {
        // Clear all editing states
        setEmployeeId(null);
        setProfile(null);
        setIsEditing(false);
        setCurrentEditingUser(null);
        setEditAccountDialogOpen(false);
        
        // Reset forms
        setForm({
            first_name: "",
            last_name: "",
            department: "",
            position: "",
            email: "",
            phone: "",
            address: "",
            birthday: "",
            civil_status: "",
            emergency_contact: "",
            hire_date: "",
            manager: "",
            employee_status: "Active",
            profile_photo_url: "",
        });
        setNewAccountForm({
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            roles: "Employee",
        });
        setEditAccountForm({
            first_name: "",
            last_name: "",
            email: "",
            role: "Employee",
            original_email: "",
        });
    };

    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = Array.isArray(filteredEmployees) 
        ? filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee)
        : [];

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Employee Self-Service...</p>
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
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Employee Self-Service</h2>
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
            {/* Enhanced Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <User className="h-6 w-6 text-primary" />
                            <h1 className="text-lg font-semibold">Employee Self-Service</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 space-y-8">
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

                {/* Personal Information */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-600" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!loading && profile ? (
                            <div className="flex gap-6">
                                {/* Profile Photo - Left Side */}
                                <div className="flex flex-col items-center space-y-4 min-w-[200px]">
                                    <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden">
                                        <img
                                            src={profile.profile_photo_url || 'https://imgur.com/gallery/empty-profile-BgI2COR#Yrf0E0C'}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {(isEmployee || isHR2Admin) && (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => fileInputRef.current.click()}
                                                size="sm"
                                            >
                                                <Upload className="w-4 h-4 mr-1" />
                                                Upload Photo
                                            </Button>
                                            <Input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Form Fields - Right Side */}
                                <div className="flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Personal Information */}
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="newAccountFirstName">First Name</Label>
                                                <Input
                                                    id="newAccountFirstName"
                                                    value={form.first_name || ''}
                                                    onChange={(e) => handleChange('first_name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="last_name">Last Name</Label>
                                                <Input
                                                    id="last_name"
                                                    value={form.last_name || ''}
                                                    onChange={(e) => handleChange('last_name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={form.email || ''}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input
                                                    id="phone"
                                                    value={form.phone || ''}
                                                    onChange={(e) => handleChange('phone', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="address">Address</Label>
                                                <Input
                                                    id="address"
                                                    value={form.address || ''}
                                                    onChange={(e) => handleChange('address', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="manager">Manager</Label>
                                                <Input
                                                    id="manager"
                                                    value={form.manager || ''}
                                                    onChange={(e) => handleChange('manager', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {/* Employment Information */}
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="department">Department</Label>
                                                <Input
                                                    id="department"
                                                    value={form.department || ''}
                                                    onChange={(e) => handleChange('department', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="position">Position</Label>
                                                <Input
                                                    id="position"
                                                    value={form.position || ''}
                                                    onChange={(e) => handleChange('position', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="birthday">Birthday</Label>
                                                <Input
                                                    id="birthday"
                                                    type="date"
                                                    value={form.birthday || ''}
                                                    onChange={(e) => handleChange('birthday', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="civil_status">Civil Status</Label>
                                                <Input
                                                    id="civil_status"
                                                    value={form.civil_status || ''}
                                                    onChange={(e) => handleChange('civil_status', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                                                <Input
                                                    id="emergency_contact"
                                                    value={form.emergency_contact || ''}
                                                    onChange={(e) => handleChange('emergency_contact', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="hire_date">Hire Date</Label>
                                                <Input
                                                    id="hire_date"
                                                    type="date"
                                                    value={form.hire_date || ''}
                                                    onChange={(e) => handleChange('hire_date', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading profile information...</p>
                            </div>
                        )}
                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={handleUpdateEmployee}
                                disabled={saving}
                                size="sm"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Leave Request | Overtime & Timesheet Adjustments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Leave Requests Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    {isEmployee && (
                                        <CardTitle className="flex items-center gap-2">
                                            <Send className="w-5 h-5 text-orange-600" />
                                            Leave Requests
                                        </CardTitle>
                                    )}
                                    {isHR2Admin && (
                                        <CardTitle className="flex items-center gap-2">
                                            <ShieldUser className="w-6 h-6 text-orange-600" />
                                            Manage Leave Requests
                                        </CardTitle>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {isHR2Admin && (
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
                                    )}
                                    <Dialog open={leaveRequestDialogOpen} onOpenChange={setLeaveRequestDialogOpen}>
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
                                </Dialog>
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

                    {/* Overtime & Timesheet Adjustments */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                {isEmployee && (
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                            Overtime & Timesheet Adjustments
                                        </CardTitle>
                                    )}
                                    {isHR2Admin && (
                                        <CardTitle className="flex items-center gap-2">
                                            <ShieldUser className="w-6 h-6 text-blue-600" />
                                            Manage Adjustment Requests
                                        </CardTitle>
                                    )}
                                <div className="flex gap-2">
                                    {isHR2Admin && (
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
                                    )}
                                    {!isHR2Admin && (
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
                                )}
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
                                {isEmployee && (
                                    <CardTitle className="flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-green-600" />
                                        Expense Reimbursements
                                    </CardTitle>
                                )}
                                {isHR2Admin && (
                                    <CardTitle className="flex items-center gap-2">
                                        <HandCoins className="w-5 h-5 text-green-600" />
                                        Manage Reimbursements
                                    </CardTitle>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {isHR2Admin && (
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
                                )}
                                {!isHR2Admin && (
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
                                )}
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

                {/* My Learning Plans | Available Trainings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* My Learning Plans */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                My Learning Plans
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium">Employee Onboarding Program</h3>
                                        <Badge variant="secondary">Mandatory</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Progress</span>
                                            <span>75%</span>
                                        </div>
                                        <Progress value={75} className="h-2" />
                                        <div className="text-xs text-muted-foreground">
                                            Due: Oct 15, 2025 • 6/8 modules completed
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium">Leadership Development</h3>
                                        <Badge variant="outline">Role-based</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Progress</span>
                                            <span>30%</span>
                                        </div>
                                        <Progress value={30} className="h-2" />
                                        <div className="text-xs text-muted-foreground">
                                            Due: Nov 20, 2025 • 3/10 modules completed
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Available Trainings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                Available Trainings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium">Advanced Project Management</h3>
                                        <Badge variant="outline">Available</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Master advanced project management techniques and methodologies.
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span>3 Days • Leadership</span>
                                        <Button size="sm">Enroll</Button>
                                    </div>
                                </div>
                                <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium">React Development Fundamentals</h3>
                                        <Badge variant="outline">Available</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Learn modern React development with hooks and best practices.
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span>2 Weeks • Technical</span>
                                        <Button size="sm">Enroll</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            Performance History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">4.8</div>
                                    <div className="text-sm text-muted-foreground">Average Rating</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">12</div>
                                    <div className="text-sm text-muted-foreground">Reviews Completed</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">95%</div>
                                    <div className="text-sm text-muted-foreground">Goals Achieved</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium">Recent Performance Reviews</h4>
                                <div className="space-y-2">
                                    <div className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium">Q3 2025 Performance Review</h3>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="default">4.9/5</Badge>
                                                <Button variant="outline" size="sm">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            "Excellent performance in project delivery and team leadership. Consistently exceeds expectations."
                                        </p>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Reviewed by: Sarah Johnson • September 15, 2025
                                        </div>
                                    </div>

                                    <div className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium">Q2 2025 Performance Review</h3>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="default">4.7/5</Badge>
                                                <Button variant="outline" size="sm">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            "Strong technical skills and problem-solving abilities. Good progress in leadership development."
                                        </p>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Reviewed by: Mike Chen • June 20, 2025
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Management Section (HR2 Admin Only) */}
                {isHR2Admin && (
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-blue-600" />
                                Account Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="gap-2">
                                                <UserPlus className="w-4 h-4" />
                                                Create Account
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Create New Account</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="newAccountFirstName">First Name</Label>
                                                    <Input
                                                        id="newAccountFirstName"
                                                        name="first_name"
                                                        placeholder="John"
                                                        value={newAccountForm.first_name}
                                                        onChange={handleNewAccountFormChange}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="newAccountLastName">Last Name</Label>
                                                    <Input
                                                        id="newAccountLastName"
                                                        name="last_name"
                                                        placeholder="Doe"
                                                        value={newAccountForm.last_name}
                                                        onChange={handleNewAccountFormChange}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="newAccountEmail">Email</Label>
                                                    <Input
                                                        id="newAccountEmail"
                                                        name="email"
                                                        type="email"
                                                        placeholder="john.doe@company.com"
                                                        value={newAccountForm.email}
                                                        onChange={handleNewAccountFormChange}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="newAccountPassword">Password</Label>
                                                    <Input
                                                        id="newAccountPassword"
                                                        name="password"
                                                        type="password"
                                                        placeholder="Enter password"
                                                        value={newAccountForm.password}
                                                        onChange={handleNewAccountFormChange}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="newAccountRole">Role</Label>
                                                    <Select
                                                        name="roles"
                                                        value={newAccountForm.roles}
                                                        onValueChange={(value) => handleNewAccountFormChange({ target: { name: 'roles', value } })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Employee">Employee</SelectItem>
                                                            <SelectItem value="HR2 Admin">HR2 Admin</SelectItem>
                                                            <SelectItem value="Trainer">Trainer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleCreateAccount} disabled={saving}>
                                                    {saving ? 'Creating...' : 'Create Account'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* Account List Table */}
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userAccounts.length > 0 ? (
                                                userAccounts.map((user) => {
                                                    // Find corresponding employee data for full name
                                                    const employeeData = employees.find(emp => 
                                                        emp.email === user.email || 
                                                        String(emp.id) === String(user.id)
                                                    );
                                                    
                                                    // Build full name - prioritize user data fields, then employee data, then fallback
                                                    let fullName = '';
                                                    
                                                    // First priority: user object fields (most reliable)
                                                    const userNameParts = [
                                                        user.first_name,
                                                        user.last_name
                                                    ].filter(Boolean);
                                                    if (userNameParts.length > 0) {
                                                        fullName = userNameParts.join(' ');
                                                    }
                                                    
                                                    // Second priority: employee data if user fields not available
                                                    if (!fullName) {
                                                        const employeeData = employees.find(emp => 
                                                            emp.email === user.email || 
                                                            String(emp.id) === String(user.id)
                                                        );
                                                        
                                                        if (employeeData) {
                                                            const empNameParts = [
                                                                employeeData.first_name,
                                                                employeeData.last_name
                                                            ].filter(Boolean);
                                                            if (empNameParts.length > 0) {
                                                                fullName = empNameParts.join(' ');
                                                            }
                                                        }
                                                    }
                                                    
                                                    // Final fallback
                                                    if (!fullName) { fullName = user.name || 'Unknown User'; }
                                                    const isEditingThisUser = editAccountDialogOpen && currentEditingUser && currentEditingUser.id === user.id;
                                                    return (
                                                        <TableRow key={user.id}>
                                                            <TableCell className="font-medium">{fullName}</TableCell>
                                                            <TableCell>{user.email}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">
                                                                    {user.role || 'Employee'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Button variant="outline" size="sm" onClick={() => openEditAccountDialog(user)}>
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    {isEditingThisUser && (
                                                                        <Dialog open={true} onOpenChange={setEditAccountDialogOpen}>
                                                                            <DialogContent className="max-w-md">
                                                                                <DialogHeader>
                                                                                    <DialogTitle>Edit Account</DialogTitle>
                                                                                </DialogHeader>
                                                                                <div className="grid gap-4 py-4">
                                                                                    <div className="grid gap-2">
                                                                                        <Label htmlFor="editAccountFirstName">First Name</Label>
                                                                                        <Input
                                                                                            id="editAccountFirstName"
                                                                                            name="first_name"
                                                                                            value={editAccountForm.first_name}
                                                                                            onChange={handleEditAccountFormChange}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="grid gap-2">
                                                                                        <Label htmlFor="editAccountLastName">Last Name</Label>
                                                                                        <Input
                                                                                            id="editAccountLastName"
                                                                                            name="last_name"
                                                                                            value={editAccountForm.last_name}
                                                                                            onChange={handleEditAccountFormChange}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="grid gap-2">
                                                                                        <Label htmlFor="editAccountEmail">Email</Label>
                                                                                        <Input
                                                                                            id="editAccountEmail"
                                                                                            name="email"
                                                                                            type="email"
                                                                                            value={editAccountForm.email}
                                                                                            onChange={handleEditAccountFormChange}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="grid gap-2">
                                                                                        <Label htmlFor="editAccountRole">Role</Label>
                                                                                        <Select
                                                                                            name="role"
                                                                                            value={editAccountForm.role}
                                                                                            onValueChange={(value) => handleEditAccountFormChange({ target: { name: 'role', value } })}
                                                                                        >
                                                                                            <SelectTrigger>
                                                                                                <SelectValue />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="Employee">Employee</SelectItem>
                                                                                                <SelectItem value="HR2 Admin">HR2 Admin</SelectItem>
                                                                                                <SelectItem value="Trainer">Trainer</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                </div>
                                                                                <DialogFooter>
                                                                                    <Button onClick={() => handleEditAccount(user.id)} disabled={saving}>
                                                                                        {saving ? 'Saving...' : 'Save Changes'}
                                                                                    </Button>
                                                                                </DialogFooter>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    )}
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteAccount(user.id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                        No user accounts found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Manage Leave Request Dialog */}
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

            {/* Manage All Leave Requests Dialog */}
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

            {/* Manage Timesheet Adjustment Dialog */}
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

            {/* Manage Reimbursement Dialog */}
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
                                                <TableCell>{formatDate(request.start)}</TableCell>
                                                <TableCell>{formatDate(request.end)}</TableCell>
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

            {/* Receipt View Dialog */}
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
                                                            // Try alternative URL patterns
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
                                                    <div style={{display: 'none'}} className="text-center py-8">
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