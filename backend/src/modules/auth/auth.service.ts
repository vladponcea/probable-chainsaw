import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
    validatePassword(password: string): boolean {
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
            console.warn('ADMIN_PASSWORD is not set in environment variables');
            return false;
        }

        if (password === adminPassword) {
            return true;
        }

        throw new UnauthorizedException('Invalid password');
    }
}
