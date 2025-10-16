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
import AuthContext from '../context/AuthProvider';
import { hr2 } from '../api/hr2';
import { toast, Toaster } from 'sonner';
import {
  BookOpen, TrendingUp,
  BarChart3, GraduationCap, Route,
  ClipboardList, Play, CheckCircle,
  Clock, Users, Calendar,
  Award, Target, Search, Plus,
  LibraryBig, Edit, Trash2, X,
  History, RotateCcw, Download, Upload,
  LibraryIcon
} from 'lucide-react';

function CourseCatalogAndPlans() {
  const { auth } = useContext(AuthContext);

  const isHR2Admin = auth?.role === 'HR2 Admin';
  const isTrainer = auth?.role === 'Trainer';
  const isEmployee = auth?.role === 'Employee';

  const getCurrentUserId = () => {
    return parseInt(auth?.employee_id || localStorage.getItem('employeeId') || auth?.id);
  };

  const [courseCatalog, setCourseCatalog] = useState([]);
  const [availableLearningPlans, setAvailableLearningPlans] = useState([]);
  const [assignedLearningPlans, setAssignedLearningPlans] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [progressStats, setProgressStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showViewCourse, setShowViewCourse] = useState(false);
  const [showViewProgress, setShowViewProgress] = useState(false);
  const [showEnrolledEmployees, setShowEnrolledEmployees] = useState(false);
  const [selectedViewCourse, setSelectedViewCourse] = useState(null);
  const [selectedViewProgress, setSelectedViewProgress] = useState(null);
  const [selectedCourseForEmployees, setSelectedCourseForEmployees] = useState(null);
  const [enrolledEmployees, setEnrolledEmployees] = useState([]);
  const [employeeGrades, setEmployeeGrades] = useState({});
  const [completedCoursesList, setCompletedCoursesList] = useState([]);

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

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load course catalog
        const coursesResponse = await hr2.learning.courses.getAll();
        if (coursesResponse.data && coursesResponse.data.success) {
          const userId = getCurrentUserId();
          const processedCourses = (coursesResponse.data.data || []).map(course => ({
            ...course,
            isEnrolled: course.enrolled_users?.includes(userId) || false
          }));
          setCourseCatalog(processedCourses);
        }

        // Load learning plans for authenticated users
        const userId = getCurrentUserId();
        const plansResponse = await hr2.learning.learningPlans.getAvailable(userId);
        if (plansResponse.data && plansResponse.data.success) {
          setAvailableLearningPlans(plansResponse.data.data || []);
        }

        // Load assigned learning plans for authenticated users
        const assignedPlansResponse = await hr2.learning.learningPlans.getByUser(userId);
        if (assignedPlansResponse.data && assignedPlansResponse.data.success) {
          setAssignedLearningPlans(assignedPlansResponse.data.data || []);
        }

        // Load user-specific data if authenticated
        if (auth?.employee_id) {

          // Load learning progress
          const progressResponse = await hr2.learning.progress.getByUser(userId);
          if (progressResponse.data && progressResponse.data.success) {
            setLearningProgress(progressResponse.data.data || []);
          }

          // Load enrolled courses
          const enrolledResponse = await hr2.learning.progress.getByUser(userId);
          if (enrolledResponse.data && enrolledResponse.data.success) {
            setEnrolledCourses(enrolledResponse.data.data || []);
          }

          // Calculate progress stats
          const statsResponse = await hr2.learning.dashboard.getLearningProgress(userId);
          if (statsResponse.data && statsResponse.data.success) {
            setProgressStats(statsResponse.data.data || {});
          }
        }

      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load learning management data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [auth]);

  // Listen for course catalog refresh events from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'hr2_course_catalog_refresh') {
        // Reload course catalog and related data
        const reloadData = async () => {
          try {
            const userId = getCurrentUserId();

            // Reload course catalog
            const coursesResponse = await hr2.learning.courses.getAll();
            if (coursesResponse.data && coursesResponse.data.success) {
              const processedCourses = (coursesResponse.data.data || []).map(course => ({
                ...course,
                isEnrolled: course.enrolled_users?.includes(userId) || false
              }));
              setCourseCatalog(processedCourses);
            }

            // Reload learning progress and stats if user is authenticated
            if (auth?.employee_id) {
              const [progressRes, enrolledCoursesRes] = await Promise.all([
                hr2.learning.dashboard.getLearningProgress(userId),
                hr2.learning.progress.getByUser(userId)
              ]);

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
            console.error('Failed to reload course catalog:', error);
          }
        };

        reloadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [auth]);

  const completedCourses = progressStats.completedCourses || 0;
  const totalCourses = progressStats.totalCourses || 0;
  const overallProgress = progressStats.overallProgress || 0;

  const getCourseById = (courseId) => {
    return (courseCatalog || []).find(course => course.id === courseId);
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

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'not_started':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleCreateCourse = async () => {
    if (!courseForm.title || !courseForm.description || !courseForm.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await hr2.learning.courses.create({
        ...courseForm,
        created_by: getCurrentUserId()
      });

      if (response.data && response.data.success) {
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

        // Reload course catalog
        const coursesResponse = await hr2.learning.courses.getAll();
        if (coursesResponse.data && coursesResponse.data.success) {
          const userId = getCurrentUserId();
          const processedCourses = (coursesResponse.data.data || []).map(course => ({
            ...course,
            isEnrolled: course.enrolled_users?.includes(userId) || false
          }));
          setCourseCatalog(processedCourses);
        }
      } else {
        toast.error(response.data?.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      toast.error('Failed to create course');
    }
  };

  const handleCreatePlan = async () => {
    if (!planForm.title || planForm.courses.length === 0) {
      toast.error('Please fill in the plan title and select at least one course');
      return;
    }

    try {
      const response = await hr2.learning.learningPlans.create({
        ...planForm,
        created_by: getCurrentUserId()
      });

      if (response.data && response.data.success) {
        toast.success('Learning plan created successfully');
        setShowCreatePlan(false);
        setPlanForm({
          title: '',
          description: '',
          courses: [],
          estimated_hours: ''
        });

        // Reload learning plans
        const userId = getCurrentUserId();
        const plansResponse = await hr2.learning.learningPlans.getAvailable(userId);
        if (plansResponse.data && plansResponse.data.success) {
          setAvailableLearningPlans(plansResponse.data.data || []);
        }

        // Reload assigned learning plans
        const assignedPlansResponse = await hr2.learning.learningPlans.getByUser(userId);
        if (assignedPlansResponse.data && assignedPlansResponse.data.success) {
          setAssignedLearningPlans(assignedPlansResponse.data.data || []);
        }
      } else {
        toast.error(response.data?.message || 'Failed to create learning plan');
      }
    } catch (error) {
      console.error('Failed to create learning plan:', error);
      toast.error('Failed to create learning plan');
    }
  };

  const handleUpdateLearningPlan = async () => {
    if (!planForm.title || planForm.courses.length === 0) {
      toast.error('Please fill in the plan title and select at least one course');
      return;
    }

    try {
      const response = await hr2.learning.learningPlans.update(selectedPlan.id, planForm);

      if (response.data && response.data.success) {
        toast.success('Learning plan updated successfully');
        setShowEditPlan(false);
        setSelectedPlan(null);
        setPlanForm({
          title: '',
          description: '',
          courses: [],
          estimated_hours: ''
        });

        // Reload learning plans
        const userId = getCurrentUserId();
        const plansResponse = await hr2.learning.learningPlans.getAvailable(userId);
        if (plansResponse.data && plansResponse.data.success) {
          setAvailableLearningPlans(plansResponse.data.data || []);
        }

        // Reload assigned learning plans
        const assignedPlansResponse = await hr2.learning.learningPlans.getByUser(userId);
        if (assignedPlansResponse.data && assignedPlansResponse.data.success) {
          setAssignedLearningPlans(assignedPlansResponse.data.data || []);
        }
      } else {
        toast.error(response.data?.message || 'Failed to update learning plan');
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

      if (response.data && response.data.success) {
        toast.success('Learning plan deleted successfully');

        // Reload learning plans
        const userId = getCurrentUserId();
        const plansResponse = await hr2.learning.learningPlans.getAvailable(userId);
        if (plansResponse.data && plansResponse.data.success) {
          setAvailableLearningPlans(plansResponse.data.data || []);
        }

        // Reload assigned learning plans
        const assignedPlansResponse = await hr2.learning.learningPlans.getByUser(userId);
        if (assignedPlansResponse.data && assignedPlansResponse.data.success) {
          setAssignedLearningPlans(assignedPlansResponse.data.data || []);
        }
      } else {
        toast.error(response.data?.message || 'Failed to delete learning plan');
      }
    } catch (error) {
      console.error('Failed to delete learning plan:', error);
      toast.error('Failed to delete learning plan');
    }
  };

  const handleEnrollInCourse = async (courseId) => {
    try {
      const userId = getCurrentUserId();
      const response = await hr2.learning.enrollment.enroll({
        course_id: courseId,
        user_id: userId,
        source: 'direct'
      });

      if (response.data) {
        toast.success('You have been successfully enrolled in the course');

        // Trigger refresh in other components
        localStorage.setItem('hr2_course_catalog_refresh', Date.now().toString());

        // Reload course catalog and related data to reflect enrollment
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
      } else {
        // Handle specific error cases
        if (response.status === 409) {
          toast.info('You are already enrolled in this course');
          // Still refresh data to ensure UI is in sync
          localStorage.setItem('hr2_course_catalog_refresh', Date.now().toString());
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
        } else {
          toast.error(response.data?.message || 'Failed to enroll in course');
        }
      }
    } catch (error) {
      console.error('Failed to enroll in course:', error);
      // Handle HTTP error responses
      if (error.response?.status === 409) {
        toast.info('You are already enrolled in this course');
        // Refresh data to ensure UI is in sync
        const userId = getCurrentUserId();
        localStorage.setItem('hr2_course_catalog_refresh', Date.now().toString());
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
      } else {
        toast.error('Unable to enroll in course. Please try again');
      }
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
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await hr2.learning.courses.update(selectedCourse.id, courseForm);

      if (response.data && response.data.success) {
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

        // Reload course catalog
        const coursesResponse = await hr2.learning.courses.getAll();
        if (coursesResponse.data && coursesResponse.data.success) {
          const userId = getCurrentUserId();
          const processedCourses = (coursesResponse.data.data || []).map(course => ({
            ...course,
            isEnrolled: course.enrolled_users?.includes(userId) || false
          }));
          setCourseCatalog(processedCourses);
        }
      } else {
        toast.error(response.data?.message || 'Failed to update course');
      }
    } catch (error) {
      console.error('Failed to update course:', error);
      toast.error('Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await hr2.courses.delete(courseId);

      if (response.data && response.data.success) {
        toast.success('Course deleted successfully');

        // Reload course catalog
        const coursesResponse = await hr2.courses.getAll();
        if (coursesResponse.data && coursesResponse.data.success) {
          const userId = getCurrentUserId();
          const processedCourses = (coursesResponse.data.data || []).map(course => ({
            ...course,
            isEnrolled: course.enrolled_users?.includes(userId) || false
          }));
          setCourseCatalog(processedCourses);
        }
      } else {
        toast.error(response.data?.message || 'Failed to delete course');
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleUpdateProgress = async (courseId, newProgress) => {
    try {
      const userId = getCurrentUserId();
      const progressRes = await hr2.learning.progress.getByUser(userId);
      const progressRecord = progressRes.data?.data?.find(p => p.course_id === courseId);

      if (!progressRecord) {
        const createResponse = await hr2.learning.progress.create({
          course_id: courseId,
          user_id: userId,
          progress: newProgress
        });

        if (createResponse.data) {
          toast.success('Learning progress has been initiated');
        }
      } else {
        const response = await hr2.learning.progress.update(progressRecord.id, {
          progress: newProgress
        });

        if (response.data) {
          toast.success('Learning progress has been updated');
        }
      }

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
      toast.error('Unable to update learning progress. Please try again');
    }
  };

  const handleMarkCourseCompleted = async (courseId) => {
    try {
      const userId = getCurrentUserId();
      const progressRes = await hr2.learning.progress.getByUser(userId);
      const progressRecord = progressRes.data?.data?.find(p => p.course_id === courseId);

      if (!progressRecord) {
        toast.error('No learning record found for this course');
        return;
      }

      const response = await hr2.learning.progress.complete(progressRecord.id, {
        score: 85
      });

      if (response.data) {
        toast.success('Congratulations! Course has been marked as completed');
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
      toast.error('Unable to mark course as completed. Please try again');
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
        toast.success('You have been successfully unenrolled from the course');
        const userId = getCurrentUserId();
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
      }
    } catch (error) {
      console.error('Failed to unenroll from course:', error);
      toast.error('Unable to unenroll from course. Please try again');
    }
  };

  const handleStartCourse = async (courseId) => {
    try {
      const enrollResponse = await hr2.learning.enrollment.enroll({
        course_id: courseId,
        user_id: getCurrentUserId()
      });

      if (enrollResponse.data) {
        await handleUpdateProgress(courseId, 5);
        toast.success('Welcome! Your learning journey has begun');
      }
    } catch (error) {
      console.error('Failed to start course:', error);
      if (error.response?.status === 409) {
        // User is already enrolled, just update progress
        await handleUpdateProgress(courseId, 5);
        toast.success('Welcome! Your learning journey has begun');
      } else {
        toast.error('Unable to start course. Please try again');
      }
    }
  };

  const handleRequestPlanAssignment = async (planId) => {
    try {
      const userId = getCurrentUserId();
      const response = await hr2.learning.learningPlans.enroll(planId, userId);

      if (response.data && response.data.success) {
        toast.success('Assignment request submitted');

        // Reload assigned learning plans
        const assignedPlansResponse = await hr2.learning.learningPlans.getByUser(userId);
        if (assignedPlansResponse.data && assignedPlansResponse.data.success) {
          setAssignedLearningPlans(assignedPlansResponse.data.data || []);
        }
      } else {
        toast.error(response.data?.message || 'Failed to request assignment');
      }
    } catch (error) {
      console.error('Failed to request assignment:', error);
      toast.error('Failed to request assignment');
    }
  };

  const handleContinueLearningPlan = async (planId) => {
    try {
      const userId = getCurrentUserId();
      // Just reload assigned learning plans
      const assignedPlansResponse = await hr2.learning.learningPlans.getByUser(userId);
      if (assignedPlansResponse.data && assignedPlansResponse.data.success) {
        setAssignedLearningPlans(assignedPlansResponse.data.data || []);
      } else {
        toast.error('Failed to continue learning plan');
      }
    } catch (error) {
      console.error('Failed to continue learning plan:', error);
      toast.error('Failed to continue learning plan');
    }
  };

  const handleEnrollInLearningPlan = async (planId) => {
    try {
      const userId = getCurrentUserId();
      const response = await hr2.learning.learningPlans.enroll(planId, userId);

      if (response.data && response.data.success) {
        toast.success('Successfully enrolled in learning plan');

        // Reload both available and assigned learning plans
        const [availablePlansResponse, assignedPlansResponse] = await Promise.all([
          hr2.learning.learningPlans.getAvailable(userId),
          hr2.learning.learningPlans.getByUser(userId)
        ]);
        if (availablePlansResponse.data && availablePlansResponse.data.success) {
          setAvailableLearningPlans(availablePlansResponse.data.data || []);
        }
        if (assignedPlansResponse.data && assignedPlansResponse.data.success) {
          setAssignedLearningPlans(assignedPlansResponse.data.data || []);
        }

        // Enroll in missing courses
        await enrollInMissingCourses(response.data.data, userId);
      } else {
        toast.error(response.data?.message || 'Failed to enroll in learning plan');
      }
    } catch (error) {
      console.error('Failed to enroll in learning plan:', error);
      toast.error('Failed to enroll in learning plan');
    }
  };

  const handleUnenrollFromLearningPlan = async (planId) => {
    try {
      const userId = getCurrentUserId();
      const response = await hr2.learning.learningPlans.unenroll(planId, userId);

      if (response.data && response.data.success) {
        toast.success('Successfully unenrolled from learning plan');

        // Reload both available and assigned learning plans
        const [availablePlansResponse, assignedPlansResponse] = await Promise.all([
          hr2.learning.learningPlans.getAvailable(userId),
          hr2.learning.learningPlans.getByUser(userId)
        ]);
        if (availablePlansResponse.data && availablePlansResponse.data.success) {
          setAvailableLearningPlans(availablePlansResponse.data.data || []);
        }
        if (assignedPlansResponse.data && assignedPlansResponse.data.success) {
          setAssignedLearningPlans(assignedPlansResponse.data.data || []);
        }
      } else {
        toast.error(response.data?.message || 'Failed to unenroll from learning plan');
      }
    } catch (error) {
      console.error('Failed to unenroll from learning plan:', error);
      toast.error('Failed to unenroll from learning plan');
    }
  };

  const enrollInMissingCourses = async (plan, userId) => {
    try {
      const planDetails = await hr2.learning.learningPlans.getById(plan.id);
      if (planDetails.data && planDetails.data.success) {
        const courseIds = planDetails.data.data.courses || [];

        for (const courseId of courseIds) {
          // Check if already enrolled
          const existingEnrollment = enrolledCourses.find(ec => ec.course_id === courseId);
          if (!existingEnrollment) {
            await hr2.enrolledCourses.create({
              course_id: courseId,
              employee_id: userId
            });
          }
        }

        // Reload enrolled courses
        const enrolledResponse = await hr2.enrolledCourses.getByUser(userId);
        if (enrolledResponse.data && enrolledResponse.data.success) {
          setEnrolledCourses(enrolledResponse.data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to enroll in missing courses:', error);
    }
  };

  const handleMarkCourseAsDone = async (courseId) => {
    try {
      const updatedList = [...completedCoursesList, courseId];
      setCompletedCoursesList(updatedList);
      localStorage.setItem('completedCourses', JSON.stringify(updatedList));

      toast.success('Course status has been updated to completed');
      const coursesResponse = await hr2.learning.courses.getAll();
      const userId = getCurrentUserId();
      const processedCourses = (coursesResponse.data?.data || []).map(course => ({
        ...course,
        isEnrolled: course.enrolled_users?.includes(userId) || false
      }));
      setCourseCatalog(processedCourses);
    } catch (error) {
      console.error('Failed to mark course as done:', error);
      toast.error('Unable to update course status. Please try again');
    }
  };

  const handleUndoMarkAsDone = async (courseId) => {
    try {
      const updatedList = completedCoursesList.filter(id => id !== courseId);
      setCompletedCoursesList(updatedList);
      localStorage.setItem('completedCourses', JSON.stringify(updatedList));

      toast.success('Course status has been updated');
      const coursesResponse = await hr2.learning.courses.getAll();
      const userId = getCurrentUserId();
      const processedCourses = (coursesResponse.data?.data || []).map(course => ({
        ...course,
        isEnrolled: course.enrolled_users?.includes(userId) || false
      }));
      setCourseCatalog(processedCourses);
    } catch (error) {
      console.error('Failed to undo mark as done:', error);
      toast.error('Unable to update course status. Please try again');
    }
  };

  const handleViewEnrolledEmployees = async (course) => {
    try {
      const response = await hr2.enrolledCourses.getByCourse(course.id);
      if (response.data && response.data.success) {
        setEnrolledEmployees(response.data.data || []);
        setSelectedCourseForEmployees(course);
        setShowEnrolledEmployees(true);
      } else {
        toast.error('Failed to load enrolled employees');
      }
    } catch (error) {
      console.error('Failed to load enrolled employees:', error);
      toast.error('Failed to load enrolled employees');
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

  const handleUploadCertificate = async (progressId, file) => {
    try {
      const formData = new FormData();
      formData.append('certificate', file);

      const response = await hr2.learning.progress.update(progressId, { certificate_uploaded: true });

      if (response.data) {
        const mockCertificateUrl = `certificate_${progressId}.pdf`;
        setEnrolledEmployees(prev => prev.map(emp =>
          emp.id === progressId ? { ...emp, certificate_url: mockCertificateUrl } : emp
        ));
        toast.success('Certificate has been uploaded successfully');
      }
    } catch (error) {
      console.error('Failed to upload certificate:', error);
      toast.error('Unable to upload certificate. Please try again');
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Employee ID', 'Name', 'Email', 'Enrollment Date', 'Status', 'Progress', 'Grade'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.employee_id,
        `"${row.name}"`,
        row.email,
        row.enrollment_date,
        row.status,
        `${row.progress}%`,
        row.grade
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Enrollment data has been exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Learning Catalog...</p>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Learning Catalog</h2>
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <LibraryBig className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Learning Management</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {(courseCatalog || []).filter(course => {
                const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  course.category.toLowerCase().includes(searchTerm.toLowerCase());

                const isEnrolled = course.isEnrolled || false;
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
              const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.category.toLowerCase().includes(searchTerm.toLowerCase());

              const isEnrolled = course.isEnrolled || false;
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

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
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
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {availableLearningPlans.map((plan) => {
                  const planProgress = calculateLearningPlanProgress(plan.id);
                  return (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-sm">{plan.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isHR2Admin || isTrainer ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditLearningPlan(plan)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteLearningPlan(plan.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {planProgress.completed}/{planProgress.total} courses
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Progress</span>
                          <span>{planProgress.percentage}%</span>
                        </div>
                        <Progress value={planProgress.percentage} className="h-2" />

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{plan.estimated_hours ? `${plan.estimated_hours} hours` : 'Duration TBD'}</span>
                          <span>{plan.courses?.length || 0} courses</span>
                        </div>
                      </div>

                      {isEmployee && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          {assignedLearningPlans.some(ap => ap.id === plan.id) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleContinueLearningPlan(plan.id)}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Continue
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEnrollInLearningPlan(plan.id)}
                            >
                              <BookOpen className="w-3 h-3 mr-1" />
                              Enroll
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestPlanAssignment(plan.id)}
                          >
                            <Target className="w-3 h-3 mr-1" />
                            Request
                          </Button>
                        </div>
                      )}
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
                          const newCourses = planForm.courses.includes(course.id)
                            ? planForm.courses.filter(id => id !== course.id)
                            : [...planForm.courses, course.id];
                          setPlanForm(prev => ({ ...prev, courses: newCourses }));
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
                          const newCourses = planForm.courses.includes(course.id)
                            ? planForm.courses.filter(id => id !== course.id)
                            : [...planForm.courses, course.id];
                          setPlanForm(prev => ({ ...prev, courses: newCourses }));
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

export default CourseCatalogAndPlans;