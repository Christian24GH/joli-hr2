<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reimbursement extends Model
{
    use HasFactory;

    protected $table = 'reimbursements';

    protected $fillable = [
        'employee_id',
        'type',
        'amount',
        'date',
        'description',
        'receipt_path',
        'status',
        'admin_notes',
        'approved_by',
        'approved_at',
        'submitted_at'
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    /**
     * Get the employee that owns the reimbursement request.
     */
    public function employee()
    {
        return $this->belongsTo(EmployeeSelfService::class, 'employee_id');
    }

    /**
     * Get the admin who approved the reimbursement request.
     */
    public function approver()
    {
        return $this->belongsTo(EmployeeSelfService::class, 'approved_by');
    }

    /**
     * Scope a query to only include pending requests.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'Pending');
    }

    /**
     * Scope a query to only include approved requests.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'Approved');
    }

    /**
     * Scope a query to only include rejected requests.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'Rejected');
    }
}