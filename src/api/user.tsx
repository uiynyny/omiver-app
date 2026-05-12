const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'; // origin
const AUTH_TOKEN_KEY = 'omiver_auth_token';

export const setAuthToken = (token?: string | null): void => {
    console.log('token:', token)
    if (!token) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        return;
    }
    localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getAuthToken = (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

const withAuthHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
    const token = getAuthToken();
    return token ? { ...headers, Authorization: `Token ${token}` } : headers;
};

export interface LoginResponse {
    token?: string;
    access_token?: string;
    token_type: string;
    user_id: number;
    email: string;
    account_type: string;
    type?: 'PROVIDER' | 'INDIVIDUAL';
    first_name?: string;
    last_name?: string;
    allergies?: string;
    avoided_cusisines?: string;
    date_of_birth?: string;
    dietary_preference_mode?: string;
    dietary_preferences?: string;
    dietary_recall?: string;
    dietary_typicality?: number;
    nutritional_goal?: string;
    ethnicity?: string;
    execrise_days_per_week?: number;
    exercise_types?: string;
    fitness_goal?: string;
    health_conditions?: string;
    height?: number;
    preferred_cuisines?: string;
    provider_notes?: string;
    referral_code?: string;
    weekly_exercise_routine?: string;
    weight?: number;
    sport: string;
    id?: number;
}

export interface RegisterResponse {
    id: number;
    email: string;
    account_type: string;
    access_token?: string;
    token_type?: string;
    token?: string;
    referral_code?: string;
}

export interface BiomarkerResultItem {
    value: number;
    unit: string;
    biomarker_name: string;
    normal_range: string;
    status: string;
}

export interface BiomarkerSection {
    biomarker_count: number;
    results: BiomarkerResultItem[];
}

export interface DashboardProfile {
    name?: string;
    age?: number | string;
    height?: number | string;
    weight?: number | string;
}

export interface Dashboard {
    health_score?: number;
    optimal_biomarkers?: number;
    total_biomarkers?: number;
    profile?: DashboardProfile;
    recommendations?: string[];
    biomarker_results?: Record<string, BiomarkerSection>;
}

export interface Kit {
    id: number;
    name?: string;
    // Backend provides a minimal kit shape; frontend consumes a richer display shape.
    // Make these optional so components can use / map them freely.
    title?: string;
    description?: string;
    subtitle?: string;
    // price may be number from API but components often render a formatted string
    price: number | string;
    frequency?: string;
    color?: string;
    badge?: string;
    features?: string[];
    active?: boolean;
}

export interface Order {
    id: number;
    order_number?: string | number;
    test_kit_name?: string;
    order_date?: string;
    created_at?: string;
    tracking_number?: string;
    // aliases used by UI
    testName?: string;
    date?: string;
    tracking?: string;
    status?: string;
    quantity?: number;
}

export interface DeliveryEvent {
    id: string | number;
    event_type: string;
    title: string;
    description?: string;
    is_completed?: boolean;
}

export interface OrderDetail extends Order {
    delivery_events?: DeliveryEvent[];
}

export interface PaymentHistory {
    id: number;
    client_id: number;
    amount: number;
    status: string;
    created_at: string;
    // optional billing details returned by API
    cardholder_name?: string;
    billing_address?: {
        street_address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
    };
}

export interface PaymentIntentResponse {
    clientSecret: string;
}

export interface PaymentConfirmationResponse {
    payment_intent_id: string;
    status: string;
    order_id?: number;
}

export interface Patient {
    id: number;
    email: string;
    full_name: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    gender: string;
    height: number | null;
    weight: number | null;
    ethnicity: string;
    health_conditions: string;
    dietary_preferences: string;
    dietary_recall?: string;
    dietary_typicality?: number | null;
    dietary_preference_mode?: string;
    preferred_cuisines?: string;
    avoided_cuisines?: string;
    weekly_exercise_routine?: string;
    exercise_days_per_week?: number | null;
    exercise_types?: string;
    provider_notes?: string;
    fitness_goal: string;
    created_at: string;
    latest_test_date: string | null;
    total_orders: number;
}

export type ClientUpdateResponse = Patient;

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    const options: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
    };

    const response = await fetch(`${API_URL}/login`, options);

    if (!response.ok) {
        throw new Error('Login failed');
    }
    const data = await response.json();
    setAuthToken(data.token ?? data.access_token ?? null);
    return data;
}

export const register = async (user: Record<string, unknown>): Promise<RegisterResponse> => {
    const options: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify(user),
        credentials: 'include',
    };

    const response = await fetch(`${API_URL}/register`, options);

    if (!response.ok) {
        const errorData = await response.text().catch(() => ({}));
        throw new Error('Registration failed, ' + errorData);
    }

    const data = await response.json();
    // Keep compatibility if backend later returns token on registration.
    setAuthToken(data.token ?? data.access_token ?? null);
    return data;
}

export const logoutApi = async (): Promise<void> => {
    const token = getAuthToken();
    const headers = withAuthHeaders({ 'Content-Type': 'application/json' });
    const options: RequestInit = {
        method: 'POST',
        headers,
        credentials: token ? undefined : 'include',
    };
    await fetch(`${API_URL}/logout`, options);
};

export const emailExist = async (email: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/check_email?email=${encodeURIComponent(email)}`)

    if (!response.ok) {
        throw new Error('Email existence check failed' + response);
    }

    const data = await response.json();
    return data.exists;
}

export const fetchDashboard = async (clientId: string | number): Promise<Dashboard> => {
    const response = await fetch(`${API_URL}/dashboard?client_id=${clientId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
}

export const fetchKits = async (): Promise<Kit[]> => {
    const response = await fetch(`${API_URL}/kits`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch kits');
    }
    return response.json();
}

export const fetchOrders = async (clientId: string | number): Promise<Order[]> => {
    const response = await fetch(`${API_URL}/orders?client_id=${clientId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch orders');
    }
    return response.json();
}

export const fetchOrderDetail = async (orderId: string | number): Promise<OrderDetail> => {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch order detail');
    }
    return response.json();
}
export const getReferralLink = async (clientId: string | number): Promise<{
    referral_code: string;
    patient_count: number;
}> => {
    const response = await fetch(`${API_URL}/provider/referral-link?client_id=${clientId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch referral link');
    }
    return response.json();
}

export const getProviderPatients = async (clientId: string | number): Promise<Patient[]> => {
    const response = await fetch(`${API_URL}/provider/patients?client_id=${clientId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch provider patients');
    }
    return response.json();
}

export const fetchPayments = async (clientId: string | number): Promise<PaymentHistory[]> => {
    const response = await fetch(`${API_URL}/payments?client_id=${clientId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch payment history');
    }
    return response.json();
}

export const checkout = async (data: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: withAuthHeaders({
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
        credentials: 'include',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Checkout failed');
    }
    return response.json();
}

export const createPaymentIntent = async (testKitId: number, clientId: number, quantity: number = 1): Promise<PaymentIntentResponse> => {
    const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: withAuthHeaders({
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ test_kit_id: testKitId, client_id: clientId, quantity }),
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment intent');
    }
    return response.json();
}

export const confirmPaymentApi = async (data: {
    payment_intent_id: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    cardholder_name?: string;
    test_kit_id?: number;
    quantity?: number;
}): Promise<PaymentConfirmationResponse> => {
    const token = getAuthToken();
    const headers = withAuthHeaders({ 'Content-Type': 'application/json' });
    const options: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    // If no token is present, assume cookie/session auth and add CSRF
    if (!token) {
        // add CSRF header for session-based auth
        (options.headers as Record<string, string>)['X-CSRFToken'] = getCookie('csrftoken') || '';
    }

    const response = await fetch(`${API_URL}/confirm-payment`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Payment confirmation failed');
    }
    return response.json();
}

export const updateClient = async (clientId: string | number, data: Partial<Patient & Record<string, unknown>>): Promise<ClientUpdateResponse> => {
    const response = await fetch(`${API_URL}/client/${clientId}`, {
        method: 'PATCH',
        headers: withAuthHeaders({
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update client');
    }

    return response.json();
}

export const checkReferralCode = async (code: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/validate_referral_code?code=${encodeURIComponent(code)}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to validate referral code');
    }
    const result = await response.json();
    return result.isValid;
}