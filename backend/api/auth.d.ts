export interface SignupParams {
    email: string;
    password: string;
}

export interface SignupResult {
    userId: number;
    username: string;
}

export function signupUser(params: SignupParams): Promise<SignupResult>;
