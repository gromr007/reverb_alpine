import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],

    // Настройки авторизации для Sanctum
    authEndpoint: `https://${import.meta.env.VITE_REVERB_HOST}:${import.meta.env.VITE_REVERB_PORT}/api/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: `Bearer ${import.meta.env.VITE_TOKEN_CHAT_BACK}`,
            Accept: 'application/json',
        },
		withCredentials: false,
		credentials: 'omit'
    },
});
