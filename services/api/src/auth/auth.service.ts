import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";

const CODE_LENGTH = 6;
const CODE_EXPIRY_MS = 10 * 60 * 1000;
const RATE_LIMIT_MS = 60 * 1000;
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService
  ) {}

  private generateCode(): string {
    return Array.from({ length: CODE_LENGTH }, () =>
      Math.floor(Math.random() * 10).toString()
    ).join("");
  }

  private signToken(user: { id: string; email: string }): string {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{
    token: string;
    user: { id: string; email: string; name: string };
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException("Ya existe una cuenta con este email");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: passwordHash,
        plan: "free",
      },
    });

    const token = this.signToken(user);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name! },
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{
    token: string;
    user: { id: string; email: string; name: string | null };
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    if (!user.password) {
      throw new UnauthorizedException(
        "Esta cuenta usa login por código. Usa el código de verificación."
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const token = this.signToken(user);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async requestCode(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const recentCode = await this.prisma.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_MS) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentCode) {
      throw new BadRequestException(
        "Espera un momento antes de solicitar otro código"
      );
    }

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    await this.prisma.verificationCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
        userId: user?.id ?? null,
      },
    });

    await this.email.sendVerificationCode(normalizedEmail, code);

    return { message: "Código enviado" };
  }

  async verifyCode(
    email: string,
    code: string
  ): Promise<{
    token: string;
    user: { id: string; email: string; name: string | null };
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      throw new UnauthorizedException("Código inválido o expirado");
    }

    await this.prisma.verificationCode.update({
      where: { id: verification.id },
      data: { used: true },
    });

    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email: normalizedEmail },
      });
    }

    const token = this.signToken(user);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) {
      throw new UnauthorizedException("Usuario no encontrado");
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      planStatus: user.planStatus,
      planExpiresAt: user.planExpiresAt,
      organizationId: user.organizationId,
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            plan: user.organization.plan,
          }
        : null,
    };
  }
}
