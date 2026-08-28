import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Observable } from "rxjs";
import type { AuthenticatedUser } from "./jwt.strategy";

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}
