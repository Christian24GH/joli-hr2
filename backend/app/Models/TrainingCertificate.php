<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingCertificate extends Model
{
    use HasFactory;

    protected $table = 'training_certificates';

    protected $fillable = [
        'training_id',
        'employee_id',
        'certificate_number',
        'issue_date',
        'expiry_date',
        'certificate_path',
        'issued_by'
    ];

    protected $dates = [
        'issue_date',
        'expiry_date'
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