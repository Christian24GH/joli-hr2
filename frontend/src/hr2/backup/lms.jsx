import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthContext from '../../context/AuthProvider';
import { hr2 } from '../../api/hr2';
import { toast, Toaster } from 'sonner';
import {
  BookOpen,
  TrendingUp,
  BarChart3,
  GraduationCap,
  Route,
  ClipboardList,
  Play,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  Award,
  Target,
  Search,
  Plus,
  LibraryBig,
  Edit,
  Trash2,
  X
} from 'lucide-react';

function LearningManagementSystem() {
  const { auth } = useContext(AuthContext);

  // Check user role
  const isHR2Admin = auth?.role === 'HR2 Admin';
  const isTrainer = auth?.role === 'Trainer';
  const isEmployee = auth?.role === 'Employee';

  // Get current user ID
  const getCurrentUserId = () => {
    return parseInt(auth?.employee_id || localStorage.getItem('employeeId') || auth?.id);
  };

  // State for API data
  const [courseCatalog, setCourseCatalog] = useState([]);
  const [availableLearningPlans, setAvailableLearningPlans] = useState([]);
  const [assignedLearningPlans, setAssignedLearningPlans] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [progressStats, setProgressStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI states
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showViewCourse, setShowViewCourse] = useState(false);
  const [showViewProgress, setShowViewProgress] = useState(false);
  const [selectedViewCourse, setSelectedViewCourse] = useState(null);
  const [selectedViewProgress, setSelectedViewProgress] = useState(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner',
    schedule_date: '',
    instructor: '',
    objectives: '',
    meeting_link: '',
    assessment_link: ''
  });

  const [planForm, setPlanForm] = useState({
    title: '',
    description: '',
    courses: [],
    estimated_hours: ''
  });

  // Selected items for editing
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      if (!auth) return;

      setLoading(true);
      try {
        // Load dashboard data
        const userId = getCurrentUserId();
        console.log('Loading LMS data for user:', userId, 'auth object:', auth);

        const [courseCatalogRes, availablePlansRes, learningPlansRes, progressRes, enrolledCoursesRes] = await Promise.all([
          hr2.learning.courses.getAll(), // Use direct courses endpoint instead of dashboard
          hr2.learning.learningPlans.getAvailable(userId),
          hr2.learning.learningPlans.getByUser(userId),
          hr2.learning.dashboard.getLearningProgress(userId),
          hr2.learning.progress.getByUser(userId)
        ]);

        // Process course catalog to add enrollment status
        const processedCourses = (courseCatalogRes.data?.data || []).map(course => ({
          ...course,
          isEnrolled: course.enrolled_users?.includes(userId) || false
        }));

        setCourseCatalog(processedCourses);
        setAvailableLearningPlans(availablePlansRes.data?.data || []);
        setAssignedLearningPlans(learningPlansRes.data?.data || []);
        setProgressStats({
          totalCourses: progressRes.data?.data?.totalCourses || 0,
          completedCourses: progressRes.data?.data?.completedCourses || 0,
          inProgressCourses: progressRes.data?.data?.inProgressCourses || 0,
          overallProgress: progressRes.data?.data?.overallProgress || 0
        });
        setLearningProgress(progressRes.data?.data?.recentActivity || []);
        setEnrolledCourses(enrolledCoursesRes.data?.data || []);

        setError(null);
      } catch (err) {
        console.error('Failed to load LMS data:', err);
        setError('Failed to load learning management data');

        // Fallback to mock data on error
        setCourseCatalog(mockData.courseCatalog);
        setAssignedLearningPlans(mockData.learningPlans);
        setAvailableLearningPlans(mockData.availableLearningPlans || []);
        setProgressStats(mockData.progressStats);
        setLearningProgress(mockData.recentActivity);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [auth]);

  // Calculate metrics from dashboard data
  const completedCourses = progressStats.completedCourses || 0;
  const totalCourses = progressStats.totalCourses || 0;
  const overallProgress = progressStats.overallProgress || 0;

  // Utility functions
  const getCourseById = (courseId) => {
    return (courseCatalog || []).find(course => course.id === courseId);
  };

  const calculateLearningPlanProgress = (planId) => {
    const plan = assignedLearningPlans.find(p => p.id === planId);
    if (!plan) return { completed: 0, total: 0, percentage: 0 };

    // Learning plans now come with progress data from dashboard API
    return {
      completed: plan.completedCourses || 0,
      total: plan.totalCourses || 0,
      percentage: plan.progress || 0
    };
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'not_started': return 'outline';
      default: return 'outline';
    }
  };

  // Handler functions
  const handleCreateCourse = async () => {
    if (!courseForm.title || !courseForm.description || !courseForm.category) {
      toast.error('Please fill in required fields (Title, Description, Category)');
      return;
    }

    try {
      const courseData = {
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.category,
        level: courseForm.level,
        schedule_date: courseForm.schedule_date,
        instructor: courseForm.instructor,
        objectives: courseForm.objectives
      };

      // Only add URL fields if they have values
      if (courseForm.meeting_link.trim()) {
        courseData.meeting_link = courseForm.meeting_link.trim();
      }
      if (courseForm.assessment_link.trim()) {
        courseData.assessment_link = courseForm.assessment_link.trim();
      }

      const response = await hr2.learning.courses.create(courseData);

      if (response.data) {
        toast.success('Course created successfully');
        setShowCreateCourse(false);
        setCourseForm({
          title: '',
          description: '',
          category: '',
          level: 'Beginner',
          schedule_date: '',
          instructor: '',
          objectives: '',
          meeting_link: '',
          assessment_link: ''
        });
        // Reload data using the courses endpoint instead of dashboard
        const coursesResponse = await hr2.learning.courses.getAll();
        setCourseCatalog(coursesResponse.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      toast.error('Failed to create course');
    }
  };

  const handleCreatePlan = async () => {
    if (!planForm.title || planForm.courses.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await hr2.learning.learningPlans.create({
        title: planForm.title,
        description: planForm.description,
        courses: planForm.courses,
        estimated_hours: planForm.estimated_hours
        // assigned_users is intentionally omitted - users must apply manually
      });

      if (response.data) {
        toast.success('Learning plan created successfully');
        setShowCreatePlan(false);
        setPlanForm({
          title: '',
          description: '',
          courses: [],
          estimated_hours: ''
        });
        // Reload data - new plan should appear in available plans
        const userId = getCurrentUserId();
        const [availablePlansRes, learningPlansRes] = await Promise.all([
          hr2.learning.learningPlans.getAvailable(userId),
          hr2.learning.learningPlans.getByUser(userId)
        ]);
        setAvailableLearningPlans(availablePlansRes.data?.data || []);
        setAssignedLearningPlans(learningPlansRes.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to create learning plan:', error);
      toast.error('Failed to create learning plan');
    }
  };

  const handleUpdateLearningPlan = async () => {
    if (!planForm.title || planForm.courses.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await hr2.learning.learningPlans.update(selectedPlan.id, {
        title: planForm.title,
        description: planForm.description,
        courses: planForm.courses,
        estimated_hours: planForm.estimated_hours
      });

      if (response.data) {
        toast.success('Learning plan updated successfully');
        setShowEditPlan(false);
        setSelectedPlan(null);
        setPlanForm({
          title: '',
          description: '',
          courses: [],
          estimated_hours: ''
        });
        // Reload data
        const userId = getCurrentUserId();
        const response2 = await hr2.learning.learningPlans.getByUser(userId);
        setAssignedLearningPlans(response2.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to update learning plan:', error);
      toast.error('Failed to update learning plan');
    }
  };

  const handleEditLearningPlan = (plan) => {
    setPlanForm({
      title: plan.title,
      description: plan.description,
      courses: plan.courses || [],
      estimated_hours: plan.estimated_hours || ''
    });
    setSelectedPlan(plan);
    setShowEditPlan(true);
  };

  const handleDeleteLearningPlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this learning plan?')) return;

    try {
      const response = await hr2.learning.learningPlans.delete(planId);
      if (response.data?.success) {
        toast.success('Learning plan deleted successfully');
        // Reload learning plans
        const userId = getCurrentUserId();
        const response2 = await hr2.learning.learningPlans.getByUser(userId);
        setAssignedLearningPlans(response2.data?.data || []);
      } else {
        toast.error('Failed to delete learning plan');
      }
    } catch (error) {
      console.error('Failed to delete learning plan:', error);
      toast.error('Failed to delete learning plan');
    }
  };

  const handleEnrollInCourse = async (courseId) => {
    try {
      const response = await hr2.learning.enrollment.enroll({
        course_id: courseId,
        user_id: getCurrentUserId(),
        source: 'direct'
      });

      if (response.data) {
        toast.success('Successfully enrolled in course');

        // Reload data
        const userId = getCurrentUserId();
        const [courseCatalogRes, progressRes, enrolledCoursesRes] = await Promise.all([
          hr2.learning.courses.getAll(), // Use direct courses endpoint
          hr2.learning.dashboard.getLearningProgress(userId),
          hr2.learning.progress.getByUser(userId)
        ]);

        // Process course catalog to add enrollment status
        const processedCourses = (courseCatalogRes.data?.data || []).map(course => ({
          ...course,
          isEnrolled: course.enrolled_users?.includes(userId) || false
        }));
        setCourseCatalog(processedCourses);
        setProgressStats({
          totalCourses: progressRes.data?.data?.totalCourses || 0,
          completedCourses: progressRes.data?.data?.completedCourses || 0,
          inProgressCourses: progressRes.data?.data?.inProgressCourses || 0,
          overallProgress: progressRes.data?.data?.overallProgress || 0
        });
        setLearningProgress(progressRes.data?.data?.recentActivity || []);
        setEnrolledCourses(enrolledCoursesRes.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to enroll in course:', error);
      toast.error('Failed to enroll in course');
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      schedule_date: course.schedule_date || '',
      instructor: course.instructor,
      objectives: course.objectives,
      meeting_link: course.meeting_link || '',
      assessment_link: course.assessment_link || ''
    });
    setShowEditCourse(true);
  };

  const handleViewCourse = (course) => {
    setSelectedViewCourse(course);
    setShowViewCourse(true);
  };

  const handleViewProgress = (progressItem) => {
    // Find the course details from the catalog
    const courseDetails = courseCatalog.find(course => course.id === progressItem.course_id);
    const progressWithLinks = {
      ...progressItem,
      meeting_link: courseDetails?.meeting_link,
      assessment_link: courseDetails?.assessment_link
    };
    setSelectedViewProgress(progressWithLinks);
    setShowViewProgress(true);
  };

  const handleUpdateCourse = async () => {
    if (!courseForm.title || !courseForm.description || !courseForm.category) {
      toast.error('Please fill in required fields (Title, Description, Category)');
      return;
    }

    try {
      const courseData = {
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.category,
        level: courseForm.level,
        schedule_date: courseForm.schedule_date,
        instructor: courseForm.instructor,
        objectives: courseForm.objectives
      };

      // Only add URL fields if they have values
      if (courseForm.meeting_link.trim()) {
        courseData.meeting_link = courseForm.meeting_link.trim();
      }
      if (courseForm.assessment_link.trim()) {
        courseData.assessment_link = courseForm.assessment_link.trim();
      }

      const response = await hr2.learning.courses.update(selectedCourse.id, courseData);

      if (response.data) {
        toast.success('Course updated successfully');
        setShowEditCourse(false);
        setSelectedCourse(null);
        setCourseForm({
          title: '',
          description: '',
          category: '',
          level: 'Beginner',
          schedule_date: '',
          instructor: '',
          objectives: '',
          meeting_link: '',
          assessment_link: ''
        });
        // Reload data using the courses endpoint instead of dashboard
        const coursesResponse = await hr2.learning.courses.getAll();
        setCourseCatalog(coursesResponse.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to update course:', error);
      toast.error('Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await hr2.learning.courses.delete(courseId);

      if (response.data) {
        toast.success('Course deleted successfully');
        // Reload data using the courses endpoint instead of dashboard
        const coursesResponse = await hr2.learning.courses.getAll();
        setCourseCatalog(coursesResponse.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    }
  };

  // Employee-specific functions
  const handleUpdateProgress = async (courseId, newProgress) => {
    try {
      // First, find the progress record for this course and user
      const userId = getCurrentUserId();
      const progressRes = await hr2.learning.progress.getByUser(userId);
      const progressRecord = progressRes.data?.data?.find(p => p.course_id === courseId);

      if (!progressRecord) {
        // Create new progress record if it doesn't exist
        const createResponse = await hr2.learning.progress.create({
          course_id: courseId,
          user_id: userId,
          progress: newProgress
        });

        if (createResponse.data) {
          toast.success('Progress started successfully');
        }
      } else {
        // Update existing progress record
        const response = await hr2.learning.progress.update(progressRecord.id, {
          progress: newProgress
        });

        if (response.data) {
          toast.success('Progress updated successfully');
        }
      }

      // Reload progress data
      const updatedProgressRes = await hr2.learning.dashboard.getLearningProgress(userId);
      const enrolledCoursesRes = await hr2.learning.progress.getByUser(userId);
      setProgressStats({
        totalCourses: updatedProgressRes.data?.data?.totalCourses || 0,
        completedCourses: updatedProgressRes.data?.data?.completedCourses || 0,
        inProgressCourses: updatedProgressRes.data?.data?.inProgressCourses || 0,
        overallProgress: updatedProgressRes.data?.data?.overallProgress || 0
      });
      setLearningProgress(updatedProgressRes.data?.data?.recentActivity || []);
      setEnrolledCourses(enrolledCoursesRes.data?.data || []);
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const handleMarkCourseCompleted = async (courseId) => {
    try {
      // First, find the progress record for this course and user
      const userId = getCurrentUserId();
      const progressRes = await hr2.learning.progress.getByUser(userId);
      const progressRecord = progressRes.data?.data?.find(p => p.course_id === courseId);

      if (!progressRecord) {
        toast.error('No progress record found for this course');
        return;
      }

      const response = await hr2.learning.progress.complete(progressRecord.id, {
        score: 85 // Default score, could be made configurable
      });

      if (response.data) {
        toast.success('Course marked as completed!');
        // Reload progress data
        const updatedProgressRes = await hr2.learning.dashboard.getLearningProgress(userId);
        const enrolledCoursesRes = await hr2.learning.progress.getByUser(userId);
        setProgressStats({
          totalCourses: updatedProgressRes.data?.data?.totalCourses || 0,
          completedCourses: updatedProgressRes.data?.data?.completedCourses || 0,
          inProgressCourses: updatedProgressRes.data?.data?.inProgressCourses || 0,
          overallProgress: updatedProgressRes.data?.data?.overallProgress || 0
        });
        setLearningProgress(updatedProgressRes.data?.data?.recentActivity || []);
        setEnrolledCourses(enrolledCoursesRes.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to mark course as completed:', error);
      toast.error('Failed to mark course as completed');
    }
  };

  const handleUnenrollFromCourse = async (courseId) => {
    if (!confirm('Are you sure you want to unenroll from this course? Your progress will be lost.')) return;

    try {
      const response = await hr2.learning.enrollment.unenroll({
        user_id: getCurrentUserId(),
        course_id: courseId
      });

      if (response.data) {
        toast.success('Successfully unenrolled from course');
        // Reload data
        const userId = getCurrentUserId();
        const [courseCatalogRes, progressRes, enrolledCoursesRes] = await Promise.all([
          hr2.learning.courses.getAll(),
          hr2.learning.dashboard.getLearningProgress(userId),
          hr2.learning.progress.getByUser(userId)
        ]);
        // Process course catalog to add enrollment status
        const processedCourses = (courseCatalogRes.data?.data || []).map(course => ({
          ...course,
          isEnrolled: course.enrolled_users?.includes(userId) || false
        }));
        setCourseCatalog(processedCourses);
        setProgressStats({
          totalCourses: progressRes.data?.data?.totalCourses || 0,
          completedCourses: progressRes.data?.data?.completedCourses || 0,
          inProgressCourses: progressRes.data?.data?.inProgressCourses || 0,
          overallProgress: progressRes.data?.data?.overallProgress || 0
        });
        setLearningProgress(progressRes.data?.data?.recentActivity || []);
        setEnrolledCourses(enrolledCoursesRes.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to unenroll from course:', error);
      toast.error('Failed to unenroll from course');
    }
  };

  const handleStartCourse = async (courseId) => {
    try {
      // First enroll if not already enrolled
      const enrollResponse = await hr2.learning.enrollment.enroll({
        course_id: courseId,
        user_id: getCurrentUserId()
      });

      if (enrollResponse.data) {
        // Then update progress to indicate started
        await handleUpdateProgress(courseId, 5); // Start with 5% progress
        toast.success('Course started! Happy learning!');
      }
    } catch (error) {
      console.error('Failed to start course:', error);
      toast.error('Failed to start course');
    }
  };

  const handleRequestPlanAssignment = async (planId) => {
    try {
      // For now, simulate the request since the backend endpoint doesn't exist yet
      // TODO: Implement actual API call when backend is ready
      console.log('Requesting assignment to plan:', planId);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Assignment request submitted! Your manager will review it.');
    } catch (error) {
      console.error('Failed to request plan assignment:', error);
      toast.error('Failed to request assignment');
    }
  };

  const handleContinueLearningPlan = async (planId) => {
    try {
      // Find the next course in the plan that needs to be worked on
      const plan = assignedLearningPlans.find(p => p.id === planId);
      if (!plan) return;

      // Get user's progress on courses in this plan
      const userId = getCurrentUserId();
      const progressRes = await hr2.learning.dashboard.getLearningProgress(userId);
      const userProgress = progressRes.data?.recentActivity || [];

      // Find the first course in the plan that is not completed
      for (const courseId of plan.courses) {
        const courseProgress = userProgress.find(p => p.course_id === courseId);
        if (!courseProgress || courseProgress.status !== 'completed') {
          // Start or continue this course
          if (!courseProgress) {
            await handleStartCourse(courseId);
          } else {
            toast.info(`Continue working on: ${courseProgress.courseTitle}`);
            // Could navigate to course content here
          }
          return;
        }
      }

      toast.success('All courses in this plan are completed!');
    } catch (error) {
      console.error('Failed to continue learning plan:', error);
      toast.error('Failed to continue learning plan');
    }
  };

  const handleEnrollInLearningPlan = async (planId) => {
    try {
      const userId = parseInt(getCurrentUserId());
      const response = await hr2.learning.learningPlans.enroll(planId, userId);

      if (response.data) {
        toast.success('Successfully enrolled in learning plan! All courses have been added to your learning progress.');

        // Reload data to reflect changes
        const [availablePlansRes, learningPlansRes, progressRes, enrolledCoursesRes, courseCatalogRes] = await Promise.all([
          hr2.learning.learningPlans.getAvailable(userId),
          hr2.learning.learningPlans.getByUser(userId),
          hr2.learning.dashboard.getLearningProgress(userId),
          hr2.learning.progress.getByUser(userId),
          hr2.learning.courses.getAll()
        ]);

        setAvailableLearningPlans(availablePlansRes.data?.data || []);
        setAssignedLearningPlans(learningPlansRes.data?.data || []);
        setProgressStats({
          totalCourses: progressRes.data?.data?.totalCourses || 0,
          completedCourses: progressRes.data?.data?.completedCourses || 0,
          inProgressCourses: progressRes.data?.data?.inProgressCourses || 0,
          overallProgress: progressRes.data?.data?.overallProgress || 0
        });
        setLearningProgress(progressRes.data?.data?.recentActivity || []);
        setEnrolledCourses(enrolledCoursesRes.data?.data || []);

        // Update course catalog with enrollment status
        const processedCourses = (courseCatalogRes.data?.data || []).map(course => ({
          ...course,
          isEnrolled: course.enrolled_users?.includes(userId) || false
        }));
        setCourseCatalog(processedCourses);
      }
    } catch (error) {
      console.log('Error in handleEnrollInLearningPlan:', error);
      console.log('Error response:', error.response);
      console.log('Error status:', error.response?.status);

      // Check for 409 conflict (already enrolled)
      if (error.response?.status === 409) {
        toast.info('You are already enrolled in this learning plan.');
      } else {
        console.error('Failed to enroll in learning plan:', error);
        toast.error('Failed to enroll in learning plan');
      }
    }
  };

  const handleUnenrollFromLearningPlan = async (planId) => {
    try {
      const userId = getCurrentUserId();
      const response = await hr2.learning.learningPlans.unenroll(planId, userId);

      if (response.data) {
        toast.success('Successfully unenrolled from learning plan.');

        // Reload data to reflect changes
        const [availablePlansRes, learningPlansRes, progressRes, enrolledCoursesRes, courseCatalogRes] = await Promise.all([
          hr2.learning.learningPlans.getAvailable(userId),
          hr2.learning.learningPlans.getByUser(userId),
          hr2.learning.dashboard.getLearningProgress(userId),
          hr2.learning.progress.getByUser(userId),
          hr2.learning.courses.getAll()
        ]);

        setAvailableLearningPlans(availablePlansRes.data?.data || []);
        setAssignedLearningPlans(learningPlansRes.data?.data || []);
        setProgressStats({
          totalCourses: progressRes.data?.data?.totalCourses || 0,
          completedCourses: progressRes.data?.data?.completedCourses || 0,
          inProgressCourses: progressRes.data?.data?.inProgressCourses || 0,
          overallProgress: progressRes.data?.data?.overallProgress || 0
        });
        setLearningProgress(progressRes.data?.data?.recentActivity || []);
        setEnrolledCourses(enrolledCoursesRes.data?.data || []);

        // Update course catalog with enrollment status
        const processedCourses = (courseCatalogRes.data?.data || []).map(course => ({
          ...course,
          isEnrolled: course.enrolled_users?.includes(userId) || false
        }));
        setCourseCatalog(processedCourses);
      }
    } catch (error) {
      console.error('Failed to unenroll from learning plan:', error);
      toast.error('Failed to unenroll from learning plan');
    }
  };

  const enrollInMissingCourses = async (plan, userId) => {
    try {
      console.log('Enrolling in missing courses for plan:', plan);
      console.log('Current learning progress:', learningProgress);

      const userProgress = learningProgress || [];
      const missingCourses = [];

      // Ensure plan.courses is an array
      const planCourses = Array.isArray(plan.courses) ? plan.courses : [];
      console.log('Plan courses as array:', planCourses);

      // Find courses in the plan that user is not enrolled in
      for (const courseId of planCourses) {
        const isEnrolled = userProgress.some(p => p.course_id === courseId);
        console.log(`Course ${courseId}: enrolled = ${isEnrolled}`);
        if (!isEnrolled) {
          missingCourses.push(courseId);
        }
      }

      console.log('Missing courses:', missingCourses);

      if (missingCourses.length === 0) {
        toast.info('You are already enrolled in all courses in this learning plan.');
        return;
      }

      // Enroll in missing courses
      for (const courseId of missingCourses) {
        await hr2.learning.enrollment.enroll({
          course_id: courseId,
          user_id: userId,
          source: 'learning_plan'
        });
      }

      toast.success(`Successfully enrolled in ${missingCourses.length} missing course(s) from the learning plan!`);

      // Reload data
      const [courseCatalogRes, progressRes, enrolledCoursesRes] = await Promise.all([
        hr2.learning.courses.getAll(),
        hr2.learning.dashboard.getLearningProgress(userId),
        hr2.learning.progress.getByUser(userId)
      ]);

      const processedCourses = (courseCatalogRes.data?.data || []).map(course => ({
        ...course,
        isEnrolled: course.enrolled_users?.includes(userId) || false
      }));

      setCourseCatalog(processedCourses);
      setProgressStats({
        totalCourses: progressRes.data?.data?.totalCourses || 0,
        completedCourses: progressRes.data?.data?.completedCourses || 0,
        inProgressCourses: progressRes.data?.data?.inProgressCourses || 0,
        overallProgress: progressRes.data?.data?.overallProgress || 0
      });
      setLearningProgress(progressRes.data?.data?.recentActivity || []);
      setEnrolledCourses(enrolledCoursesRes.data?.data || []);

    } catch (error) {
      console.error('Failed to enroll in missing courses:', error);
      toast.error('Failed to enroll in missing courses');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Learning Management...</p>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Learning Management</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Learning Management</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Course Catalog */}
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <LibraryBig className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold">Course Catalog</h2>
              <div className="flex items-center gap-2 justify-end ml-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 h-9"
                  />
                </div>
                {(isHR2Admin || isTrainer) && (
                  <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        New Course
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(courseCatalog || []).filter(course => {
                // Search filter
                const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  course.category.toLowerCase().includes(searchTerm.toLowerCase());

                // For employees, hide enrolled courses from catalog
                const isEnrolled = course.isEnrolled || learningProgress.some(p => p.course_id === course.id);
                const shouldShow = isHR2Admin || isTrainer || !isEnrolled;

                return matchesSearch && shouldShow;
              }).map((course) => {
                const isEnrolled = course.isEnrolled || false;
                const courseProgress = learningProgress.find(p => p.course_id === course.id);

                return (
                  <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm">{course.title}</h3>
                      <span className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                        <Badge variant="outline" className="text-xs">{course.level}</Badge>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.description}</p>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {course.schedule_date ?
                            new Date(course.schedule_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) + ' - ' + new Date(course.schedule_date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            }) :
                            'Schedule TBD'}
                        </span>
                      </div>

                      {courseProgress && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span>{courseProgress.progress}%</span>
                          </div>
                          <Progress value={courseProgress.progress} className="h-1" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      {isHR2Admin || isTrainer ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCourse(course)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleViewCourse(course)}>
                                View
                              </Button>
                              {isEmployee && !course.isEnrolled && (
                                <Button
                                  size="sm"
                                  onClick={() => handleEnrollInCourse(course.id)}
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Enroll
                                </Button>
                              )}
                            </div>
                            {isEmployee && courseProgress && courseProgress.status === 'completed' && (
                              <Button size="sm" variant="outline">
                                <Award className="w-3 h-3 mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {((courseCatalog || []).filter(course => {
              // Search filter
              const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.category.toLowerCase().includes(searchTerm.toLowerCase());

              // For employees, hide enrolled courses from catalog
              const isEnrolled = course.isEnrolled || learningProgress.some(p => p.course_id === course.id);
              const shouldShow = isHR2Admin || isTrainer || !isEnrolled;

              return matchesSearch && shouldShow;
            }).length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <LibraryBig className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No courses available</p>
                <p className="text-xs">Courses will appear here when created by administrators</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">

          {/* Learning Plans Card */}
          <Card>
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Learning Plans</h2>
                {(isHR2Admin || isTrainer) && (
                  <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="ml-auto">
                        <Plus className="w-4 h-4 mr-1" />
                        New Plan
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                {availableLearningPlans.map((plan) => {
                  const planProgress = calculateLearningPlanProgress(plan.id);
                  return (
                    <div key={plan.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm">{plan.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {plan.courses?.length || 0} courses
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                      <div className="flex items-center justify-between">
                        {plan.estimated_hours && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Estimated: {plan.estimated_hours} hours</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                          {!(isHR2Admin || isTrainer) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleEnrollInLearningPlan(plan.id)}
                            >
                              <BookOpen className="w-3 h-3 mr-1" />
                              Apply
                            </Button>
                          )}
                          {(isHR2Admin || isTrainer) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleEditLearningPlan(plan)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleDeleteLearningPlan(plan.id)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {availableLearningPlans.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No learning plans available</p>
                    <p className="text-xs">Learning plans will appear here when created by administrators</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Learning Progress */}
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Learning Progress</h2>
            </div>
          </div>
          <CardContent className="p-4">

            {/* Overall Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-2xl font-bold">{completedCourses}</span>
                </div>
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-2xl font-bold">{progressStats.inProgressCourses || 0}</span>
                </div>
                <span className="text-sm text-muted-foreground">In Progress</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="text-2xl font-bold">{overallProgress}%</span>
                </div>
                <span className="text-sm text-muted-foreground">Overall</span>
              </div>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="courses" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="courses">Enrolled Courses</TabsTrigger>
                <TabsTrigger value="plans">Assigned Learning Plans</TabsTrigger>
              </TabsList>

              {/* Enrolled Courses Tab */}
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
                          <span className="text-sm font-medium">{item.progress}%</span>
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

              {/* Learning Plans Tab */}
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

        {/* Create Course Dialog */}
        <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add a new course to the learning catalog
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Course Title *</Label>
                <Input
                  placeholder="Enter course title"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select
                  value={courseForm.category}
                  onValueChange={(value) => setCourseForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select
                  value={courseForm.level}
                  onValueChange={(value) => setCourseForm(prev => ({ ...prev, level: value }))}
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
              <div>
                <Label>Schedule Date</Label>
                <Input
                  type="datetime-local"
                  value={courseForm.schedule_date}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, schedule_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Instructor</Label>
                <Input
                  placeholder="Enter instructor name"
                  value={courseForm.instructor}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, instructor: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter course description"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Learning Objectives</Label>
                <Textarea
                  placeholder="Enter learning objectives"
                  value={courseForm.objectives}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, objectives: e.target.value }))}
                />
              </div>
              <div>
                <Label>Meeting Link (Zoom/Google Meet)</Label>
                <Input
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  value={courseForm.meeting_link}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, meeting_link: e.target.value }))}
                />
              </div>
              <div>
                <Label>Assessment Link (Google Forms)</Label>
                <Input
                  placeholder="https://forms.google.com/..."
                  value={courseForm.assessment_link}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, assessment_link: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreateCourse(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCourse}>
                Create Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Learning Plan Dialog */}
        <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Learning Plan</DialogTitle>
              <DialogDescription>
                Create a structured learning path with multiple courses
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plan Title *</Label>
                <Input
                  placeholder="Enter plan title"
                  value={planForm.title}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter plan description"
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  placeholder="e.g., 20"
                  value={planForm.estimated_hours}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                />
              </div>
              <div>
                <Label>Select Courses *</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {(courseCatalog || []).slice(0, 10).map((course) => (
                    <div key={course.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`course-${course.id}`}
                        checked={planForm.courses.includes(course.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPlanForm(prev => ({
                            ...prev,
                            courses: checked
                              ? [...prev.courses, course.id]
                              : prev.courses.filter(id => id !== course.id)
                          }));
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`course-${course.id}`} className="text-sm">
                        {course.title} ({course.category})
                      </label>
                    </div>
                  ))}
                </div>
                {planForm.courses.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one course</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreatePlan(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan}>
                Create Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Course Dialog */}
        <Dialog open={showViewCourse} onOpenChange={setShowViewCourse}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedViewCourse?.title}</DialogTitle>
              <DialogDescription>
                Course details and information
              </DialogDescription>
            </DialogHeader>
            {selectedViewCourse && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedViewCourse.category}</Badge>
                  <Badge variant="outline">{selectedViewCourse.level}</Badge>
                </div>

                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedViewCourse.description}</p>
                </div>

                {selectedViewCourse.objectives && (
                  <div>
                    <Label className="text-sm font-medium">Learning Objectives</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedViewCourse.objectives}</p>
                  </div>
                )}

                <div className="text-sm">
                  <Label className="text-sm font-medium">Schedule</Label>
                  <p className="text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {selectedViewCourse.schedule_date ?
                      new Date(selectedViewCourse.schedule_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) + ' - ' + new Date(selectedViewCourse.schedule_date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }) :
                      'TBD'}
                  </p>
                </div>

                <div className="text-sm">
                  <Label className="text-sm font-medium">Enrolled</Label>
                  <p className="text-muted-foreground mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {selectedViewCourse.enrolledCount} students
                  </p>
                </div>

                {selectedViewCourse.instructor && (
                  <div>
                    <Label className="text-sm font-medium">Instructor</Label>
                    <p className="text-muted-foreground mt-1">{selectedViewCourse.instructor}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Rating: {selectedViewCourse.rating}/5.0
                  </div>
                  {isEmployee && !selectedViewCourse.isEnrolled && (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleEnrollInCourse(selectedViewCourse.id);
                        setShowViewCourse(false);
                      }}
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Enroll in Course
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Progress Dialog */}
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

                {/* Meeting and Assessment Links */}
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

        {/* Edit Course Dialog */}
        <Dialog open={showEditCourse} onOpenChange={setShowEditCourse}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update course information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Course Title *</Label>
                <Input
                  placeholder="Enter course title"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select
                  value={courseForm.category}
                  onValueChange={(value) => setCourseForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select
                  value={courseForm.level}
                  onValueChange={(value) => setCourseForm(prev => ({ ...prev, level: value }))}
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
              <div>
                <Label>Schedule Date</Label>
                <Input
                  type="datetime-local"
                  value={courseForm.schedule_date}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, schedule_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Instructor</Label>
                <Input
                  placeholder="Enter instructor name"
                  value={courseForm.instructor}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, instructor: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter course description"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Learning Objectives</Label>
                <Textarea
                  placeholder="Enter learning objectives"
                  value={courseForm.objectives}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, objectives: e.target.value }))}
                />
              </div>
              <div>
                <Label>Meeting Link (Zoom/Google Meet)</Label>
                <Input
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  value={courseForm.meeting_link}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, meeting_link: e.target.value }))}
                />
              </div>
              <div>
                <Label>Assessment Link (Google Forms)</Label>
                <Input
                  placeholder="https://forms.google.com/..."
                  value={courseForm.assessment_link}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, assessment_link: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                setShowEditCourse(false);
                setSelectedCourse(null);
                setCourseForm({
                  title: '',
                  description: '',
                  category: '',
                  level: 'Beginner',
                  schedule_date: '',
                  instructor: '',
                  objectives: '',
                  meeting_link: '',
                  assessment_link: ''
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCourse}>
                Update Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Learning Plan Dialog */}
        <Dialog open={showEditPlan} onOpenChange={setShowEditPlan}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Learning Plan</DialogTitle>
              <DialogDescription>
                Update the learning plan details and course selection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plan Title *</Label>
                <Input
                  placeholder="Enter plan title"
                  value={planForm.title}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter plan description"
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  placeholder="e.g., 20"
                  value={planForm.estimated_hours}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                />
              </div>
              <div>
                <Label>Select Courses *</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {(courseCatalog || []).slice(0, 10).map((course) => (
                    <div key={course.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-course-${course.id}`}
                        checked={planForm.courses.includes(course.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPlanForm(prev => ({
                            ...prev,
                            courses: checked
                              ? [...prev.courses, course.id]
                              : prev.courses.filter(id => id !== course.id)
                          }));
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`edit-course-${course.id}`} className="text-sm">
                        {course.title} ({course.category})
                      </label>
                    </div>
                  ))}
                </div>
                {planForm.courses.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one course</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                setShowEditPlan(false);
                setSelectedPlan(null);
                setPlanForm({
                  title: '',
                  description: '',
                  courses: [],
                  estimated_hours: ''
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLearningPlan}>
                Update Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Toaster />

      </div>
    </div>
  );
}

export default LearningManagementSystem;