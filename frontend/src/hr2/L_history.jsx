import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthProvider';
import { hr2 } from '../api/hr2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import {
  BookOpen,
  Users,
  Calendar,
  CheckCircle,
  Play,
  Download,
  TrendingUp,
  Award,
  Clock,
  Target,
  BarChart3,
  ClipboardList,
  X,
  History,
  ClipboardClock
} from 'lucide-react';

const LearningProgressAndHistory = () => {
  const { auth } = useContext(AuthContext);
  const isEmployee = auth?.role === 'Employee';
  const isHR2Admin = auth?.role === 'HR2 Admin';
  const isTrainer = auth?.role === 'Trainer';

  const getCurrentUserId = () => {
    return parseInt(auth?.employee_id || localStorage.getItem('employeeId') || auth?.id);
  };

  // State for Learning Progress section
  const [learningProgress, setLearningProgress] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [assignedLearningPlans, setAssignedLearningPlans] = useState([]);
  const [courseCatalog, setCourseCatalog] = useState([]);
  const [progressStats, setProgressStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    overallProgress: 0
  });
  const [selectedViewProgress, setSelectedViewProgress] = useState(null);
  const [showViewProgress, setShowViewProgress] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  // State for Course History section
  const [courseHistory, setCourseHistory] = useState([]);
  const [enrolledEmployees, setEnrolledEmployees] = useState([]);
  const [selectedCourseForEmployees, setSelectedCourseForEmployees] = useState(null);
  const [showEnrolledEmployees, setShowEnrolledEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load data on component mount
  useEffect(() => {
    if (auth) {
      loadData();
    }
  }, [auth]);

  // Listen for course catalog refresh events from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'hr2_course_catalog_refresh' && auth) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [auth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();

      // Load course catalog first
      const courseCatalogRes = await hr2.learning.courses.getAll();
      const courseCatalogData = courseCatalogRes.data?.data || [];
      setCourseCatalog(courseCatalogData);

      // Load learning progress data for all authenticated users
      const [progressRes, enrolledCoursesRes] = await Promise.all([
        hr2.learning.dashboard.getLearningProgress(userId),
        hr2.learning.progress.getByUser(userId)
      ]);

      // Set progress stats from dashboard API
      setProgressStats({
        totalCourses: progressRes.data?.data?.totalCourses || 0,
        completedCourses: progressRes.data?.data?.completedCourses || 0,
        inProgressCourses: progressRes.data?.data?.inProgressCourses || 0,
        overallProgress: progressRes.data?.data?.overallProgress || 0
      });

      // Set learning progress from dashboard recent activity
      setLearningProgress(progressRes.data?.data?.recentActivity || []);

      // Set enrolled courses from progress API
      const rawEnrolledCourses = enrolledCoursesRes.data?.data || [];
      const processedEnrolledCourses = rawEnrolledCourses.map(course => {
        // If course_title is missing but course_id exists, find it from course catalog
        if (!course.course_title && course.course_id) {
          const courseDetails = courseCatalogData.find(c => c.id === course.course_id);
          return {
            ...course,
            course_title: courseDetails?.title || `Course ${course.course_id}`
          };
        }
        return course;
      });
      setEnrolledCourses(processedEnrolledCourses);

      // Load assigned learning plans for authenticated users
      const assignedPlansRes = await hr2.learning.learningPlans.getByUser(userId);
      setAssignedLearningPlans(assignedPlansRes.data?.data || []);

      if (!isEmployee) {
        loadCourseHistory();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load learning progress data. Please try again.');
      toast.error('Failed to load learning progress data');
    } finally {
      setLoading(false);
    }
  };

  const loadLearningProgress = async () => {
    // This function is now handled by loadData
    await loadData();
  };

  const loadAssignedLearningPlans = async () => {
    // This function is now handled by loadData
    await loadData();
  };

  const loadCourseCatalog = async () => {
    try {
      const response = await hr2.learning.courses.getAll();
      setCourseCatalog(response.data?.data || []);
    } catch (error) {
      console.error('Error loading course catalog:', error);
      toast.error('Failed to load courses');
    }
  };

  const loadCourseHistory = async () => {
    try {
      // For now, use progress data to show course history
      // This should be replaced with proper course history API when available
      const response = await hr2.learning.progress.getAll();
      setCourseHistory(response.data?.data || []);
    } catch (error) {
      console.error('Error loading course history:', error);
      toast.error('Failed to load course history');
    }
  };

  const handleUnenrollFromCourse = async (courseId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const response = await hr2.learning.enrollment.unenroll({
        user_id: userId,
        course_id: courseId
      });

      if (response.data && response.data.success) {
        toast.success('Successfully unenrolled from course');
        // Trigger refresh in other components
        localStorage.setItem('hr2_course_catalog_refresh', Date.now().toString());
        await loadData();
      } else {
        toast.error(response.data?.message || 'Failed to unenroll from course');
      }
    } catch (error) {
      console.error('Failed to unenroll from course:', error);
      // Handle specific error cases
      if (error.response?.status === 422) {
        toast.error('Unable to unenroll: Invalid request data');
      } else {
        toast.error('Failed to unenroll from course');
      }
    }
  };

  const handleUnenrollFromLearningPlan = async (planId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const response = await hr2.learning.learningPlans.unenroll(planId, userId);

      if (response.data && response.data.success) {
        toast.success('Successfully unenrolled from learning plan');
        // Trigger refresh in other components
        localStorage.setItem('hr2_course_catalog_refresh', Date.now().toString());
        await loadData();
      } else {
        toast.error(response.data?.message || 'Failed to unenroll from learning plan');
      }
    } catch (error) {
      console.error('Failed to unenroll from learning plan:', error);
      toast.error('Failed to unenroll from learning plan');
    }
  };

  const handleViewProgress = (progressItem) => {
    const courseDetails = courseCatalog.find(course => course.title === progressItem.course_title || course.id === progressItem.course_id);
    const progressWithLinks = {
      ...progressItem,
      meeting_link: courseDetails?.meeting_link,
      assessment_link: courseDetails?.assessment_link
    };
    setSelectedViewProgress(progressWithLinks);
    setShowViewProgress(true);
  };

  const calculateLearningPlanProgress = (planId) => {
    const plan = assignedLearningPlans.find(p => p.id === planId);
    if (!plan) return { completed: 0, total: 0, percentage: 0 };

    return {
      completed: plan.completedCourses || 0,
      total: plan.totalCourses || 0,
      percentage: plan.progress || 0
    };
  };

  const handleViewEnrolledEmployees = async (course) => {
    try {
      setSelectedCourseForEmployees(course);

      const progressResponse = await hr2.learning.progress.getByCourse(course.id);
      const enrolledEmployees = progressResponse.data?.data || [];

      setEnrolledEmployees(enrolledEmployees);
      setShowEnrolledEmployees(true);
    } catch (error) {
      console.error('Failed to load enrolled employees:', error);
      setEnrolledEmployees([]);
      setShowEnrolledEmployees(true);
      toast.error('Unable to load enrolled employees at this time');
    }
  };

  const handleUpdateGrade = async (progressId, newGrade) => {
    try {
      const response = await hr2.learning.progress.update(progressId, { grade: newGrade });

      if (response.data) {
        setEnrolledEmployees(prev => prev.map(emp =>
          emp.id === progressId ? { ...emp, grade: newGrade } : emp
        ));
        toast.success('Grade has been updated successfully');
      }
    } catch (error) {
      console.error('Failed to update grade:', error);
      toast.error('Unable to update grade. Please try again');
    }
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'not_started': return 'outline';
      default: return 'outline';
    }
  };

  const filteredHistory = courseHistory.filter(history => {
    const matchesSearch = history.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      history.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || history.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Learning History...</p>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Learning History</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Learning Course History</h1>
          </div>
        </div>
      </header>

      {/* Learning Progress Section - Employee Only */}
      {isEmployee && (
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Learning Progress</h2>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-2xl font-bold">{progressStats.completedCourses}</span>
                </div>
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-2xl font-bold">{progressStats.inProgressCourses}</span>
                </div>
                <span className="text-sm text-muted-foreground">In Progress</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="text-2xl font-bold">{progressStats.overallProgress}%</span>
                </div>
                <span className="text-sm text-muted-foreground">Overall</span>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="courses">Enrolled Courses</TabsTrigger>
                <TabsTrigger value="plans">Assigned Learning Plans</TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="mt-4">
                <div className="space-y-2">
                  {enrolledCourses.length > 0 ? (
                    enrolledCourses.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-green-500' :
                            item.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-300'
                            }`} />
                          <div>
                            <p className="text-sm font-medium">{item.course_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {(() => {
                                const courseDetails = courseCatalog.find(c => c.title === item.course_title);
                                const scheduleDate = courseDetails?.schedule_date;
                                return scheduleDate ?
                                  `Schedule: ${new Date(scheduleDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })} - ${new Date(scheduleDate).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}` :
                                  `Enrolled: ${new Date(item.enrollment_date || item.last_accessed || new Date()).toLocaleDateString()}`;
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm font-medium">Grade: {item.grade || 'N/A'}%</span>
                          <div className="flex gap-1 ml-2">
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleViewProgress(item)}>
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleUnenrollFromCourse(item.course_id)}
                            >
                              Unenroll
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No enrolled courses yet</p>
                      <p className="text-xs">Enroll in courses from the catalog above</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="plans" className="mt-4">
                <div className="space-y-2">
                  {assignedLearningPlans.length > 0 ? (
                    assignedLearningPlans.map((plan) => {
                      const planProgress = calculateLearningPlanProgress(plan.id);
                      return (
                        <div key={plan.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-sm">{plan.title}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {planProgress.completed}/{planProgress.total}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                          {plan.estimated_hours && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                              <Clock className="h-3 w-3" />
                              <span>Estimated: {plan.estimated_hours} hours</span>
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>Progress</span>
                              <span>{planProgress.percentage}%</span>
                            </div>
                            <Progress value={planProgress.percentage} className="h-2" />
                          </div>
                          <div className="flex items-center justify-end mt-3 text-xs text-muted-foreground">
                            {planProgress.percentage === 100 ? (
                              <Badge variant="default" className="text-xs">Completed</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleUnenrollFromLearningPlan(plan.id)}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel Apply
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No assigned learning plans</p>
                      <p className="text-xs">Learning plans will appear here when assigned</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Course History Section - Admin/Trainer Only */}
      {(isHR2Admin || isTrainer) && (
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <ClipboardClock className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Course History</h2>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Course Title</TableHead>
                    <TableHead className="text-center">Category</TableHead>
                    <TableHead className="text-center">Date Created</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(courseCatalog || []).map((course) => {
                    const isCompleted = courseHistory.some(h => h.course_id === course.id && h.status === 'completed');
                    return (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium text-center">{course.title}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{course.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {course.created_at ?
                            new Date(course.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) :
                            'N/A'
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isCompleted ? "default" : "outline"}>
                            {isCompleted ? "Completed" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEnrolledEmployees(course)}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              View Students
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {(courseCatalog || []).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No courses created yet</p>
                  <p className="text-xs">Courses will appear here when created</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={showViewProgress} onOpenChange={setShowViewProgress}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedViewProgress?.course_title}</DialogTitle>
            <DialogDescription>
              Your learning progress and course resources
            </DialogDescription>
          </DialogHeader>
          {selectedViewProgress && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={getStatusBadgeVariant(selectedViewProgress.status)}>
                  {selectedViewProgress.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm font-medium">{selectedViewProgress.progress}% Complete</span>
              </div>

              <div>
                <Label className="text-sm font-medium">Progress</Label>
                <Progress value={selectedViewProgress.progress} className="mt-2" />
              </div>

              <div className="text-sm text-muted-foreground">
                {(() => {
                  const courseDetails = courseCatalog.find(c => c.title === selectedViewProgress.course_title);
                  const scheduleDate = courseDetails?.schedule_date;
                  return (
                    <p>
                      {scheduleDate ?
                        `Schedule: ${new Date(scheduleDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} - ${new Date(scheduleDate).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}` :
                        `Enrolled: ${new Date(selectedViewProgress.enrollment_date || selectedViewProgress.last_accessed || new Date()).toLocaleDateString()}`}
                    </p>
                  );
                })()}
                {selectedViewProgress.last_accessed && (
                  <p>Last accessed: {new Date(selectedViewProgress.last_accessed).toLocaleDateString()}</p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm font-medium">Course Resources</Label>

                {selectedViewProgress.meeting_link && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(selectedViewProgress.meeting_link, '_blank')}
                    >
                      <Play className="w-3 h-3 mr-2" />
                      Join Meeting
                    </Button>
                  </div>
                )}

                {selectedViewProgress.assessment_link && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(selectedViewProgress.assessment_link, '_blank')}
                    >
                      <CheckCircle className="w-3 h-3 mr-2" />
                      Take Assessment
                    </Button>
                  </div>
                )}

                {(!selectedViewProgress.meeting_link && !selectedViewProgress.assessment_link) && (
                  <p className="text-xs text-muted-foreground">No resources available yet</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewProgress(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEnrolledEmployees} onOpenChange={setShowEnrolledEmployees}>
        <DialogContent
          className="w-[95vw] max-w-none max-h-[95vh] overflow-y-auto"
          style={{ width: '95vw', maxWidth: 'none' }}
        >
          <DialogHeader>
            <DialogTitle>Enrolled Employees - {selectedCourseForEmployees?.title}</DialogTitle>
            <DialogDescription>
              Manage grades and certificates for enrolled employees
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Total enrolled: {enrolledEmployees.length}
            </div>
            <Button
              onClick={() => exportToCSV(enrolledEmployees, `enrolled-employees-${selectedCourseForEmployees?.title || 'course'}.csv`)}
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Name</TableHead>
                  <TableHead className="text-center">Department</TableHead>
                  <TableHead className="text-center">Course Title</TableHead>
                  <TableHead className="text-center">Grade%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium text-center">{employee.name}</TableCell>
                    <TableCell className="text-center">{employee.department || 'N/A'}</TableCell>
                    <TableCell className="text-center">{selectedCourseForEmployees?.title || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        value={employee.grade}
                        onChange={(e) => {
                          const newGrade = e.target.value;
                          setEnrolledEmployees(prev => prev.map(emp =>
                            emp.id === employee.id ? { ...emp, grade: newGrade } : emp
                          ));
                        }}
                        onBlur={(e) => handleUpdateGrade(employee.id, e.target.value)}
                        placeholder="Enter grade"
                        className="w-24 h-8 mx-auto"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {enrolledEmployees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No employees enrolled in this course</p>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowEnrolledEmployees(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default LearningProgressAndHistory;