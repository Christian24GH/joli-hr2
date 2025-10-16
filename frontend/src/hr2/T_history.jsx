import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AuthContext from '../context/AuthProvider.jsx';
import { hr2 } from '../api/hr2.js';
import { toast, Toaster } from 'sonner';
import {
    History, Award, Download,
    CheckCircle, TrendingUp
} from 'lucide-react';

const TrainingHistorySystem = () => {
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
    const [completedTrainings, setCompletedTrainings] = useState([]);
    const [stats, setStats] = useState({
        totalTrainings: 0,
        enrolledTrainings: 0,
        completedTrainings: 0,
        upcomingSessions: 0
    });

    // UI states
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Auto-refresh states
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

    // Auto-refresh intervals (in milliseconds) - less frequent for subtle updates
    const REFRESH_INTERVALS = {
        trainings: 60000,      // 1 minute - training catalog changes less frequently
        enrollments: 30000,    // 30 seconds - enrollments change more often
        completions: 45000,    // 45 seconds - completions are important to see quickly
        applications: 20000,   // 20 seconds - admin needs to see new applications quickly
        feedback: 120000       // 2 minutes - feedback changes least frequently
    };

    // Data loading - Replace with API calls
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                await loadCompletedTrainings();
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

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefreshEnabled) return;

        const intervals = [
            // Refresh completions
            setInterval(() => loadCompletedTrainings(true), REFRESH_INTERVALS.completions)
        ];

        return () => intervals.forEach(clearInterval);
    }, [auth, autoRefreshEnabled]);

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

    // Download Certificate
    const handleDownloadCertificate = async (completion) => {
        try {
            // Placeholder for certificate download
            toast.info('Certificate download feature coming soon!');
        } catch (error) {
            console.error('Failed to download certificate:', error);
            toast.error('Failed to download certificate');
        }
    };

    // Enhanced Status badge component (Shadcn-style)
    const StatusBadge = ({ status }) => {
        const statusConfig = {
            'pending': { variant: 'secondary', icon: CheckCircle, text: 'Pending' },
            'approved': { variant: 'default', icon: CheckCircle, text: 'Approved' },
            'rejected': { variant: 'destructive', icon: CheckCircle, text: 'Rejected' },
            'completed': { variant: 'default', icon: Award, text: 'Completed' },
            'active': { variant: 'default', icon: CheckCircle, text: 'Active' },
            'scheduled': { variant: 'secondary', icon: CheckCircle, text: 'Scheduled' }
        };

        const config = statusConfig[status] || { variant: 'secondary', icon: CheckCircle, text: status };

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <config.icon className="w-3 h-3" />
                {config.text}
            </Badge>
        );
    };

    // Loading state
    if (loading) {
        return (
          <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading Training History...</p>
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
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Training History</h2>
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
                        <History className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold">Training History</h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Training History Section */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-slate-600 flex-shrink-0" />
                                <CardTitle className="text-xl sm:text-2xl">Training History & Certificates</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            <CardContent className="max-h-96 overflow-y-auto">
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
                                                                <div className="font-medium">{training.training?.title || 'Training Title Not Available'}</div>
                                                                <div className="text-sm text-muted-foreground">{training.training?.trainer || 'TBA'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm">
                                                        {training.completed_at ? new Date(training.completed_at).toLocaleDateString() : 'Date Not Available'}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {training.performance || 'N/A'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm hidden lg:table-cell">
                                                        {training.competencies ? training.competencies.join(', ') : 'N/A'}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {training.certificateId ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleDownloadCertificate(training)}
                                                                className="gap-1"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                Download
                                                            </Button>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Not Available
                                                            </Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {completedTrainings.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No Training History</p>
                                        <p className="text-sm">You haven't completed any trainings yet. Start by enrolling in available courses.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </CardContent>
                </Card>

                <Toaster position="bottom-right" />
            </div>
        </div>
    );
};

export default TrainingHistorySystem;