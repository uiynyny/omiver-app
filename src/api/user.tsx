import { encryptName, decryptName } from '../utils/crypto';

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'omiver_auth_token';
const PERSISTENT_LOGIN_KEY = 'omiver_persistent_login';
const CUSTOM_PROFILE_KEY = 'omiver_custom_profile_key';

export const getCustomProfileKey = (): string | null => {
    return localStorage.getItem(CUSTOM_PROFILE_KEY);
};

export const setCustomProfileKey = (key?: string | null): void => {
    if (!key) {
        localStorage.removeItem(CUSTOM_PROFILE_KEY);
    } else {
        localStorage.setItem(CUSTOM_PROFILE_KEY, key);
    }
};

export const clearCustomProfileKey = (): void => {
    localStorage.removeItem(CUSTOM_PROFILE_KEY);
};

export const decryptProfileData = async <T extends Record<string, any>>(data: T): Promise<T> => {
    if (!data) return data;
    const key = getCustomProfileKey();
    const result = { ...data } as any;
    if (typeof result.first_name === 'string' && result.first_name.startsWith('client_enc:')) {
        result.first_name = key ? await decryptName(result.first_name, key) : '[Locked]';
    }
    if (typeof result.last_name === 'string' && result.last_name.startsWith('client_enc:')) {
        result.last_name = key ? await decryptName(result.last_name, key) : '[Locked]';
    }
    return result as T;
};

export const decryptPatientsArray = async (patients: any[]): Promise<any[]> => {
    if (!patients) return patients;
    return Promise.all(patients.map(p => decryptProfileData(p)));
};

export const decryptDashboardData = async (data: any): Promise<any> => {
    if (!data || !data.profile) return data;
    const key = getCustomProfileKey();
    const result = { ...data };
    if (result.profile && typeof result.profile.name === 'string') {
        const name = result.profile.name as string;
        const parts = name.split(' ');
        const decryptedParts = await Promise.all(parts.map(async part => {
            if (part.startsWith('client_enc:')) {
                return key ? await decryptName(part, key) : '[Locked]';
            }
            return part;
        }));
        result.profile.name = decryptedParts.join(' ').trim();
    }
    return result;
};

export const setAuthToken = (token?: string | null): void => {
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

export const setPersistentLogin = (loginInfo?: { userId: string; userType: 'PROVIDER' | 'INDIVIDUAL'; clientId: number; email: string } | null): void => {
    if (!loginInfo) {
        localStorage.removeItem(PERSISTENT_LOGIN_KEY);
        return;
    }
    localStorage.setItem(PERSISTENT_LOGIN_KEY, JSON.stringify(loginInfo));
};

export const getPersistentLogin = (): { userId: string; userType: 'PROVIDER' | 'INDIVIDUAL'; clientId: number; email: string } | null => {
    try {
        const stored = localStorage.getItem(PERSISTENT_LOGIN_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const clearPersistentLogin = (): void => {
    localStorage.removeItem(PERSISTENT_LOGIN_KEY);
};

export const verifyToken = async (): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_URL}/verify-token`, {
            headers: withAuthHeaders(),
            credentials: 'include',
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
        // backend base (strip trailing /api if present)
        const backendBase = API_URL.replace(/\/api\/?$/, '');
        const url = `${backendBase}/accounts/password_reset/`;
        const form = new URLSearchParams();
        form.append('email', email);

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: form.toString(),
            credentials: 'include',
        });
        return res.ok;
    } catch (err) {
        console.error('requestPasswordReset error', err);
        return false;
    }
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
    exercise_recall?: string;
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
    forward_tracking_number?: string;
    return_tracking_number?: string;
    tracking_number?: string;
    // aliases used by UI
    testName?: string;
    date?: string;
    tracking?: string;
    status?: string;
    quantity?: number;
    barcode_assignment?: { barcode_number: string } | null;
    collection_status?: string;
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
    card_brand?: string;
    card_last_four?: string;
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
    exercise_recall?: string;
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
    return decryptProfileData(data);
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
    // Clear persistent login on logout
    clearPersistentLogin();
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
    const data = await response.json();
    return decryptDashboardData(data);
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
    const data = await response.json();
    return decryptPatientsArray(data);
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

export const createOrder = async (data: Record<string, unknown>): Promise<OrderDetail> => {
    const token = getAuthToken();
    const headers = withAuthHeaders({
        'Content-Type': 'application/json',
    });
    const options: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    if (!token) {
        (options.headers as Record<string, string>)['X-CSRFToken'] = getCookie('csrftoken') || '';
    }

    const response = await fetch(`${API_URL}/orders/create`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create order');
    }

    return response.json();
}

export const createBarcodeAssignment = async (data: {
    kit_code: string;
    barcode_number: string;
}): Promise<{
    created: boolean;
    assignment_id: number;
    barcode_number: string;
    client_id: number;
    order_id: number;
    test_kit_id: number;
    test_kit_name: string;
}> => {
    const token = getAuthToken();
    const headers = withAuthHeaders({
        'Content-Type': 'application/json',
    });
    const options: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    if (!token) {
        (options.headers as Record<string, string>)['X-CSRFToken'] = getCookie('csrftoken') || '';
    }

    const response = await fetch(`${API_URL}/barcode/assign`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to create barcode assignment');
    }

    return response.json();
}

export const linkBarcodeAssignment = async (data: {
    barcode_number: string;
    client_id: number | string;
}): Promise<{
    linked: boolean;
    already_linked: boolean;
    barcode_number: string;
    client_id: number;
    order_id: number;
    test_kit_id: number;
    test_kit_name: string;
}> => {
    const token = getAuthToken();
    const headers = withAuthHeaders({
        'Content-Type': 'application/json',
    });
    const options: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    if (!token) {
        (options.headers as Record<string, string>)['X-CSRFToken'] = getCookie('csrftoken') || '';
    }

    const response = await fetch(`${API_URL}/barcode/link`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to link barcode');
    }

    return response.json();
}

export const unlinkBarcodeAssignment = async (data: {
    barcode_number: string;
    client_id: number | string;
}): Promise<{ unlinked: boolean }> => {
    const token = getAuthToken();
    const headers = withAuthHeaders({
        'Content-Type': 'application/json',
    });
    const options: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    if (!token) {
        (options.headers as Record<string, string>)['X-CSRFToken'] = getCookie('csrftoken') || '';
    }

    const response = await fetch(`${API_URL}/barcode/unlink`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to unlink barcode');
    }

    return response.json();
}

export const markBarcodeCollected = async (data: {
    barcode_number: string;
    client_id?: number | string;
    collected_at?: string;
}): Promise<{
    collected: boolean;
    barcode_number: string;
    collected_at: string;
    assignment_id: number;
    client_id: number | null;
    order_id: number | null;
    test_kit_id: number;
    test_kit_name: string;
}> => {
    const token = getAuthToken();
    const headers = withAuthHeaders({
        'Content-Type': 'application/json',
    });
    const options: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    if (!token) {
        (options.headers as Record<string, string>)['X-CSRFToken'] = getCookie('csrftoken') || '';
    }

    const response = await fetch(`${API_URL}/barcode/collect`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to mark barcode as collected');
    }

    return response.json();
}

export const updateOrderStatus = async (
    orderId: number | string,
    data: {
        status: string;
        title?: string;
        description?: string;
        forward_tracking_number?: string;
        return_tracking_number?: string;
        tracking_number?: string;
    },
): Promise<OrderDetail> => {
    const token = getAuthToken();
    const headers = withAuthHeaders({
        'Content-Type': 'application/json',
    });
    const options: RequestInit = {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    if (!token) {
        (options.headers as Record<string, string>)['X-CSRFToken'] = getCookie('csrftoken') || '';
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/status`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update order status');
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
    country?: string;
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

export const fetchClient = async (clientId: string | number): Promise<any> => {
    const response = await fetch(`${API_URL}/client/${clientId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch client data');
    }
    const data = await response.json();
    return decryptProfileData(data);
}

export const updateClient = async (clientId: string | number, data: Partial<Patient & Record<string, unknown>>): Promise<ClientUpdateResponse> => {
    const key = getCustomProfileKey();
    let payload = { ...data };
    if (key) {
        if (typeof payload.first_name === 'string' && payload.first_name && !payload.first_name.startsWith('client_enc:')) {
            payload.first_name = await encryptName(payload.first_name, key);
        }
        if (typeof payload.last_name === 'string' && payload.last_name && !payload.last_name.startsWith('client_enc:')) {
            payload.last_name = await encryptName(payload.last_name, key);
        }
    }
    const response = await fetch(`${API_URL}/client/${clientId}`, {
        method: 'PATCH',
        headers: withAuthHeaders({
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update client');
    }

    const resData = await response.json();
    return decryptProfileData(resData);
}

export const checkReferralCode = async (code: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/validate_referral_code?code=${encodeURIComponent(code)}`, {
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to validate referral code');
    }
    const result = await response.json();
    return result.isValid;
}

export const verifyKitCode = async (kitCode: string): Promise<{ valid: boolean; message?: string }> => {
    const response = await fetch(`${API_URL}/verify-kit-code?code=${encodeURIComponent(kitCode)}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { valid: false, message: errorData.message || 'Kit code not found' };
    }
    return { valid: true, message: 'Kit code verified' };
}

export const fetchShippingAddresses = async (clientId: string | number): Promise<any[]> => {
    const response = await fetch(`${API_URL}/shipping-addresses?client_id=${clientId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch shipping addresses');
    }
    return response.json();
}

export const fetchDefaultShippingAddress = async (clientId?: string | number): Promise<any> => {
    const query = clientId ? `?client_id=${clientId}` : '';
    const response = await fetch(`${API_URL}/shipping-address${query}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch default shipping address');
    }
    return response.json();
}

export interface KitCollectionData {
    id: number;
    kit_barcode: string;
    status: string;
    dietary_recall?: string | null;
    exercise_recall?: string | null;
    collected_at?: string | null;
    created_at: string;
    updated_at: string;
}

export const getKitCollection = async (orderId: number | string): Promise<KitCollectionData> => {
    const response = await fetch(`${API_URL}/collection/${orderId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch kit collection');
    return response.json();
}

export const collectionScan = async (orderId: number | string, kitBarcode: string): Promise<KitCollectionData> => {
    const response = await fetch(`${API_URL}/collection/scan`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ order_id: orderId, kit_barcode: kitBarcode }),
    });
    if (!response.ok) throw new Error('Failed to scan kit collection');
    return response.json();
}

export const collectionLog = async (orderId: number | string, dietaryRecall: string, exerciseRecall: string, collectedAt?: string): Promise<KitCollectionData> => {
    const response = await fetch(`${API_URL}/collection/log`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ order_id: orderId, dietary_recall: dietaryRecall, exercise_recall: exerciseRecall, collected_at: collectedAt }),
    });
    if (!response.ok) throw new Error('Failed to save collection logs');
    return response.json();
}

export const collectionConfirm = async (orderId: number | string): Promise<KitCollectionData> => {
    const response = await fetch(`${API_URL}/collection/confirm`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ order_id: orderId }),
    });
    if (!response.ok) throw new Error('Failed to confirm collection');
    return response.json();
}

export const collectionShip = async (orderId: number | string, trackingNumber?: string): Promise<KitCollectionData> => {
    const response = await fetch(`${API_URL}/collection/ship`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ order_id: orderId, tracking_number: trackingNumber }),
    });
    if (!response.ok) throw new Error('Failed to ship collection');
    return response.json();
}

export interface MealPlanSuggestion {
    meal: string;
    suggestion: string;
}

export interface DietaryRecommendation {
    summary: string;
    dos?: string[];
    donts?: string[];
    sample_meal_plan?: MealPlanSuggestion[];
}

export interface ExerciseRecommendation {
    summary: string;
    frequency?: string;
    activities?: string[];
    precautions?: string[];
}

export interface RecommendationResponse {
    id: number;
    client: number;
    biomarker_test?: number;
    text?: string;
    doctor_notes?: string;
    dietary_final?: DietaryRecommendation;
    exercise_final?: ExerciseRecommendation;
    status: string;
    approved_at?: string;
    created_at?: string;
}

export const fetchRecommendations = async (clientId: string | number): Promise<RecommendationResponse[]> => {
    const response = await fetch(`${API_URL}/recommendations?client_id=${clientId}`, {
        headers: withAuthHeaders(),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
    }
    return response.json();
}

export interface SecurityQuestionResponse {
    security_question: string;
    security_question_display: string;
}

export const fetchSecurityQuestion = async (email: string): Promise<SecurityQuestionResponse> => {
    const response = await fetch(`${API_URL}/password-recovery/question`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to retrieve security question');
    }
    return response.json();
};

export const verifySecurityAnswer = async (
    email: string,
    securityQuestion: string,
    securityAnswer: string
): Promise<{ token: string }> => {
    const response = await fetch(`${API_URL}/password-recovery/verify-answer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({
            email,
            security_question: securityQuestion,
            security_answer: securityAnswer,
        }),
        credentials: 'include',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw errorData;
    }
    return response.json();
};

export const resetPasswordWithToken = async (
    token: string,
    newPassword: string
): Promise<{ message?: string; password?: string[] }> => {
    const response = await fetch(`${API_URL}/password-recovery/reset-with-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({
            token,
            new_password: newPassword,
        }),
        credentials: 'include',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw errorData;
    }
    return response.json();
};