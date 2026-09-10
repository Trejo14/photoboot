import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { ConfigService } from "@nestjs/config";
import { S3Service } from "../s3/s3.service";

@Controller("download")
export class DownloadController {
  private readonly installerKey: string;
  private readonly installerMsiKey: string;

  constructor(
    private readonly s3: S3Service,
    private readonly config: ConfigService,
  ) {
    this.installerKey =
      this.config.get<string>("DOWNLOAD_INSTALLER_KEY") ??
      "installers/birdcam-setup.exe";
    this.installerMsiKey =
      this.config.get<string>("DOWNLOAD_INSTALLER_MSI_KEY") ??
      "installers/birdcam-setup.msi";
  }

  // Streams the file through our own domain instead of redirecting to the
  // raw R2 bucket URL. Browser download-reputation checks (Chrome/Edge Safe
  // Browsing) weigh the hosting domain, and a public *.r2.dev bucket is a
  // much more commonly abused domain for malware than our own API host.
  @Get()
  async installer(@Res() res: Response): Promise<void> {
    await this.stream(
      res,
      this.installerKey,
      "birdcam-setup.exe",
      "application/x-msdownload",
    );
  }

  // Alternate .msi bundle. NSIS installers are, in practice, a far more
  // common malware-dropper wrapper than WiX/MSI, so some heuristic scanners
  // flag them more readily — offered as a fallback while the app is unsigned.
  @Get("msi")
  async installerMsi(@Res() res: Response): Promise<void> {
    await this.stream(
      res,
      this.installerMsiKey,
      "birdcam-setup.msi",
      "application/x-msi",
    );
  }

  private async stream(
    res: Response,
    key: string,
    filename: string,
    fallbackContentType: string,
  ): Promise<void> {
    const base = this.config.get<string>("S3_PUBLIC_BASE_URL");
    if (!base) {
      throw new HttpException(
        "El instalador no está configurado aún.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const { body, contentType, contentLength } =
      await this.s3.getObjectStream(key);

    res.setHeader("Content-Type", contentType ?? fallbackContentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    body.pipe(res);
  }
}
