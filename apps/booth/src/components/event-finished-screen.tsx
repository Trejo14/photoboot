import { Button } from "@photobooth/ui";
import { CalendarIcon } from "./icons";

interface Props {
  eventName: string | null;
  onSwitchEvent: () => void;
}

export function EventFinishedScreen({ eventName, onSwitchEvent }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
        <CalendarIcon className="h-9 w-9 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Este evento ya finalizó
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {eventName ? `"${eventName}" ` : "El evento "}
          llegó a su fecha de término y ya no acepta nuevas fotos. Gracias por
          usar Birdcam.
        </p>
      </div>
      <Button size="lg" onClick={onSwitchEvent} className="gradient-birdcam">
        Elegir otro evento
      </Button>
    </div>
  );
}
