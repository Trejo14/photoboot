import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { EventsService } from "./events.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import type { AuthenticatedRequest } from "../auth/jwt.guard";
import { AdminKeyGuard } from "../auth/admin-key.guard";

@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.events.listForUser(req.user!.organizationId);
  }

  @UseGuards(AdminKeyGuard)
  @Get("admin")
  listAll() {
    return this.events.listAll();
  }

  @UseGuards(AdminKeyGuard)
  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.events.create(dto);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.events.findById(id);
  }
}
