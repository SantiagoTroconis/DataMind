export const API_BASE_URL = 'http://localhost:5000';

/**
 * Wrapper around fetch that:
 * 1. Injects Authorization: Bearer <token> from localStorage automatically
 * 2. On 401 response, clears auth state and redirects to /auth?expired=1
 *
 * IMPORTANT: Do NOT use apiFetch for auth endpoints (/auth/login, /auth/register).
 * Those run before authentication and must use plain fetch to avoid redirect loops.
 */
export const apiFetch = async (
    path: string,
    options: RequestInit = {}
): Promise<Response> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth?expired=1';
        throw new Error('Session expired. Redirecting to login.');
    }

    return response;
};
