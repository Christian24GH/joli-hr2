<?php

namespace App\Http\Controllers;

use App\Models\SuccessionPlanning;
use App\Models\EmployeeSelfService;
use App\Models\LearningManagement;
use App\Models\TrainingManagement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SPController extends Controller
{
    // ===========================================
    // TALENT POOL MANAGEMENT
    // ===========================================

    public function getTalentPool(Request $request): JsonResponse
    {
        try {
            $query = SuccessionPlanning::with(['employee']);

            // Apply filters if provided
            if ($request->has('role_id')) {
                $query->where('role_id', $request->role_id);
            }

            $talentPool = $query->get()->map(function ($item) {
                $employee = $item->employee;
                return [
                    'id' => $item->id,
                    'name' => $employee ? $employee->first_name . ' ' . $employee->last_name : 'Unknown',
                    'currentRole' => $employee ? $employee->position : 'Unknown',
                    'department' => $employee ? $employee->department : 'Unknown',
                    'readinessLevel' => $item->readiness_level,
                    'readinessScore' => $this->calculateReadinessScore($item->readiness_level),
                    'potentialRoles' => $this->getPotentialRoles($item->role_id),
                    'leadershipScore' => rand(60, 95), // Mock score - could be calculated from assessments
                    'performanceRating' => $this->getPerformanceRating(),
                    'profilePhoto' => $employee ? $employee->profile_photo_url : 'https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000',
                    'riskLevel' => $this->calculateRiskLevel($item->readiness_level),
                    'lastAssessment' => now()->format('Y-m-d'),
                    'keyStrengths' => $this->getKeyStrengths(),
                    'developmentAreas' => $this->getDevelopmentAreas($item->development_plan),
                ];
            });

            return response()->json($talentPool);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch talent pool'], 500);
        }
    }

    public function createTalentPoolEntry(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'role_id' => 'required|integer',
                'employee_id' => 'required|integer',
                'readiness_level' => 'required|string',
                'development_plan' => 'nullable|string',
                'timeline_for_readiness' => 'nullable|string',
            ]);

            $entry = SuccessionPlanning::create($data);
            return response()->json($entry, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create talent pool entry'], 500);
        }
    }

    public function updateTalentPoolEntry(Request $request, $id): JsonResponse
    {
        try {
            $entry = SuccessionPlanning::findOrFail($id);
            $entry->update($request->all());
            return response()->json($entry);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update talent pool entry'], 500);
        }
    }

    public function deleteTalentPoolEntry($id): JsonResponse
    {
        try {
            $entry = SuccessionPlanning::findOrFail($id);
            $entry->delete();
            return response()->json(['message' => 'Talent pool entry deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete talent pool entry'], 500);
        }
    }

    // ===========================================
    // LEADERSHIP PIPELINE MANAGEMENT
    // ===========================================

    public function getLeadershipPipeline(Request $request): JsonResponse
    {
        try {
            // For now, create mock leadership pipeline data
            // In a real implementation, this would come from a dedicated table
            $pipeline = [
                [
                    'id' => 1,
                    'position' => 'Chief Executive Officer',
                    'currentHolder' => 'Robert Wilson',
                    'level' => 'C-Suite',
                    'successors' => $this->getSuccessorsForPosition(1),
                    'criticalityScore' => 100,
                    'vacancyRisk' => 'Low'
                ],
                [
                    'id' => 2,
                    'position' => 'VP of Technology',
                    'currentHolder' => 'Jennifer Lee',
                    'level' => 'Executive',
                    'successors' => $this->getSuccessorsForPosition(2),
                    'criticalityScore' => 90,
                    'vacancyRisk' => 'Medium'
                ],
                [
                    'id' => 3,
                    'position' => 'Director of Marketing',
                    'currentHolder' => 'VACANT',
                    'level' => 'Director',
                    'successors' => $this->getSuccessorsForPosition(3),
                    'criticalityScore' => 85,
                    'vacancyRisk' => 'High'
                ]
            ];

            return response()->json($pipeline);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch leadership pipeline'], 500);
        }
    }

    public function createLeadershipPipelineEntry(Request $request): JsonResponse
    {
        // Implementation for creating leadership pipeline entries
        return response()->json(['message' => 'Leadership pipeline creation not implemented yet'], 501);
    }

    public function updateLeadershipPipelineEntry(Request $request, $id): JsonResponse
    {
        // Implementation for updating leadership pipeline entries
        return response()->json(['message' => 'Leadership pipeline update not implemented yet'], 501);
    }

    public function deleteLeadershipPipelineEntry($id): JsonResponse
    {
        // Implementation for deleting leadership pipeline entries
        return response()->json(['message' => 'Leadership pipeline deletion not implemented yet'], 501);
    }

    // ===========================================
    // DEVELOPMENT PLANS MANAGEMENT
    // ===========================================

    public function getDevelopmentPlans(Request $request): JsonResponse
    {
        try {
            $query = LearningManagement::with(['employee']);

            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }

            $plans = $query->get()->map(function ($plan) {
                $employee = $plan->employee;
                return [
                    'id' => $plan->id,
                    'employeeId' => $plan->employee_id,
                    'employeeName' => $employee ? $employee->first_name . ' ' . $employee->last_name : 'Unknown',
                    'targetRole' => $this->getTargetRole($plan->title),
                    'planType' => $this->getPlanType($plan->title),
                    'status' => $plan->status,
                    'startDate' => $plan->created_at->format('Y-m-d'),
                    'expectedCompletion' => $plan->due_date,
                    'progress' => $plan->progress,
                    'activities' => $this->getPlanActivities($plan->id),
                    'mentor' => 'Mentor Name', // Could be from a mentor field
                    'competencyGaps' => $this->getCompetencyGaps($plan->title),
                ];
            });

            return response()->json($plans);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch development plans'], 500);
        }
    }

    public function createDevelopmentPlan(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'employee_id' => 'required|integer',
                'title' => 'required|string',
                'description' => 'nullable|string',
                'status' => 'nullable|string',
                'progress' => 'nullable|integer',
                'due_date' => 'nullable|date',
            ]);

            $plan = LearningManagement::create($data);
            return response()->json($plan, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create development plan'], 500);
        }
    }

    public function updateDevelopmentPlan(Request $request, $id): JsonResponse
    {
        try {
            $plan = LearningManagement::findOrFail($id);
            $plan->update($request->all());
            return response()->json($plan);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update development plan'], 500);
        }
    }

    public function deleteDevelopmentPlan($id): JsonResponse
    {
        try {
            $plan = LearningManagement::findOrFail($id);
            $plan->delete();
            return response()->json(['message' => 'Development plan deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete development plan'], 500);
        }
    }

    // ===========================================
    // SUCCESSION ANALYTICS
    // ===========================================

    public function getSuccessionAnalytics(): JsonResponse
    {
        try {
            $successionData = SuccessionPlanning::all();
            $totalTalentPool = $successionData->count();

            $readinessCounts = $successionData->groupBy('readiness_level');
            $readyNow = $readinessCounts->get('Ready Now', collect())->count();
            $readyIn1to2Years = $readinessCounts->get('1-2 years', collect())->count();
            $readyIn3PlusYears = $readinessCounts->get('3+ years', collect())->count();

            $analytics = [
                'totalTalentPool' => $totalTalentPool,
                'readyNow' => $readyNow,
                'readyIn1to2Years' => $readyIn1to2Years,
                'readyIn3PlusYears' => $readyIn3PlusYears,
                'criticalRolesCovered' => 75, // Mock value
                'averageReadinessScore' => 73, // Mock value
                'highRiskPositions' => 2, // Mock value
                'turnoverRisk' => [
                    'low' => 8,
                    'medium' => 3,
                    'high' => 1
                ]
            ];

            return response()->json($analytics);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch succession analytics'], 500);
        }
    }

    public function getReadinessDistribution(): JsonResponse
    {
        // Implementation for readiness distribution
        return response()->json(['message' => 'Readiness distribution not implemented yet'], 501);
    }

    public function getPipelineGaps(): JsonResponse
    {
        // Implementation for pipeline gaps
        return response()->json(['message' => 'Pipeline gaps not implemented yet'], 501);
    }

    // ===========================================
    // HELPER METHODS
    // ===========================================

    private function calculateReadinessScore($level): int
    {
        switch ($level) {
            case 'Ready Now': return rand(85, 100);
            case '1-2 years': return rand(70, 84);
            case '3+ years': return rand(50, 69);
            default: return 50;
        }
    }

    private function getPotentialRoles($roleId): array
    {
        $roles = [
            1 => ['Director of Operations', 'VP Operations'],
            2 => ['IT Manager', 'Tech Director'],
            3 => ['Marketing Manager', 'Brand Director'],
        ];
        return $roles[$roleId] ?? ['Senior Manager', 'Director'];
    }

    private function getPerformanceRating(): string
    {
        $ratings = ['Outstanding', 'Exceeds Expectations', 'Meets Expectations'];
        return $ratings[array_rand($ratings)];
    }

    private function calculateRiskLevel($readinessLevel): string
    {
        switch ($readinessLevel) {
            case 'Ready Now': return 'Low';
            case '1-2 years': return 'Medium';
            case '3+ years': return 'High';
            default: return 'Medium';
        }
    }

    private function getKeyStrengths(): array
    {
        $strengths = [
            ['Strategic Thinking', 'Team Leadership', 'Change Management'],
            ['Technical Excellence', 'Innovation', 'Problem Solving'],
            ['Creativity', 'Market Analysis', 'Campaign Management'],
        ];
        return $strengths[array_rand($strengths)];
    }

    private function getDevelopmentAreas($developmentPlan): array
    {
        if (str_contains($developmentPlan, 'Executive')) {
            return ['Financial Acumen', 'Digital Transformation'];
        } elseif (str_contains($developmentPlan, 'Technical')) {
            return ['People Management', 'Communication'];
        } else {
            return ['Leadership Skills', 'Strategic Planning'];
        }
    }

    private function getSuccessorsForPosition($positionId): array
    {
        $successors = [
            1 => [
                ['name' => 'Sarah Johnson', 'readiness' => 'Ready Now', 'probability' => 85],
                ['name' => 'David Kim', 'readiness' => '1-2 years', 'probability' => 70]
            ],
            2 => [
                ['name' => 'Michael Chen', 'readiness' => '1-2 years', 'probability' => 80],
                ['name' => 'Alex Thompson', 'readiness' => '2-3 years', 'probability' => 65]
            ],
            3 => [
                ['name' => 'Emily Rodriguez', 'readiness' => '3+ years', 'probability' => 60],
                ['name' => 'Mark Stevens', 'readiness' => 'Ready Now', 'probability' => 75]
            ]
        ];
        return $successors[$positionId] ?? [];
    }

    private function getTargetRole($title): string
    {
        if (str_contains($title, 'Executive')) {
            return 'Chief Executive Officer';
        } elseif (str_contains($title, 'Technical')) {
            return 'VP of Technology';
        } else {
            return 'Director Level';
        }
    }

    private function getPlanType($title): string
    {
        if (str_contains($title, 'Executive')) {
            return 'Executive Leadership Track';
        } elseif (str_contains($title, 'Technical')) {
            return 'Technical Leadership Track';
        } else {
            return 'General Development Plan';
        }
    }

    private function getPlanActivities($planId): array
    {
        // Mock activities - in real implementation, this would come from a related table
        return [
            ['type' => 'Training', 'title' => 'Strategic Leadership Program', 'status' => 'Completed', 'dueDate' => '2025-03-15'],
            ['type' => 'Coaching', 'title' => 'Executive Coaching Sessions', 'status' => 'In Progress', 'dueDate' => '2025-10-01'],
            ['type' => 'Project', 'title' => 'Cross-Functional Initiative Lead', 'status' => 'In Progress', 'dueDate' => '2025-11-30'],
        ];
    }

    private function getCompetencyGaps($title): array
    {
        if (str_contains($title, 'Executive')) {
            return ['Financial Strategy', 'Board Relations'];
        } elseif (str_contains($title, 'Technical')) {
            return ['Team Leadership', 'Budget Management'];
        } else {
            return ['Communication', 'Project Management'];
        }
    }

    // Legacy methods for backward compatibility
    public function index(): JsonResponse
    {
        return $this->getTalentPool(request());
    }

    public function candidates(): JsonResponse
    {
        return $this->getTalentPool(request());
    }
}
