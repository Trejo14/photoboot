import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly resend: Resend | null = null;
  private readonly from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.from = this.config.get<string>("EMAIL_FROM") || "noreply@birdcam.app";
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn("RESEND_API_KEY not set — emails will be logged to console");
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const subject = "Tu código de Birdcam";
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:480px;margin:40px auto;padding:40px;background-color:#141414;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">Birdcam</h1>
          </div>
          <p style="color:#a0a0a0;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Usa el siguiente código para iniciar sesión:
          </p>
          <div style="text-align:center;margin:32px 0;">
            <span style="display:inline-block;font-size:48px;font-weight:700;letter-spacing:12px;color:#ffffff;background:linear-gradient(135deg,#a78bfa,#f472b6,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
              ${code}
            </span>
          </div>
          <p style="color:#666666;font-size:12px;line-height:1.5;margin:0;text-align:center;">
            Este código expira en 10 minutos.<br>
            Si no solicitaste este código, puedes ignorar este mensaje.
          </p>
        </div>
      </body>
      </html>
    `;

    if (this.resend) {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject,
        html,
      });
    } else {
      this.logger.log(`[DEV] Verification code for ${email}: ${code}`);
    }
  }

  async sendLicenseKey(
    email: string,
    licenseKey: string,
    plan: string
  ): Promise<void> {
    const planLabel = plan === "lifetime" ? "LIFETIME" : "PRO";
    const subject = `Tu licencia Birdcam ${planLabel}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:480px;margin:40px auto;padding:40px;background-color:#141414;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">Birdcam</h1>
          </div>
          <p style="color:#a0a0a0;font-size:14px;line-height:1.6;margin:0 0 24px;">
            ¡Gracias por tu compra! Este es tu ID de membresía ${planLabel}.
            Ábrelo dentro de la app de Birdcam para activar tu plan.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <span style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:2px;color:#38bdf8;">
              ${licenseKey}
            </span>
          </div>
          <p style="color:#666666;font-size:12px;line-height:1.5;margin:0;text-align:center;">
            Descarga la app desde birdcam.app si aún no lo has hecho, inicia sesión
            y pega este código cuando te pida activar tu licencia.
          </p>
        </div>
      </body>
      </html>
    `;

    if (this.resend) {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject,
        html,
      });
    } else {
      this.logger.log(`[DEV] License key for ${email} (${plan}): ${licenseKey}`);
    }
  }
}
