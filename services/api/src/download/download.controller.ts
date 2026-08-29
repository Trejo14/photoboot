import { Controller, Get, HttpException, HttpStatus, Redirect } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Service } from "../s3/s3.service";

interface DownloadResult {
  url: string;
  statusCode: 302;
}

@Controller("download")
export class DownloadController {
  private readonly installerKey: string;

  constructor(
    private readonly s3: S3Service,
    private readonly config: ConfigService
  ) {
    this.installerKey =
      this.config.get<string>("DOWNLOAD_INSTALLER_KEY") ?? "installers/birdcam-setup.exe";
  }

  @Get()
  @Redirect()
  installer(): DownloadResult {
    const base = this.config.get<string>("S3_PUBLIC_BASE_URL");
    if (!base) {
      throw new HttpException(
        "El instalador no está configurado aún.",
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
    return {
      url: this.s3.publicUrl(this.installerKey),
      statusCode: 302,
    };
  }
}
