/**
 * Comandos de Tauri que hacen `Err(String)` del lado de Rust rechazan la
 * promesa en JS con ese STRING directo, no con un `Error` — así que
 * `err instanceof Error` es falso y el mensaje real (el único dato útil
 * para diagnosticar) se perdía, mostrando siempre un texto genérico.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}
