import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { validateEnv } from "./env";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [".env"],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModuleGlobal {}
