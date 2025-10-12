<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompetencyManagement extends Model
{
    protected $fillable = [
        'employee_id',
        'competency_name',
        'competency_category',
        'proficiency_level',
        'proficiency_score',
        'description',
        'acquired_from_completion_id',
        'acquired_date',
        'last_updated',
        'is_active'
    ];

    protected $casts = [
        'proficiency_score' => 'decimal:2',
        'acquired_date' => 'date',
        'last_updated' => 'date',
        'is_active' => 'boolean'
    ];

    // Relationships
    public function employee(): BelongsTo
    {
        return $this->belongsTo(EmployeeSelfService::class, 'employee_id');
    }

    public function trainingCompletion(): BelongsTo
    {
        return $this->belongsTo(TrainingCompletion::class, 'acquired_from_completion_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('competency_category', $category);
    }

    public function scopeByProficiencyLevel($query, $level)
    {
        return $query->where('proficiency_level', $level);
    }

    // Helper methods
    public function getProficiencyLevelColorAttribute()
    {
        return match($this->proficiency_level) {
            'beginner' => 'bg-gray-100 text-gray-800',
            'intermediate' => 'bg-blue-100 text-blue-800',
            'advanced' => 'bg-green-100 text-green-800',
            'expert' => 'bg-purple-100 text-purple-800',
            default => 'bg-gray-100 text-gray-800'
        };
    }

    public function getCategoryColorAttribute()
    {
        return match($this->competency_category) {
            'technical' => 'bg-blue-100 text-blue-800',
            'soft_skills' => 'bg-green-100 text-green-800',
            'leadership' => 'bg-purple-100 text-purple-800',
            'compliance' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800'
        };
    }
}
