<?php

namespace App\Http\Controllers;

use App\Models\TrainingManagement;
use App\Models\SuccessionPlanning;
use App\Models\TrainingApplication;
use App\Models\TrainingFeedback;
use App\Models\TrainingCompletion;
use App\Models\TrainingCertificate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TMController extends Controller
{
    // List pending training applications
    public function pendingApplications(): JsonResponse
    {
        $pending = TrainingApplication::where('status', 'applied')->get();
        return response()->json($pending);
    }
    
    public function cancelApplication(Request $request, $id): JsonResponse
    {
        $application = TrainingApplication::find($id);

        if (!$application) {
            return response()->json(['error' => 'Application not found'], 404);
        }

        // Only allow cancelling if not already cancelled or completed
        if (in_array($application->status, ['cancelled', 'completed'])) {
            return response()->json(['error' => 'Cannot cancel this application'], 400);
        }

        $application->status = 'cancelled';
        $application->save();

        // Update enrolled count
        if ($application->training_id) {
            $training = TrainingManagement::find($application->training_id);
            if ($training) {
                $training->updateEnrolledCount();
            }
        }

        return response()->json(['success' => true, 'message' => 'Application cancelled successfully']);
    }

    // Apply for training (enroll)
    public function applyForTraining(Request $request): JsonResponse
    {
        $request->validate([
            'training_id' => 'required|integer',
            'employee_id' => 'required|integer',
            'notes' => 'nullable|string|max:500',
        ]);

        // For now, we'll accept any employee_id as long as it's an integer
        // In a full implementation, you might want to validate against a user system
        // or ensure the employee record exists in employee_self_service
        
        $training = TrainingManagement::find($request->training_id);
        if (!$training) {
            return response()->json(['error' => 'Training not found'], 404);
        }

        // Check if training is full
        if ($training->is_full) {
            return response()->json(['error' => 'Training is full'], 400);
        }

        // Check if employee already applied
        $existingApplication = TrainingApplication::where('training_id', $request->training_id)
            ->where('employee_id', $request->employee_id)
            ->whereIn('status', ['applied', 'approved'])
            ->first();

        if ($existingApplication) {
            return response()->json(['error' => 'Already applied for this training'], 400);
        }

        $application = TrainingApplication::create([
            'training_id' => $request->training_id,
            'employee_id' => $request->employee_id,
            'status' => 'applied',
            'submitted_at' => now(),
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully',
            'application' => $application->load('training')
        ], 201);
    }

    // Approve training application
    public function approveApplication(Request $request, $id): JsonResponse
    {
        // Temporarily bypass authentication for debugging
        // $user = Auth::user();
        // if (!$user || (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
        //     return response()->json(['error' => 'Unauthorized. HR2 Admin access required.'], 403);
        // }

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $application = TrainingApplication::find($id);
        if (!$application) {
            return response()->json(['error' => 'Application not found'], 404);
        }

        if ($application->status !== 'applied') {
            return response()->json(['error' => 'Application is not in pending status'], 400);
        }

        // Check if training is still available
        $training = $application->training;
        if ($training->is_full) {
            return response()->json(['error' => 'Training is now full'], 400);
        }

        $application->update([
            'status' => 'approved',
            'approved_by' => null, // No approver for testing
            'manager_approved_at' => now(),
            'manager_approval_notes' => $request->notes,
        ]);

        // Update enrolled count
        $training->updateEnrolledCount();

        return response()->json([
            'success' => true,
            'message' => 'Application approved successfully',
            'application' => $application->load(['training', 'employee'])
        ]);
    }

    // Reject training application
    public function rejectApplication(Request $request, $id): JsonResponse
    {
        // Temporarily bypass authentication for debugging
        // $user = Auth::user();
        // if (!$user || (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
        //     return response()->json(['error' => 'Unauthorized. HR2 Admin access required.'], 403);
        // }

        $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:500',
        ]);

        $application = TrainingApplication::find($id);
        if (!$application) {
            return response()->json(['error' => 'Application not found'], 404);
        }

        if ($application->status !== 'applied') {
            return response()->json(['error' => 'Application is not in pending status'], 400);
        }

        $application->update([
            'status' => 'rejected',
            'approved_by' => null, // No approver for rejections
            'manager_approved_at' => now(),
            'rejection_reason' => $request->rejection_reason,
            'manager_approval_notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Application rejected successfully',
            'application' => $application->load(['training', 'employee'])
        ]);
    }

    // Get user's training applications
    public function getUserApplications(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:employee_self_service,id',
        ]);

        $applications = TrainingApplication::where('employee_id', $request->employee_id)
            ->with(['training', 'approver', 'rejector'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($applications);
    }

    // Get pending applications for approval (HR Admin)
    public function getPendingApplications(): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
            return response()->json(['error' => 'Unauthorized. HR2 Admin access required.'], 403);
        }

        $applications = TrainingApplication::where('status', 'applied')
            ->with(['training', 'employee'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($applications);
    }

    // Get applications for a specific employee
    public function getEmployeeApplications(Request $request, $employeeId): JsonResponse
    {
        $applications = TrainingApplication::where('employee_id', $employeeId)
            ->where('status', '!=', 'rejected') // Exclude rejected applications
            ->with(['training'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($applications);
    }

    // Get all training applications (HR2 Admin/Trainer)
    public function getApplications(Request $request): JsonResponse
    {
        // Temporarily bypass authentication for debugging
        // $user = Auth::user();
        // if (!$user || (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
        //     return response()->json(['error' => 'Unauthorized. HR2 Admin access required.'], 403);
        // }

        try {
            $applications = TrainingApplication::query()
                ->where('status', '!=', 'rejected') // Exclude rejected applications
                ->with([
                    'training', 
                    'employee.user' => function($query) {
                        $query->select('id', 'name', 'email');
                    },
                    'approver' => function($query) {
                        $query->select('id', 'first_name', 'last_name');
                    }
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            // For each application, try to get employee name from multiple sources
            $applications->transform(function ($application) {
                // If we have employee data, use it
                if ($application->employee) {
                    $application->employee_name = $application->employee->user?->name ?? 
                                                 $application->employee->name ?? 
                                                 trim(($application->employee->first_name ?? '') . ' ' . ($application->employee->last_name ?? '')) ?? 
                                                 'Unknown Employee';
                    $application->employee_department = $application->employee->department ?? 'N/A';
                } else {
                    // Try to get user data directly if employee doesn't exist in employee_self_service
                    $user = \App\Models\User::find($application->employee_id);
                    if ($user) {
                        $application->employee_name = $user->name ?? 'Unknown Employee';
                        $application->employee_department = 'N/A';
                        // Create a mock employee object for consistency
                        $application->employee = (object) [
                            'id' => $application->employee_id,
                            'name' => $user->name,
                            'department' => 'N/A',
                            'user' => $user
                        ];
                    } else {
                        $application->employee_name = 'Employee ' . $application->employee_id;
                        $application->employee_department = 'N/A';
                    }
                }
                
                return $application;
            });

            return response()->json($applications);
        } catch (\Exception $e) {
            \Log::error('Failed to load training applications', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to load training applications'], 500);
        }
    }

    // Get training enrollment statistics
    public function getTrainingStats($id): JsonResponse
    {
        $training = TrainingManagement::find($id);
        if (!$training) {
            return response()->json(['error' => 'Training not found'], 404);
        }

        $stats = [
            'total_applications' => $training->applications()->count(),
            'approved_applications' => $training->approvedApplications()->count(),
            'pending_applications' => $training->applications()->where('status', 'applied')->count(),
            'rejected_applications' => $training->applications()->where('status', 'rejected')->count(),
            'cancelled_applications' => $training->applications()->where('status', 'cancelled')->count(),
            'available_slots' => $training->available_slots,
            'enrollment_percentage' => $training->enrollment_percentage,
            'is_full' => $training->is_full,
        ];

        return response()->json($stats);
    }
    // Training Management endpoints
    public function index(Request $request): JsonResponse
    {
        $employeeId = $request->get('employee_id') ?: Auth::id();

        $query = TrainingManagement::query();

        // Apply filters
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('program_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('trainer', 'like', "%{$search}%")
                  ->orWhere('target_skills', 'like', "%{$search}%");
            });
        }

        if ($request->has('training_type') && !empty($request->training_type)) {
            $query->where('training_type', $request->training_type);
        }

        if ($request->has('required_role') && !empty($request->required_role)) {
            $query->where('required_role', $request->required_role);
        }

        if ($request->has('start_date_from') && !empty($request->start_date_from)) {
            $query->where('start_date', '>=', $request->start_date_from);
        }

        if ($request->has('start_date_to') && !empty($request->start_date_to)) {
            $query->where('start_date', '<=', $request->start_date_to);
        }

        // Show both global (employee_id is null) and user-specific trainings
        $query->where(function($q) use ($employeeId) {
            $q->whereNull('employee_id')
              ->orWhere('employee_id', $employeeId);
        });

        // Exclude inactive/deleted trainings from catalog
        $query->where('status', '!=', 'inactive');

        $trainings = $query->get();
        return response()->json($trainings);
    }

    // Get inactive/deleted trainings (HR Admin only)
    public function getInactiveTrainings(Request $request): JsonResponse
    {
        $trainings = TrainingManagement::where('status', 'inactive')
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json($trainings);
    }

    // Restore inactive training (HR Admin only)
    public function restoreTraining($id): JsonResponse
    {
        try {
            $training = TrainingManagement::where('id', $id)
                ->where('status', 'inactive')
                ->firstOrFail();
            
            $training->update([
                'status' => 'active',
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Training restored to catalog successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to restore training: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            // Debug logging
            Log::info('Training creation request received', [
                'request_data' => $request->all()
            ]);

            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'objectives' => 'nullable|string',
                'trainer' => 'nullable|string|max:255',
                'duration' => 'required|string|max:100',
                'topic' => 'nullable|string',
                'targetRole' => 'nullable|string',
                'prerequisites' => 'nullable|string',
                'startDate' => 'nullable|date',
                'endDate' => 'nullable|date|after_or_equal:startDate',
                'maxParticipants' => 'nullable|integer|min:1',
                'location' => 'nullable|string|max:255',
                'difficulty' => 'nullable|string',
                'format' => 'nullable|string',
            ]);

            // Basic data that must be present in original table
            $basicData = [
                'employee_id' => null, // Global training
                'program_name' => $request->title,
                'provider' => $request->trainer ?: 'Internal',
                'duration' => $request->duration,
                'target_skills' => $request->topic ?: 'General',
                'status' => 'Active',
                'feedback_score' => 0,
            ];

            // Additional data that was added via TMS migration
            $additionalData = [
                'description' => $request->description ?: null,
                'objectives' => $request->objectives ?: null,
                'trainer' => $request->trainer ?: null,
                'prerequisites' => $request->prerequisites ?: null,
                'start_date' => $request->startDate ? Carbon::parse($request->startDate)->format('Y-m-d H:i:s') : null,
                'end_date' => $request->endDate ? Carbon::parse($request->endDate)->format('Y-m-d H:i:s') : null,
                'max_participants' => (int)($request->maxParticipants ?: 0),
                'location' => $request->location ?: null,
                'training_type' => $this->normalizeTrainingType($request->format ?? 'online'),
                'enrolled_count' => 0,
                'difficulty' => $request->difficulty ?: 'Beginner',
                'format' => $request->format ?: 'Online',
                'topic' => $request->topic ?: null,
                'rating' => 0
            ];

            $trainingData = array_merge($basicData, $additionalData);

            Log::info('Training data to be created', ['training_data' => $trainingData]);

            $training = TrainingManagement::create($trainingData);

            return response()->json([
                'success' => true,
                'message' => 'Training created successfully',
                'data' => $training
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Database query failed', [
                'error' => $e->getMessage(),
                'sql' => $e->getSql() ?? 'No SQL available',
                'bindings' => $e->getBindings() ?? [],
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            Log::error('Failed to create training', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to create training: ' . $e->getMessage()
            ], 500);
        }
    }

    private function normalizeTrainingType($format): string
    {
        $format = strtolower($format);
        $typeMapping = [
            'online' => 'Online',
            'in-person' => 'In-Person',
            'hybrid' => 'Hybrid',
            'workshop' => 'In-Person',
            'seminar' => 'In-Person',
            'self-paced' => 'Self-paced'
        ];

        return $typeMapping[$format] ?? 'Online';
    }

    public function show($id): JsonResponse
    {
        try {
            $training = TrainingManagement::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $training
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Training not found'
            ], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'objectives' => 'nullable|string',
                'trainer' => 'nullable|string|max:255',
                'duration' => 'required|string|max:100',
                'topic' => 'nullable|string',
                'targetRole' => 'nullable|string',
                'prerequisites' => 'nullable|string',
                'startDate' => 'nullable|date',
                'endDate' => 'nullable|date|after_or_equal:startDate',
                'maxParticipants' => 'nullable|integer|min:1',
                'location' => 'nullable|string|max:255',
                'difficulty' => 'nullable|string',
                'format' => 'nullable|string',
            ]);

            $training = TrainingManagement::findOrFail($id);
            
            $training->update([
                'program_name' => $request->title,
                'provider' => $request->trainer ?? 'Internal',
                'description' => $request->description,
                'objectives' => $request->objectives,
                'trainer' => $request->trainer,
                'duration' => $request->duration,
                'target_skills' => $request->topic,
                'prerequisites' => $request->prerequisites,
                'start_date' => $request->startDate,
                'end_date' => $request->endDate,
                'max_participants' => $request->maxParticipants ?? 0,
                'location' => $request->location,
                'training_type' => $this->normalizeTrainingType($request->format ?? 'online'),
                'difficulty' => $request->difficulty ?? 'Beginner',
                'format' => $request->format ?? 'Online',
                'topic' => $request->topic,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Training updated successfully',
                'data' => $training,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update training', [
                'error' => $e->getMessage(),
                'training_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to update training: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $training = TrainingManagement::findOrFail($id);
            
            // Use database transaction to ensure data consistency
            DB::transaction(function () use ($id, $training) {
                // Instead of hard deleting, mark the training as inactive to preserve employee history
                // This allows employees to keep their training records while removing it from catalog
                
                $training->update([
                    'status' => 'inactive', // Mark as inactive instead of deleting
                    'updated_at' => now()
                ]);
                
                // Cancel any pending applications (preserve approved/completed for history)
                TrainingApplication::where('training_id', $id)
                    ->where('status', 'applied')
                    ->update([
                        'status' => 'cancelled',
                        'rejection_reason' => 'Training program discontinued',
                        'updated_at' => now()
                    ]);
                
                // Keep completed trainings, certificates, and feedback for employee records
                // These are important for compliance and employee development tracking
            });

            return response()->json([
                'success' => true,
                'message' => 'Training removed from catalog while preserving employee history'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to deactivate training', [
                'error' => $e->getMessage(),
                'training_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to remove training: ' . $e->getMessage()
            ], 500);
        }
    }
    // Succession Planning endpoints
    public function listSuccessionPlans()
    {
        $plans = SuccessionPlanning::all();
        return response()->json($plans);
    }
    public function listSuccessionCandidates()
    {
        $candidates = SuccessionPlanning::all();
        return response()->json($candidates);
    }
    // Feedback & Evaluation System Endpoints

    // Submit training feedback (Employee)
    public function submitFeedback(Request $request): JsonResponse
    {
        $request->validate([
            'training_application_id' => 'required|exists:training_applications,id',
            'overall_rating' => 'nullable|integer|min:1|max:5',
            'content_quality' => 'nullable|integer|min:1|max:5',
            'trainer_effectiveness' => 'nullable|integer|min:1|max:5',
            'material_usefulness' => 'nullable|integer|min:1|max:5',
            'facilities_rating' => 'nullable|integer|min:1|max:5',
            'strengths' => 'nullable|string|max:1000',
            'areas_for_improvement' => 'nullable|string|max:1000',
            'additional_comments' => 'nullable|string|max:1000',
            'would_recommend' => 'nullable|boolean',
            'skills_learned' => 'nullable|string|max:1000',
            'application_to_work' => 'nullable|string|max:1000',
        ]);

        $application = TrainingApplication::find($request->training_application_id);
        if (!$application) {
            return response()->json(['error' => 'Training application not found'], 404);
        }

        // Check if user can submit feedback for this application
        $user = Auth::user();
        if ($application->employee_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized to submit feedback for this application'], 403);
        }

        // Check if application is approved (feedback can only be submitted for completed trainings)
        if ($application->status !== 'approved') {
            return response()->json(['error' => 'Feedback can only be submitted for approved trainings'], 400);
        }

        $feedback = TrainingFeedback::updateOrCreate(
            [
                'training_application_id' => $request->training_application_id,
                'employee_id' => $user->id,
            ],
            [
                'training_id' => $application->training_id,
                'overall_rating' => $request->overall_rating,
                'content_quality' => $request->content_quality,
                'trainer_effectiveness' => $request->trainer_effectiveness,
                'material_usefulness' => $request->material_usefulness,
                'facilities_rating' => $request->facilities_rating,
                'strengths' => $request->strengths,
                'areas_for_improvement' => $request->areas_for_improvement,
                'additional_comments' => $request->additional_comments,
                'would_recommend' => $request->would_recommend,
                'skills_learned' => $request->skills_learned,
                'application_to_work' => $request->application_to_work,
                'submitted_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Feedback submitted successfully',
            'feedback' => $feedback->load(['training', 'employee'])
        ]);
    }

    // Get feedback for a training application
    public function getFeedback($applicationId): JsonResponse
    {
        $application = TrainingApplication::find($applicationId);
        if (!$application) {
            return response()->json(['error' => 'Training application not found'], 404);
        }

        $user = Auth::user();
        // Users can only view their own feedback, HR2 Admins can view all
        if ($application->employee_id !== $user->id &&
            (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
            return response()->json(['error' => 'Unauthorized to view this feedback'], 403);
        }

        $feedback = TrainingFeedback::where('training_application_id', $applicationId)
            ->with(['training', 'employee'])
            ->first();

        return response()->json($feedback);
    }

    // Get feedback for a specific employee
    public function getEmployeeFeedback(Request $request, $employeeId): JsonResponse
    {
        $feedback = TrainingFeedback::where('employee_id', $employeeId)
            ->with(['training', 'application'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($feedback);
    }

    // Submit trainer assessment (HR2 Admin)
    public function submitAssessment(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
            return response()->json(['error' => 'Unauthorized. HR2 Admin access required.'], 403);
        }

        $request->validate([
            'training_application_id' => 'required|exists:training_applications,id',
            'attendance_rating' => 'nullable|integer|min:1|max:5',
            'participation_rating' => 'nullable|integer|min:1|max:5',
            'understanding_rating' => 'nullable|integer|min:1|max:5',
            'application_rating' => 'nullable|integer|min:1|max:5',
            'overall_performance' => 'nullable|integer|min:1|max:5',
            'strengths_observed' => 'nullable|string|max:1000',
            'areas_needing_improvement' => 'nullable|string|max:1000',
            'development_recommendations' => 'nullable|string|max:1000',
            'trainer_comments' => 'nullable|string|max:1000',
            'assessment_date' => 'nullable|date',
            'due_date' => 'nullable|date|after:today',
        ]);

        $application = TrainingApplication::find($request->training_application_id);
        if (!$application) {
            return response()->json(['error' => 'Training application not found'], 404);
        }

        $assessment = TrainerAssessment::updateOrCreate(
            [
                'training_application_id' => $request->training_application_id,
                'assessor_id' => $user->id,
            ],
            [
                'employee_id' => $application->employee_id,
                'training_id' => $application->training_id,
                'attendance_rating' => $request->attendance_rating,
                'participation_rating' => $request->participation_rating,
                'understanding_rating' => $request->understanding_rating,
                'application_rating' => $request->application_rating,
                'overall_performance' => $request->overall_performance,
                'strengths_observed' => $request->strengths_observed,
                'areas_needing_improvement' => $request->areas_needing_improvement,
                'development_recommendations' => $request->development_recommendations,
                'trainer_comments' => $request->trainer_comments,
                'assessment_status' => 'completed',
                'assessment_date' => $request->assessment_date ?? now(),
                'due_date' => $request->due_date,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Assessment submitted successfully',
            'assessment' => $assessment->load(['training', 'employee', 'assessor'])
        ]);
    }

    // Get assessment for a training application
    public function getAssessment($applicationId): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
            return response()->json(['error' => 'Unauthorized. HR2 Admin access required.'], 403);
        }

        $assessment = TrainerAssessment::where('training_application_id', $applicationId)
            ->with(['training', 'employee', 'assessor'])
            ->first();

        return response()->json($assessment);
    }

    // Create performance note
    public function createPerformanceNote(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
            return response()->json(['error' => 'Unauthorized. HR2 Admin access required.'], 403);
        }

        $request->validate([
            'training_application_id' => 'required|exists:training_applications,id',
            'performance_before_training' => 'nullable|string|max:1000',
            'performance_after_training' => 'nullable|string|max:1000',
            'improvement_observed' => 'nullable|string|max:1000',
            'challenges_faced' => 'nullable|string|max:1000',
            'success_stories' => 'nullable|string|max:1000',
            'recommended_actions' => 'nullable|string|max:1000',
            'follow_up_date' => 'nullable|date|after:today',
            'additional_notes' => 'nullable|string|max:1000',
        ]);

        $application = TrainingApplication::find($request->training_application_id);
        if (!$application) {
            return response()->json(['error' => 'Training application not found'], 404);
        }

        $note = PerformanceNote::create([
            'training_application_id' => $request->training_application_id,
            'employee_id' => $application->employee_id,
            'training_id' => $application->training_id,
            'noted_by' => $user->id,
            'performance_before_training' => $request->performance_before_training,
            'performance_after_training' => $request->performance_after_training,
            'improvement_observed' => $request->improvement_observed,
            'challenges_faced' => $request->challenges_faced,
            'success_stories' => $request->success_stories,
            'recommended_actions' => $request->recommended_actions,
            'follow_up_date' => $request->follow_up_date,
            'additional_notes' => $request->additional_notes,
            'follow_up_status' => 'pending',
            'noted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Performance note created successfully',
            'note' => $note->load(['training', 'employee', 'notedBy'])
        ]);
    }

    // Get performance notes for a training application
    public function getPerformanceNotes($applicationId): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
            return response()->json(['error' => 'Unauthorized. HR2 Admin access required.'], 403);
        }

        $notes = PerformanceNote::where('training_application_id', $applicationId)
            ->with(['training', 'employee', 'notedBy'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notes);
    }

    // Get all feedback and assessments for a user (for dashboard)
    public function getUserFeedback(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:employee_self_service,id',
        ]);

        $user = Auth::user();
        // Users can only view their own feedback, HR2 Admins can view all
        if ($request->employee_id !== $user->id &&
            (!in_array($user->role, ['HR2 Admin', 'hr2_admin']) && $user->user_type !== 'HR2 Admin')) {
            return response()->json(['error' => 'Unauthorized to view this feedback'], 403);
        }

        $feedback = TrainingFeedback::where('employee_id', $request->employee_id)
            ->with(['training', 'trainingApplication'])
            ->get();

        $assessments = TrainerAssessment::where('employee_id', $request->employee_id)
            ->with(['training', 'trainingApplication', 'assessor'])
            ->get();

        $notes = PerformanceNote::where('employee_id', $request->employee_id)
            ->with(['training', 'trainingApplication', 'notedBy'])
            ->get();

        return response()->json([
            'feedback' => $feedback,
            'assessments' => $assessments,
            'performance_notes' => $notes,
        ]);
    }

    // ==================== CALENDAR SYSTEM ENDPOINTS ====================

    // Get all training sessions
    public function getTrainingSessions(Request $request): JsonResponse
    {
        $query = TrainingSession::with(['training', 'attendees.employee']);

        // Filter by date range if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('start_datetime', [$request->start_date, $request->end_date]);
        }

        // Filter by training ID if provided
        if ($request->has('training_id')) {
            $query->where('training_id', $request->training_id);
        }

        $sessions = $query->orderBy('start_datetime')->get();

        return response()->json($sessions);
    }

    // Create a new training session
    public function createTrainingSession(Request $request): JsonResponse
    {
        $request->validate([
            'training_id' => 'required|integer|min:1',
            'session_title' => 'required|string|max:255',
            'session_description' => 'nullable|string|max:1000',
            'start_datetime' => 'required',
            'end_datetime' => 'required',
            'location' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:255',
            'max_participants' => 'nullable|integer|min:1',
            'session_type' => 'nullable|in:training,assessment,follow_up,workshop',
            'trainer_id' => 'nullable|integer|min:1',
            'materials' => 'nullable|json',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Manual validation for training existence
        $training = \App\Models\TrainingManagement::find($request->training_id);
        if (!$training) {
            Log::error('Training not found for session creation', ['training_id' => $request->training_id]);
            return response()->json([
                'message' => 'The selected training course does not exist.',
                'errors' => ['training_id' => ['The selected training course does not exist.']]
            ], 422);
        }

        // Debug logging
        Log::info('Creating training session', [
            'request_data' => $request->all(),
            'trainer_id' => $request->trainer_id,
            'training_id' => $request->training_id,
            'start_datetime' => $request->start_datetime,
            'end_datetime' => $request->end_datetime,
            'start_datetime_type' => gettype($request->start_datetime),
            'end_datetime_type' => gettype($request->end_datetime),
            'all_request_data' => $request->all()
        ]);

        // Check if training exists
        $trainingExists = \App\Models\TrainingManagement::find($request->training_id);
        Log::info('Training exists check', [
            'training_id' => $request->training_id,
            'exists' => $trainingExists ? 'YES' : 'NO',
            'training_data' => $trainingExists ? $trainingExists->toArray() : null
        ]);

        if (!$trainingExists) {
            Log::error('Training not found', ['training_id' => $request->training_id]);
            return response()->json(['error' => 'Training course not found'], 404);
        }

        $session = TrainingSession::create([
            'training_id' => $request->training_id,
            'session_title' => $request->session_title,
            'session_description' => $request->session_description,
            'start_datetime' => $request->start_datetime,
            'end_datetime' => $request->end_datetime,
            'location' => $request->location,
            'room' => $request->room,
            'max_participants' => $request->max_participants ?? 0,
            'current_participants' => 0,
            'session_type' => $request->session_type ?? 'training',
            'status' => 'scheduled',
            'trainer_id' => $request->trainer_id,
            'materials' => $request->materials,
            'notes' => $request->notes,
        ]);

        return response()->json(['success' => true, 'session' => $session->load('training')]);
    }

    // Update training session
    public function updateTrainingSession(Request $request, $id): JsonResponse
    {
        $session = TrainingSession::find($id);
        if (!$session) {
            return response()->json(['error' => 'Training session not found'], 404);
        }

        $request->validate([
            'session_title' => 'sometimes|string|max:255',
            'session_description' => 'nullable|string|max:1000',
            'start_datetime' => 'sometimes|date',
            'end_datetime' => 'sometimes|date',
            'location' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:255',
            'max_participants' => 'nullable|integer|min:1',
            'session_type' => 'nullable|in:training,assessment,follow_up,workshop',
            'status' => 'sometimes|in:scheduled,in_progress,completed,cancelled',
            'trainer_id' => 'nullable|exists:employee_self_service,id',
            'materials' => 'nullable|json',
            'notes' => 'nullable|string|max:1000',
        ]);

        $session->update($request->only([
            'session_title', 'session_description', 'start_datetime', 'end_datetime', 'location',
            'room', 'max_participants', 'session_type', 'status', 'trainer_id', 'materials', 'notes'
        ]));

        return response()->json(['success' => true, 'session' => $session->load('training')]);
    }

    // Get employee schedules
    public function getEmployeeSchedules(Request $request): JsonResponse
    {
        $query = EmployeeSchedule::with('employee');

        // Filter by employee ID if provided
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by date range if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('shift_date', [$request->start_date, $request->end_date]);
        }

        $schedules = $query->orderBy('shift_date')->orderBy('start_time')->get();

        return response()->json($schedules);
    }

    // Create or update employee schedule
    public function manageEmployeeSchedule(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:employee_self_service,id',
            'shift_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'shift_type' => 'required|string|max:100',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        $schedule = EmployeeSchedule::updateOrCreate(
            [
                'employee_id' => $request->employee_id,
                'shift_date' => $request->shift_date,
            ],
            [
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'shift_type' => $request->shift_type,
                'location' => $request->location,
                'notes' => $request->notes,
            ]
        );

        return response()->json(['success' => true, 'schedule' => $schedule->load('employee')]);
    }

    // Get calendar events with conflict detection
    public function getCalendarEvents(Request $request): JsonResponse
    {
        $query = TrainingCalendarEvent::with(['session.training', 'employee']);

        // Filter by employee ID if provided
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by date range if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('event_date', [$request->start_date, $request->end_date]);
        }

        $events = $query->orderBy('event_date')->get();

        return response()->json($events);
    }

    // Register employee for training session
    public function registerForSession(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|exists:training_sessions,id',
            'employee_id' => 'required|exists:employee_self_service,id',
            'application_id' => 'required|exists:training_applications,id',
        ]);

        $session = TrainingSession::find($request->session_id);

        // Check if session is full
        if ($session->attendees()->count() >= $session->max_attendees) {
            return response()->json(['error' => 'Session is full'], 400);
        }

        // Check if employee is already registered
        $existingAttendee = TrainingSessionAttendee::where('session_id', $request->session_id)
            ->where('employee_id', $request->employee_id)
            ->first();

        if ($existingAttendee) {
            return response()->json(['error' => 'Already registered for this session'], 400);
        }

        $attendee = TrainingSessionAttendee::create([
            'session_id' => $request->session_id,
            'employee_id' => $request->employee_id,
            'application_id' => $request->application_id,
            'attendance_status' => 'registered',
        ]);

        // Create calendar event
        TrainingCalendarEvent::create([
            'session_id' => $request->session_id,
            'employee_id' => $request->employee_id,
            'event_type' => 'training_session',
            'event_date' => $session->session_date,
            'title' => $session->training->training_name,
            'description' => "Training session at {$session->location}",
            'is_conflict' => false, // Will be checked by frontend
        ]);

        return response()->json(['success' => true, 'attendee' => $attendee->load(['session.training', 'employee'])]);
    }

    // Update attendance status
    public function updateAttendance(Request $request, $attendeeId): JsonResponse
    {
        $attendee = TrainingSessionAttendee::find($attendeeId);
        if (!$attendee) {
            return response()->json(['error' => 'Attendee not found'], 404);
        }

        $request->validate([
            'attendance_status' => 'required|in:registered,present,absent,late',
            'check_in_time' => 'nullable|date',
            'check_out_time' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $attendee->update($request->only([
            'attendance_status', 'check_in_time', 'check_out_time', 'notes'
        ]));

        return response()->json(['success' => true, 'attendee' => $attendee]);
    }

    // Get employee's training calendar
    public function getEmployeeCalendar(Request $request, $employeeId): JsonResponse
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        // Get training sessions for this employee
        $trainingSessions = TrainingSessionAttendee::where('employee_id', $employeeId)
            ->whereHas('session', function($query) use ($startDate, $endDate) {
                $query->whereBetween('session_date', [$startDate, $endDate]);
            })
            ->with(['session.training'])
            ->get();

        // Get employee schedules
        $employeeSchedules = EmployeeSchedule::where('employee_id', $employeeId)
            ->whereBetween('shift_date', [$startDate, $endDate])
            ->get();

        // Get calendar events
        $calendarEvents = TrainingCalendarEvent::where('employee_id', $employeeId)
            ->whereBetween('event_date', [$startDate, $endDate])
            ->with(['session.training'])
            ->get();

        return response()->json([
            'training_sessions' => $trainingSessions,
            'employee_schedules' => $employeeSchedules,
            'calendar_events' => $calendarEvents,
        ]);
    }

    // Get attendees for a specific training session
    public function getSessionAttendees(Request $request, $sessionId): JsonResponse
    {
        $attendees = TrainingSessionAttendee::where('session_id', $sessionId)
            ->with(['employee', 'application'])
            ->get();

        return response()->json($attendees);
    }

    // Create a new calendar event
    public function createCalendarEvent(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'nullable|exists:training_sessions,id',
            'employee_id' => 'required|exists:employee_self_service,id',
            'event_type' => 'required|in:training_session,meeting,deadline,reminder,general',
            'event_date' => 'required|date',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_conflict' => 'boolean',
            'conflict_reason' => 'nullable|string|max:500',
        ]);

        $event = TrainingCalendarEvent::create($request->all());

        return response()->json([
            'success' => true,
            'event' => $event->load(['session.training', 'employee'])
        ], 201);
    }

    // Update a calendar event
    public function updateCalendarEvent(Request $request, $eventId): JsonResponse
    {
        $event = TrainingCalendarEvent::find($eventId);
        if (!$event) {
            return response()->json(['error' => 'Calendar event not found'], 404);
        }

        $request->validate([
            'session_id' => 'nullable|exists:training_sessions,id',
            'employee_id' => 'nullable|exists:employee_self_service,id',
            'event_type' => 'nullable|in:training_session,meeting,deadline,reminder,general',
            'event_date' => 'nullable|date',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_conflict' => 'boolean',
            'conflict_reason' => 'nullable|string|max:500',
        ]);

        $event->update($request->all());

        return response()->json([
            'success' => true,
            'event' => $event->load(['session.training', 'employee'])
        ]);
    }

    // Delete a calendar event
    public function deleteCalendarEvent(Request $request, $eventId): JsonResponse
    {
        $event = TrainingCalendarEvent::find($eventId);
        if (!$event) {
            return response()->json(['error' => 'Calendar event not found'], 404);
        }

        $event->delete();

        return response()->json(['success' => true, 'message' => 'Calendar event deleted successfully']);
    }

    // ==================== TRAINING STATUS & HISTORY ENDPOINTS ====================

    // Get all training completions
    public function getTrainingCompletions(Request $request): JsonResponse
    {
        $query = TrainingCompletion::with(['employee', 'training', 'application', 'certificates']);

        // Filter by employee ID if provided
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by training ID if provided
        if ($request->has('training_id')) {
            $query->where('training_id', $request->training_id);
        }

        // Filter by date range if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('completion_date', [$request->start_date, $request->end_date]);
        }

        $completions = $query->orderBy('completion_date', 'desc')->get();

        return response()->json($completions);
    }

    // Create training completion
    public function createTrainingCompletion(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|integer',
            'training_id' => 'nullable|integer',
            'application_id' => 'nullable|integer',
            'completion_date' => 'required|date',
            'score_percentage' => 'nullable|numeric|min:0|max:100',
            'grade' => 'nullable|string|in:A,B,C,D,F',
            'completion_notes' => 'nullable|string|max:1000',
            'competencies_gained' => 'nullable|array',
        ]);

        // If application_id is provided, get training_id from the application
        $trainingId = $request->training_id;
        if ($request->application_id && !$trainingId) {
            $application = TrainingApplication::find($request->application_id);
            if ($application) {
                $trainingId = $application->training_id;
            }
        }

        $completionData = $request->all();
        $completionData['training_id'] = $trainingId;

        $completion = TrainingCompletion::create($completionData);

        // Update the training application status to completed
        if ($request->application_id) {
            $application = TrainingApplication::find($request->application_id);
            if ($application) {
                $application->update(['status' => 'completed']);
            }
        }

        // Auto-create competencies if provided
        // Note: EmployeeCompetency model/table doesn't exist yet
        // if ($request->has('competencies_gained') && is_array($request->competencies_gained)) {
        //     foreach ($request->competencies_gained as $competency) {
        //         EmployeeCompetency::create([
        //             'employee_id' => $request->employee_id,
        //             'competency_name' => $competency['name'] ?? $competency,
        //             'competency_category' => $competency['category'] ?? 'technical',
        //             'proficiency_level' => $competency['level'] ?? 'intermediate',
        //             'proficiency_score' => $competency['score'] ?? null,
        //             'description' => $competency['description'] ?? null,
        //             'acquired_from_completion_id' => $completion->id,
        //             'acquired_date' => $request->completion_date,
        //             'last_updated' => $request->completion_date,
        //             'is_active' => true,
        //         ]);
        //     }
        // }

        return response()->json([
            'success' => true,
            'completion' => $completion->load(['employee', 'training', 'certificates'])
        ], 201);
    }

    // Update training completion
    public function updateTrainingCompletion(Request $request, $id): JsonResponse
    {
        $completion = TrainingCompletion::find($id);
        if (!$completion) {
            return response()->json(['error' => 'Training completion not found'], 404);
        }

        $request->validate([
            'completion_date' => 'sometimes|date',
            'score_percentage' => 'nullable|numeric|min:0|max:100',
            'grade' => 'nullable|in:A,B,C,D,F',
            'completion_notes' => 'nullable|string|max:1000',
            'certificate_issued' => 'sometimes|boolean',
            'competencies_gained' => 'nullable|array',
        ]);

        $completion->update($request->all());

        return response()->json([
            'success' => true,
            'completion' => $completion->load(['employee', 'training', 'certificates'])
        ]);
    }

    // Delete training completion
    public function deleteTrainingCompletion(Request $request, $id): JsonResponse
    {
        $completion = TrainingCompletion::find($id);
        if (!$completion) {
            return response()->json(['error' => 'Training completion not found'], 404);
        }

        $completion->delete();

        return response()->json(['success' => true, 'message' => 'Training completion deleted successfully']);
    }

    // Get completions for a specific employee
    public function getEmployeeCompletions(Request $request, $employeeId): JsonResponse
    {
        $completions = TrainingCompletion::where('employee_id', $employeeId)
            ->with(['training', 'application', 'certificates'])
            ->orderBy('completion_date', 'desc')
            ->get();

        return response()->json($completions);
    }

    // Issue certificate for training completion
    public function issueCertificate(Request $request, $completionId): JsonResponse
    {
        $completion = TrainingCompletion::find($completionId);
        if (!$completion) {
            return response()->json(['error' => 'Training completion not found'], 404);
        }

        $request->validate([
            'certificate_type' => 'required|in:certificate,badge,achievement',
            'certificate_title' => 'required|string|max:255',
            'certificate_description' => 'nullable|string|max:1000',
            'issued_by' => 'required|string|max:255',
            'issue_date' => 'required|date',
            'expiry_date' => 'nullable|date|after:issue_date',
            'file_path' => 'nullable|string',
            'file_name' => 'nullable|string',
            'file_mime_type' => 'nullable|string',
            'file_size' => 'nullable|integer',
        ]);

        $certificate = TrainingCertificate::create([
            'completion_id' => $completionId,
            'certificate_number' => 'CERT-' . $completionId . '-' . time(),
            'certificate_type' => $request->certificate_type,
            'certificate_title' => $request->certificate_title,
            'certificate_description' => $request->certificate_description,
            'issued_by' => $request->issued_by,
            'issue_date' => $request->issue_date,
            'expiry_date' => $request->expiry_date,
            'file_path' => $request->file_path,
            'file_name' => $request->file_name,
            'file_mime_type' => $request->file_mime_type,
            'file_size' => $request->file_size,
            'is_downloadable' => true,
        ]);

        // Update completion to mark certificate as issued
        $completion->update(['certificate_issued' => true]);

        return response()->json([
            'success' => true,
            'certificate' => $certificate->load('completion')
        ], 201);
    }

    // Get all certificates
    public function getCertificates(Request $request): JsonResponse
    {
        $query = TrainingCertificate::with(['completion.employee', 'completion.training']);

        // Filter by employee ID if provided
        if ($request->has('employee_id')) {
            $query->whereHas('completion', function($q) use ($request) {
                $q->where('employee_id', $request->employee_id);
            });
        }

        // Filter by certificate type if provided
        if ($request->has('certificate_type')) {
            $query->where('certificate_type', $request->certificate_type);
        }

        $certificates = $query->orderBy('issue_date', 'desc')->get();

        return response()->json($certificates);
    }

    // Download certificate
    public function downloadCertificate(Request $request, $certificateId): JsonResponse
    {
        $certificate = TrainingCertificate::find($certificateId);
        if (!$certificate) {
            return response()->json(['error' => 'Certificate not found'], 404);
        }

        if (!$certificate->is_downloadable || !$certificate->file_path) {
            return response()->json(['error' => 'Certificate is not available for download'], 400);
        }

        return response()->json([
            'download_url' => $certificate->file_url,
            'file_name' => $certificate->file_name,
            'file_size' => $certificate->file_size,
            'formatted_size' => $certificate->formatted_file_size,
        ]);
    }

    // Delete certificate
    public function deleteCertificate(Request $request, $certificateId): JsonResponse
    {
        $certificate = TrainingCertificate::find($certificateId);
        if (!$certificate) {
            return response()->json(['error' => 'Certificate not found'], 404);
        }

        // Delete file if exists
        if ($certificate->file_path && file_exists(storage_path('app/public/' . $certificate->file_path))) {
            unlink(storage_path('app/public/' . $certificate->file_path));
        }

        $certificate->delete();

        return response()->json(['success' => true, 'message' => 'Certificate deleted successfully']);
    }

    // Get all employee competencies
    public function getEmployeeCompetencies(Request $request): JsonResponse
    {
        $query = EmployeeCompetency::with(['employee', 'trainingCompletion']);

        // Filter by employee ID if provided
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by category if provided
        if ($request->has('category')) {
            $query->where('competency_category', $request->category);
        }

        // Filter by proficiency level if provided
        if ($request->has('proficiency_level')) {
            $query->where('proficiency_level', $request->proficiency_level);
        }

        // Only active competencies by default
        if (!$request->has('include_inactive') || !$request->include_inactive) {
            $query->where('is_active', true);
        }

        $competencies = $query->orderBy('last_updated', 'desc')->get();

        return response()->json($competencies);
    }

    // Create employee competency
    public function createEmployeeCompetency(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:employee_self_service,id',
            'competency_name' => 'required|string|max:255',
            'competency_category' => 'required|string|max:100',
            'proficiency_level' => 'required|in:beginner,intermediate,advanced,expert',
            'proficiency_score' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string|max:1000',
            'acquired_from_completion_id' => 'nullable|exists:training_completions,id',
            'acquired_date' => 'required|date',
        ]);

        $competency = EmployeeCompetency::create([
            'employee_id' => $request->employee_id,
            'competency_name' => $request->competency_name,
            'competency_category' => $request->competency_category,
            'proficiency_level' => $request->proficiency_level,
            'proficiency_score' => $request->proficiency_score,
            'description' => $request->description,
            'acquired_from_completion_id' => $request->acquired_from_completion_id,
            'acquired_date' => $request->acquired_date,
            'last_updated' => $request->acquired_date,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'competency' => $competency->load(['employee', 'trainingCompletion'])
        ], 201);
    }

    // Update employee competency
    public function updateEmployeeCompetency(Request $request, $id): JsonResponse
    {
        $competency = EmployeeCompetency::find($id);
        if (!$competency) {
            return response()->json(['error' => 'Employee competency not found'], 404);
        }

        $request->validate([
            'competency_name' => 'sometimes|string|max:255',
            'competency_category' => 'sometimes|string|max:100',
            'proficiency_level' => 'sometimes|in:beginner,intermediate,advanced,expert',
            'proficiency_score' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

        $competency->update($request->all());
        $competency->update(['last_updated' => now()]);

        return response()->json([
            'success' => true,
            'competency' => $competency->load(['employee', 'trainingCompletion'])
        ]);
    }

    // Delete employee competency
    public function deleteEmployeeCompetency(Request $request, $id): JsonResponse
    {
        $competency = EmployeeCompetency::find($id);
        if (!$competency) {
            return response()->json(['error' => 'Employee competency not found'], 404);
        }

        $competency->delete();

        return response()->json(['success' => true, 'message' => 'Employee competency deleted successfully']);
    }

    // Get competencies for a specific employee
    public function getEmployeeCompetenciesByEmployee(Request $request, $employeeId): JsonResponse
    {
        $competencies = EmployeeCompetency::where('employee_id', $employeeId)
            ->with(['trainingCompletion'])
            ->where('is_active', true)
            ->orderBy('last_updated', 'desc')
            ->get();

        return response()->json($competencies);
    }
}
