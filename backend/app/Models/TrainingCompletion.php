<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingCompletion extends Model
{
    use HasFactory;

    protected $table = 'training_completions';

    protected $fillable = [
        'training_id',
        'employee_id',
        'application_id',
        'completion_date',
        'score_percentage',
        'grade',
        'completion_notes',
        'certificate_issued',
        'competencies_gained'
    ];

    protected $casts = [
        'completion_date' => 'date',
        'competencies_gained' => 'array',
        'certificate_issued' => 'boolean',
    ];

    public function training()
    {
        return $this->belongsTo(TrainingManagement::class, 'training_id');
    }

    public function employee()
    {
        return $this->belongsTo(EmployeeSelfService::class, 'employee_id');
    }

    public function application()
    {
        return $this->belongsTo(TrainingApplication::class, 'application_id');
    }

    public function certificates()
    {
        return $this->hasMany(\App\Models\TrainingCertificate::class, 'completion_id');
    }
}