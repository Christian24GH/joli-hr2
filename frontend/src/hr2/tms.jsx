import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AuthContext from '../context/AuthProvider';
import { hr2 } from '../api/hr2.js';
import { toast, Toaster } from 'sonner';
import {
    Search, Calendar, User, Plus, Edit,
    Trash2, Download, Users, Clock, CheckCircle,
    XCircle, AlertCircle, BookOpen, Award,
    TrendingUp, History, Star, ClockArrowUp,
    Blocks, LibraryBig, MessageSquare, MessageSquareDashed,
    Eye, CalendarPlus, X,
    ClipboardList,
    CircleAlert,
    ClockAlert,
    WrenchIcon
} from 'lucide-react';

const TrainingManagementSystem = () => {
    const { auth } = useContext(AuthContext);

    // Helper function to determine if user is HR2 Admin
    const isHR2Admin = () => {
        return auth?.role === "HR2 Admin";
    };

    // Helper function to determine if user is Trainer
    const isTrainer = () => {
        return auth?.role === "Trainer";
    };

    // Helper function to get employee ID
    const getEmployeeId = () => {
        // Priority: auth.employee_id, then localStorage employeeId, then auth.id as fallback
        return auth?.employee_id || localStorage.getItem('employeeId') || auth?.id;
    };

    // Helper function to determine if user is employee (different permissions)
    const isEmployee = () => {
        return auth?.role === "Employee";
    };

    // Main data states
    const [trainings, setTrainings] = useState([]);
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [completedTrainings, setCompletedTrainings] = useState([]);
    const [feedbackData, setFeedbackData] = useState([]);
    const [stats, setStats] = useState({
        totalTrainings: 0,
        enrolledTrainings: 0,
        completedTrainings: 0,
        upcomingSessions: 0
    });

    // UI states
    const [searchTerm, setSearchTerm] = useState('');
    const [topicFilter, setTopicFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [dashboardView, setDashboardView] = useState('upcoming'); // 'upcoming' or 'completed'
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Auto-refresh states
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [recentlyEnrolled, setRecentlyEnrolled] = useState(new Set()); // Track recently enrolled training IDs

    // Auto-refresh intervals (in milliseconds) - less frequent for subtle updates
    const REFRESH_INTERVALS = {
        trainings: 60000,      // 1 minute - training catalog changes less frequently
        enrollments: 30000,    // 30 seconds - enrollments change more often
        completions: 45000,    // 45 seconds - completions are important to see quickly
        applications: 20000,   // 20 seconds - admin needs to see new applications quickly
        feedback: 120000       // 2 minutes - feedback changes least frequently
    };

    // Dialog states - similar to ESS
    const [showAddTrainingModal, setShowAddTrainingModal] = useState(false);
    const [showEditTrainingModal, setShowEditTrainingModal] = useState(false);
    const [showTrainingDetailsModal, setShowTrainingDetailsModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAddFeedback, setShowAddFeedback] = useState(false);
    const [showManageTrainingModal, setShowManageTrainingModal] = useState(false);
    const [showManageSessionsModal, setShowManageSessionsModal] = useState(false);

    // Selected items for modals
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [editingTraining, setEditingTraining] = useState(null);
    const [selectedTrainingSession, setSelectedTrainingSession] = useState(null);
    const [enrolledParticipants, setEnrolledParticipants] = useState([]);

    // Form states
    const [newTraining, setNewTraining] = useState({
        title: '',
        description: '',
        trainer: '',
        duration: '',
        topic: '',
        targetRole: '',
        startDate: '',
        endDate: '',
        maxParticipants: '',
        location: '',
        difficulty: 'Beginner',
        format: 'In-Person',
        prerequisites: '',
        objectives: ''
    });

    const [enrollmentData, setEnrollmentData] = useState({
        notes: ''
    });

    const [scheduleData, setScheduleData] = useState({
        sessionTitle: '',
        sessionDescription: '',
        startDateTime: '',
        endDateTime: '',
        location: '',
        maxAttendees: ''
    });

    // Data loading - Replace with API calls
    useEffect(() => {
        const loadInitialData = async () => {
            if (!auth) return;

            setError(null);
            try {
                await loadTrainingData(true); // silent
                if (isEmployee()) {
                    await loadMyEnrollments(true);
                    await loadCompletedTrainings(true);
                    await loadFeedbackData(true);
                }
                setLoading(false);
            } catch (err) {
                console.error('Failed to load training data:', err);
                setError('Failed to load training data');
                setLoading(false);
            }
        };

        loadInitialData();
    }, [auth]);

    // Reload enrolled participants when training session changes
    useEffect(() => {
        if (selectedTrainingSession && showManageSessionsModal) {
            loadEnrolledParticipants(selectedTrainingSession.id);
        }
    }, [selectedTrainingSession, showManageSessionsModal]);

    // Auto-refresh functionality
    useEffect(() => {
        if (!auth || !autoRefreshEnabled) return;

        // Auto-refresh training data
        const trainingInterval = setInterval(() => {
            loadTrainingData();
        }, REFRESH_INTERVALS.trainings);

        // Auto-refresh enrollments for employees
        let enrollmentInterval;
        if (isEmployee()) {
            enrollmentInterval = setInterval(() => {
                loadMyEnrollments();
                loadCompletedTrainings();
                loadFeedbackData();
            }, REFRESH_INTERVALS.enrollments);
        }

        // Auto-refresh applications for admins/trainers
        let applicationInterval;
        if (isHR2Admin() || isTrainer()) {
            applicationInterval = setInterval(() => {
                loadTrainingData(); // Refresh training list with applications
            }, REFRESH_INTERVALS.applications);
        }

        return () => {
            clearInterval(trainingInterval);
            if (enrollmentInterval) clearInterval(enrollmentInterval);
            if (applicationInterval) clearInterval(applicationInterval);
        };
    }, [auth, autoRefreshEnabled]);

    // Load training data from backend
    const loadTrainingData = async (silent = false) => {
        try {
            const response = await hr2.training.getAll({
                search: searchTerm,
                topic: topicFilter,
                role: roleFilter,
                date: dateFilter
            });

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
                // No training data available
                setTrainings([]);
            }

            // Update stats
            setStats(prevStats => ({
                ...prevStats,
                totalTrainings: response && response.data ? response.data.length : 0
            }));

        } catch (error) {
            console.error('Failed to load training data:', error);
            if (!silent) toast.error('Failed to load training data');
        }
    };

    // Load employee enrollments
    const loadMyEnrollments = async (silent = false) => {
        try {
            const response = await hr2.trainingApplications.getByEmployee(getEmployeeId());

            if (response && response.data && response.data.length) {
                // Filter out rejected, completed, and cancelled applications so they don't appear as current enrollments
                // Completed applications should only appear in Training History
                const activeEnrollments = response.data.filter(app =>
                    app.status !== 'rejected' && app.status !== 'completed' && app.status !== 'cancelled'
                );
                setMyEnrollments(activeEnrollments);

                // Clear recently enrolled since we now have the real data
                setRecentlyEnrolled(new Set());

                setStats(prevStats => ({
                    ...prevStats,
                    enrolledTrainings: activeEnrollments.length,
                    upcomingSessions: activeEnrollments.filter(e => e.status === 'approved').length
                }));
            } else {
                // No enrollment data available
                setMyEnrollments([]);
                setStats(prevStats => ({
                    ...prevStats,
                    enrolledTrainings: 0,
                    upcomingSessions: 0
                }));
            }

        } catch (error) {
            console.error('Failed to load enrollments:', error);
            if (!silent) toast.error('Failed to load enrollments');
        }
    };

    // Load completed trainings
    const loadCompletedTrainings = async (silent = false) => {
        try {
            const response = await hr2.trainingCompletions.getByEmployee(getEmployeeId());

            if (response && response.data && response.data.length) {
                // Transform the data to match the expected format
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
                // No completed training data available
                setCompletedTrainings([]);
            }

            setStats(prevStats => ({
                ...prevStats,
                completedTrainings: completedTrainings.length
            }));

        } catch (error) {
            console.error('Failed to load completed trainings:', error);
            if (!silent) toast.error('Failed to load completed trainings');
        }
    };

    // Load feedback data
    const loadFeedbackData = async (silent = false) => {
        try {
            const response = await hr2.trainingFeedback.getByEmployee(getEmployeeId());

            if (response && response.data && response.data.length) {
                setFeedbackData(response.data);
            } else {
                // No feedback data available
                setFeedbackData([]);
            }

        } catch (error) {
            console.error('Failed to load feedback data:', error);
            if (!silent) toast.error('Failed to load feedback data');
        }
    };

    // Training Management Functions (HR2 Admin/Trainer)
    const handleCreateTraining = async () => {
        if (!newTraining.title || !newTraining.duration || !newTraining.topic) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const response = await hr2.training.create({
                title: newTraining.title,
                description: newTraining.description,
                objectives: newTraining.objectives,
                trainer: newTraining.trainer,
                duration: newTraining.duration,
                topic: newTraining.topic,
                targetRole: newTraining.targetRole,
                prerequisites: newTraining.prerequisites,
                startDate: newTraining.startDate,
                endDate: newTraining.endDate,
                maxParticipants: newTraining.maxParticipants,
                location: newTraining.location,
                difficulty: newTraining.difficulty,
                format: newTraining.format
            });

            if (response.data && response.data.success) {
                toast.success('Training created successfully');
                setShowAddTrainingModal(false);
                setNewTraining({
                    title: '',
                    description: '',
                    trainer: '',
                    duration: '',
                    topic: '',
                    targetRole: '',
                    startDate: '',
                    endDate: '',
                    maxParticipants: '',
                    location: '',
                    difficulty: 'Beginner',
                    format: 'In-Person',
                    prerequisites: '',
                    objectives: ''
                });
                loadTrainingData();
            } else {
                toast.error(response.data?.message || 'Failed to create training');
            }
        } catch (error) {
            console.error('Failed to create training:', error);
            toast.error('Failed to create training');
        }
    };

    const handleEditTraining = (training) => {
        setEditingTraining(training);
        setNewTraining({
            title: training.title,
            description: training.description,
            trainer: training.trainer,
            duration: training.duration,
            topic: training.topic,
            targetRole: training.targetRole,
            startDate: training.startDate,
            endDate: training.endDate,
            maxParticipants: training.maxParticipants,
            location: training.location,
            difficulty: training.difficulty,
            format: training.format,
            prerequisites: training.prerequisites || '',
            objectives: training.objectives || ''
        });
        setShowEditTrainingModal(true);
    };

    const handleUpdateTraining = async () => {
        if (!newTraining.title || !newTraining.duration || !newTraining.topic) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const response = await hr2.training.update(editingTraining.id, {
                title: newTraining.title,
                description: newTraining.description,
                objectives: newTraining.objectives,
                trainer: newTraining.trainer,
                duration: newTraining.duration,
                topic: newTraining.topic,
                targetRole: newTraining.targetRole,
                prerequisites: newTraining.prerequisites,
                startDate: newTraining.startDate,
                endDate: newTraining.endDate,
                maxParticipants: newTraining.maxParticipants,
                location: newTraining.location,
                difficulty: newTraining.difficulty,
                format: newTraining.format
            });

            if (response.data && response.data.success) {
                toast.success('Training updated successfully');
                setShowEditTrainingModal(false);
                setEditingTraining(null);
                loadTrainingData();
            } else {
                toast.error(response.data?.message || 'Failed to update training');
            }
        } catch (error) {
            console.error('Failed to update training:', error);
            toast.error('Failed to update training');
        }
    };

    const handleDeleteTraining = async (training) => {
        if (!confirm(`Are you sure you want to remove "${training.title}" from the catalog? Employee training history will be preserved.`)) {
            return;
        }

        try {
            const response = await hr2.training.delete(training.id);

            if (response.data && response.data.success) {
                toast.success('Training removed from catalog successfully');
                loadTrainingData();
            } else {
                toast.error(response.data?.message || 'Failed to remove training');
            }
        } catch (error) {
            console.error('Failed to remove training:', error);
            toast.error('Failed to remove training');
        }
    };

    // Employee Functions
    const handleViewTrainingDetails = (training) => {
        setSelectedTraining(training);
        setShowTrainingDetailsModal(true);
    };

    const handleEnrollTraining = (training) => {
        setSelectedTraining(training);
        setEnrollmentData({ notes: '' });
        setShowEnrollModal(true);
    };

    const handleSubmitEnrollment = async () => {
        try {
            const employeeId = parseInt(getEmployeeId());
            const trainingId = parseInt(selectedTraining.id);

            console.log('Submitting enrollment with:', {
                training_id: trainingId,
                employee_id: employeeId,
                notes: enrollmentData.notes
            });

            const response = await hr2.trainingApplications.apply({
                training_id: trainingId,
                employee_id: employeeId,
                notes: enrollmentData.notes
            });

            if (response.data && response.data.success) {
                toast.success('Training enrollment submitted successfully');
                setShowEnrollModal(false);
                setSelectedTraining(null);
                setEnrollmentData({ notes: '' });

                // Immediately mark as enrolled to disable button
                setRecentlyEnrolled(prev => new Set([...prev, String(trainingId)]));

                loadMyEnrollments();
            } else {
                toast.error(response.data?.error || 'Failed to submit enrollment');
            }
        } catch (error) {
            console.error('Failed to submit enrollment:', error);
            toast.error('Failed to submit enrollment');
        }
    };

    const handleUnenrollTraining = async (enrollment) => {
        if (!confirm('Are you sure you want to unenroll from this training?')) {
            return;
        }

        try {
            const response = await hr2.trainingApplications.cancel(enrollment.id);

            if (response.data && response.data.success) {
                toast.success('Successfully unenrolled from training');

                loadMyEnrollments(); // This will filter out the cancelled enrollment
            } else {
                toast.error(response.data?.message || 'Failed to unenroll');
            }
        } catch (error) {
            console.error('Failed to unenroll:', error);
            toast.error('Failed to unenroll from training');
        }
    };

    const handleSyncToCalendar = async (enrollment) => {
        try {
            const response = await hr2.trainingCalendar.sync(enrollment.id);

            if (response.data && response.data.success) {
                toast.success('Training synced to calendar successfully');
            } else {
                toast.error(response.data?.message || 'Failed to sync to calendar');
            }
        } catch (error) {
            console.error('Failed to sync to calendar:', error);
            toast.error('Failed to sync to calendar');
        }
    };

    // Schedule Training (HR2 Admin/Trainer)
    const handleScheduleTraining = (training) => {
        setSelectedTraining(training);
        setScheduleData({
            sessionTitle: `${training.title} - Session`,
            sessionDescription: training.description,
            startDateTime: '',
            endDateTime: '',
            location: training.location || '',
            maxAttendees: training.maxParticipants || ''
        });
        setShowScheduleModal(true);
    };

    const handleSubmitSchedule = async () => {
        if (!scheduleData.startDateTime || !scheduleData.endDateTime) {
            toast.error('Please fill in start and end date/time');
            return;
        }

        try {
            const response = await hr2.trainingSessions.create({
                training_id: selectedTraining.id,
                session_title: scheduleData.sessionTitle,
                session_description: scheduleData.sessionDescription,
                start_datetime: scheduleData.startDateTime,
                end_datetime: scheduleData.endDateTime,
                location: scheduleData.location,
                max_participants: scheduleData.maxAttendees
            });

            if (response.data && response.data.success) {
                toast.success('Training session scheduled successfully');
                setShowScheduleModal(false);
                setSelectedTraining(null);
                // Refresh training data to show updated status
                loadTrainingData();
            } else {
                toast.error(response.data?.message || 'Failed to schedule training');
            }
        } catch (error) {
            console.error('Failed to schedule training:', error);
            toast.error('Failed to schedule training');
        }
    };

    // Download Certificate
    const handleDownloadCertificate = async (completion) => {
        try {
            const blob = await hr2.certificates.download(completion.certificateId);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `certificate_${completion.trainingName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('Certificate downloaded successfully');
        } catch (error) {
            console.error('Failed to download certificate:', error);
            toast.error('Failed to download certificate');
        }
    };

    // Submit Feedback
    const handleSubmitFeedback = async (feedbackData) => {
        try {
            const response = await hr2.trainingFeedback.submit(feedbackData);

            if (response.data && response.data.success) {
                toast.success('Feedback submitted successfully');
                setShowAddFeedback(false);
                loadFeedbackData();
            } else {
                toast.error(response.data?.message || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            toast.error('Failed to submit feedback');
        }
    };

    // Handle managing training sessions
    const handleManageTrainingSessions = (training) => {
        setSelectedTrainingSession(training);
        setShowManageSessionsModal(true);
        loadEnrolledParticipants(training.id);
    };

    // Load enrolled participants for a training session
    const loadEnrolledParticipants = async (trainingId) => {
        try {
            // Get all training applications and filter by training ID and exclude cancelled, rejected, and completed
            const response = await hr2.trainingApplications.getAll();
            const participants = response.data.filter(app =>
                app.training_id == trainingId &&
                app.status !== 'cancelled' &&
                app.status !== 'rejected' &&
                app.status !== 'completed'
            );
            setEnrolledParticipants(participants);
        } catch (error) {
            console.error('Failed to load enrolled participants:', error);
            toast.error('Failed to load enrolled participants');
            setEnrolledParticipants([]);
        }
    };

    // Mark participant as completed
    const handleMarkParticipantCompleted = async (applicationId, employeeId, participant = null) => {
        try {

            // Get the training application to get training_id
            let trainingId;
            if (participant && participant.training_id) {
                trainingId = participant.training_id;
            } else {
                const application = enrolledParticipants.find(p => p.id === applicationId);
                if (!application) {
                    toast.error('Application not found');
                    return;
                }
                trainingId = application.training_id;
            }

            // Create training completion
            const completionData = {
                application_id: parseInt(applicationId),
                employee_id: parseInt(employeeId),
                training_id: parseInt(trainingId),
                completion_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
                completion_notes: 'Marked as completed by trainer/admin'
            };

            const response = await hr2.trainingCompletions.create(completionData);

            if (response.data && response.data.success) {
                toast.success('Participant marked as completed');
                // Reload participants to update the list
                if (selectedTrainingSession) {
                    loadEnrolledParticipants(selectedTrainingSession.id);
                }
                // Reload user's enrollments to update status
                loadMyEnrollments();
            } else {
                toast.error(response.data?.message || 'Failed to mark participant as completed');
            }
        } catch (error) {
            console.error('Failed to mark participant as completed:', error);
            toast.error('Failed to mark participant as completed');
        }
    };

    // Approve training application
    const handleApproveApplication = async (applicationId) => {
        try {
            const response = await hr2.trainingApplications.approve(applicationId);

            if (response.data && response.data.success) {
                toast.success('Application approved successfully');
                // Reload participants to update the list
                if (selectedTrainingSession) {
                    loadEnrolledParticipants(selectedTrainingSession.id);
                }
            } else {
                toast.error(response.data?.message || 'Failed to approve application');
            }
        } catch (error) {
            console.error('Failed to approve application:', error);
            toast.error('Failed to approve application');
        }
    };

    // Reject training application
    const handleRejectApplication = async (applicationId) => {
        try {
            const response = await hr2.trainingApplications.reject(applicationId);

            if (response.data && response.data.success) {
                toast.success('Application rejected successfully');
                // Reload participants to update the list
                if (selectedTrainingSession) {
                    loadEnrolledParticipants(selectedTrainingSession.id);
                }
            } else {
                toast.error(response.data?.message || 'Failed to reject application');
            }
        } catch (error) {
            console.error('Failed to reject application:', error);
            toast.error('Failed to reject application');
        }
    };

    // Get enrollment status for a training
    const getEnrollmentStatus = (trainingId) => {
        // Check if recently enrolled
        if (recentlyEnrolled.has(String(trainingId))) {
            return 'applied'; // Return a status to indicate enrollment
        }

        // Check current enrollments
        const enrollment = myEnrollments.find(e => String(e.training_id) === String(trainingId));
        if (enrollment && enrollment.status !== 'cancelled') {
            return enrollment.status;
        }

        // Check if training is completed
        const completed = completedTrainings.find(c => String(c.training?.id) === String(trainingId));
        if (completed) {
            return 'completed';
        }

        return null;
    };

    // Filter trainings based on search and filters
    const filteredTrainings = trainings.filter(training => {
        const title = training.title || training.program_name || '';
        const topic = training.topic || training.target_skills || '';
        const targetRole = training.targetRole || training.required_role || '';
        const startDate = training.startDate || training.start_date || '';

        return (
            title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (topicFilter === '' || topic === topicFilter) &&
            (roleFilter === '' || targetRole === roleFilter || targetRole === 'All') &&
            (dateFilter === '' || startDate >= dateFilter) &&
            getEnrollmentStatus(training.id) !== 'completed'
        );
    });

    // Enhanced Status badge component (Shadcn-style)
    const StatusBadge = ({ status }) => {
        // Handle null, undefined, or empty status
        if (!status) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not Enrolled
                </Badge>
            );
        }

        const variants = {
            Approved: { variant: 'success', icon: CheckCircle },
            approved: { variant: 'success', icon: CheckCircle },
            Pending: { variant: 'warning', icon: AlertCircle },
            applied: { variant: 'warning', icon: AlertCircle },
            Rejected: { variant: 'error', icon: XCircle },
            rejected: { variant: 'error', icon: XCircle, displayText: 'Unenrolled' },
            cancelled: { variant: 'secondary', icon: XCircle },
            Cancelled: { variant: 'secondary', icon: XCircle }
        };

        const config = variants[status];

        // Handle unknown status values
        if (!config) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {status}
                </Badge>
            );
        }

        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="w-3 h-3" />
                {config.displayText || status}
            </Badge>
        );
    };

    // Enhanced Training Card Component (Shadcn-style)
    const TrainingCard = ({ training }) => {
        const enrollmentStatus = getEnrollmentStatus(training.id);

        // Safe property access with fallbacks
        const title = training.title || training.program_name || 'Untitled Training';
        const trainer = training.trainer || 'TBA';
        const rating = training.rating || training.feedback_score || 0;
        const description = training.description || 'No description available';
        const format = training.format || 'Online';
        const duration = training.duration || 'TBA';
        const difficulty = training.difficulty || 'Beginner';
        const enrolled = training.enrolled || training.enrolled_count || 0;
        const maxParticipants = training.maxParticipants || training.max_participants || 0;
        const topic = training.topic || training.target_skills || 'General';

        const getDifficultyColor = (difficulty) => {
            switch (difficulty) {
                case 'Beginner': return 'bg-green-100 text-green-800';
                case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
                case 'Advanced': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };

        const getFormatIcon = (format) => {
            switch (format) {
                case 'Online': return '💻';
                case 'In-Person': return '🏢';
                case 'Hybrid': return '🔄';
                default: return '📚';
            }
        };

        return (
            <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-2 line-clamp-2">{title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{trainer}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0 ml-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {rating}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-shrink-0">{description}</p>

                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                            {getFormatIcon(format)} {format}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {duration}
                        </Badge>
                        <Badge className={`text-xs ${getDifficultyColor(difficulty)}`}>
                            {difficulty}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground flex-shrink-0">
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {enrolled}/{maxParticipants} enrolled
                        </span>
                        <span className="truncate">{topic}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t mt-auto">
                        {isHR2Admin() ? (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="gap-1">
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </Button>
                                <Button variant="destructive" size="sm" className="gap-1">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                            </div>
                        ) : isTrainer() ? (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="gap-1">
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </Button>
                                <Button variant="destructive" size="sm" className="gap-1">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <div className="text-sm text-muted-foreground truncate">
                                    Starts {new Date(training.startDate).toLocaleDateString()}
                                </div>
                                {enrollmentStatus ? (
                                    <StatusBadge status={enrollmentStatus} />
                                ) : (
                                    <Button size="sm" className="gap-1">
                                        <BookOpen className="w-4 h-4" />
                                        Enroll
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Training Management...</p>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Training Management</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Responsive Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
                <div className="container flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <WrenchIcon className="h-5 w-5 text-primary flex-shrink-0" />
                        <h1 className="text-base sm:text-lg font-semibold truncate">Training Management</h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/*Training Catalog */}
                <Card>
                    <div className="p-3 sm:p-4 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                            <div className="flex items-center gap-2">
                                <LibraryBig className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <h2 className="text-lg font-semibold">Training Catalog</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:justify-end sm:ml-auto">
                                <div className="relative flex-1 sm:flex-initial">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Search trainings..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-full h-9"
                                    />
                                </div>
                                {(isHR2Admin() || isTrainer()) && (
                                    <Button size="sm" onClick={() => setShowAddTrainingModal(true)} className="whitespace-nowrap">
                                        <Plus className="w-4 h-4 mr-1" />
                                        <span className="hidden xs:inline">New Training</span>
                                        <span className="xs:hidden">New</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {filteredTrainings.length === 0 ? (
                                <div className="col-span-full flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Training Available</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {searchTerm || topicFilter || roleFilter || dateFilter
                                                ? "No trainings match your current filters. Try adjusting your search criteria."
                                                : "There are currently no trainings available. Check back later or contact your HR administrator."
                                            }
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                filteredTrainings.map(training => (
                                    <div key={training.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                            <h3 className="font-medium text-sm line-clamp-2 flex-1">{training.title}</h3>
                                            <div className="flex flex-wrap gap-1">
                                                <Badge variant="secondary" className="text-xs">{training.format}</Badge>
                                                <Badge variant="outline" className="text-xs">{training.difficulty}</Badge>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{training.description}</p>

                                        <div className="space-y-2 mb-3">
                                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{training.duration}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <ClipboardList className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{training.topic}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{training.trainer}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{training.enrolled}/{training.maxParticipants}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-3 pt-3 border-t">
                                            {isHR2Admin() || isTrainer() ? (
                                                <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start w-full">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditTraining(training)}
                                                        className="flex-1 sm:flex-initial gap-1"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        <span className="hidden sm:inline">Edit</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteTraining(training)}
                                                        className="flex-1 sm:flex-initial gap-1"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        <span className="hidden sm:inline">Delete</span>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
                                                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleViewTrainingDetails(training)}
                                                            className="flex-1 gap-1"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            <span className="hidden sm:inline">View</span>
                                                        </Button>
                                                        {isEmployee() && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => !getEnrollmentStatus(training.id) ? handleEnrollTraining(training) : null}
                                                                disabled={!!getEnrollmentStatus(training.id)}
                                                                className="flex-1 gap-1"
                                                            >
                                                                <BookOpen className="w-3 h-3" />
                                                                <span className="hidden sm:inline">{getEnrollmentStatus(training.id) ? 'Enrolled' : 'Enroll'}</span>
                                                                <span className="sm:hidden">{getEnrollmentStatus(training.id) ? '✓' : '+'}</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Training Status & History Section */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                            <div className="flex items-center gap-2">
                                <Blocks className="w-5 h-5 text-rose-600 flex-shrink-0" />
                                <CardTitle className="text-xl sm:text-2xl">Training Status & History</CardTitle>
                            </div>
                            <div className="flex items-center space-x-1 rounded-lg bg-muted p-1 justify-start sm:justify-end sm:ml-auto">
                                <Button
                                    variant={dashboardView === 'upcoming' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setDashboardView('upcoming')}
                                    className="text-xs sm:text-sm px-2 sm:px-3"
                                >
                                    <span className="hidden sm:inline">Upcoming Sessions</span>
                                    <span className="sm:hidden">Upcoming</span>
                                </Button>
                                <Button
                                    variant={dashboardView === 'completed' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setDashboardView('completed')}
                                    className="text-xs sm:text-sm px-2 sm:px-3"
                                >
                                    <span className="hidden sm:inline">Training History</span>
                                    <span className="sm:hidden">History</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Enhanced Upcoming Sessions Table */}
                        {dashboardView === 'upcoming' && (
                            <Card>
                                <CardHeader>
                                    {isHR2Admin() || isTrainer() ? (
                                        <CardTitle className="flex item-center gap-2">
                                            <ClockAlert className="w-5 h-5 text-cyan-600" />
                                            Manage Training Sessions
                                        </CardTitle>
                                    ) : (
                                        <CardTitle className="flex item-center gap-2">
                                            <ClockArrowUp className="w-5 h-5 text-cyan-600" />
                                            Upcoming Training Sessions
                                        </CardTitle>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {(isHR2Admin() || isTrainer()) ? (
                                        // For HR2 Admin/Trainer: Show all trainings they can manage
                                        trainings.length > 0 ? (
                                            <>
                                                {/* Mobile Card View */}
                                                <div className="block md:hidden space-y-3">
                                                    {trainings.map(training => (
                                                        <Card key={training.id} className="p-4">
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h3 className="font-medium text-sm">{training.program_name || training.title || 'Training Name Not Available'}</h3>
                                                                        <p className="text-xs text-muted-foreground">{training.trainer || 'TBA'}</p>
                                                                    </div>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {training.enrolled_count || 0} / {training.max_participants || 'Unlimited'}
                                                                    </Badge>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        <span className="truncate">
                                                                            {training.start_date
                                                                                ? new Date(training.start_date).toLocaleDateString()
                                                                                : 'Date TBA'
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        <span className="truncate">{training.location || 'Location TBA'}</span>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full gap-1"
                                                                    onClick={() => handleManageTrainingSessions(training)}
                                                                >
                                                                    <Users className="w-4 h-4" />
                                                                    Manage Attendees
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>

                                                {/* Desktop Table View */}
                                                <div className="hidden md:block overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b">
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Training Name</th>
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date & Time</th>
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Enrolled</th>
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {trainings.map(training => (
                                                                <tr key={training.id} className="border-b hover:bg-muted/50">
                                                                    <td className="py-4 px-4">
                                                                        <div className="font-medium">
                                                                            {training.program_name || training.title || 'Training Name Not Available'}
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {training.trainer || 'TBA'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-4">
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                            <Calendar className="w-4 h-4" />
                                                                            {training.start_date
                                                                                ? new Date(training.start_date).toLocaleDateString() + ' ' +
                                                                                new Date(training.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                                : 'Date TBA'
                                                                            }
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-4">
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {training.location || 'Location TBA'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-4">
                                                                        <Badge variant="secondary">
                                                                            {training.enrolled_count || 0} / {training.max_participants || 'Unlimited'}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="py-4 px-4">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="gap-1"
                                                                            onClick={() => handleManageTrainingSessions(training)}
                                                                        >
                                                                            <Users className="w-4 h-4" />
                                                                            Manage Attendees
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-lg font-medium">No Trainings Available</p>
                                                <p className="text-sm">No training sessions have been created yet.</p>
                                            </div>
                                        )
                                    ) : (
                                        // For regular employees: Show their enrollments
                                        myEnrollments.filter(enrollment =>
                                            enrollment.status &&
                                            enrollment.status.toLowerCase() !== 'cancelled'
                                        ).length > 0 ? (
                                            <>
                                                {/* Mobile Card View */}
                                                <div className="block md:hidden space-y-3">
                                                    {myEnrollments.filter(enrollment =>
                                                        enrollment.status &&
                                                        enrollment.status.toLowerCase() !== 'cancelled'
                                                    ).map(enrollment => (
                                                        <Card key={enrollment.id} className="p-4">
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h3 className="font-medium text-sm">{enrollment.training?.program_name || enrollment.training?.title || enrollment.trainingName || 'Training Name Not Available'}</h3>
                                                                        <p className="text-xs text-muted-foreground">{enrollment.training?.trainer || 'TBA'}</p>
                                                                    </div>
                                                                    <Badge variant="secondary" className="text-xs">{enrollment.status}</Badge>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        <span className="truncate">
                                                                            {enrollment.training?.start_date
                                                                                ? new Date(enrollment.training.start_date).toLocaleDateString()
                                                                                : enrollment.dateTime
                                                                                    ? new Date(enrollment.dateTime).toLocaleString()
                                                                                    : 'Date TBA'
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        <span className="truncate">{enrollment.training?.location || enrollment.location || 'Location TBA'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1 gap-1"
                                                                        onClick={() => handleSyncToCalendar(enrollment)}
                                                                    >
                                                                        <CalendarPlus className="w-3 h-3" />
                                                                        <span className="hidden sm:inline">Sync</span>
                                                                    </Button>
                                                                    {(enrollment.status && enrollment.status.toLowerCase() !== "cancelled" && enrollment.status.toLowerCase() !== "completed") && (
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            className="flex-1 gap-1"
                                                                            onClick={() => handleUnenrollTraining(enrollment)}
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                            <span className="hidden sm:inline">Unenroll</span>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>

                                                {/* Desktop Table View */}
                                                <div className="hidden md:block overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b">
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Training Name</th>
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date & Time</th>
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {myEnrollments.filter(enrollment =>
                                                                enrollment.status &&
                                                                enrollment.status.toLowerCase() !== 'cancelled'
                                                            ).map(enrollment => (
                                                                <tr key={enrollment.id} className="border-b hover:bg-muted/50">
                                                                    <td className="py-4 px-4">
                                                                        <div className="font-medium">
                                                                            {enrollment.training?.program_name || enrollment.training?.title || enrollment.trainingName || 'Training Name Not Available'}
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {enrollment.training?.trainer || 'TBA'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-4">
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                            <Calendar className="w-4 h-4" />
                                                                            {enrollment.training?.start_date
                                                                                ? new Date(enrollment.training.start_date).toLocaleDateString() + ' ' +
                                                                                new Date(enrollment.training.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                                : enrollment.dateTime
                                                                                    ? new Date(enrollment.dateTime).toLocaleString()
                                                                                    : 'Date TBA'
                                                                            }
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-4">
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {enrollment.training?.location || enrollment.location || 'Location TBA'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-4"> <Badge>{enrollment.status}</Badge> </td>
                                                                    <td className="py-4 px-4">
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleSyncToCalendar(enrollment)}
                                                                            >
                                                                                <CalendarPlus className="w-4 h-4 mr-1" />
                                                                                Sync to Calendar
                                                                            </Button>
                                                                            {(enrollment.status && enrollment.status.toLowerCase() !== "cancelled" && enrollment.status.toLowerCase() !== "completed") && (
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    size="sm"
                                                                                    onClick={() => handleUnenrollTraining(enrollment)}
                                                                                >
                                                                                    <X className="w-4 h-4 mr-1" />
                                                                                    Unenroll
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <ClockArrowUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-lg font-medium">No Training Enrollments</p>
                                                <p className="text-sm">You haven't enrolled in any training sessions yet.</p>
                                            </div>
                                        )
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Enhanced Completed Trainings Table */}
                        {dashboardView === 'completed' && (
                            <div className="space-y-6">
                                {/* Training Summary Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total Completed</p>
                                                <p className="text-2xl font-bold">{completedTrainings.length}</p>
                                            </div>
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Certificates Earned</p>
                                                <p className="text-2xl font-bold">{completedTrainings.filter(t => t.certificateId).length}</p>
                                            </div>
                                            <Award className="h-5 w-5 text-amber-600" />
                                        </div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Skills Updated</p>
                                                <p className="text-2xl font-bold">{[...new Set(completedTrainings.flatMap(t => t.competencies))].length}</p>
                                            </div>
                                            <TrendingUp className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </Card>
                                </div>

                                {/* Training History Table */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <History className="w-5 h-5 text-slate-600" />
                                            Training History & Certificates
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Training Name</th>
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Completion Date</th>
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Performance</th>
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Skills Acquired</th>
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Certificate</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {completedTrainings.map(training => (
                                                        <tr key={training.id} className="border-b hover:bg-muted/50">
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                                    <div>
                                                                        <div className="font-medium">{training.trainingName}</div>
                                                                        <div className="text-xs text-muted-foreground">ID: {training.certificateId}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="text-sm text-muted-foreground">
                                                                    {new Date(training.completionDate).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="text-sm">
                                                                        {training.score}% - {training.grade}
                                                                    </Badge>
                                                                    {training.score >= 90 && (
                                                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4 hidden lg:table-cell">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {training.competencies.map((skill, index) => (
                                                                        <Badge key={index} variant="secondary" className="text-xs">
                                                                            {skill}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex flex-col sm:flex-row gap-2">
                                                                    {training.certificateId && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="gap-1 w-full sm:w-auto"
                                                                            onClick={() => handleDownloadCertificate(training)}
                                                                        >
                                                                            <Download className="w-4 h-4" />
                                                                            <span className="hidden sm:inline">Certificate</span>
                                                                        </Button>
                                                                    )}
                                                                    <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
                                                                        <Award className="w-4 h-4" />
                                                                        <span className="hidden sm:inline">Badge</span>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Skills Development Summary */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                            Skills Development Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <p className="text-sm text-muted-foreground">
                                                Your training history has enhanced the following competencies:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {[...new Set(completedTrainings.flatMap(t => t.competencies))].map((skill, index) => (
                                                    <Badge key={index} variant="default" className="text-sm">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t">
                                                <p className="text-sm text-muted-foreground">
                                                    Total unique skills developed: {[...new Set(completedTrainings.flatMap(t => t.competencies))].length}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Feedback & Evaluation */}
                <Card>
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-orange-600" />
                                Feedback & Evaluation
                            </h2>
                            <Dialog open={showAddFeedback} onOpenChange={setShowAddFeedback}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="w-4 h-4" />
                                        Feedback
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Training Feedback</DialogTitle>
                                        <DialogDescription>
                                            Share your feedback about a completed training session.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <label htmlFor="training-select" className="text-sm font-medium">Training</label>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a training" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {completedTrainings.map(training => (
                                                        <SelectItem key={training.id} value={training.id.toString()}>
                                                            {training.trainingName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Rating</label>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Button
                                                        key={star}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-1 h-8 w-8"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label htmlFor="feedback-text" className="text-sm font-medium">Feedback</label>
                                            <textarea
                                                id="feedback-text"
                                                placeholder="Share your thoughts about the training..."
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setShowAddFeedback(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={() => setShowAddFeedback(false)}>
                                            Submit Feedback
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            {feedbackData.map((feedback) => (
                                <div key={feedback.id} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium text-sm flex items-center gap-2">
                                            <MessageSquareDashed className="w-4 h-4 text-orange-500" />
                                            {feedback.courseTitle}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${i < feedback.rating
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                            <span className="text-xs ml-1">{feedback.rating}/5</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2 italic line-clamp-2">
                                        "{feedback.feedback}"
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{feedback.trainer} • {new Date(feedback.date).toLocaleDateString()}</span>
                                        <Button size="sm" variant="outline" className="h-6 px-2">Edit</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Enhanced Add Training Modal */}
                <Dialog open={showAddTrainingModal} onOpenChange={setShowAddTrainingModal}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Training</DialogTitle>
                            <DialogDescription>
                                Create a new training program for employees to enroll in.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Training Title *</Label>
                                    <Input
                                        id="title"
                                        value={newTraining.title}
                                        onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                                        placeholder="Enter training title"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="trainer">Trainer</Label>
                                    <Input
                                        id="trainer"
                                        value={newTraining.trainer}
                                        onChange={(e) => setNewTraining({ ...newTraining, trainer: e.target.value })}
                                        placeholder="Trainer name"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={newTraining.description}
                                    onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
                                    placeholder="Enter training description"
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="objectives">Learning Objectives</Label>
                                <Textarea
                                    id="objectives"
                                    value={newTraining.objectives}
                                    onChange={(e) => setNewTraining({ ...newTraining, objectives: e.target.value })}
                                    placeholder="What will participants learn?"
                                    className="min-h-[60px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duration *</Label>
                                    <Input
                                        id="duration"
                                        value={newTraining.duration}
                                        onChange={(e) => setNewTraining({ ...newTraining, duration: e.target.value })}
                                        placeholder="e.g. 3 Days, 2 Weeks"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="topic">Topic *</Label>
                                    <Select
                                        value={newTraining.topic}
                                        onValueChange={(value) => setNewTraining({ ...newTraining, topic: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select topic" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Leadership">Leadership</SelectItem>
                                            <SelectItem value="Technical">Technical</SelectItem>
                                            <SelectItem value="Compliance">Compliance</SelectItem>
                                            <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                                            <SelectItem value="Safety">Safety</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="format">Format</Label>
                                    <Select
                                        value={newTraining.format}
                                        onValueChange={(value) => setNewTraining({ ...newTraining, format: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="In-Person">In-Person</SelectItem>
                                            <SelectItem value="Online">Online</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="difficulty">Difficulty</Label>
                                    <Select
                                        value={newTraining.difficulty}
                                        onValueChange={(value) => setNewTraining({ ...newTraining, difficulty: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="maxParticipants">Max Participants</Label>
                                    <Input
                                        id="maxParticipants"
                                        type="number"
                                        value={newTraining.maxParticipants}
                                        onChange={(e) => setNewTraining({ ...newTraining, maxParticipants: e.target.value })}
                                        placeholder="30"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="targetRole">Target Role</Label>
                                    <Input
                                        id="targetRole"
                                        value={newTraining.targetRole}
                                        onChange={(e) => setNewTraining({ ...newTraining, targetRole: e.target.value })}
                                        placeholder="Manager, Developer, All"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={newTraining.startDate}
                                        onChange={(e) => setNewTraining({ ...newTraining, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={newTraining.endDate}
                                        onChange={(e) => setNewTraining({ ...newTraining, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={newTraining.location}
                                    onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })}
                                    placeholder="Conference Room A, Online Platform"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="prerequisites">Prerequisites</Label>
                                <Textarea
                                    id="prerequisites"
                                    value={newTraining.prerequisites}
                                    onChange={(e) => setNewTraining({ ...newTraining, prerequisites: e.target.value })}
                                    placeholder="Required skills or experience"
                                    className="min-h-[60px]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowAddTrainingModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTraining}>
                                Create Training
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Training Modal */}
                <Dialog open={showEditTrainingModal} onOpenChange={setShowEditTrainingModal}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Training</DialogTitle>
                            <DialogDescription>
                                Update training information.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-title">Training Title *</Label>
                                    <Input
                                        id="edit-title"
                                        value={newTraining.title}
                                        onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                                        placeholder="Enter training title"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-trainer">Trainer</Label>
                                    <Input
                                        id="edit-trainer"
                                        value={newTraining.trainer}
                                        onChange={(e) => setNewTraining({ ...newTraining, trainer: e.target.value })}
                                        placeholder="Trainer name"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={newTraining.description}
                                    onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
                                    placeholder="Enter training description"
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-objectives">Learning Objectives</Label>
                                <Textarea
                                    id="edit-objectives"
                                    value={newTraining.objectives}
                                    onChange={(e) => setNewTraining({ ...newTraining, objectives: e.target.value })}
                                    placeholder="What will participants learn?"
                                    className="min-h-[60px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-duration">Duration *</Label>
                                    <Input
                                        id="edit-duration"
                                        value={newTraining.duration}
                                        onChange={(e) => setNewTraining({ ...newTraining, duration: e.target.value })}
                                        placeholder="e.g. 3 Days, 2 Weeks"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-topic">Topic *</Label>
                                    <Select
                                        value={newTraining.topic}
                                        onValueChange={(value) => setNewTraining({ ...newTraining, topic: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select topic" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Leadership">Leadership</SelectItem>
                                            <SelectItem value="Technical">Technical</SelectItem>
                                            <SelectItem value="Compliance">Compliance</SelectItem>
                                            <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                                            <SelectItem value="Safety">Safety</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-format">Format</Label>
                                    <Select
                                        value={newTraining.format}
                                        onValueChange={(value) => setNewTraining({ ...newTraining, format: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="In-Person">In-Person</SelectItem>
                                            <SelectItem value="Online">Online</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-difficulty">Difficulty</Label>
                                    <Select
                                        value={newTraining.difficulty}
                                        onValueChange={(value) => setNewTraining({ ...newTraining, difficulty: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-maxParticipants">Max Participants</Label>
                                    <Input
                                        id="edit-maxParticipants"
                                        type="number"
                                        value={newTraining.maxParticipants}
                                        onChange={(e) => setNewTraining({ ...newTraining, maxParticipants: e.target.value })}
                                        placeholder="30"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-targetRole">Target Role</Label>
                                    <Input
                                        id="edit-targetRole"
                                        value={newTraining.targetRole}
                                        onChange={(e) => setNewTraining({ ...newTraining, targetRole: e.target.value })}
                                        placeholder="Manager, Developer, All"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-startDate">Start Date</Label>
                                    <Input
                                        id="edit-startDate"
                                        type="date"
                                        value={newTraining.startDate}
                                        onChange={(e) => setNewTraining({ ...newTraining, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-endDate">End Date</Label>
                                    <Input
                                        id="edit-endDate"
                                        type="date"
                                        value={newTraining.endDate}
                                        onChange={(e) => setNewTraining({ ...newTraining, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-location">Location</Label>
                                <Input
                                    id="edit-location"
                                    value={newTraining.location}
                                    onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })}
                                    placeholder="Conference Room A, Online Platform"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-prerequisites">Prerequisites</Label>
                                <Textarea
                                    id="edit-prerequisites"
                                    value={newTraining.prerequisites}
                                    onChange={(e) => setNewTraining({ ...newTraining, prerequisites: e.target.value })}
                                    placeholder="Required skills or experience"
                                    className="min-h-[60px]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowEditTrainingModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateTraining}>
                                Update Training
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Training Details Modal */}
                <Dialog open={showTrainingDetailsModal} onOpenChange={setShowTrainingDetailsModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                {selectedTraining?.title}
                            </DialogTitle>
                            <DialogDescription>
                                View detailed information about this training program.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedTraining && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-sm text-muted-foreground">{selectedTraining.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-1">Trainer</h4>
                                        <p className="text-sm text-muted-foreground">{selectedTraining.trainer}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Duration</h4>
                                        <p className="text-sm text-muted-foreground">{selectedTraining.duration}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-1">Format</h4>
                                        <Badge variant="secondary">{selectedTraining.format}</Badge>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Difficulty</h4>
                                        <Badge variant="outline">{selectedTraining.difficulty}</Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-1">Enrollment</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedTraining.enrolled}/{selectedTraining.maxParticipants} participants
                                        </p>
                                    </div>
                                </div>

                                {selectedTraining.startDate && (
                                    <div>
                                        <h4 className="font-medium mb-1">Start Date</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(selectedTraining.startDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {selectedTraining.location && (
                                    <div>
                                        <h4 className="font-medium mb-1">Location</h4>
                                        <p className="text-sm text-muted-foreground">{selectedTraining.location}</p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowTrainingDetailsModal(false)}
                                    >
                                        Close
                                    </Button>
                                    {isEmployee() && (
                                        <Button
                                            onClick={() => {
                                                if (!getEnrollmentStatus(selectedTraining.id)) {
                                                    setShowTrainingDetailsModal(false);
                                                    handleEnrollTraining(selectedTraining);
                                                }
                                            }}
                                            disabled={!!getEnrollmentStatus(selectedTraining.id)}
                                        >
                                            <BookOpen className="w-4 h-4 mr-1" />
                                            {getEnrollmentStatus(selectedTraining.id) ? 'Already Enrolled' : 'Enroll Now'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Enroll Training Modal */}
                <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enroll in Training</DialogTitle>
                            <DialogDescription>
                                Submit your enrollment request for "{selectedTraining?.title}".
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="enrollment-notes">Notes (Optional)</Label>
                                <Textarea
                                    id="enrollment-notes"
                                    value={enrollmentData.notes}
                                    onChange={(e) => setEnrollmentData({ ...enrollmentData, notes: e.target.value })}
                                    placeholder="Any additional information or reasons for enrollment..."
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowEnrollModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSubmitEnrollment}>
                                Submit Enrollment
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Enhanced Add Feedback Modal */}
                <Dialog open={showAddFeedback} onOpenChange={setShowAddFeedback}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Training Feedback</DialogTitle>
                            <DialogDescription>
                                Share your feedback about a completed training session.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="training-select">Training</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a training" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {completedTrainings.map(training => (
                                            <SelectItem key={training.id} value={training.id.toString()}>
                                                {training.trainingName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Rating</Label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Button
                                            key={star}
                                            variant="ghost"
                                            size="sm"
                                            className="p-1 h-8 w-8"
                                        >
                                            <Star className="w-4 h-4" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="feedback-text">Feedback</Label>
                                <Textarea
                                    id="feedback-text"
                                    placeholder="Share your thoughts about the training..."
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAddFeedback(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setShowAddFeedback(false)}>
                                Submit Feedback
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Manage Training Sessions Modal */}
                <Dialog open={showManageSessionsModal} onOpenChange={setShowManageSessionsModal}>
                    <DialogContent 
                        className="w-[95vw] max-w-none max-h-[95vh] overflow-y-auto"
                        style={{ width: '95vw', maxWidth: 'none' }}
                    >
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Manage Training Session: {selectedTrainingSession?.program_name || selectedTrainingSession?.title}
                            </DialogTitle>
                            <DialogDescription>
                                View all applicants and manage their training status.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Training Details */}
                            {selectedTrainingSession && (
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-muted-foreground">Trainer:</span>
                                                <p>{selectedTrainingSession.trainer || 'TBA'}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Date:</span>
                                                <p>{selectedTrainingSession.start_date ? new Date(selectedTrainingSession.start_date).toLocaleDateString() : 'TBA'}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Location:</span>
                                                <p>{selectedTrainingSession.location || 'TBA'}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Enrolled:</span>
                                                <p>{enrolledParticipants.length} / {selectedTrainingSession.max_participants || 'Unlimited'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Training Applicants Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Training Applicants</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {enrolledParticipants.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Applied Date</th>
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {enrolledParticipants.map((participant) => (
                                                        <tr key={participant.id} className="border-b hover:bg-muted/50">
                                                            <td className="py-4 px-4">
                                                                <div className="font-medium">
                                                                    {participant.employee_name ||
                                                                        participant.employee?.user?.name ||
                                                                        participant.employee?.name ||
                                                                        (participant.employee?.first_name && participant.employee?.last_name
                                                                            ? `${participant.employee.first_name} ${participant.employee.last_name}`.trim()
                                                                            : `Employee ${participant.employee_id}`)}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="text-sm text-muted-foreground">
                                                                    {participant.employee_department || participant.employee?.department || 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="text-sm text-muted-foreground">
                                                                    {participant.submitted_at ? new Date(participant.submitted_at).toLocaleDateString() : 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <Badge variant="secondary">
                                                                    {participant.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex gap-2">
                                                                    {participant.status === 'approved' ? (
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleMarkParticipantCompleted(participant.id, participant.employee_id, participant)}
                                                                            className="gap-1"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            Mark Done
                                                                        </Button>
                                                                    ) : participant.status === 'applied' ? (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleApproveApplication(participant.id)}
                                                                                className="gap-1"
                                                                            >
                                                                                <CheckCircle className="w-4 h-4" />
                                                                                Approve
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                onClick={() => handleRejectApplication(participant.id)}
                                                                                className="gap-1"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                                Reject
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <Badge variant="secondary">
                                                                            {participant.status}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium">No Training Applicants</p>
                                            <p className="text-sm">No one has applied for this training session yet.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowManageSessionsModal(false)}>
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Toaster position="bottom-right" />
            </div>
        </div>
    );
};

export default TrainingManagementSystem;