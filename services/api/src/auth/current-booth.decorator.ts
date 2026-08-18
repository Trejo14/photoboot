import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Booth } from "@prisma/client";
import type { AuthenticatedRequest } from "./device-token.guard";

export const CurrentBooth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Booth => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.booth) {
      throw new Error("CurrentBooth used without DeviceTokenGuard");
    }
    return req.booth;
  }
);
