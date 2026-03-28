const API_URL = 'http://localhost:8000/api'; // origin

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