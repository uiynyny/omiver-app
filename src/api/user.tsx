const API_URL = 'https://www.omiver.me/api';

export const login = async (username: string, password: string): Promise<string> => {
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
    console.log(response)
    return response.text();
}

export const register = async (user: any): Promise<string> => {
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

    return response.text();
}

export const emailExist = async (email: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/check_email?email=${encodeURIComponent(email)}`)

    if (!response.ok) {
        throw new Error('Email existence check failed' + response);
    }

    const data = await response.json();
    return data.exists;
}