<?php

use App\Http\Middleware\CookieTokenMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Remove statefulApi() for pure API backend
        // $middleware->statefulApi();
        //Dito dapat kayo naglalagay ng middlewares for global. If api middleware lang, dun sa routes/api.php using ->middleware('name')
        //$middleware->append(CookieTokenMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
