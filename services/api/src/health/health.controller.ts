import { Controller, Get } from "@nestjs/common";
import type { HealthOutput } from "@photobooth/types";

@Controller()
export class HealthController {
  @Get("health")
  health(): HealthOutput {
    return {
      status: "ok",
      service: "@photobooth/api",
      timestamp: new Date().toISOString(),
    };
  }
}
