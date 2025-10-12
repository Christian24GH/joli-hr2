<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingManagement extends Model
{
    use HasFactory;

    protected $table = 'training_management';

    protected $fillable = [
        'employee_id',
        'program_name',
        'provider',
        'description',
        'objectives',
        'trainer',
        'duration',
        'target_skills',
        'prerequisites',
        'start_date',
        'end_date',
        'max_participants',
        'location',
        'status',
        'feedback_score',
        'training_type',
        'enrolled_count',
        'difficulty',
        'format',
        'topic',
        'rating'
    ];

    protected $casts = [
        'feedback_score' => 'integer',
        'max_participants' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'enrolled_count' => 'integer',
    ];

        // --- Merged Models ---

        // TrainingApplication logic
        public function trainingApplications()
        {
            return $this->hasMany(TrainingApplication::class, 'training_id');
        }

        // TrainingCategory logic
        public function category()
        {
            return $this->belongsTo(TrainingCategory::class, 'category_id');
        }

        // TrainingCertificate logic
        public function certificates()
        {
            return $this->hasMany(TrainingCertificate::class, 'training_id');
        }

        // TrainingCompletion logic
        public function completions()
        {
            return $this->hasMany(TrainingCompletion::class, 'training_id');
        }

        // Scopes for applications
        public function scopePendingApplications($query)
        {
            return $query->whereHas('applications', function($q){ $q->where('status', 'pending'); });
        }
        public function scopeApprovedApplications($query)
        {
            return $query->whereHas('applications', function($q){ $q->where('status', 'approved'); });
        }
        public function scopeRejectedApplications($query)
        {
            return $query->whereHas('applications', function($q){ $q->where('status', 'rejected'); });
        }
        public function scopeAppliedApplications($query)
        {
            return $query->whereHas('applications', function($q){ $q->where('status', 'applied'); });
        }

        // Helper for TrainingCertificate
        public function getCertificateFileUrlAttribute()
        {
            $certificate = $this->certificates()->latest()->first();
            return $certificate ? $certificate->file_url : null;
        }

        public function getCertificateIsExpiredAttribute()
        {
            $certificate = $this->certificates()->latest()->first();
            return $certificate ? $certificate->isExpired() : false;
        }

        public function getCertificateFormattedFileSizeAttribute()
        {
            $certificate = $this->certificates()->latest()->first();
            return $certificate ? $certificate->formatted_file_size : null;
        }

        // Helper for TrainingCompletion
        public function getLatestCompletionAttribute()
        {
            return $this->completions()->latest('completion_date')->first();
        }

        public function getCompetenciesGainedAttribute()
        {
            $completion = $this->latest_completion;
            return $completion ? $completion->competencies_gained : [];
        }

        // Helper for TrainingCategory
        public function getCategoryNameAttribute()
        {
            return $this->category ? $this->category->name : null;
        }

        // Helper for TrainingApplication status counts
        public function getApplicationStatusCountsAttribute()
        {
            return [
                'pending' => $this->applications()->pending()->count(),
                'approved' => $this->applications()->approved()->count(),
                'rejected' => $this->applications()->rejected()->count(),
                'applied' => $this->applications()->applied()->count(),
            ];
        }
    // Relationships
    public function applications()
    {
        return $this->hasMany(TrainingApplication::class, 'training_id');
    }

    public function approvedApplications()
    {
        return $this->hasMany(TrainingApplication::class, 'training_id')->where('status', 'approved');
    }

    // Accessors & Methods
    public function getAvailableSlotsAttribute()
    {
        return max(0, $this->max_participants - $this->enrolled_count);
    }

    public function getIsFullAttribute()
    {
        return $this->enrolled_count >= $this->max_participants;
    }

    public function getEnrollmentPercentageAttribute()
    {
        if ($this->max_participants <= 0) return 0;
        return round(($this->enrolled_count / $this->max_participants) * 100, 1);
    }

    public function canEnroll()
    {
        return !$this->is_full && $this->status === 'active';
    }

    public function updateEnrolledCount()
    {
        $this->enrolled_count = $this->approvedApplications()->count();
        $this->save();
    }
}