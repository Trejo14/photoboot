import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@photobooth/ui";
import { LogoBirdcam } from "./logo";
import { AuthHeroPanel } from "./auth-hero-panel";
import {
  MailIcon,
  CheckCircleIcon,
  ExclamationIcon,
  LockIcon,
  UserIcon,
} from "./icons";
import {
  login,
  register,
  requestCode,
  verifyCode,
  setAuthToken,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";

interface Props {
  onAuthenticated: (email: string) => void;
  onSelectPlan?: (plan: "free" | "pro" | "lifetime", email: string) => void;
}

type Tab = "login" | "register";
type LoginMode = "password" | "otp";

function mapError(msg: string): string {
  if (
    msg.toLowerCase().includes("failed to fetch") ||
    msg.toLowerCase().includes("networkerror")
  ) {
    return "No pudimos conectar con el servidor. Verifica tu conexión e intenta de nuevo.";
  }
  if (
    msg.toLowerCase().includes("401") ||
    msg.toLowerCase().includes("unauthorized")
  ) {
    return "Credenciales incorrectas. Verifica tu correo y contraseña.";
  }
  if (
    msg.toLowerCase().includes("409") ||
    msg.toLowerCase().includes("conflict")
  ) {
    return "Ya existe una cuenta con ese correo electrónico.";
  }
  return msg;
}

export function AdminLoginScreen({ onAuthenticated, onSelectPlan }: Props) {
  const [tab, setTab] = useState<Tab>("login");
  const [mode, setMode] = useState<LoginMode>("password");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);
  const [registered, setRegistered] = useState(false);

  function startResendCooldown() {
    setResendCooldown(60);
    const iv = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(iv);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLastAction(() => () => handleLogin(e));
    try {
      await login(email.trim(), password);
      onAuthenticated(email.trim());
    } catch (err) {
      setError(mapError(errorMessage(err, "Credenciales inválidas")));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLastAction(() => () => handleRegister(e));
    try {
      const result = await register(name.trim(), email.trim(), password);
      await setAuthToken(result.token);
      setRegistered(true);
      setTimeout(() => {
        if (onSelectPlan) {
          onSelectPlan("free", email.trim());
        } else {
          onAuthenticated(email.trim());
        }
      }, 1200);
    } catch (err) {
      setError(mapError(errorMessage(err, "No se pudo crear la cuenta")));
      setLoading(false);
    }
  }

  async function handleRequestOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLastAction(() => () => handleRequestOtp(e));
    try {
      await requestCode(email.trim());
      setOtpStep("code");
      startResendCooldown();
    } catch (err) {
      setError(mapError(errorMessage(err, "No se pudo enviar el código")));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLastAction(() => () => handleVerifyOtp(e));
    try {
      await verifyCode(email.trim(), code.trim());
      onAuthenticated(email.trim());
    } catch (err) {
      setError(mapError(errorMessage(err, "Código inválido")));
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    setLastAction(() => handleResendOtp);
    try {
      await requestCode(email.trim());
      startResendCooldown();
    } catch (err) {
      setError(mapError(errorMessage(err, "No se pudo reenviar el código")));
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setName("");
    setEmail("");
    setPassword("");
    setCode("");
    setError(null);
    setOtpStep("email");
    setLastAction(null);
    setRegistered(false);
  }

  function handleRetry() {
    if (lastAction) {
      setError(null);
      lastAction();
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0f] p-4">
      {/* Floating blobs */}
      <div
        className="blob blob-1"
        style={{
          width: 300,
          height: 300,
          background: "#a78bfa",
          top: "10%",
          left: "10%",
          animation: "float 15s ease-in-out infinite alternate",
        }}
      />
      <div
        className="blob blob-2"
        style={{
          width: 250,
          height: 250,
          background: "#f472b6",
          bottom: "15%",
          right: "10%",
          animation: "float-reverse 18s ease-in-out infinite alternate",
        }}
      />
      <div
        className="blob blob-3"
        style={{
          width: 200,
          height: 200,
          background: "#22d3ee",
          top: "50%",
          left: "60%",
          animation: "float 20s ease-in-out infinite alternate",
        }}
      />

      <div
        className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-2xl animate-fade-in"
        style={{ minHeight: 520 }}
      >
        {/* Card */}
        <Card className="glass w-full max-w-sm shrink-0 border-0 md:rounded-r-none">
          <CardHeader>
            <div className="flex justify-center">
              <LogoBirdcam size="8" className="text-white" />
            </div>
            <CardTitle className="text-center text-lg">
              {tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tab switcher */}
            <div className="mb-4 flex rounded-lg bg-muted p-0.5">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  resetAll();
                }}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  resetAll();
                }}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Registrarme
              </button>
            </div>

            {/* LOGIN TAB */}
            {tab === "login" && (
              <div key="login" className="animate-fade-in">
                {mode === "password" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MailIcon className="h-4 w-4 text-muted-foreground" />
                        Correo electrónico
                      </label>
                      <Input
                        type="email"
                        autoFocus
                        placeholder="tu@ejemplo.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        className="input-birdcam"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <LockIcon className="h-4 w-4 text-muted-foreground" />
                        Contraseña
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        className="input-birdcam"
                        required
                        minLength={8}
                      />
                    </div>
                    {error && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                        <ExclamationIcon className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-red-300/80">{error}</p>
                          {lastAction && (
                            <button
                              type="button"
                              onClick={handleRetry}
                              className="mt-1 text-xs font-medium text-red-400 underline underline-offset-2 hover:text-red-300"
                            >
                              Reintentar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full gradient-birdcam hover:brightness-110 transition-all"
                      disabled={loading || !email.trim() || !password}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spinner rounded-full border-2 border-white/30 border-t-white" />
                          Entrando…
                        </span>
                      ) : (
                        "Iniciar sesión"
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("otp");
                        setError(null);
                      }}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      ¿No recuerdas tu contraseña? Usa un código por email
                    </button>
                  </form>
                ) : /* OTP Mode */
                otpStep === "email" ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Ingresa tu correo para recibir un código de verificación.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MailIcon className="h-4 w-4 text-muted-foreground" />
                        Correo electrónico
                      </label>
                      <Input
                        type="email"
                        autoFocus
                        placeholder="tu@ejemplo.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        className="input-birdcam"
                        required
                      />
                    </div>
                    {error && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                        <ExclamationIcon className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-red-300/80">{error}</p>
                          {lastAction && (
                            <button
                              type="button"
                              onClick={handleRetry}
                              className="mt-1 text-xs font-medium text-red-400 underline underline-offset-2 hover:text-red-300"
                            >
                              Reintentar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full gradient-birdcam hover:brightness-110 transition-all"
                      disabled={loading || !email.trim()}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spinner rounded-full border-2 border-white/30 border-t-white" />
                          Enviando…
                        </span>
                      ) : (
                        "Enviar código"
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("password");
                        setError(null);
                      }}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      Volver a contraseña
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#a78bfa]/10">
                        <CheckCircleIcon className="h-6 w-6 text-[#a78bfa]" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Enviamos un código a
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {email}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Código de verificación
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        placeholder="000000"
                        className="input-birdcam text-center text-lg tracking-[0.5em]"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.replace(/\D/g, ""));
                          setError(null);
                        }}
                        maxLength={6}
                      />
                    </div>
                    {error && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                        <ExclamationIcon className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-red-300/80">{error}</p>
                          {lastAction && (
                            <button
                              type="button"
                              onClick={handleRetry}
                              className="mt-1 text-xs font-medium text-red-400 underline underline-offset-2 hover:text-red-300"
                            >
                              Reintentar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full gradient-birdcam hover:brightness-110 transition-all"
                      disabled={loading || code.length < 6}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spinner rounded-full border-2 border-white/30 border-t-white" />
                          Verificando…
                        </span>
                      ) : (
                        "Iniciar sesión"
                      )}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setOtpStep("email");
                          setCode("");
                          setError(null);
                        }}
                      >
                        Cambiar email
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || loading}
                      >
                        {resendCooldown > 0
                          ? `Reenviar (${resendCooldown}s)`
                          : "Reenviar código"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* REGISTER TAB */}
            {tab === "register" && registered && (
              <div
                key="register-success"
                className="flex flex-col items-center gap-3 py-6 animate-fade-in"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircleIcon className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-center text-sm font-medium text-foreground">
                  ¡Cuenta creada! Usuario registrado correctamente.
                </p>
              </div>
            )}
            {tab === "register" && !registered && (
              <div key="register" className="animate-fade-in">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      Nombre
                    </label>
                    <Input
                      type="text"
                      autoFocus
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError(null);
                      }}
                      className="input-birdcam"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MailIcon className="h-4 w-4 text-muted-foreground" />
                      Correo electrónico
                    </label>
                    <Input
                      type="email"
                      placeholder="tu@ejemplo.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="input-birdcam"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <LockIcon className="h-4 w-4 text-muted-foreground" />
                      Contraseña
                    </label>
                    <Input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      className="input-birdcam"
                      required
                      minLength={8}
                    />
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                      <ExclamationIcon className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-red-300/80">{error}</p>
                        {lastAction && (
                          <button
                            type="button"
                            onClick={handleRetry}
                            className="mt-1 text-xs font-medium text-red-400 underline underline-offset-2 hover:text-red-300"
                          >
                            Reintentar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full gradient-birdcam hover:brightness-110 transition-all"
                    disabled={
                      loading || !name.trim() || !email.trim() || !password
                    }
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spinner rounded-full border-2 border-white/30 border-t-white" />
                        Creando cuenta…
                      </span>
                    ) : (
                      "Crear cuenta"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Al crear cuenta seleccionarás tu plan en el siguiente paso.
                  </p>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hero panel — desktop only */}
        <AuthHeroPanel />
      </div>
    </main>
  );
}
