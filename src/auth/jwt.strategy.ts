import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    // private configService: ConfigService, // If using ConfigModule
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-key',
    });
  }

  async validate(payload: { sub: number; email: string; role: UserRole }) {
    const user = await this.userRepository.findOne({
      where: { userId: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Attach full user to req.user (for guards/services)
    (user as Partial<User>).password = undefined; // Security: Don't expose hashed pass
    return { ...user, role: payload.role }; // Merge payload role for quick access
  }
}
