<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingSession extends Model
{
    use HasFactory;

    protected $table = 'training_sessions';

    protected $fillable = [
        'training_id',
        'session_title',
        'session_description',
        'start_datetime',
        'end_datetime',
        'location',
        'max_attendees',
        'instructor_id',
        'status'
    ];

    protected $dates = [
        'start_datetime',
        'end_datetime'
    ];

    public function training()
    {
        return $this->belongsTo(TrainingManagement::class, 'training_id');
    }

    public function instructor()
    {
        return $this->belongsTo(EmployeeSelfService::class, 'instructor_id');
    }
}