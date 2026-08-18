import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { Booth } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface AuthenticatedRequest extends Request {
  booth?: Booth;
}

@Injectable()
export class DeviceTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = req.headers["x-device-token"];

    if (!token || typeof token !== "string") {
      throw new UnauthorizedException("Missing X-Device-Token header");
    }

    const booth = await this.prisma.booth.findUnique({
      where: { deviceToken: token },
    });

    if (!booth) {
      throw new UnauthorizedException("Invalid device token");
    }

    req.booth = booth;
    return true;
  }
}
