<?php

namespace App\Http\Controllers;

use App\Models\LearningManagement;
use App\Models\CompetencyManagement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class LMController extends Controller
{
    // Learning Management endpoints
    public function index(Request $request): JsonResponse
    {
        $employeeId = $request->query('employee_id');
        $query = LearningManagement::query();
        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }
        $courses = $query->get();
        return response()->json($courses);
    }
    public function store(Request $request)
    {
        // Debug: Log request data
        Log::info('LMController store request data:', ['data' => $request->all()]);
        Log::info('LMController store files:', ['files' => $request->allFiles()]);
        Log::info('LMController store has file:', ['has_file' => $request->hasFile('file')]);
        
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'file' => 'required|file|mimes:pdf,mp4,ppt,pptx,doc,docx,zip,rar,avi,mov,wmv,mkv,webm,jpg,jpeg,png',
            'due_date' => 'nullable|date',
        ]);
        $user = $request->user();
        Log::info('LMController authenticated user:', ['user' => $user]);
        
        // Temporary: If no user found, try to get user info from token payload
        if (!$user) {
            $token = $request->bearerToken();
            Log::info('LMController bearer token:', ['token' => $token]);
            if ($token) {
                // For now, create a dummy user for testing
                $user = (object) ['id' => 1, 'employee_id' => 1, 'name' => 'Test User'];
                Log::info('LMController using dummy user for testing', ['token_present' => true]);
            }
        }
        
        $employeeId = $user ? ($user->employee_id ?? $user->id) : null;
        Log::info('LMController employeeId:', ['employee_id' => $employeeId]);
        if (!$employeeId) {
            return response()->json(['message' => 'Not authenticated'], 401);
        }
        $file = $request->file('file');
        Log::info('LMController file object:', ['file' => $file]);
        if (!$file) {
            Log::error('LMController: No file received');
            return response()->json(['message' => 'File is required'], 422);
        }
        $path = $file->store('elearning', 'public');
        $course = new LearningManagement();
        $course->employee_id = $employeeId;
        $course->title = $request->input('title');
        $course->description = $request->input('description');
        $course->status = 'todo';
        $course->progress = 0;
        $course->due_date = $request->input('due_date') ?: Carbon::now()->addDays(30);
        $course->file_path = $path;
        if ($request->has('quiz')) {
            $quiz = $request->input('quiz');
            if (is_string($quiz)) {
                $quiz = json_decode($quiz, true);
            }
            $course->quiz = $quiz;
        }
        $course->save();
        return response()->json($course, 201);
    }
    public function update(Request $request, $id)
    {
        $course = LearningManagement::findOrFail($id);
        $course->title = $request->input('title', $course->title);
        $course->description = $request->input('description', $course->description);
        if ($request->has('due_date')) {
            $course->due_date = $request->input('due_date');
        }
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('elearning', 'public');
            $course->file_path = $path;
        }
        if ($request->has('quiz')) {
            $quiz = $request->input('quiz');
            if (is_string($quiz)) {
                $quiz = json_decode($quiz, true);
            }
            $course->quiz = $quiz;
        }
        $course->save();
        return response()->json($course);
    }
    public function destroy($id)
    {
        $course = LearningManagement::findOrFail($id);
        $course->delete();
        return response()->json(['message' => 'Course deleted']);
    }
    public function getQuiz($courseId)
    {
        $course = LearningManagement::findOrFail($courseId);
        return response()->json($course->quiz ?? []);
    }
    public function saveQuizResult(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|integer|exists:employee_self_service,id',
            'course_id' => 'required|integer|exists:learning_management,id',
            'quiz_answers' => 'required|array',
            'quiz_score' => 'required|integer',
        ]);
        $course = LearningManagement::where('id', $request->course_id)
            ->where('employee_id', $request->employee_id)
            ->first();
        if ($course) {
            $course->status = 'done';
            $course->completion_date = now();
            $course->quiz_answers = $request->quiz_answers;
            $course->quiz_score = $request->quiz_score;
            $course->save();
        } else {
            $course = LearningManagement::create([
                'employee_id' => $request->employee_id,
                'title' => '',
                'description' => '',
                'status' => 'done',
                'progress' => 100,
                'due_date' => null,
                'file_path' => null,
                'quiz' => null,
                'quiz_answers' => $request->quiz_answers,
                'quiz_score' => $request->quiz_score,
                'completion_date' => now(),
            ]);
        }
        return response()->json(['message' => 'Quiz result saved.']);
    }
    // Competency Management endpoints
    public function listCompetencies()
    {
        $competencies = CompetencyManagement::all();
        return response()->json($competencies);
    }
    public function createCompetency(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|integer',
            'role_id' => 'nullable|integer',
            'role_name' => 'nullable|string|max:255',
            'competency_id' => 'nullable|integer',
            'competency_name' => 'nullable|string|max:255',
            'competency_type' => 'nullable|string|max:255',
            'competency_level' => 'nullable|string|max:255',
            'last_assessed_date' => 'nullable|date',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $competency = CompetencyManagement::create($validator->validated());
        return response()->json(['message' => 'Competency data saved successfully!', 'competency' => $competency], 201);
    }
}
