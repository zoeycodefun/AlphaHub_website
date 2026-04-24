/**
 * auth api service
 * authentication API service
 * seal all HTTP requests related to user authentication(/auth)
 * 1. POST /auth/register -register a new user account
 * 2. POST /auth/login -login and get JWT token
 * 3. GET /auth/me -get current logined user info(need Bearer token)
 * security principles:
 * 1. no sensitive information showed in console
 * 2. JWT token only stored in localStorage key "auth_token"
 * 3. clear expired token after 401 response, and redirect to login page
 */
import axios, { type AxiosInstance, type AxiosResponse } from "axios";
// universal response type(corresponding to backend BaseResponse)
interface BaseResponse {
    success: boolean;
    message: string;
    timestamp: string;
}
interface DataResponse<T> extends BaseResponse {
    data?: T;
}
// request payload type
/**
 * POST /auth/register payload
 */
export interface RegisterPayload {
    email: string;
    password: string;
    confirmPassword: string;
    nickname?: string;
}
/**
 * POST /auth/login payload
 */
export interface LoginPayload {
    email: string;
    password: string;
    rememberMe?: boolean; // if true, token will be stored for 7 days, if false or undifined, token will be stored for 1 day
}
// response data type(data field from backend)
/**
 * user object(the password field will be removed when backend return user info)
 * corresponding to PlatformUserInfo(without password)
 */
export interface AuthUser {
    id: number;
    username: string;
    email: string | null;
    phone: string | null;
    nickname: string | null;
    avatar: string | null;
    enabled: boolean;
    phoneVerified: boolean;
    role: string;
    lastLoginAt: number | null;
    createdAt: string;
    updatedAt: string;
}
/**
 * POST /auth/login 
 * data fields when login is successful
 */
export interface LoginResponseData {
    accessToken: string;
    user: AuthUser;
    expiresIn: string; // 24 hours or 7 days
}
/**
 * POST /auth/register
 * data fields when register is successful
 */
export interface RegisterResponseData {
    user: AuthUser;
}
// AuthApiService class
class AuthApiService {
    private readonly http: AxiosInstance;
    constructor() {
        // create an independent axios instance for auth API, all requests share the same baseURL and configuration
        this.http = axios.create({
            baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api',
            timeout: 15_000, // 15 seconds timeout for auth requests
            headers: {
                'Content-Type': 'application/json'
            },
        });
        // requests interceptor to add Authorization header with Bearer token if available
        this.http.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        // response interceptor to handle 401 Unauthorized globally
        this.http.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // token expired or invalid, clear silently
                    localStorage.removeItem('auth_token');
                    // dispatch global event, let Zustand store listen and quit login state
                    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                }
                return Promise.reject(error);
            }
        );
    }
    /**
     * register a new user account
     * POST /auth/register
     * no token needed
     */
    async register(payload: RegisterPayload): Promise<AuthUser> {
        const response: AxiosResponse<DataResponse<RegisterResponseData>> = 
        await this.http.post('/auth/register', payload);
        return response.data.data!.user;
    }
    /**
     * user login
     * POST /auth/login
     * if successful, store the access token in localStorage and return user info
     */
    async login(payload: LoginPayload): Promise<LoginResponseData> {
        const response: AxiosResponse<DataResponse<LoginResponseData>> =
        await this.http.post('/auth/login', payload);
        const data = response.data.data!;
        // store token in localStorage, keep login state even refresh page
        localStorage.setItem('auth_token', data.accessToken);
        return data;
    }
    /**
     * get complete info of current logined user
     * GET /auth/me
     * need valid Bearer token stored in localStorage
     */
    async getMe(): Promise<AuthUser> {
        const response: AxiosResponse<DataResponse<{ user: AuthUser}>> =
        await this.http.get('/auth/me');
        return response.data.data!.user;
    }
    /**
     * logout user, clear token
     * delete token from localStorage, and do not need to call backend
     */
    logout(): void {
        localStorage.removeItem('auth_token');
    }
}
export const authApiService = new AuthApiService();