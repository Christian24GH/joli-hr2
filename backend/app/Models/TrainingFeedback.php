<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingFeedback extends Model
{
    use HasFactory;

    protected $table = 'training_feedback';

    protected $fillable = [
        'training_id',
        'employee_id',
        'rating',
        'feedback_text',
        'trainer_rating',
        'content_rating',
        'delivery_rating',
        'recommendations',
        'submitted_date'
    ];

    protected $dates = [
        'submitted_date'
    ];

    public function training()
    {
        return $this->belongsTo(TrainingManagement::class, 'training_id');
    }

    public function employee()
    {
        return $this->belongsTo(EmployeeSelfService::class, 'employee_id');
    }
}