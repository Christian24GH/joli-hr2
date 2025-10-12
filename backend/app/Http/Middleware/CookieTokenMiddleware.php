<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CookieTokenMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {   
        try{
            $token = $request->cookie('auth_token');
            

            if (!$token) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
    
            $url = env('AUTH_BACKEND_URL').'/api/user';
            //Log::info("Calling auth backend: " . $url);

            $response = Http::withHeaders(['Accept' => 'application/json'])
                ->withToken($token)
                ->when(app()->environment('local'), fn($http) => $http->withOptions(['verify' => false]))
                ->get($url);
            
            /*
            Log::info('Auth backend response', [
                'status' => $response->status(),
                'body'   => $response->json(),
            ]);
            */
            if ($response->failed()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
    
            // Attach the user payload to request
            $request->attributes->set('user', $response->json());

        }catch(Exception $e){
            Log::error($e->getMessage());
            return response()->json(["message" => "Server Error"], 500);
        }

        return $next($request);
    }
}
