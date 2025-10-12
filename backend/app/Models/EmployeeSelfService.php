<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeSelfService extends Model
{
    use HasFactory;

    protected $table = 'employee_self_service';

    protected $fillable = [
        'auth_user_id',
        'first_name',
        'last_name',
        'department',
        'position',
        'email',
        'phone',
        'address',
        'birthday',
        'civil_status',
        'emergency_contact',
        'hire_date',
        'manager',
        'employee_status',
        'profile_photo_url',
        'roles',
    ];

    /**
     * Get the full name attribute.
     */
    public function getNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }
    /**
     * Get the user associated with the employee self service.
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'auth_user_id');
    }

    /**
     * Get the leave requests for the employee.
     */
    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class, 'employee_id');
    }
}
