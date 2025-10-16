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
    HandCoins, Wallet, Eye, Target
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

    // Training state variables
    const [trainings, setTrainings] = useState([]);
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [completedTrainings, setCompletedTrainings] = useState([]);
    const [trainingLoading, setTrainingLoading] = useState(false);
    const [showTrainingDetailsModal, setShowTrainingDetailsModal] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState(null);

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
        phone: "",
        address: "",
        birthday: "",
        civil_status: "",
        emergency_contact: "",
        department: "",
        position: "",
        hire_date: "",
        manager: "",
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

    // Dialog state for editing profile
    const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);

    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 10;
    const totalPages = Math.ceil((Array.isArray(filteredEmployees) ? filteredEmployees.length : 0) / employeesPerPage);

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

    const loadProfile = async (userId) => {
        if (!userId) {
            setProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        console.log('Loading profile for user ID:', userId, 'Employees loaded:', employees.length);

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
            console.log('Employees array:', employees);
            const user = employees.find(u => String(u.id) === String(userId));
            console.log('Found user for ID', userId, ':', user);
            console.log('Found user:', user);

            if (user && user.employee_data) {
                const employeeId = user.employee_data.id;
                console.log('Found employee data for user', userId, '-> employee ID:', employeeId);

                try {
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
                    setAuthUserId(userId);
                    console.log('Loaded profile for employee:', employeeId, 'auth user:', userId, profileData);
                    setLoading(false);
                    return;
                } catch (employeeError) {
                    console.log('Employee API failed, using combined employee data:', employeeError.message);
                }
            }

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

            if (employees.length === 0) {
                console.log('Employees not loaded yet, waiting...');
                setTimeout(() => loadProfile(userId), 1000);
                return;
            }

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

            // Don't show toast error for other errors - handle gracefully
            // toast.error('Failed to load user accounts. Please check your connection.');
            setUserAccounts([]);
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

    // Load training data from TMS
    const loadTrainingData = async () => {
        try {
            setTrainingLoading(true);
            const response = await hr2.training.getAll();

            if (response && response.data && response.data.length) {
                // Transform backend data to match frontend expectations
                const transformedTrainings = response.data.map(training => ({
                    ...training,
                    title: training.program_name || training.title || '',
                    topic: training.target_skills || training.topic || '',
                    targetRole: training.required_role || training.targetRole || '',
                    startDate: training.start_date || training.startDate || '',
                    endDate: training.end_date || training.endDate || '',
                    maxParticipants: training.max_participants || training.maxParticipants || 0,
                    enrolled: training.enrolled_count || training.enrolled || 0,
                    rating: training.rating || training.feedback_score || 0
                }));
                setTrainings(transformedTrainings);
            } else {
                setTrainings([]);
            }
        } catch (error) {
            console.error('Failed to load training data:', error);
            setTrainings([]);
        } finally {
            setTrainingLoading(false);
        }
    };

    // Load employee enrollments
    const loadMyEnrollments = async () => {
        try {
            if (!employeeId) return;

            const response = await hr2.trainingApplications.getByEmployee(employeeId);

            if (response && response.data && response.data.length) {
                const activeEnrollments = response.data.filter(app =>
                    app.status !== 'rejected' && app.status !== 'completed' && app.status !== 'cancelled'
                );
                setMyEnrollments(activeEnrollments);
            } else {
                setMyEnrollments([]);
            }
        } catch (error) {
            console.error('Failed to load enrollments:', error);
            setMyEnrollments([]);
        }
    };

    // Load trainings
    const loadCompletedTrainings = async () => {
        try {
            if (!employeeId) return;

            const response = await hr2.trainingCompletions.getByEmployee(employeeId);

            if (response && response.data && response.data.length) {
                const transformedData = response.data.map(completion => ({
                    id: completion.id,
                    trainingName: completion.training?.program_name || completion.training?.title || 'Unknown Training',
                    completionDate: completion.completion_date,
                    score: completion.score_percentage || 0,
                    grade: completion.grade || 'N/A',
                    competencies: Array.isArray(completion.competencies_gained)
                        ? completion.competencies_gained
                        : (completion.competencies_gained ? JSON.parse(completion.competencies_gained) : []),
                    certificateId: completion.id,
                    training: completion.training,
                    application: completion.application
                }));
                setCompletedTrainings(transformedData);
            } else {
                setCompletedTrainings([]);
            }
        } catch (error) {
            console.error('Failed to load completed trainings:', error);
            setCompletedTrainings([]);
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
            loadProfile(currentUser.id);

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

    useEffect(() => {
        if (isEmployee || isHR2Admin) {
            loadTrainingData();
        }
    }, [isEmployee, isHR2Admin]);

    useEffect(() => {
        console.log('useEffect triggered for loadMyEnrollments - employeeId:', employeeId, 'isEmployee:', isEmployee);
        if (employeeId && isEmployee) {
            console.log('Loading my enrollments');
            loadMyEnrollments();
            loadCompletedTrainings();
        }
    }, [employeeId, isEmployee]);

    // Auto-refresh data for newfile1.jsx
    useEffect(() => {
        const interval = setInterval(() => {
            if (currentUser?.id && employees.length > 0 && !editProfileDialogOpen) {
                console.log('Auto-refreshing profile data');
                loadProfile(currentUser.id);
            }
            if ((isEmployee || isHR2Admin) && !editProfileDialogOpen) {
                console.log('Auto-refreshing training data');
                loadTrainingData();
            }
            if (employeeId && isEmployee && !editProfileDialogOpen) {
                console.log('Auto-refreshing enrollments and completed trainings');
                loadMyEnrollments();
                loadCompletedTrainings();
            }
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [currentUser?.id, employees.length, isEmployee, isHR2Admin, employeeId, editProfileDialogOpen]);

    // Refresh data when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                if (currentUser?.id && employees.length > 0 && !editProfileDialogOpen) {
                    console.log('Refreshing profile data on visibility change');
                    loadProfile(currentUser.id);
                }
                if ((isEmployee || isHR2Admin) && !editProfileDialogOpen) {
                    console.log('Refreshing training data on visibility change');
                    loadTrainingData();
                }
                if (employeeId && isEmployee && !editProfileDialogOpen) {
                    console.log('Refreshing enrollments and completed trainings on visibility change');
                    loadMyEnrollments();
                    loadCompletedTrainings();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [currentUser?.id, employees.length, isEmployee, isHR2Admin, employeeId, editProfileDialogOpen]);

    useEffect(() => {
        const handleProfileUpdated = (event) => {
            console.log('Received profile update event:', event.detail);
            if (currentUser?.id && employees.length > 0) {
                loadProfile(currentUser.id);
            }
        };
        window.addEventListener('profileUpdated', handleProfileUpdated);

        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdated);
        };
    }, [currentUser?.id, employees.length]);

    useEffect(() => {
        const handleTrainingEnrolled = (event) => {
            console.log('Received training enrollment event:', event.detail);
            if (employeeId && isEmployee) {
                loadMyEnrollments();
                loadCompletedTrainings();
            }
        };
        window.addEventListener('trainingEnrolled', handleTrainingEnrolled);

        return () => {
            window.removeEventListener('trainingEnrolled', handleTrainingEnrolled);
        };
    }, [employeeId, isEmployee]);

    const formatName = (p) => {
        if (!p) return "";
        let name = p.last_name || "";
        if (p.first_name) name = p.first_name + " " + name;
        return name.trim();
    };

    const getEnrollmentStatus = (trainingId) => {
        const enrollment = myEnrollments.find(e => String(e.training_id) === String(trainingId));
        return enrollment ? enrollment.status : null;
    };
    const getTrainingProgress = (trainingId) => {
        const enrollment = myEnrollments.find(e => String(e.training_id) === String(trainingId));
        if (enrollment && enrollment.status === 'approved') {
            return Math.floor(Math.random() * 100);
        }
        return 0;
    };

    const handleEnrollTraining = async (training) => {
        try {
            if (!employeeId) {
                toast.error('Employee ID not found. Please refresh the page.');
                return;
            }

            const enrollmentData = {
                training_id: training.id,
                employee_id: employeeId,
                notes: `Enrollment request for ${training.title}`
            };

            console.log('Submitting enrollment with:', enrollmentData);

            const response = await hr2.trainingApplications.apply(enrollmentData);

            if (response.data && response.data.success) {
                toast.success('Enrollment request submitted successfully!');
                await loadMyEnrollments();
                // Dispatch custom event for real-time training updates
                window.dispatchEvent(new CustomEvent('trainingEnrolled', { detail: enrollmentData }));
            } else {
                toast.error('Failed to submit enrollment request. Please try again.');
            }
        } catch (error) {
            console.error('Error enrolling in training:', error);
            toast.error('Failed to enroll in training. Please try again.');
        }
    };

    const handleViewTrainingDetails = (training) => {
        setSelectedTraining(training);
        setShowTrainingDetailsModal(true);
    };

    const handleGoToTraining = () => {
        navigate('/hr2/tms');
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

    const openEditAccountDialog = async (user) => {
        setCurrentEditingUser(user);
        const employeeData = employees.find(emp => String(emp.id) === String(user.id))?.employee_data;

        let firstName = '';
        let lastName = '';

        if (employeeData) {
            firstName = employeeData.first_name || '';
            lastName = employeeData.last_name || '';
        } else {
            const nameParts = (user.name || '').trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        }

        setEditAccountForm({
            first_name: firstName,
            last_name: lastName,
            email: user.email || '',
            phone: employeeData?.phone || '',
            address: employeeData?.address || '',
            birthday: employeeData?.birthday || '',
            civil_status: employeeData?.civil_status || '',
            emergency_contact: employeeData?.emergency_contact || '',
            department: employeeData?.department || '',
            position: employeeData?.position || '',
            hire_date: employeeData?.hire_date || '',
            manager: employeeData?.manager || '',
            role: user.role || 'Employee',
            original_email: user.email || '',
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

            const fullName = [newAccountForm.first_name, newAccountForm.last_name].filter(Boolean).join(' ').trim();
            const registrationData = {
                name: fullName,
                email: newAccountForm.email,
                password: newAccountForm.password,
                role: newAccountForm.roles
            };

            const response = await api.post('/register', registrationData);

            const employeeData = {
                first_name: newAccountForm.first_name,
                last_name: newAccountForm.last_name,
                email: newAccountForm.email,
                roles: newAccountForm.roles,
                hire_date: new Date().toISOString().split('T')[0],
                employee_status: 'Active'
            };

            try {
                await hr2.employees.create(employeeData);
                console.log('HR2 employee record created successfully');
            } catch (hr2Error) {
                console.error('Failed to create HR2 employee record:', hr2Error);
                toast.warning('Account created but HR2 employee record may not be synced. Please contact administrator.');
            }

            toast.success("Account created successfully!");
            setNewAccountForm({ first_name: "", last_name: "", email: "", password: "", roles: "Employee" });

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
        console.log('handleEditAccount called for userId:', userId, 'current userRole:', userRole, 'isHR2Admin:', isHR2Admin);
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

            if (editAccountForm.email !== editAccountForm.original_email && !editAccountForm.email) {
                toast.error('Please provide an email address.');
                return;
            }

            const fullName = [editAccountForm.first_name, editAccountForm.last_name].filter(Boolean).join(' ').trim();

            const updateData = {
                name: fullName,
                role: editAccountForm.role
            };

            if (editAccountForm.email !== editAccountForm.original_email) {
                updateData.email = editAccountForm.email;
            }

            console.log('Sending update data to auth API:', updateData);
            let authUpdateSuccess = false;
            try {
                await api.put(`/users/${userId}`, updateData);
                authUpdateSuccess = true;
                console.log('Auth service updated successfully');
            } catch (authError) {
                console.error('Auth service update failed:', authError);
            }

            try {
                let currentEmployees = employees;
                if (currentEmployees.length === 0) {
                    console.log('Employees not loaded yet, fetching directly...');
                    const response = await hr2.users.getCombinedEmployees();
                    currentEmployees = response.value || response.data || response;
                    console.log('Fetched employees directly:', currentEmployees.length);
                }

                const combinedEmployee = currentEmployees.find(emp => String(emp.id) === String(userId));
                console.log('Editing user:', userId, 'isHR2Admin:', isHR2Admin, 'combinedEmployee found:', !!combinedEmployee, 'employee_data:', combinedEmployee?.employee_data);

                const hr2EmployeeId = combinedEmployee?.employee_data?.id;

                if (hr2EmployeeId) {
                    const hr2UpdateData = {
                        first_name: editAccountForm.first_name,
                        last_name: editAccountForm.last_name,
                        email: editAccountForm.email,
                        roles: editAccountForm.role,
                        phone: editAccountForm.phone,
                        address: editAccountForm.address,
                        birthday: editAccountForm.birthday,
                        civil_status: editAccountForm.civil_status,
                        emergency_contact: editAccountForm.emergency_contact,
                        department: editAccountForm.department,
                        position: editAccountForm.position,
                        hire_date: editAccountForm.hire_date,
                        manager: editAccountForm.manager
                    };

                    await hr2.employees.update(hr2EmployeeId, hr2UpdateData);
                    console.log('HR2 employee record updated successfully');
                } else if (isHR2Admin) {
                    const hr2CreateData = {
                        auth_user_id: userId,
                        user_id: userId,
                        first_name: editAccountForm.first_name,
                        last_name: editAccountForm.last_name,
                        email: editAccountForm.email,
                        roles: editAccountForm.role,
                        phone: editAccountForm.phone,
                        address: editAccountForm.address,
                        birthday: editAccountForm.birthday,
                        civil_status: editAccountForm.civil_status,
                        emergency_contact: editAccountForm.emergency_contact,
                        department: editAccountForm.department,
                        position: editAccountForm.position,
                        hire_date: editAccountForm.hire_date || new Date().toISOString().split('T')[0],
                        manager: editAccountForm.manager,
                        employee_status: 'Active'
                    };

                    console.log('Creating HR2 employee record with data:', hr2CreateData);
                    try {
                        await hr2.employees.create(hr2CreateData);
                        console.log('HR2 employee record created successfully');
                    } catch (createError) {
                        console.error('HR2 employee creation failed:', createError);
                        if (createError.response?.status === 422) {
                            console.log('Validation error, trying to find existing employee record by email');
                        }
                        throw createError;
                    }
                } else {
                    console.log('No HR2 employee record found and user is not HR2 Admin, skipping HR2 update');
                }
            } catch (hr2Error) {
                console.error('HR2 sync failed:', hr2Error);
                if (!authUpdateSuccess) {
                    throw hr2Error;
                }
            }

            toast.success('Account updated successfully!');

            setEditAccountDialogOpen(false);
            setCurrentEditingUser(null);
            setEditAccountForm({
                first_name: "",
                last_name: "",
                email: "",
                role: "Employee",
                original_email: "",
            });

            await loadUserAccounts();
            await loadAllEmployees();

            if (String(userId) === String(currentUser?.id)) {
                await loadProfile(currentUser?.id);
            }
        } catch (error) {
            console.error('Error updating account:', error);
            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors || error.response?.data;
                if (typeof validationErrors === 'object') {
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

            try {
                const combinedEmployee = employees.find(emp => String(emp.id) === String(userId));
                const hr2EmployeeId = combinedEmployee?.employee_data?.id;

                if (hr2EmployeeId) {
                    await hr2.employees.update(hr2EmployeeId, { employee_status: 'Inactive' });
                    console.log('HR2 employee record marked as inactive');
                } else {
                    console.log('No HR2 employee record found for user, skipping HR2 deactivation');
                }
            } catch (hr2Error) {
                console.error('HR2 deactivation failed:', hr2Error);
            }

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
                if (key === 'first_name' || key === 'last_name' || key === 'email') {
                    cleanedData[key] = value || '';
                } else if (value !== "" || key === 'roles') {
                    cleanedData[key] = value;
                }
            });

            if (!cleanedData.first_name) {
                cleanedData.first_name = form.first_name || '';
            }
            if (!cleanedData.last_name) {
                cleanedData.last_name = form.last_name || '';
            }
            if (!cleanedData.email) {
                cleanedData.email = form.email || '';
            }

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

            const hr2Data = { ...cleanedData };
            if (!isHR2Admin) {
                delete hr2Data.department;
                delete hr2Data.position;
                delete hr2Data.hire_date;
                delete hr2Data.manager;
                delete hr2Data.roles;
            }

            console.log('Sending auth data:', authData);
            console.log('Sending hr2 data:', hr2Data);
            console.log('Employee ID:', employeeId);

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

            if (Object.keys(authData).length > 0) {
                try {
                    await hr2.users.updateUser(currentAuthUserId, authData);
                    console.log('Auth update successful');
                } catch (authError) {
                    console.error('Auth update failed:', authError);

                    const errorMessage = authError.response?.data?.message ||
                        authError.response?.data?.error ||
                        authError.message || '';

                    if (errorMessage.toLowerCase().includes('email has been taken') ||
                        errorMessage.toLowerCase().includes('email already exists') ||
                        errorMessage.toLowerCase().includes('duplicate entry')) {
                        console.log('Email validation error detected, continuing with HR2 update only');
                        toast.warning('Email validation issue detected. Updating employee record only.');
                    } else {
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
                console.log('Attempting to update employee with ID:', employeeIdToUse);
                response = await hr2.employees.update(employeeIdToUse, hr2Data);
                console.log('HR2 Update successful:', response);
                updateSuccessful = true;
            } catch (updateError) {
                console.log('Update error caught:', updateError.response?.status);

                if (updateError.response?.status === 404) {
                    console.log('Employee not found, creating new employee record...');

                    try {
                        const createData = {
                            ...hr2Data,
                            auth_user_id: currentAuthUserId,
                            user_id: currentAuthUserId,
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
                    const errorMsg = updateError.response?.data?.message ||
                        updateError.response?.data?.error ||
                        'Failed to update employee profile.';
                    toast.error(errorMsg);
                    setSaving(false);
                    return;
                }
            }

            if (updateSuccessful) {
                toast.success('Employee profile updated successfully.');

                // Update profile state directly with the new data
                setProfile(prevProfile => ({
                    ...prevProfile,
                    ...hr2Data,
                    // Also update auth-related fields if they were changed
                    ...(authData.name && {
                        first_name: cleanedData.first_name,
                        last_name: cleanedData.last_name
                    }),
                    ...(authData.email && { email: cleanedData.email }),
                    ...(authData.role && { roles: cleanedData.roles })
                }));

                // Update form state as well
                setForm(prevForm => ({
                    ...prevForm,
                    ...hr2Data,
                    ...(authData.name && {
                        first_name: cleanedData.first_name,
                        last_name: cleanedData.last_name
                    }),
                    ...(authData.email && { email: cleanedData.email }),
                    ...(authData.role && { roles: cleanedData.roles })
                }));
            }
            await loadAllEmployees();
            await loadUserAccounts();
            // Removed loadProfile call since we're updating state directly
            setDialogOpen(false);
            setEditProfileDialogOpen(false);
            setIsEditing(false);
            setDialogData(null);
            // Dispatch custom event for real-time profile updates
            window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { userId: currentAuthUserId } }));
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
            const firstName = document.getElementById('firstName')?.value || '';
            const lastName = document.getElementById('lastName')?.value || '';
            const email = document.getElementById('email')?.value || '';
            const department = document.querySelector('[name="department"]')?.value || '';
            const position = document.getElementById('position')?.value || '';
            const hireDate = document.getElementById('hireDate')?.value || '';
            const employeeData = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                department: department,
                position: position,
                hire_date: hireDate,
                employee_status: 'Active'
            };
            const response = await hr2.employees.create(employeeData);
            toast.success('Employee added successfully.');
            await loadAllEmployees();
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
            const response = await fetch('http://front.tchr2.jolitravel.local:3002', {
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
        const isServerRunning = await checkServerStatus();
        if (!isServerRunning) {
            toast.error('HR2 server is not responding. Please start the server first.');
            toast.info('Run: cd hr2 && php artisan serve --port=3002', { autoClose: 8000 });
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
            if (e.response?.status === 404) {
                setTimeout(() => {
                    toast.info('Make sure the HR2 Laravel server is running on port 3002', { autoClose: 5000 });
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

    const handleUpdateClick = (empId) => {
        console.log('Editing employee:', empId);

        if (currentEditingUser) {
            toast.error('Please finish the current account editing session first.');
            return;
        }
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
        loadProfile(empId);
        setDialogOpen(true);
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            try {
                setSaving(true);

                const formData = new FormData();
                formData.append('profile_photo', selectedFile);

                const currentEmployeeId = currentUser?.id || employeeId;

                if (!currentEmployeeId) {
                    toast.error('Unable to identify user for photo upload');
                    return;
                }

                const response = await hr2.employees.uploadPhoto(currentEmployeeId, formData);

                if (response.profile_photo_url) {
                    setForm(f => ({ ...f, profile_photo_url: response.profile_photo_url }));

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
        setEmployeeId(null);
        setProfile(null);
        setIsEditing(false);
        setCurrentEditingUser(null);
        setEditAccountDialogOpen(false);
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
                    <p className="mt-4 text-muted-foreground">Loading Personal Data...</p>
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
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Personal Data</h2>
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
                            <User className="h-6 w-6 text-primary" />
                            <h1 className="text-lg font-semibold">Personal Data</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 space-y-8">
                {/* Personal Information - Read Only Display */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-purple-600" />
                                Personal Information
                            </CardTitle>
                            {(isEmployee || isHR2Admin) && (
                                <Button
                                    variant="outline"
                                    onClick={() => setEditProfileDialogOpen(true)}
                                    size="sm"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!loading && profile ? (
                            <div className="flex gap-6">
                                {/* Profile Photo */}
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

                                {/* Information Display */}
                                <div className="flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Personal Information */}
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">First Name</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.first_name || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Last Name</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.last_name || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Email</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.email || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Phone</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.phone || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Address</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.address || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Manager</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.manager || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        {/* Employment Information */}
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Department</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.department || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Position</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.position || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Birthday</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.birthday ? formatDate(profile.birthday) : 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Civil Status</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.civil_status || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.emergency_contact || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Hire Date</Label>
                                                <p className="text-sm text-gray-900 mt-1">{profile.hire_date ? formatDate(profile.hire_date) : 'Not provided'}</p>
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
                    </CardContent>
                </Card>

                {/* Edit Profile Dialog */}
                <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
                    <DialogContent
                        className="w-[95vw] max-w-none max-h-[90vh] overflow-y-auto"
                        style={{ width: '95vw', maxWidth: 'none' }}
                    >
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit className="w-5 h-5 text-purple-600" />
                                Edit Profile
                            </DialogTitle>
                            <DialogDescription>
                                Update your personal and employment information.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                            {/* Profile Photo Section */}
                            <div className="flex gap-6">
                                <div className="flex flex-col items-center space-y-4 min-w-[200px]">
                                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                                        <img
                                            src={form.profile_photo_url || profile?.profile_photo_url || 'https://imgur.com/gallery/empty-profile-BgI2COR#Yrf0E0C'}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current.click()}
                                        size="sm"
                                    >
                                        <Upload className="w-4 h-4 mr-1" />
                                        Change Photo
                                    </Button>
                                    <Input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Form Fields */}
                                <div className="flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Personal Information */}
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="editFirstName">First Name</Label>
                                                <Input
                                                    id="editFirstName"
                                                    value={form.first_name || ''}
                                                    onChange={(e) => handleChange('first_name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editLastName">Last Name</Label>
                                                <Input
                                                    id="editLastName"
                                                    value={form.last_name || ''}
                                                    onChange={(e) => handleChange('last_name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editEmail">Email</Label>
                                                <Input
                                                    id="editEmail"
                                                    type="email"
                                                    value={form.email || ''}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editPhone">Phone</Label>
                                                <Input
                                                    id="editPhone"
                                                    value={form.phone || ''}
                                                    onChange={(e) => handleChange('phone', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editAddress">Address</Label>
                                                <Input
                                                    id="editAddress"
                                                    value={form.address || ''}
                                                    onChange={(e) => handleChange('address', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editManager">Manager</Label>
                                                <Input
                                                    id="editManager"
                                                    value={form.manager || ''}
                                                    onChange={(e) => handleChange('manager', e.target.value)}
                                                    disabled={!isHR2Admin}
                                                    className={!isHR2Admin ? 'bg-gray-50' : ''}
                                                />
                                            </div>
                                        </div>
                                        {/* Employment Information */}
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="editDepartment">Department</Label>
                                                <Input
                                                    id="editDepartment"
                                                    value={form.department || ''}
                                                    onChange={(e) => handleChange('department', e.target.value)}
                                                    disabled={!isHR2Admin}
                                                    className={!isHR2Admin ? 'bg-gray-50' : ''}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editPosition">Position</Label>
                                                <Input
                                                    id="editPosition"
                                                    value={form.position || ''}
                                                    onChange={(e) => handleChange('position', e.target.value)}
                                                    disabled={!isHR2Admin}
                                                    className={!isHR2Admin ? 'bg-gray-50' : ''}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editBirthday">Birthday</Label>
                                                <Input
                                                    id="editBirthday"
                                                    type="date"
                                                    value={form.birthday || ''}
                                                    onChange={(e) => handleChange('birthday', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editCivilStatus">Civil Status</Label>
                                                <Input
                                                    id="editCivilStatus"
                                                    value={form.civil_status || ''}
                                                    onChange={(e) => handleChange('civil_status', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editEmergencyContact">Emergency Contact</Label>
                                                <Input
                                                    id="editEmergencyContact"
                                                    value={form.emergency_contact || ''}
                                                    onChange={(e) => handleChange('emergency_contact', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="editHireDate">Hire Date</Label>
                                                <Input
                                                    id="editHireDate"
                                                    type="date"
                                                    value={form.hire_date || ''}
                                                    onChange={(e) => handleChange('hire_date', e.target.value)}
                                                    disabled={!isHR2Admin}
                                                    className={!isHR2Admin ? 'bg-gray-50' : ''}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setEditProfileDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateEmployee}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Training & Competency Access */}
                {isEmployee && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Training Programs */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                    Training Programs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trainingLoading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                        <p className="text-muted-foreground">Loading training programs...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Training Title</TableHead>
                                                    <TableHead>Progress</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {myEnrollments.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                            No enrolled trainings found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    myEnrollments.map((enrollment) => {
                                                        const training = trainings.find(t => String(t.id) === String(enrollment.training_id));
                                                        const progress = getTrainingProgress(enrollment.training_id);

                                                        return (
                                                            <TableRow key={enrollment.id}>
                                                                <TableCell className="font-medium">
                                                                    {training ? training.title : 'Training not found'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <Progress value={progress} className="w-20 h-2" />
                                                                        <span className="text-sm">{progress}%</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="secondary">Enrolled</Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleViewTrainingDetails(training)}
                                                                        >
                                                                            <Eye className="w-4 h-4 mr-1" />
                                                                            View
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={handleGoToTraining}
                                                                        >
                                                                            <Target className="w-4 h-4 mr-1" />
                                                                            Go To Training
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Competency Framework */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-purple-600" />
                                    Competency Framework
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-medium">My Competency Profile</h3>
                                            <Badge variant="outline">View</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Review your current competency levels and development needs.
                                        </p>
                                        <div className="flex items-center justify-between text-xs">
                                            <span>Personal Dashboard</span>
                                            <Button size="sm">View Profile</Button>
                                        </div>
                                    </div>
                                    <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-medium">Competency Assessments</h3>
                                            <Badge variant="outline">Available</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Take assessments to evaluate and track your competency progress.
                                        </p>
                                        <div className="flex items-center justify-between text-xs">
                                            <span>Self-assessment • Manager review</span>
                                            <Button size="sm">Start Assessment</Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Account Management Section (Admin Only) */}
                {isHR2Admin && (
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-blue-600" />
                                Employee Management
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
                                                                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                                                <DialogHeader>
                                                                                    <DialogTitle>Edit Account</DialogTitle>
                                                                                    <DialogDescription>
                                                                                        Update user account information and personal details.
                                                                                    </DialogDescription>
                                                                                </DialogHeader>
                                                                                <div className="grid gap-6 py-4">
                                                                                    {/* Personal Information */}
                                                                                    <div className="space-y-4">
                                                                                        <h3 className="text-lg font-medium">Personal Information</h3>
                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                                                                <Label htmlFor="editAccountPhone">Phone</Label>
                                                                                                <Input
                                                                                                    id="editAccountPhone"
                                                                                                    name="phone"
                                                                                                    value={editAccountForm.phone}
                                                                                                    onChange={handleEditAccountFormChange}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="grid gap-2">
                                                                                                <Label htmlFor="editAccountAddress">Address</Label>
                                                                                                <Input
                                                                                                    id="editAccountAddress"
                                                                                                    name="address"
                                                                                                    value={editAccountForm.address}
                                                                                                    onChange={handleEditAccountFormChange}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="grid gap-2">
                                                                                                <Label htmlFor="editAccountBirthday">Birthday</Label>
                                                                                                <Input
                                                                                                    id="editAccountBirthday"
                                                                                                    name="birthday"
                                                                                                    type="date"
                                                                                                    value={editAccountForm.birthday}
                                                                                                    onChange={handleEditAccountFormChange}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="grid gap-2">
                                                                                                <Label htmlFor="editAccountCivilStatus">Civil Status</Label>
                                                                                                <Input
                                                                                                    id="editAccountCivilStatus"
                                                                                                    name="civil_status"
                                                                                                    value={editAccountForm.civil_status}
                                                                                                    onChange={handleEditAccountFormChange}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="grid gap-2">
                                                                                                <Label htmlFor="editAccountEmergencyContact">Emergency Contact</Label>
                                                                                                <Input
                                                                                                    id="editAccountEmergencyContact"
                                                                                                    name="emergency_contact"
                                                                                                    value={editAccountForm.emergency_contact}
                                                                                                    onChange={handleEditAccountFormChange}
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Employment Information */}
                                                                                    <div className="space-y-4">
                                                                                        <h3 className="text-lg font-medium">Employment Information</h3>
                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                            <div className="grid gap-2">
                                                                                                <Label htmlFor="editAccountDepartment">Department</Label>
                                                                                                <Input
                                                                                                    id="editAccountDepartment"
                                                                                                    name="department"
                                                                                                    value={editAccountForm.department}
                                                                                                    onChange={handleEditAccountFormChange}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="grid gap-2">
                                                                                                <Label htmlFor="editAccountPosition">Position</Label>
                                                                                                <Input
                                                                                                    id="editAccountPosition"
                                                                                                    name="position"
                                                                                                    value={editAccountForm.position}
                                                                                                    onChange={handleEditAccountFormChange}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="grid gap-2">
                                                                                                <Label htmlFor="editAccountHireDate">Hire Date</Label>
                                                                                                <Input
                                                                                                    id="editAccountHireDate"
                                                                                                    name="hire_date"
                                                                                                    type="date"
                                                                                                    value={editAccountForm.hire_date}
                                                                                                    onChange={handleEditAccountFormChange}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="grid gap-2">
                                                                                                <Label htmlFor="editAccountManager">Manager</Label>
                                                                                                <Input
                                                                                                    id="editAccountManager"
                                                                                                    name="manager"
                                                                                                    value={editAccountForm.manager}
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
                                                                                    </div>
                                                                                </div>
                                                                                <DialogFooter>
                                                                                    <Button variant="outline" onClick={() => setEditAccountDialogOpen(false)}>
                                                                                        Cancel
                                                                                    </Button>
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

            {/* Training Details Modal */}
            <Dialog open={showTrainingDetailsModal} onOpenChange={setShowTrainingDetailsModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 break-words pr-8">
                            <BookOpen className="w-5 h-5 flex-shrink-0" />
                            <span className="break-words">{selectedTraining?.title}</span>
                        </DialogTitle>
                        <DialogDescription>
                            View detailed information about this training program.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTraining && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground break-words">{selectedTraining.description || 'No description available'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-1">Trainer</h4>
                                    <p className="text-sm text-muted-foreground">{selectedTraining.trainer || 'TBA'}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Duration</h4>
                                    <p className="text-sm text-muted-foreground">{selectedTraining.duration || 'TBA'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-1">Format</h4>
                                    <Badge variant="secondary">{selectedTraining.format || 'Online'}</Badge>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Topic</h4>
                                    <p className="text-sm text-muted-foreground break-words">{selectedTraining.topic || 'General'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-1">Start Date</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedTraining.startDate ? formatDate(selectedTraining.startDate) : 'TBA'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">End Date</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedTraining.endDate ? formatDate(selectedTraining.endDate) : 'TBA'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTrainingDetailsModal(false)}>
                            Close
                        </Button>
                        <Button onClick={handleGoToTraining}>
                            <Target className="w-4 h-4 mr-2" />
                            Go To Training
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster position="bottom-right" />
        </div>
    );
};
export default ESS;