import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  private hashPassword(password: string): string {
    // Using PBKDF2 for password hashing, safe and has no native build requirements
    return crypto.pbkdf2Sync(password, 'lowca-app-salt-2026', 1000, 64, 'sha512').toString('hex');
  }

  private generateToken(user: UserDocument): string {
    const payload = { sub: user._id, email: user.email, name: user.name };
    return this.jwtService.sign(payload);
  }

  async register(email: string, password: string, name?: string): Promise<any> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email: normalizedEmail }).exec();
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = this.hashPassword(password);
    const createdUser = new this.userModel({
      email: normalizedEmail,
      passwordHash,
      name: name || '',
    });
    const saved = await createdUser.save();
    const token = this.generateToken(saved);

    return {
      token,
      user: {
        id: saved._id,
        email: saved.email,
        name: saved.name,
      },
    };
  }

  async login(email: string, password: string): Promise<any> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const inputHash = this.hashPassword(password);
    if (user.passwordHash !== inputHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new UnauthorizedException('User not found');
    return { id: user._id, email: user.email, name: user.name };
  }
}

