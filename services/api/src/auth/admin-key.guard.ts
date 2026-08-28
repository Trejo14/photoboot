import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.headers["x-admin-key"];
    const expected = this.config.get<string>("ADMIN_KEY");

    if (!expected || !key || typeof key !== "string" || key !== expected) {
      throw new UnauthorizedException("Invalid admin key");
    }
    return true;
  }
}