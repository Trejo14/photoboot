import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";
import type { AuthenticatedRequest } from "./jwt.guard";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.name, dto.email, dto.password);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("request-code")
  requestCode(@Body("email") email: string) {
    if (!email || typeof email !== "string") {
      return { message: "Email requerido" };
    }
    return this.auth.requestCode(email);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("verify-code")
  verifyCode(@Body("email") email: string, @Body("code") code: string) {
    if (!email || !code) {
      return { message: "Email y código requeridos" };
    }
    return this.auth.verifyCode(email, code);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.auth.getProfile(req.user!.id, req.user!.emailVerified);
  }
}
