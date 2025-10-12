<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingApplication extends Model
{
    use HasFactory;

    protected $table = 'training_applications';

    protected $fillable = [
        'training_id',
        'employee_id',
        'application_date',
        'status',
        'notes',
        'approved_by',
        'approved_date',
        'rejection_reason',
        'preferred_start_date',
        'manager_approval_notes',
        'manager_approved_at',
        'submitted_at',
        'applied_at'
    ];

    protected $dates = [
        'application_date',
        'approved_date',
        'manager_approved_at',
        'submitted_at'
    ];

    public function training()
    {
        return $this->belongsTo(TrainingManagement::class, 'training_id');
    }

    public function employee()
    {
        return $this->belongsTo(EmployeeSelfService::class, 'employee_id');
    }

    public function approver()
    {
        return $this->belongsTo(EmployeeSelfService::class, 'approved_by');
    }
}