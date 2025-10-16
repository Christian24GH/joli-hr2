import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AuthContext from '../context/AuthProvider.jsx';
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
    WrenchIcon, MapPin
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
            try {
                setLoading(true);
                await loadTrainingData();
                await loadMyEnrollments();
                await loadCompletedTrainings();
                await loadFeedbackData();
                setLoading(false);
            } catch (err) {
                console.error('Error loading initial data:', err);
                setError('Failed to load training data. Please refresh the page.');
                setLoading(false);
            }
        };

        if (auth) {
            loadInitialData();
        }
    }, [auth]);

    // Reload enrolled participants when training session changes
    useEffect(() => {
        if (selectedTrainingSession && showManageSessionsModal) {
            loadEnrolledParticipants(selectedTrainingSession.id);
        }
    }, [selectedTrainingSession, showManageSessionsModal]);

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefreshEnabled) return;

        const intervals = [
            // Refresh trainings
            setInterval(() => loadTrainingData(true), REFRESH_INTERVALS.trainings),
            // Refresh enrollments
            setInterval(() => loadMyEnrollments(true), REFRESH_INTERVALS.enrollments),
            // Refresh completions
            setInterval(() => loadCompletedTrainings(true), REFRESH_INTERVALS.completions),
            // Refresh feedback
            setInterval(() => loadFeedbackData(true), REFRESH_INTERVALS.feedback)
        ];

        return () => intervals.forEach(clearInterval);
    }, [auth, autoRefreshEnabled]);

    // Load training data from backend
    const loadTrainingData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);

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
            setStats(prev => ({
                ...prev,
                totalTrainings: response && response.data ? response.data.length : 0
            }));

            if (!silent) setLoading(false);
        } catch (error) {
            console.error('Failed to load training data:', error);
            if (!silent) {
                setError('Failed to load training programs');
                setLoading(false);
            }
        }
    };

    // Load employee enrollments
    const loadMyEnrollments = async (silent = false) => {
        try {
            const employeeId = getEmployeeId();
            if (!employeeId) {
                console.warn('No employee ID available for loading enrollments');
                return;
            }

            const response = await hr2.trainingApplications.getByEmployee(employeeId);
            const enrollments = response.data || [];

            // Filter out completed applications - they should only appear in Training History
            const activeEnrollments = enrollments.filter(app => app.status !== 'completed');

            setMyEnrollments(activeEnrollments);
            setStats(prev => ({ ...prev, enrolledTrainings: activeEnrollments.length }));

        } catch (error) {
            console.error('Failed to load enrollments:', error);
            if (!silent) toast.error('Failed to load your training enrollments');
        }
    };

    // Load completed trainings
    const loadCompletedTrainings = async (silent = false) => {
        try {
            const employeeId = getEmployeeId();
            if (!employeeId) return;

            const response = await hr2.trainingApplications.getByEmployee(employeeId);
            const allEnrollments = response.data || [];

            // Filter for completed trainings only
            const completed = allEnrollments.filter(app => app.status === 'completed');
            setCompletedTrainings(completed);
            setStats(prev => ({ ...prev, completedTrainings: completed.length }));

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
                    objectives: '',
                    trainer: '',
                    duration: '',
                    topic: '',
                    targetRole: '',
                    prerequisites: '',
                    startDate: '',
                    endDate: '',
                    maxParticipants: '',
                    location: '',
                    difficulty: 'Beginner',
                    format: 'In-Person'
                });
                loadTrainingData();
            } else {
                toast.error(response.data?.error || 'Failed to create training');
            }
        } catch (error) {
            console.error('Failed to create training:', error);
            toast.error('Failed to create training');
        }
    };

    const handleEditTraining = (training) => {
        setEditingTraining(training);
        setNewTraining({
            title: training.title || '',
            description: training.description || '',
            trainer: training.trainer || '',
            duration: training.duration || '',
            topic: training.topic || '',
            targetRole: training.targetRole || '',
            startDate: training.startDate || '',
            endDate: training.endDate || '',
            maxParticipants: training.maxParticipants || '',
            location: training.location || '',
            difficulty: training.difficulty || 'Beginner',
            format: training.format || 'In-Person',
            prerequisites: training.prerequisites || '',
            objectives: training.objectives || ''
        });
        setShowEditTrainingModal(true);
    };

    const handleUpdateTraining = async () => {
        if (!editingTraining || !newTraining.title.trim()) {
            toast.error('Training title is required');
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
                setNewTraining({
                    title: '',
                    description: '',
                    objectives: '',
                    trainer: '',
                    duration: '',
                    topic: '',
                    targetRole: '',
                    prerequisites: '',
                    startDate: '',
                    endDate: '',
                    maxParticipants: '',
                    location: '',
                    difficulty: 'Beginner',
                    format: 'In-Person'
                });
                loadTrainingData();
            } else {
                toast.error(response.data?.error || 'Failed to update training');
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
            sessionTitle: '',
            sessionDescription: '',
            startDateTime: '',
            endDateTime: '',
            location: '',
            maxAttendees: ''
        });
        setShowScheduleModal(true);
    };

    const handleSubmitSchedule = async () => {
        try {
            const sessionData = {
                training_id: selectedTraining.id,
                title: scheduleData.sessionTitle,
                description: scheduleData.sessionDescription,
                start_date: scheduleData.startDateTime,
                end_date: scheduleData.endDateTime,
                location: scheduleData.location,
                max_participants: scheduleData.maxAttendees,
                status: 'scheduled'
            };

            await hr2.trainingSessions.create(sessionData);
            toast.success('Training session scheduled successfully!');
            setShowScheduleModal(false);
            setSelectedTraining(null);
        } catch (error) {
            console.error('Failed to schedule training session:', error);
            toast.error('Failed to schedule training session');
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
        const enrollment = myEnrollments.find(e => String(e.training_id) === String(trainingId));
        return enrollment ? enrollment.status : null;
    };

    // Filter trainings based on search and filters
    const filteredTrainings = trainings.filter(training => {
        const matchesSearch = !searchTerm ||
            training.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            training.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            training.trainer?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTopic = !topicFilter || training.topic === topicFilter;
        const matchesRole = !roleFilter || training.targetRole === roleFilter;
        const matchesDate = !dateFilter || training.startDate === dateFilter;

        return matchesSearch && matchesTopic && matchesRole && matchesDate;
    });

    // Enhanced Status badge component (Shadcn-style)
    const StatusBadge = ({ status }) => {
        const statusConfig = {
            'pending': { variant: 'secondary', icon: Clock, text: 'Pending' },
            'approved': { variant: 'default', icon: CheckCircle, text: 'Approved' },
            'rejected': { variant: 'destructive', icon: XCircle, text: 'Rejected' },
            'completed': { variant: 'default', icon: Award, text: 'Completed' },
            'active': { variant: 'default', icon: CheckCircle, text: 'Active' },
            'scheduled': { variant: 'secondary', icon: Calendar, text: 'Scheduled' }
        };

        const config = statusConfig[status] || { variant: 'secondary', icon: AlertCircle, text: status };

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <config.icon className="w-3 h-3" />
                {config.text}
            </Badge>
        );
    };

    // Enhanced Training Card Component (Shadcn-style)
    const TrainingCard = ({ training }) => {
        const enrollmentStatus = getEnrollmentStatus(training.id);
        const isRecentlyEnrolled = recentlyEnrolled.has(training.id);

        return (
            <Card className={`transition-all duration-200 hover:shadow-lg ${isRecentlyEnrolled ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2">{training.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                                {training.description}
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                            <Badge variant="secondary" className="text-xs">{training.format}</Badge>
                            <Badge variant="outline" className="text-xs">{training.difficulty}</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{training.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{training.trainer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{training.topic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{training.enrolled}/{training.maxParticipants}</span>
                        </div>
                    </div>

                    {enrollmentStatus && (
                        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Status:</span>
                            <StatusBadge status={enrollmentStatus} />
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTrainingDetails(training)}
                            className="flex-1"
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                        </Button>
                        {isEmployee() && (
                            <Button
                                size="sm"
                                onClick={() => !enrollmentStatus ? handleEnrollTraining(training) : handleUnenrollTraining(myEnrollments.find(e => e.training_id === training.id))}
                                disabled={!enrollmentStatus && training.enrolled >= training.maxParticipants}
                                variant={enrollmentStatus ? "destructive" : "default"}
                                className="flex-1"
                            >
                                {enrollmentStatus ? (
                                    <>
                                        <X className="w-4 h-4 mr-1" />
                                        Unenroll
                                    </>
                                ) : (
                                    <>
                                        <BookOpen className="w-4 h-4 mr-1" />
                                        Enroll
                                    </>
                                )}
                            </Button>
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
              <p className="mt-4 text-muted-foreground">Loading Training Catalog...</p>
            </div>
          </div>
        );
      }
    
      if (error) {
        return (
          <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Training Catalog</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        );
      }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
                <div className="container flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Blocks className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold">Training Management</h1>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-h-120 overflow-y-auto">
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
                                            {(isHR2Admin() || isTrainer()) ? (
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

                {/* Upcoming Training Sessions */}
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
                    <CardContent className="max-h-94 overflow-y-auto">
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
                                                            <span className="truncate">{training.duration || 'TBA'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate">{training.location || 'TBA'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            <span className="truncate">{training.format || 'In-Person'}</span>
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
                                    <div className="hidden md:block">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Training Program</th>
                                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Trainer</th>
                                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Enrolled</th>
                                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Start Date</th>
                                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trainings.map(training => (
                                                    <tr key={training.id} className="border-b hover:bg-muted/50">
                                                        <td className="py-4 px-4">
                                                            <div>
                                                                <div className="font-medium">{training.program_name || training.title || 'Training Name Not Available'}</div>
                                                                <div className="text-sm text-muted-foreground">{training.description}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm">{training.trainer || 'TBA'}</td>
                                                        <td className="py-4 px-4 text-sm">
                                                            <Badge variant="secondary">
                                                                {training.enrolled_count || 0} / {training.max_participants || 'Unlimited'}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm">
                                                            {training.start_date
                                                                ? new Date(training.start_date).toLocaleDateString()
                                                                : 'Date TBA'
                                                            }
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
                                    <p className="text-lg font-medium">No Training Programs</p>
                                    <p className="text-sm">Create your first training program to get started.</p>
                                </div>
                            )
                        ) : (
                            // For regular employees: Show their enrollments
                            myEnrollments.filter(enrollment =>
                                enrollment.status &&
                                enrollment.status.toLowerCase() !== 'cancelled' &&
                                enrollment.status.toLowerCase() !== 'completed'
                            ).length > 0 ? (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="block md:hidden space-y-3">
                                        {myEnrollments.filter(enrollment =>
                                            enrollment.status &&
                                            enrollment.status.toLowerCase() !== 'cancelled' &&
                                            enrollment.status.toLowerCase() !== 'completed'
                                        ).map(enrollment => {
                                            const training = trainings.find(t => t.id === enrollment.training_id) || enrollment.training;
                                            return (
                                                <Card key={enrollment.id} className="p-4">
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-medium text-sm">
                                                                    {training?.program_name || training?.title || enrollment.trainingName || 'Training Name Not Available'}
                                                                </h3>
                                                                <p className="text-xs text-muted-foreground">{training?.trainer || 'TBA'}</p>
                                                            </div>
                                                            <StatusBadge status={enrollment.status} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                <span className="truncate">
                                                                    {training?.start_date
                                                                        ? new Date(training.start_date).toLocaleDateString()
                                                                        : enrollment.dateTime
                                                                            ? new Date(enrollment.dateTime).toLocaleString()
                                                                            : 'Date TBA'
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                <span className="truncate">{training?.location || enrollment.location || 'Location TBA'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
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
                                            );
                                        })}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden md:block">
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
                                                    enrollment.status.toLowerCase() !== 'cancelled' &&
                                                    enrollment.status.toLowerCase() !== 'completed'
                                                ).map(enrollment => {
                                                    const training = trainings.find(t => t.id === enrollment.training_id) || enrollment.training;
                                                    return (
                                                        <tr key={enrollment.id} className="border-b hover:bg-muted/50">
                                                            <td className="py-4 px-4">
                                                                <div className="font-medium">
                                                                    {training?.program_name || training?.title || enrollment.trainingName || 'Training Name Not Available'}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {training?.trainer || 'TBA'}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {training?.start_date
                                                                        ? new Date(training.start_date).toLocaleDateString() + ' ' +
                                                                        new Date(training.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                        : enrollment.dateTime
                                                                            ? new Date(enrollment.dateTime).toLocaleString()
                                                                            : 'Date TBA'
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="text-sm text-muted-foreground">
                                                                    {training?.location || enrollment.location || 'Location TBA'}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <StatusBadge status={enrollment.status} />
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="gap-1"
                                                                        onClick={() => handleSyncToCalendar(enrollment)}
                                                                    >
                                                                        <CalendarPlus className="w-4 h-4" />
                                                                        Sync
                                                                    </Button>
                                                                    {(enrollment.status && enrollment.status.toLowerCase() !== "cancelled" && enrollment.status.toLowerCase() !== "completed") && (
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            className="gap-1"
                                                                            onClick={() => handleUnenrollTraining(enrollment)}
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                            Unenroll
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <ClockArrowUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No Upcoming Sessions</p>
                                    <p className="text-sm">You don't have any upcoming training sessions scheduled.</p>
                                </div>
                            )
                        )}
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="topic">Topic</Label>
                                    <Select value={newTraining.topic} onValueChange={(value) => setNewTraining({ ...newTraining, topic: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select topic" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Technical">Technical</SelectItem>
                                            <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                                            <SelectItem value="Compliance">Compliance</SelectItem>
                                            <SelectItem value="Leadership">Leadership</SelectItem>
                                            <SelectItem value="Safety">Safety</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="difficulty">Difficulty</Label>
                                    <Select value={newTraining.difficulty} onValueChange={(value) => setNewTraining({ ...newTraining, difficulty: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select difficulty" />
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
                                    <Label htmlFor="format">Format</Label>
                                    <Select value={newTraining.format} onValueChange={(value) => setNewTraining({ ...newTraining, format: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="In-Person">In-Person</SelectItem>
                                            <SelectItem value="Virtual">Virtual</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            <SelectItem value="Self-Paced">Self-Paced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duration</Label>
                                    <Input
                                        id="duration"
                                        value={newTraining.duration}
                                        onChange={(e) => setNewTraining({ ...newTraining, duration: e.target.value })}
                                        placeholder="e.g., 2 hours, 1 day"
                                    />
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
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={newTraining.location}
                                        onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })}
                                        placeholder="Training location"
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
                                <Label htmlFor="objectives">Learning Objectives</Label>
                                <Textarea
                                    id="objectives"
                                    value={newTraining.objectives}
                                    onChange={(e) => setNewTraining({ ...newTraining, objectives: e.target.value })}
                                    placeholder="What will participants learn?"
                                    className="min-h-[60px]"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="prerequisites">Prerequisites</Label>
                                <Textarea
                                    id="prerequisites"
                                    value={newTraining.prerequisites}
                                    onChange={(e) => setNewTraining({ ...newTraining, prerequisites: e.target.value })}
                                    placeholder="Any requirements or prerequisites?"
                                    className="min-h-[60px]"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddTrainingModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTraining}>
                                Create Training
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Enhanced Edit Training Modal */}
                <Dialog open={showEditTrainingModal} onOpenChange={setShowEditTrainingModal}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Training</DialogTitle>
                            <DialogDescription>
                                Update training program details.
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-topic">Topic</Label>
                                    <Select value={newTraining.topic} onValueChange={(value) => setNewTraining({ ...newTraining, topic: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select topic" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Technical">Technical</SelectItem>
                                            <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                                            <SelectItem value="Compliance">Compliance</SelectItem>
                                            <SelectItem value="Leadership">Leadership</SelectItem>
                                            <SelectItem value="Safety">Safety</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-difficulty">Difficulty</Label>
                                    <Select value={newTraining.difficulty} onValueChange={(value) => setNewTraining({ ...newTraining, difficulty: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select difficulty" />
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
                                    <Label htmlFor="edit-format">Format</Label>
                                    <Select value={newTraining.format} onValueChange={(value) => setNewTraining({ ...newTraining, format: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="In-Person">In-Person</SelectItem>
                                            <SelectItem value="Virtual">Virtual</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            <SelectItem value="Self-Paced">Self-Paced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-duration">Duration</Label>
                                    <Input
                                        id="edit-duration"
                                        value={newTraining.duration}
                                        onChange={(e) => setNewTraining({ ...newTraining, duration: e.target.value })}
                                        placeholder="e.g., 2 hours, 1 day"
                                    />
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
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-location">Location</Label>
                                    <Input
                                        id="edit-location"
                                        value={newTraining.location}
                                        onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })}
                                        placeholder="Training location"
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
                                <Label htmlFor="edit-objectives">Learning Objectives</Label>
                                <Textarea
                                    id="edit-objectives"
                                    value={newTraining.objectives}
                                    onChange={(e) => setNewTraining({ ...newTraining, objectives: e.target.value })}
                                    placeholder="What will participants learn?"
                                    className="min-h-[60px]"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-prerequisites">Prerequisites</Label>
                                <Textarea
                                    id="edit-prerequisites"
                                    value={newTraining.prerequisites}
                                    onChange={(e) => setNewTraining({ ...newTraining, prerequisites: e.target.value })}
                                    placeholder="Any requirements or prerequisites?"
                                    className="min-h-[60px]"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEditTrainingModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateTraining}>
                                Update Training
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Training Details Modal */}
                <Dialog open={showTrainingDetailsModal} onOpenChange={setShowTrainingDetailsModal}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                {selectedTraining?.title}
                            </DialogTitle>
                            <DialogDescription>
                                Detailed information about this training program.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedTraining && (
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-muted-foreground">Basic Information</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Trainer:</span>
                                                <span>{selectedTraining.trainer || 'TBA'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Duration:</span>
                                                <span>{selectedTraining.duration || 'TBA'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Format:</span>
                                                <span>{selectedTraining.format || 'In-Person'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Difficulty:</span>
                                                <span>{selectedTraining.difficulty || 'Beginner'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-muted-foreground">Schedule & Capacity</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Start Date:</span>
                                                <span>{selectedTraining.startDate ? new Date(selectedTraining.startDate).toLocaleDateString() : 'TBA'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">End Date:</span>
                                                <span>{selectedTraining.endDate ? new Date(selectedTraining.endDate).toLocaleDateString() : 'TBA'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Location:</span>
                                                <span>{selectedTraining.location || 'TBA'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Enrolled:</span>
                                                <span>{selectedTraining.enrolled}/{selectedTraining.maxParticipants || 'Unlimited'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                                        <p className="text-sm">{selectedTraining.description || 'No description available.'}</p>
                                    </div>

                                    {selectedTraining.objectives && (
                                        <div>
                                            <h4 className="font-medium text-sm text-muted-foreground mb-2">Learning Objectives</h4>
                                            <p className="text-sm">{selectedTraining.objectives}</p>
                                        </div>
                                    )}

                                    {selectedTraining.prerequisites && (
                                        <div>
                                            <h4 className="font-medium text-sm text-muted-foreground mb-2">Prerequisites</h4>
                                            <p className="text-sm">{selectedTraining.prerequisites}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-4 border-t">
                                    {isEmployee() && !getEnrollmentStatus(selectedTraining.id) && (
                                        <Button
                                            onClick={() => {
                                                setShowTrainingDetailsModal(false);
                                                handleEnrollTraining(selectedTraining);
                                            }}
                                            className="flex-1"
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Enroll Now
                                        </Button>
                                    )}
                                    {isEmployee() && getEnrollmentStatus(selectedTraining.id) && (
                                        <Badge variant="secondary" className="flex-1 justify-center py-2">
                                            Already Enrolled
                                        </Badge>
                                    )}
                                    <Button variant="outline" onClick={() => setShowTrainingDetailsModal(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Enrollment Modal */}
                <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enroll in Training</DialogTitle>
                            <DialogDescription>
                                Submit your enrollment request for {selectedTraining?.title}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="enrollment-notes">Additional Notes (Optional)</Label>
                                <Textarea
                                    id="enrollment-notes"
                                    value={enrollmentData.notes}
                                    onChange={(e) => setEnrollmentData({ ...enrollmentData, notes: e.target.value })}
                                    placeholder="Any special requirements or notes for the trainer?"
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEnrollModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmitEnrollment}>
                                Submit Enrollment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Schedule Training Modal */}
                <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule Training Session</DialogTitle>
                            <DialogDescription>
                                Schedule a new session for {selectedTraining?.title}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="session-title">Session Title</Label>
                                <Input
                                    id="session-title"
                                    value={scheduleData.sessionTitle}
                                    onChange={(e) => setScheduleData({ ...scheduleData, sessionTitle: e.target.value })}
                                    placeholder="e.g., Morning Session, Advanced Module"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="session-description">Session Description</Label>
                                <Textarea
                                    id="session-description"
                                    value={scheduleData.sessionDescription}
                                    onChange={(e) => setScheduleData({ ...scheduleData, sessionDescription: e.target.value })}
                                    placeholder="Brief description of this session"
                                    className="min-h-[60px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start-date-time">Start Date & Time</Label>
                                    <Input
                                        id="start-date-time"
                                        type="datetime-local"
                                        value={scheduleData.startDateTime}
                                        onChange={(e) => setScheduleData({ ...scheduleData, startDateTime: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="end-date-time">End Date & Time</Label>
                                        <Input
                                            id="end-date-time"
                                            type="datetime-local"
                                            value={scheduleData.endDateTime}
                                            onChange={(e) => setScheduleData({ ...scheduleData, endDateTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="session-location">Location</Label>
                                    <Input
                                        id="session-location"
                                        value={scheduleData.location}
                                        onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                                        placeholder="Session location"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="max-attendees">Max Attendees</Label>
                                    <Input
                                        id="max-attendees"
                                        type="number"
                                        value={scheduleData.maxAttendees}
                                        onChange={(e) => setScheduleData({ ...scheduleData, maxAttendees: e.target.value })}
                                        placeholder="Maximum attendees"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmitSchedule}>
                                Schedule Session
                            </Button>
                        </DialogFooter>
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
        </div >
    );
};

export default TrainingManagementSystem;