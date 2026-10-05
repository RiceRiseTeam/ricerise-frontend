import type {DtoUserDto} from "@/api/api";

const ACCESS_TOKEN_KEY = 'app_access_token';
const USER_KEY = "app_current_user"

export const tokenStorage = {
    getAccessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },
    setAccessToken(token: string): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    },
    clearAccessToken(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    },
};

export const userStorage = {
    getCurrentUser(): DtoUserDto | null {
        const data = localStorage.getItem(USER_KEY)
        if (!data) return null

        return JSON.parse(data)
    },
    setCurrentUser(user: DtoUserDto | null) {
        if (user == null){
            localStorage.removeItem(USER_KEY)
        }
        localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
}