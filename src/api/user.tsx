const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'; // origin

export const login = async (username: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error('Login failed');
    }
    return response.json();
}

export const register = async (user: any): Promise<any> => {
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

    return response.json();
}

export const emailExist = async (email: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/check_email?email=${encodeURIComponent(email)}`)

    if (!response.ok) {
        throw new Error('Email existence check failed' + response);
    }

    const data = await response.json();
    return data.exists;
}

export const fetchDashboard = async (clientId: string | number): Promise<any> => {
    const response = await fetch(`${API_URL}/dashboard?client_id=${clientId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
}

export const fetchKits = async (): Promise<any> => {
    const response = await fetch(`${API_URL}/kits`);
    if (!response.ok) {
        throw new Error('Failed to fetch kits');
    }
    return response.json();
}

export const fetchOrders = async (clientId: string | number): Promise<any> => {
    const response = await fetch(`${API_URL}/orders?client_id=${clientId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch orders');
    }
    return response.json();
}

export const fetchOrderDetail = async (orderId: string | number): Promise<any> => {
    const response = await fetch(`${API_URL}/orders/${orderId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch order detail');
    }
    return response.json();
}
export const getReferralLink = async (clientId: string | number): Promise<{
    referral_code: string;
    patient_count: number;
}> => {
    const response = await fetch(`${API_URL}/provider/referral-link?client_id=${clientId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch referral link');
    }
    return response.json();
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
    fitness_goal: string;
    created_at: string;
    latest_test_date: string | null;
    total_orders: number;
}

export const getProviderPatients = async (clientId: string | number): Promise<Patient[]> => {
    const response = await fetch(`${API_URL}/provider/patients?client_id=${clientId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch provider patients');
    }
    return response.json();
}

export const fetchPayments = async (clientId: string | number): Promise<any> => {
    const response = await fetch(`${API_URL}/payments?client_id=${clientId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch payment history');
    }
    return response.json();
}

export const checkout = async (data: any): Promise<any> => {
    const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Checkout failed');
    }
    return response.json();
}