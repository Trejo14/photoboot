import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { EventsService } from "./events.service";
import { CreateEventDto } from "./dto/create-event.dto";

@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.list();
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.events.create(dto);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.events.findById(id);
  }
}
