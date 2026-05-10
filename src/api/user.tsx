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
    console.log('token in withAuthHeaders:', token);
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
    referral_code?: string;
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
    name: string;
    description?: string;
    price: number;
}

export interface Order {
    id: number;
    order_number?: string | number;
    test_kit_name?: string;
    order_date?: string;
    created_at?: string;
    tracking_number?: string;
    testName?: string;
    date?: string;
    tracking?: string;
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
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error('Login failed');
    }
    const data = await response.json();
    setAuthToken(data.token ?? data.access_token ?? null);
    return data;
}

export const register = async (user: Record<string, unknown>): Promise<RegisterResponse> => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
    });

    if (!response.ok) {
        throw new Error('Registration failed');
    }

    const data = await response.json();
    // Keep compatibility if backend later returns token on registration.
    setAuthToken(data.token ?? data.access_token ?? null);
    return data;
}

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
    });
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
}

export const fetchKits = async (): Promise<Kit[]> => {
    const response = await fetch(`${API_URL}/kits`, {
        headers: withAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch kits');
    }
    return response.json();
}

export const fetchOrders = async (clientId: string | number): Promise<Order[]> => {
    const response = await fetch(`${API_URL}/orders?client_id=${clientId}`, {
        headers: withAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch orders');
    }
    return response.json();
}

export const fetchOrderDetail = async (orderId: string | number): Promise<OrderDetail> => {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: withAuthHeaders(),
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
    });
    if (!response.ok) {
        throw new Error('Failed to fetch referral link');
    }
    return response.json();
}

export const getProviderPatients = async (clientId: string | number): Promise<Patient[]> => {
    const response = await fetch(`${API_URL}/provider/patients?client_id=${clientId}`, {
        headers: withAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch provider patients');
    }
    return response.json();
}

export const fetchPayments = async (clientId: string | number): Promise<PaymentHistory[]> => {
    const response = await fetch(`${API_URL}/payments?client_id=${clientId}`, {
        headers: withAuthHeaders(),
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
}): Promise<PaymentConfirmationResponse> => {
    const response = await fetch(`${API_URL}/confirm-payment`, {
        method: 'POST',
        headers: withAuthHeaders({
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
    });

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
    });
    if (!response.ok) {
        throw new Error('Failed to validate referral code');
    }
    const result = await response.json();
    return result.isValid;
}