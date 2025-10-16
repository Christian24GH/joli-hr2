<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    //SPECIFY ALLOWED ORIGINS HERE
    'allowed_origins' => array_merge(explode(',', env('ALLOWED_ORIGINS', '')), [
        /**LOCAL DEV */
        'http://front.tchr2.jolitravel.local:3002',
        'http://auth.jolitravel.local', // Auth service
        'http://back.tchr2.jolitravel.local', // HR2 service


        /**ON DEPLOYMENT ADD MO ULIT DITO FRONTEND URL MO */
        "https://your-frontend-domain.com",

    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Authorization', 'Accept'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // Enable credentials for session-based auth

];
