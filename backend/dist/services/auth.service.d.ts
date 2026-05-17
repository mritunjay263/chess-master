import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
export declare class AuthService {
    register(data: RegisterDto): Promise<{
        user: {
            email: string;
            username: string;
            id: string;
            elo: number;
            createdAt: Date;
        };
        token: string;
    }>;
    login(data: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            elo: number;
            wins: number;
            losses: number;
            draws: number;
            gamesPlayed: number;
        };
        token: string;
    }>;
    getProfile(userId: string): Promise<{
        email: string;
        username: string;
        id: string;
        elo: number;
        wins: number;
        losses: number;
        draws: number;
        gamesPlayed: number;
        createdAt: Date;
    }>;
    private generateToken;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map