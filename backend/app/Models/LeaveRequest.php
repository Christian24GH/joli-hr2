<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $table = 'leave_requests';

    protected $fillable = [
        'employee_id',
        'type',
        'start',
        'end',
        'reason',
        'status',
        'approved_by',
        'approved_at',
        'admin_notes'
    ];

    protected $casts = [
        'start' => 'date',
        'end' => 'date',
        'approved_at' => 'datetime'
    ];

    // Relationship with Employee
    public function employee()
    {
        return $this->belongsTo(EmployeeSelfService::class, 'employee_id');
    }

    // Relationship with Approver
    public function approver()
    {
        return $this->belongsTo(EmployeeSelfService::class, 'approved_by');
    }

    // Scope for pending requests
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // Scope for approved requests
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    // Scope for rejected requests
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Get status badge color
    public function getStatusBadgeAttribute()
    {
        switch ($this->status) {
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            case 'pending':
            default:
                return 'warning';
        }
    }

    // Calculate total days automatically
    public function calculateTotalDays()
    {
        if ($this->start && $this->end) {
            $start = \Carbon\Carbon::parse($this->start);
            $end = \Carbon\Carbon::parse($this->end);
            return $end->diffInDays($start) + 1; // +1 to include both start and end dates
        }
        return 0;
    }
}
