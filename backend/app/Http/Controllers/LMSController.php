<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class LMSController extends Controller
{
    // ===========================================
    // COURSE CATALOG MANAGEMENT
    // ===========================================

    /**
     * Get all courses with filtering and search
     */
    public function getCourses(Request $request): JsonResponse
    {
        try {
            $query = DB::table('lms_courses')->where('status', 'active');
            
            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }
            
            // Category filter
            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }
            
            // Level filter
            if ($request->has('level') && $request->level !== 'all') {
                $query->where('level', $request->level);
            }
            
            $courses = $query->orderBy('created_at', 'desc')->get();
            
            // Parse JSON fields
            $courses = $courses->map(function ($course) {
                $course->tags = json_decode($course->tags, true) ?? [];
                $course->prerequisites = json_decode($course->prerequisites, true) ?? [];
                $course->enrolled_users = json_decode($course->enrolled_users, true) ?? [];
                return $course;
            });
            
            return response()->json([
                'success' => true,
                'data' => $courses
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching courses: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching courses'
            ], 500);
        }
    }

    /**
     * Create a new course (HR2Admin/Trainer only)
     */
    public function createCourse(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'category' => 'required|string',
                'level' => 'nullable|string',
                'schedule_date' => 'nullable|date',
                'instructor' => 'nullable|string',
                'objectives' => 'nullable|string',
                'meeting_link' => 'nullable|string',
                'assessment_link' => 'nullable|string',
                'tags' => 'nullable|array',
                'prerequisites' => 'nullable|array',
            ]);

            // Add URL validation only if the fields are not empty
            $validator->sometimes('meeting_link', 'url', function ($input) {
                return !empty($input['meeting_link']);
            });
            $validator->sometimes('assessment_link', 'url', function ($input) {
                return !empty($input['assessment_link']);
            });

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $courseId = DB::table('lms_courses')->insertGetId([
                'title' => $request->title,
                'description' => $request->description ?: '',
                'objectives' => $request->objectives ?: null,
                'category' => $request->category ?: '',
                'level' => $request->level ?: 'Beginner',
                'schedule_date' => $request->schedule_date ?: null,
                'instructor' => $request->instructor ?: null,
                'meeting_link' => $request->meeting_link ?: null,
                'assessment_link' => $request->assessment_link ?: null,
                'tags' => json_encode($request->tags ?? []),
                'prerequisites' => json_encode($request->prerequisites ?? []),
                'enrolled_users' => json_encode([]),
                'rating' => 0.0,
                'enrolled_count' => 0,
                'status' => 'active',
                'created_by' => null, // TODO: Get from authenticated user
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $course = DB::table('lms_courses')->where('id', $courseId)->first();
            $course->tags = json_decode($course->tags, true);
            $course->prerequisites = json_decode($course->prerequisites, true);
            $course->enrolled_users = json_decode($course->enrolled_users, true);

            return response()->json([
                'success' => true,
                'message' => 'Course created successfully',
                'data' => $course
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating course'
            ], 500);
        }
    }

    /**
     * Update a course (HR2Admin/Trainer only)
     */
    public function updateCourse(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|required|string',
                'category' => 'sometimes|required|string',
                'level' => 'nullable|string',
                'schedule_date' => 'nullable|date',
                'instructor' => 'nullable|string',
                'objectives' => 'nullable|string',
                'tags' => 'nullable|array',
                'prerequisites' => 'nullable|array',
                'meeting_link' => 'nullable|string',
                'assessment_link' => 'nullable|string',
            ]);

            // Add URL validation only if the fields are not empty
            $validator->sometimes('meeting_link', 'url', function ($input) {
                return !empty($input['meeting_link']);
            });
            $validator->sometimes('assessment_link', 'url', function ($input) {
                return !empty($input['assessment_link']);
            });

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = array_filter($request->only([
                'title', 'description', 'objectives', 'category', 'level', 'schedule_date', 'instructor', 'meeting_link', 'assessment_link'
            ]));

            if ($request->has('tags')) {
                $updateData['tags'] = json_encode($request->tags);
            }

            if ($request->has('prerequisites')) {
                $updateData['prerequisites'] = json_encode($request->prerequisites);
            }

            $updateData['updated_at'] = now();

            $updated = DB::table('lms_courses')
                ->where('id', $id)
                ->update($updateData);

            if (!$updated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $course = DB::table('lms_courses')->where('id', $id)->first();
            $course->tags = json_decode($course->tags, true);
            $course->prerequisites = json_decode($course->prerequisites, true);
            $course->enrolled_users = json_decode($course->enrolled_users, true);

            return response()->json([
                'success' => true,
                'message' => 'Course updated successfully',
                'data' => $course
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating course'
            ], 500);
        }
    }

    /**
     * Delete a course (HR2Admin/Trainer only)
     */
    public function deleteCourse($id): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Check if course exists
            $course = DB::table('lms_courses')->where('id', $id)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Delete related progress records
            DB::table('lms_learning_progress')->where('course_id', $id)->delete();
            DB::table('lms_module_progress')->where('course_id', $id)->delete();
            DB::table('lms_course_modules')->where('course_id', $id)->delete();

            // Delete course
            DB::table('lms_courses')->where('id', $id)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Course deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error deleting course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting course'
            ], 500);
        }
    }

    // ===========================================
    // LEARNING PLANS MANAGEMENT
    // ===========================================

    /**
     * Get all learning plans
     */
    public function getLearningPlans(Request $request): JsonResponse
    {
        try {
            $userId = (int) $request->query('user_id', 1); // Default to user 1 for demo
            $all = $request->query('all', false); // If true, return all plans, not just assigned
            
            Log::info('Getting learning plans', [
                'user_id' => $userId,
                'user_id_type' => gettype($userId),
                'all' => $all
            ]);
            
            if ($all) {
                $userIdParam = $request->query('user_id');
                if ($userIdParam) {
                    // Return all active learning plans that the user is NOT assigned to
                    $plans = DB::table('lms_learning_plans')
                        ->where('status', 'active')
                        ->whereNot(function($query) use ($userId) {
                            // Exclude plans where user is already assigned
                            $query->whereJsonContains('assigned_users', $userId)
                                  ->orWhereJsonContains('assigned_users', (string) $userId);
                        })
                        ->orderBy('created_at', 'desc')
                        ->get();
                        
                    Log::info('Found available plans (excluding assigned)', [
                        'user_id' => $userId,
                        'plans_count' => $plans->count(),
                        'plan_ids' => $plans->pluck('id')->toArray()
                    ]);
                } else {
                    // No user_id provided, return all active plans (for admins)
                    $plans = DB::table('lms_learning_plans')
                        ->where('status', 'active')
                        ->orderBy('created_at', 'desc')
                        ->get();
                        
                    Log::info('Found all active plans (no user filter)', [
                        'plans_count' => $plans->count(),
                        'plan_ids' => $plans->pluck('id')->toArray()
                    ]);
                }
            } else {
                // Return only assigned plans (current behavior)
                $plans = DB::table('lms_learning_plans')
                    ->where('status', 'active')
                    ->where(function($query) use ($userId) {
                        // Check for both string and integer user IDs in JSON array
                        $query->whereJsonContains('assigned_users', $userId)
                              ->orWhereJsonContains('assigned_users', (string) $userId)
                              ->orWhere('created_by', $userId);
                    })
                    ->orderBy('created_at', 'desc')
                    ->get();
                    
                Log::info('Found assigned plans', [
                    'user_id' => $userId,
                    'plans_count' => $plans->count(),
                    'plan_ids' => $plans->pluck('id')->toArray()
                ]);
            }

            $plans = $plans->map(function ($plan) {
                $plan->courses = json_decode($plan->courses, true) ?? [];
                $plan->assigned_users = json_decode($plan->assigned_users, true) ?? [];
                return $plan;
            });

            return response()->json([
                'success' => true,
                'data' => $plans
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching learning plans: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching learning plans'
            ], 500);
        }
    }

    /**
     * Create a new learning plan (HR2Admin/Trainer only)
     */
    public function createLearningPlan(Request $request): JsonResponse
    {
        try {
            Log::info('Creating learning plan', ['request_data' => $request->all()]);
            
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'courses' => 'required|array|min:1',
                'courses.*' => 'exists:lms_courses,id',
                'due_date' => 'nullable|date',
                'estimated_hours' => 'nullable|integer|min:1',
                'assigned_users' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                Log::error('Learning plan validation failed', ['errors' => $validator->errors()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Inserting learning plan', [
                'title' => $request->title,
                'courses_count' => count($request->courses ?? [])
            ]);

            $planId = DB::table('lms_learning_plans')->insertGetId([
                'title' => $request->title,
                'description' => $request->description,
                'courses' => json_encode($request->courses),
                'due_date' => $request->due_date,
                'estimated_hours' => $request->estimated_hours,
                'assigned_users' => json_encode($request->assigned_users ?? []), // Empty by default - users must apply
                'status' => 'active',
                'created_by' => 1, // TODO: Get from authenticated user
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Log::info('Learning plan created with ID', ['id' => $planId]);

            $plan = DB::table('lms_learning_plans')->where('id', $planId)->first();
            $plan->courses = json_decode($plan->courses, true);
            $plan->assigned_users = json_decode($plan->assigned_users, true);

            Log::info('Returning learning plan', ['plan' => $plan]);

            return response()->json([
                'success' => true,
                'message' => 'Learning plan created successfully',
                'data' => $plan
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating learning plan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating learning plan'
            ], 500);
        }
    }

    /**
     * Update a learning plan (HR2Admin/Trainer only)
     */
    public function updateLearningPlan(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'courses' => 'required|array|min:1',
                'courses.*' => 'integer',
                'due_date' => 'nullable|date',
                'estimated_hours' => 'nullable|integer|min:1',
                'assigned_users' => 'nullable|array',
                'status' => 'sometimes|in:active,completed,overdue,draft',
            ]);

            if ($validator->fails()) {
                Log::error('Learning plan update validation failed', [
                    'request_data' => $request->all(),
                    'errors' => $validator->errors()->toArray()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = array_filter($request->only([
                'title', 'description', 'due_date', 'estimated_hours', 'status'
            ]));

            if ($request->has('courses')) {
                $updateData['courses'] = json_encode($request->courses);
            }

            if ($request->has('assigned_users')) {
                $updateData['assigned_users'] = json_encode($request->assigned_users);
            }

            $updateData['updated_at'] = now();

            $updated = DB::table('lms_learning_plans')
                ->where('id', $id)
                ->update($updateData);

            if (!$updated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Learning plan not found'
                ], 404);
            }

            $plan = DB::table('lms_learning_plans')->where('id', $id)->first();
            $plan->courses = json_decode($plan->courses, true);
            $plan->assigned_users = json_decode($plan->assigned_users, true);

            return response()->json([
                'success' => true,
                'message' => 'Learning plan updated successfully',
                'data' => $plan
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating learning plan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating learning plan'
            ], 500);
        }
    }

    /**
     * Delete a learning plan (HR2Admin/Trainer only)
     */
    public function deleteLearningPlan($id): JsonResponse
    {
        try {
            $deleted = DB::table('lms_learning_plans')->where('id', $id)->delete();

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Learning plan not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Learning plan deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting learning plan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting learning plan'
            ], 500);
        }
    }

    // ===========================================
    // LEARNING PROGRESS MANAGEMENT
    // ===========================================

    /**
     * Get user's learning progress
     */
    public function getLearningProgress(Request $request): JsonResponse
    {
        try {
            $userId = $request->query('user_id', 1); // Default to user 1 for demo
            
            $progress = DB::table('lms_learning_progress')
                ->where('user_id', $userId)
                ->orderBy('enrollment_date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $progress
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching learning progress: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching learning progress'
            ], 500);
        }
    }

    /**
     * Enroll user in a course
     */
    public function enrollInCourse(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer',
                'course_id' => 'required|exists:lms_courses,id',
                'source' => 'required|in:direct,learning_plan',
                'source_id' => 'nullable|exists:lms_learning_plans,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if already enrolled
            $existingProgress = DB::table('lms_learning_progress')
                ->where('user_id', $request->user_id)
                ->where('course_id', $request->course_id)
                ->first();

            if ($existingProgress) {
                return response()->json([
                    'success' => false,
                    'message' => 'User already enrolled in this course'
                ], 409);
            }

            // Get course details
            $course = DB::table('lms_courses')->where('id', $request->course_id)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            DB::beginTransaction();

            // Create progress record
            $progressId = DB::table('lms_learning_progress')->insertGetId([
                'user_id' => $request->user_id,
                'course_id' => $request->course_id,
                'course_title' => $course->title,
                'source' => $request->source,
                'source_id' => $request->source_id,
                'enrollment_date' => now()->format('Y-m-d'),
                'progress' => 0,
                'status' => 'not_started',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update course enrollment count
            $enrolledUsers = json_decode($course->enrolled_users, true) ?? [];
            $enrolledUsers[] = $request->user_id;
            
            DB::table('lms_courses')
                ->where('id', $request->course_id)
                ->update([
                    'enrolled_users' => json_encode($enrolledUsers),
                    'enrolled_count' => count($enrolledUsers),
                    'updated_at' => now(),
                ]);

            DB::commit();

            $progress = DB::table('lms_learning_progress')->where('id', $progressId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Successfully enrolled in course',
                'data' => $progress
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error enrolling in course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error enrolling in course'
            ], 500);
        }
    }

    /**
     * Unenroll user from a course (Employee action)
     */
    public function unenrollFromCourse(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer',
                'course_id' => 'required|exists:lms_courses,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Find and delete progress record
            $progress = DB::table('lms_learning_progress')
                ->where('user_id', $request->user_id)
                ->where('course_id', $request->course_id)
                ->first();

            if (!$progress) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not enrolled in this course'
                ], 404);
            }

            // Don't allow unenrolling from completed courses
            if ($progress->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot unenroll from completed courses'
                ], 400);
            }

            // Delete progress record
            DB::table('lms_learning_progress')
                ->where('user_id', $request->user_id)
                ->where('course_id', $request->course_id)
                ->delete();

            // Update course enrollment count
            $course = DB::table('lms_courses')->where('id', $request->course_id)->first();
            $enrolledUsers = json_decode($course->enrolled_users, true) ?? [];
            $enrolledUsers = array_filter($enrolledUsers, function($userId) use ($request) {
                return $userId != $request->user_id;
            });

            DB::table('lms_courses')
                ->where('id', $request->course_id)
                ->update([
                    'enrolled_users' => json_encode($enrolledUsers),
                    'enrolled_count' => count($enrolledUsers),
                    'updated_at' => now(),
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Successfully unenrolled from course'
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error unenrolling from course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error unenrolling from course'
            ], 500);
        }
    }

    /**
     * Enroll user in a learning plan (bulk enroll in all courses)
     */
    public function enrollInLearningPlan(Request $request, $planId): JsonResponse
    {
        try {
            Log::info('Enrolling in learning plan', [
                'plan_id' => $planId,
                'request_data' => $request->all()
            ]);
            
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get the learning plan
            $plan = DB::table('lms_learning_plans')->where('id', $planId)->first();
            if (!$plan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Learning plan not found'
                ], 404);
            }

            $userId = (int) $request->user_id;
            $courseIds = json_decode($plan->courses, true) ?? [];

            Log::info('Processing enrollment', [
                'user_id' => $userId,
                'user_id_type' => gettype($userId),
                'course_ids' => $courseIds
            ]);

            if (empty($courseIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Learning plan has no courses'
                ], 400);
            }

            DB::beginTransaction();

            // Check if user is already assigned to this plan
            $assignedUsers = json_decode($plan->assigned_users, true) ?? [];
            if (in_array($userId, $assignedUsers)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already enrolled in this learning plan'
                ], 409);
            }

            // Enroll user in all courses in the plan
            foreach ($courseIds as $courseId) {
                // Check if already enrolled in this course
                $existingProgress = DB::table('lms_learning_progress')
                    ->where('user_id', $userId)
                    ->where('course_id', $courseId)
                    ->first();

                if (!$existingProgress) {
                    // Get course details
                    $course = DB::table('lms_courses')->where('id', $courseId)->first();
                    if ($course) {
                        // Create progress record
                        DB::table('lms_learning_progress')->insert([
                            'user_id' => $userId,
                            'course_id' => $courseId,
                            'course_title' => $course->title,
                            'source' => 'learning_plan',
                            'source_id' => $planId,
                            'enrollment_date' => now()->format('Y-m-d'),
                            'progress' => 0,
                            'status' => 'not_started',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Update course enrollment count
                        $enrolledUsers = json_decode($course->enrolled_users, true) ?? [];
                        $enrolledUsers[] = $userId;

                        DB::table('lms_courses')
                            ->where('id', $courseId)
                            ->update([
                                'enrolled_users' => json_encode($enrolledUsers),
                                'enrolled_count' => count($enrolledUsers),
                                'updated_at' => now(),
                            ]);
                    }
                }
            }

            // Add user to plan's assigned users
            $assignedUsers[] = $userId;
            Log::info('Updating learning plan assigned users', [
                'plan_id' => $planId,
                'user_id' => $userId,
                'assigned_users_before' => $assignedUsers
            ]);
            DB::table('lms_learning_plans')
                ->where('id', $planId)
                ->update([
                    'assigned_users' => json_encode($assignedUsers),
                    'updated_at' => now(),
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Successfully enrolled in learning plan',
                'data' => [
                    'plan_id' => $planId,
                    'courses_enrolled' => count($courseIds)
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error enrolling in learning plan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error enrolling in learning plan'
            ], 500);
        }
    }

    /**
     * Unenroll from a learning plan (Employee action)
     */
    public function unenrollFromLearningPlan(Request $request, $planId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get the learning plan
            $plan = DB::table('lms_learning_plans')->where('id', $planId)->first();
            if (!$plan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Learning plan not found'
                ], 404);
            }

            $userId = (int) $request->user_id;
            $courseIds = json_decode($plan->courses, true) ?? [];

            DB::beginTransaction();

            // Check if user is assigned to this plan
            $assignedUsers = json_decode($plan->assigned_users, true) ?? [];
            if (!in_array($userId, $assignedUsers)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not enrolled in this learning plan'
                ], 404);
            }

            // Remove user from plan's assigned users
            $assignedUsers = array_diff($assignedUsers, [$userId]);
            DB::table('lms_learning_plans')
                ->where('id', $planId)
                ->update([
                    'assigned_users' => json_encode(array_values($assignedUsers)),
                    'updated_at' => now(),
                ]);

            // Remove progress records for courses in this plan (only if source is learning_plan)
            foreach ($courseIds as $courseId) {
                DB::table('lms_learning_progress')
                    ->where('user_id', $userId)
                    ->where('course_id', $courseId)
                    ->where('source', 'learning_plan')
                    ->where('source_id', $planId)
                    ->delete();

                // Update course enrollment count (remove user from enrolled_users)
                $course = DB::table('lms_courses')->where('id', $courseId)->first();
                if ($course) {
                    $enrolledUsers = json_decode($course->enrolled_users, true) ?? [];
                    $enrolledUsers = array_diff($enrolledUsers, [$userId]);

                    DB::table('lms_courses')
                        ->where('id', $courseId)
                        ->update([
                            'enrolled_users' => json_encode(array_values($enrolledUsers)),
                            'enrolled_count' => count($enrolledUsers),
                            'updated_at' => now(),
                        ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Successfully unenrolled from learning plan',
                'data' => [
                    'plan_id' => $planId,
                    'courses_removed' => count($courseIds)
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error unenrolling from learning plan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error unenrolling from learning plan'
            ], 500);
        }
    }

    /**
     * Mark course as completed (Employee action)
     */
    public function completeCourse(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'score' => 'nullable|numeric|min:0|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $progress = DB::table('lms_learning_progress')->where('id', $id)->first();
            if (!$progress) {
                return response()->json([
                    'success' => false,
                    'message' => 'Progress record not found'
                ], 404);
            }

            $updateData = [
                'progress' => 100,
                'status' => 'completed',
                'updated_at' => now(),
            ];

            if ($request->has('score')) {
                $updateData['score'] = $request->score;
            }

            DB::table('lms_learning_progress')
                ->where('id', $id)
                ->update($updateData);

            $updatedProgress = DB::table('lms_learning_progress')->where('id', $id)->first();

            return response()->json([
                'success' => true,
                'message' => 'Course marked as completed',
                'data' => $updatedProgress
            ]);
        } catch (\Exception $e) {
            Log::error('Error completing course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error completing course'
            ], 500);
        }
    }

    /**
     * Reset course progress (Employee action)
     */
    public function resetProgress(Request $request, $id): JsonResponse
    {
        try {
            $progress = DB::table('lms_learning_progress')->where('id', $id)->first();
            if (!$progress) {
                return response()->json([
                    'success' => false,
                    'message' => 'Progress record not found'
                ], 404);
            }

            // Don't allow resetting completed courses
            if ($progress->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot reset progress for completed courses'
                ], 400);
            }

            DB::table('lms_learning_progress')
                ->where('id', $id)
                ->update([
                    'progress' => 0,
                    'status' => 'not_started',
                    'last_accessed' => null,
                    'score' => null,
                    'notes' => null,
                    'updated_at' => now(),
                ]);

            $updatedProgress = DB::table('lms_learning_progress')->where('id', $id)->first();

            return response()->json([
                'success' => true,
                'message' => 'Progress reset successfully',
                'data' => $updatedProgress
            ]);
        } catch (\Exception $e) {
            Log::error('Error resetting progress: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error resetting progress'
            ], 500);
        }
    }

    /**
     * Submit feedback for a course (Employee action)
     */
    public function submitFeedback(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer',
                'course_id' => 'required|exists:lms_courses,id',
                'rating' => 'required|integer|min:1|max:5',
                'feedback' => 'nullable|string',
                'would_recommend' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if user is enrolled and has completed the course
            $progress = DB::table('lms_learning_progress')
                ->where('user_id', $request->user_id)
                ->where('course_id', $request->course_id)
                ->where('status', 'completed')
                ->first();

            if (!$progress) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must complete the course before submitting feedback'
                ], 400);
            }

            $feedbackId = DB::table('lms_feedback')->insertGetId([
                'user_id' => $request->user_id,
                'course_id' => $request->course_id,
                'rating' => $request->rating,
                'feedback' => $request->feedback,
                'would_recommend' => $request->would_recommend ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $feedback = DB::table('lms_feedback')->where('id', $feedbackId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Feedback submitted successfully',
                'data' => $feedback
            ]);
        } catch (\Exception $e) {
            Log::error('Error submitting feedback: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error submitting feedback'
            ], 500);
        }
    }

    /**
     * Get user's enrolled courses with actions (Employee view)
     */
    public function getMyCourses(Request $request): JsonResponse
    {
        try {
            $userId = $request->query('user_id', 1); // Default to user 1 for demo

            $progress = DB::table('lms_learning_progress')
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            $coursesWithActions = $progress->map(function ($item) {
                $course = DB::table('lms_courses')->where('id', $item->course_id)->first();

                return [
                    'id' => $item->id,
                    'course_id' => $item->course_id,
                    'course_title' => $item->course_title,
                    'progress' => $item->progress,
                    'status' => $item->status,
                    'enrollment_date' => $item->enrollment_date,
                    'last_accessed' => $item->last_accessed,
                    'score' => $item->score,
                    'source' => $item->source,
                    'course' => $course,
                    'actions' => [
                        'can_continue' => $item->status !== 'completed',
                        'can_complete' => $item->status !== 'completed' && $item->progress >= 90,
                        'can_reset' => $item->status !== 'completed',
                        'can_unenroll' => $item->status !== 'completed',
                        'can_feedback' => $item->status === 'completed',
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $coursesWithActions
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting my courses: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error getting enrolled courses'
            ], 500);
        }
    }

    /**
     * Update learning progress (Employee action)
     */
    public function updateProgress(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'progress' => 'sometimes|integer|min:0|max:100',
                'status' => 'sometimes|in:not_started,in_progress,completed,overdue',
                'score' => 'nullable|numeric|min:0|max:100',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = array_filter($request->only([
                'progress', 'status', 'score', 'notes'
            ]));

            $updateData['last_accessed'] = now();
            $updateData['updated_at'] = now();

            $updated = DB::table('lms_learning_progress')
                ->where('id', $id)
                ->update($updateData);

            if (!$updated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Progress record not found'
                ], 404);
            }

            $progress = DB::table('lms_learning_progress')->where('id', $id)->first();

            return response()->json([
                'success' => true,
                'message' => 'Progress updated successfully',
                'data' => $progress
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating progress: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating progress'
            ], 500);
        }
    }

    /**
     * Delete learning progress (HR2Admin/Trainer only)
     */
    public function deleteProgress($id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $progress = DB::table('lms_learning_progress')->where('id', $id)->first();
            if (!$progress) {
                return response()->json([
                    'success' => false,
                    'message' => 'Progress record not found'
                ], 404);
            }

            // Remove user from course enrollment
            $course = DB::table('lms_courses')->where('id', $progress->course_id)->first();
            if ($course) {
                $enrolledUsers = json_decode($course->enrolled_users, true) ?? [];
                $enrolledUsers = array_values(array_diff($enrolledUsers, [$progress->user_id]));
                
                DB::table('lms_courses')
                    ->where('id', $progress->course_id)
                    ->update([
                        'enrolled_users' => json_encode($enrolledUsers),
                        'enrolled_count' => count($enrolledUsers),
                        'updated_at' => now(),
                    ]);
            }

            // Delete progress record
            DB::table('lms_learning_progress')->where('id', $id)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Progress record deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error deleting progress: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting progress'
            ], 500);
        }
    }

    // ===========================================
    // ANALYTICS & REPORTS
    // ===========================================

    /**
     * Get LMS analytics dashboard
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        try {
            $userId = $request->query('user_id');
            
            $analytics = [
                'total_courses' => DB::table('lms_courses')->where('status', 'active')->count(),
                'total_learning_plans' => DB::table('lms_learning_plans')->where('status', 'active')->count(),
                'categories' => DB::table('lms_courses')
                    ->where('status', 'active')
                    ->select('category', DB::raw('count(*) as count'))
                    ->groupBy('category')
                    ->get(),
            ];

            if ($userId) {
                $analytics['user_progress'] = [
                    'enrolled_courses' => DB::table('lms_learning_progress')->where('user_id', $userId)->count(),
                    'completed_courses' => DB::table('lms_learning_progress')
                        ->where('user_id', $userId)
                        ->where('status', 'completed')
                        ->count(),
                    'in_progress_courses' => DB::table('lms_learning_progress')
                        ->where('user_id', $userId)
                        ->where('status', 'in_progress')
                        ->count(),
                    'average_score' => DB::table('lms_learning_progress')
                        ->where('user_id', $userId)
                        ->whereNotNull('score')
                        ->avg('score'),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching analytics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching analytics'
            ], 500);
        }
    }

    /**
     * Get course recommendations for user
     */
    public function getRecommendations(Request $request): JsonResponse
    {
        try {
            $userId = $request->query('user_id', 1);
            
            // Get user's enrolled courses
            $enrolledCourseIds = DB::table('lms_learning_progress')
                ->where('user_id', $userId)
                ->pluck('course_id')
                ->toArray();

            // Get recommended courses (not enrolled, no prerequisites or prerequisites met)
            $recommendations = DB::table('lms_courses')
                ->where('status', 'active')
                ->whereNotIn('id', $enrolledCourseIds)
                ->orderBy('rating', 'desc')
                ->limit(6)
                ->get();

            $recommendations = $recommendations->map(function ($course) {
                $course->tags = json_decode($course->tags, true) ?? [];
                $course->prerequisites = json_decode($course->prerequisites, true) ?? [];
                return $course;
            });

            return response()->json([
                'success' => true,
                'data' => $recommendations
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching recommendations: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching recommendations'
            ], 500);
        }
    }

    // ===========================================
    // DASHBOARD ENDPOINTS
    // ===========================================

    /**
     * Get learning plans data for dashboard
     */
    public function getDashboardLearningPlans(Request $request): JsonResponse
    {
        try {
            $userId = (int) $request->query('user_id', 1); // Default user for demo
            
            Log::info('Fetching dashboard learning plans', ['user_id' => $userId, 'user_id_type' => gettype($userId)]);
            
            // Get assigned learning plans
            try {
                $learningPlans = DB::table('lms_learning_plans')
                    ->whereJsonContains('assigned_users', $userId)
                    ->where('status', '!=', 'draft')
                    ->orderBy('created_at', 'desc')
                    ->get();

                Log::info('Query executed successfully', ['count' => $learningPlans->count()]);
            } catch (\Exception $queryException) {
                Log::error('Query failed', [
                    'error' => $queryException->getMessage(),
                    'user_id' => $userId,
                    'trace' => $queryException->getTraceAsString()
                ]);
                $learningPlans = collect(); // Empty collection
            }

            Log::info('Query details', [
                'user_id' => $userId,
                'user_id_type' => gettype($userId),
                'query_sql' => DB::table('lms_learning_plans')
                    ->whereJsonContains('assigned_users', $userId)
                    ->where('status', '!=', 'draft')
                    ->toSql(),
                'query_bindings' => DB::table('lms_learning_plans')
                    ->whereJsonContains('assigned_users', $userId)
                    ->where('status', '!=', 'draft')
                    ->getBindings()
            ]);

            Log::info('Found learning plans', ['count' => $learningPlans->count(), 'plans' => $learningPlans->toArray()]);

            // Calculate progress for each plan
            $plansWithProgress = $learningPlans->map(function($plan) use ($userId) {
                $courses = json_decode($plan->courses, true) ?? [];
                $totalCourses = count($courses);
                
                if ($totalCourses === 0) {
                    $progress = 0;
                    $completedCourses = 0;
                } else {
                    $completedCourses = DB::table('lms_learning_progress')
                        ->where('user_id', $userId)
                        ->whereIn('course_id', $courses)
                        ->where('status', 'completed')
                        ->count();
                    
                    $progress = round(($completedCourses / $totalCourses) * 100);
                }

                return [
                    'id' => $plan->id,
                    'title' => $plan->title,
                    'description' => $plan->description,
                    'status' => $plan->status,
                    'progress' => $progress,
                    'totalCourses' => $totalCourses,
                    'completedCourses' => $completedCourses
                ];
            });

            // Get summary stats
            $totalPlans = $plansWithProgress->count();
            $completedPlans = $plansWithProgress->where('status', 'completed')->count();
            $overduePlans = $plansWithProgress->where('isOverdue', true)->count();
            $overallProgress = $totalPlans > 0 ? round($plansWithProgress->avg('progress')) : 0;

            $data = [
                'plans' => $plansWithProgress->take(5), // Limit to 5 for dashboard
                'totalPlans' => $totalPlans,
                'completedPlans' => $completedPlans,
                'overduePlans' => $overduePlans,
                'overallProgress' => $overallProgress
            ];

            Log::info('Returning dashboard learning plans data', ['data' => $data]);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching dashboard learning plans: ' . $e->getMessage(), [
                'user_id' => $request->query('user_id', 1),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error fetching learning plans data'
            ], 500);
        }
    }

    /**
     * Get course catalog data for dashboard
     */
    public function getDashboardCourseCatalog(Request $request): JsonResponse
    {
        try {
            $userId = $request->query('user_id', 1); // Default user for demo
            
            // Get recent/featured courses
            $courses = DB::table('lms_courses')
                ->where('status', 'active')
                ->orderBy('created_at', 'desc')
                ->limit(6)
                ->get();

            // Get user's enrolled courses to show enrollment status
            $enrolledCourseIds = DB::table('lms_learning_progress')
                ->where('user_id', $userId)
                ->pluck('course_id')
                ->toArray();

            $coursesWithStatus = $courses->map(function($course) use ($enrolledCourseIds) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => substr($course->description, 0, 150) . '...',
                    'category' => $course->category,
                    'level' => $course->level,
                    'schedule_date' => $course->schedule_date,
                    'rating' => $course->rating,
                    'enrolledCount' => $course->enrolled_count,
                    'instructor' => $course->instructor,
                    'isEnrolled' => in_array($course->id, $enrolledCourseIds),
                    'tags' => json_decode($course->tags, true) ?? []
                ];
            });

            // Get category statistics
            $categoryStats = DB::table('lms_courses')
                ->where('status', 'active')
                ->select('category', DB::raw('count(*) as count'))
                ->groupBy('category')
                ->get();

            $data = [
                'courses' => $coursesWithStatus,
                'totalCourses' => DB::table('lms_courses')->where('status', 'active')->count(),
                'categoryStats' => $categoryStats,
                'userEnrolledCount' => count($enrolledCourseIds)
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching dashboard course catalog: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching course catalog data'
            ], 500);
        }
    }

    /**
     * Get learning progress data for dashboard
     */
    public function getDashboardLearningProgress(Request $request): JsonResponse
    {
        try {
            $userId = $request->query('user_id', 1); // Default user for demo
            
            // Get user's learning progress
            $progress = DB::table('lms_learning_progress')
                ->where('user_id', $userId)
                ->get();

            // Calculate overall statistics
            $totalCourses = $progress->count();
            $completedCourses = $progress->where('status', 'completed')->count();
            $inProgressCourses = $progress->where('status', 'in_progress')->count();
            $notStartedCourses = $progress->where('status', 'not_started')->count();
            $overdueCourses = $progress->where('status', 'overdue')->count();

            $overallProgress = $totalCourses > 0 ? round(($completedCourses / $totalCourses) * 100) : 0;
            $averageScore = $progress->where('score', '>', 0)->avg('score') ?? 0;

            // Get recent activity (last 5 courses)
            $recentActivity = $progress
                ->whereNotNull('last_accessed')
                ->sortByDesc('last_accessed')
                ->take(5)
                ->map(function($item) {
                    return [
                        'id' => $item->id,
                        'courseTitle' => $item->course_title,
                        'progress' => $item->progress,
                        'status' => $item->status,
                        'lastAccessed' => $item->last_accessed,
                        'score' => $item->score,
                        'source' => $item->source
                    ];
                })
                ->values();

            // Get progress by category
            $progressByStatus = [
                'completed' => $completedCourses,
                'in_progress' => $inProgressCourses,
                'not_started' => $notStartedCourses,
                'overdue' => $overdueCourses
            ];

            // Calculate learning streak (days with activity)
            $learningStreak = $this->calculateLearningStreak($userId);

            $data = [
                'totalCourses' => $totalCourses,
                'completedCourses' => $completedCourses,
                'inProgressCourses' => $inProgressCourses,
                'overallProgress' => $overallProgress,
                'averageScore' => round($averageScore, 1),
                'learningStreak' => $learningStreak,
                'progressByStatus' => $progressByStatus,
                'recentActivity' => $recentActivity,
                'progressChart' => [
                    'completed' => $completedCourses,
                    'in_progress' => $inProgressCourses,
                    'not_started' => $notStartedCourses
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching dashboard learning progress: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching learning progress data'
            ], 500);
        }
    }

    /**
     * Calculate learning streak for user
     */
    private function calculateLearningStreak($userId): int
    {
        // Get days with learning activity in the last 30 days
        $streak = DB::table('lms_learning_progress')
            ->where('user_id', $userId)
            ->whereNotNull('last_accessed')
            ->where('last_accessed', '>=', Carbon::now()->subDays(30))
            ->distinct()
            ->count(DB::raw('DATE(last_accessed)'));
            
        return $streak;
    }
}