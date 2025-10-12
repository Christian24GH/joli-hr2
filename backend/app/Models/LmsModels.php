<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LmsCourse extends Model
{
    protected $fillable = [
        'title', 'description', 'category', 'level', 'duration', 
        'rating', 'enrolled_count', 'tags', 'prerequisites', 
        'enrolled_users', 'instructor', 'content_url', 'status', 'created_by'
    ];

    protected $casts = [
        'tags' => 'array',
        'prerequisites' => 'array',
        'enrolled_users' => 'array',
        'rating' => 'decimal:1',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(LmsCourseModule::class, 'course_id');
    }

    public function learningProgress(): HasMany
    {
        return $this->hasMany(LmsLearningProgress::class, 'course_id');
    }

    public function getEnrolledUsersCountAttribute()
    {
        return count($this->enrolled_users ?? []);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByLevel($query, $level)
    {
        return $query->where('level', $level);
    }
}

class LmsLearningPlan extends Model
{
    protected $fillable = [
        'title', 'description', 'courses', 'due_date', 'status', 'assigned_users', 'created_by'
    ];

    protected $casts = [
        'courses' => 'array',
        'assigned_users' => 'array',
        'due_date' => 'date',
    ];

    public function getCourseDetailsAttribute()
    {
        if (!$this->courses) return [];
        
        return LmsCourse::whereIn('id', $this->courses)
            ->where('status', 'active')
            ->get();
    }

    public function getProgressForUser($userId)
    {
        if (!$this->courses) return ['completed' => 0, 'total' => 0, 'percentage' => 0];
        
        $totalCourses = count($this->courses);
        $completedCourses = LmsLearningProgress::where('user_id', $userId)
            ->whereIn('course_id', $this->courses)
            ->where('status', 'completed')
            ->count();

        return [
            'completed' => $completedCourses,
            'total' => $totalCourses,
            'percentage' => $totalCourses > 0 ? round(($completedCourses / $totalCourses) * 100) : 0
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->whereJsonContains('assigned_users', $userId);
    }
}

class LmsLearningProgress extends Model
{
    protected $fillable = [
        'user_id', 'course_id', 'course_title', 'source', 'source_id',
        'enrollment_date', 'progress', 'status', 'last_accessed', 'score', 'notes'
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'last_accessed' => 'datetime',
        'score' => 'decimal:2',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(LmsCourse::class, 'course_id');
    }

    public function learningPlan(): BelongsTo
    {
        return $this->belongsTo(LmsLearningPlan::class, 'source_id');
    }

    public function moduleProgress(): HasMany
    {
        return $this->hasMany(LmsModuleProgress::class, 'user_id', 'user_id')
            ->where('course_id', $this->course_id);
    }

    public function getSourceNameAttribute()
    {
        if ($this->source === 'learning_plan' && $this->source_id) {
            $plan = LmsLearningPlan::find($this->source_id);
            return $plan ? $plan->title : 'Learning Plan';
        }
        return 'Direct Enrollment';
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }
}

class LmsCourseModule extends Model
{
    protected $fillable = [
        'course_id', 'title', 'description', 'order', 'type', 
        'content_url', 'duration_minutes', 'is_required', 'status'
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(LmsCourse::class, 'course_id');
    }

    public function moduleProgress(): HasMany
    {
        return $this->hasMany(LmsModuleProgress::class, 'module_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}

class LmsModuleProgress extends Model
{
    protected $fillable = [
        'user_id', 'course_id', 'module_id', 'status', 'progress', 
        'score', 'started_at', 'completed_at', 'notes'
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(LmsCourse::class, 'course_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(LmsCourseModule::class, 'module_id');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }
}