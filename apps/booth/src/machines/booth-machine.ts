import { setup, assign } from "xstate";
import type { DeviceInfo } from "@/lib/db";
import type { LicenseInfo } from "@/lib/license";
import type { PhotoFormat } from "@/lib/formats";
import type { FrameTemplate } from "@/lib/frame-templates";

export interface BoothContext {
  device: DeviceInfo | undefined;
  userEmail: string | null;
  license: LicenseInfo | undefined;
  licenseBlocked: boolean;
  eventFinished: boolean;
  eventName: string | null;
  format: PhotoFormat | undefined;
  frameTemplate: FrameTemplate | undefined;
  frames: Blob[];
  currentFrameIndex: number;
  composedImageUrl: string | null;
  composedBlob: Blob | null;
  photoId: string | null;
  printerError: string | null;
  splashProgress: number;
  splashText: string;
  online: boolean;
  pendingCount: number;
  syncing: boolean;
}

export type BoothEvent =
  | { type: "SPLASH_COMPLETE" }
  | {
      type: "BOOT_COMPLETE";
      device?: DeviceInfo;
      license?: LicenseInfo;
      eventFinished?: boolean;
      eventName?: string | null;
      authenticated?: boolean;
      userEmail?: string | null;
    }
  | { type: "WIZARD_COMPLETE" }
  | { type: "LOGIN_SUCCESS"; email: string }
  | { type: "SELECT_PLAN"; plan: "free" | "pro" | "lifetime"; email?: string }
  | { type: "REGISTER_SUCCESS"; device: DeviceInfo }
  | { type: "FORMAT_SELECTED"; format: PhotoFormat }
  | { type: "FRAME_SELECTED"; frame: FrameTemplate }
  | { type: "SKIP_FRAME" }
  | { type: "FRAME_CAPTURED"; blob: Blob }
  | { type: "ALL_FRAMES_CAPTURED"; frames: Blob[] }
  | { type: "RETAKE" }
  | {
      type: "COMPOSE_COMPLETE";
      imageUrl: string;
      blob: Blob;
      photoId: string | null;
    }
  | { type: "COMPOSE_FAILED"; error: string }
  | { type: "PRINT_SUCCESS" }
  | { type: "PRINT_FAILED"; error: string }
  | { type: "PRINT_RETRY" }
  | { type: "SKIP_PRINT" }
  | { type: "AUTO_PRINT" }
  | { type: "THANKS_TIMEOUT" }
  | { type: "LICENSE_ACTIVATED"; license: LicenseInfo }
  | { type: "LICENSE_BLOCKED" }
  | { type: "SHOW_LICENSE_SCREEN" }
  | { type: "HIDE_LICENSE_SCREEN" }
  | { type: "SWITCH_EVENT" }
  | { type: "LOGOUT" }
  | { type: "SHOW_EXIT_CONFIRM" }
  | { type: "HIDE_EXIT_CONFIRM" }
  | { type: "BACK" }
  | { type: "ABANDON_SESSION" }
  | { type: "GO_ONLINE" }
  | { type: "GO_OFFLINE" }
  | { type: "SET_PENDING"; count: number }
  | { type: "SET_SYNCING"; syncing: boolean }
  | { type: "SET_SPLASH"; progress: number; text: string };

export type BoothScreen =
  | "splash"
  | "wizard"
  | "login"
  | "plan-selector"
  | "event-menu"
  | "format-selection"
  | "frame-selection"
  | "capture"
  | "preview"
  | "procesando"
  | "vista-final"
  | "imprimiendo"
  | "agradecimiento"
  | "license"
  | "event-finished";

export const boothMachine = setup({
  types: {
    context: {} as BoothContext,
    events: {} as BoothEvent,
  },
  guards: {
    hasDevice: ({ context }) => !!context.device,
    noDevice: ({ context }) => !context.device,
  },
}).createMachine({
  id: "booth",
  initial: "splash",
  context: {
    device: undefined,
    userEmail: null,
    license: undefined,
    licenseBlocked: false,
    eventFinished: false,
    eventName: null,
    format: undefined,
    frameTemplate: undefined,
    frames: [],
    currentFrameIndex: 0,
    composedImageUrl: null,
    composedBlob: null,
    photoId: null,
    printerError: null,
    splashProgress: 0,
    splashText: "",
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingCount: 0,
    syncing: false,
  },
  on: {
    LICENSE_BLOCKED: {
      actions: assign({ licenseBlocked: true }),
    },
    // Fallback for states other than "license" (e.g. activating from an
    // in-context upsell on frame-selection): update the license without
    // forcing a screen change. The "license" state below defines its own
    // LICENSE_ACTIVATED transition which takes precedence while active.
    LICENSE_ACTIVATED: {
      actions: assign({
        license: ({ event }) => event.license,
        licenseBlocked: false,
      }),
    },
    GO_ONLINE: {
      actions: assign({ online: true }),
    },
    GO_OFFLINE: {
      actions: assign({ online: false }),
    },
    SET_PENDING: {
      actions: assign({ pendingCount: ({ event }) => event.count }),
    },
    SET_SYNCING: {
      actions: assign({ syncing: ({ event }) => event.syncing }),
    },
  },
  states: {
    splash: {
      on: {
        SET_SPLASH: {
          actions: assign({
            splashProgress: ({ event }) => event.progress,
            splashText: ({ event }) => event.text,
          }),
        },
        BOOT_COMPLETE: [
          {
            target: "event-finished",
            // Ojo: en el primer BOOT_COMPLETE de la vida de esta máquina
            // (cada vez que se abre la app) `context.device` todavía está
            // vacío — el dato real viene en el evento, no en el contexto
            // previo. Los guards con nombre (hasDevice/noDevice) de más
            // abajo sí pueden usar context.device porque para cuando se
            // disparan, ya quedó asignado aquí.
            guard: ({ event }) => !!event.device && !!event.eventFinished,
            actions: assign({
              device: ({ event }) => event.device,
              license: ({ event }) => event.license,
              eventFinished: true,
              eventName: ({ event }) => event.eventName ?? null,
              userEmail: ({ event }) => event.userEmail ?? null,
            }),
          },
          {
            target: "format-selection",
            guard: ({ event }) => !!event.device,
            actions: assign({
              device: ({ event }) => event.device,
              license: ({ event }) => event.license,
              eventFinished: false,
              eventName: null,
              userEmail: ({ event }) => event.userEmail ?? null,
            }),
          },
          {
            // Sin dispositivo registrado pero con una sesión de operador
            // válida (token guardado) — nos saltamos el login y vamos
            // directo a elegir evento, en vez de pedir credenciales de
            // nuevo cada vez que se abre la app.
            target: "event-menu",
            guard: ({ event }) => !event.device && !!event.authenticated,
            actions: assign({
              device: undefined,
              license: ({ event }) => event.license,
              eventFinished: false,
              eventName: null,
              userEmail: ({ event }) => event.userEmail ?? null,
            }),
          },
          {
            target: "login",
            actions: assign({
              device: ({ event }) => event.device,
              license: ({ event }) => event.license,
              eventFinished: false,
              eventName: null,
              userEmail: ({ event }) => event.userEmail ?? null,
            }),
          },
        ],
        SPLASH_COMPLETE: "login",
      },
    },

    wizard: {
      on: {
        WIZARD_COMPLETE: "login",
      },
    },

    login: {
      on: {
        LOGIN_SUCCESS: [
          {
            target: "format-selection",
            guard: "hasDevice",
            actions: assign({ userEmail: ({ event }) => event.email }),
          },
          {
            target: "event-menu",
            actions: assign({ userEmail: ({ event }) => event.email }),
          },
        ],
        SELECT_PLAN: [
          {
            target: "format-selection",
            guard: "hasDevice",
            actions: assign({
              userEmail: ({ event }) => event.email ?? null,
            }),
          },
          {
            target: "event-menu",
            actions: assign({
              userEmail: ({ event }) => event.email ?? null,
            }),
          },
        ],
      },
    },

    "plan-selector": {
      on: {
        SELECT_PLAN: [
          { target: "format-selection", guard: "hasDevice" },
          { target: "event-menu" },
        ],
        BACK: "login",
      },
    },

    "event-menu": {
      on: {
        REGISTER_SUCCESS: {
          actions: assign({
            device: ({ event }) => event.device,
          }),
          target: "format-selection",
        },
        LOGOUT: {
          target: "login",
          actions: assign({ device: undefined, userEmail: null }),
        },
      },
    },

    "format-selection": {
      on: {
        FORMAT_SELECTED: {
          actions: assign({
            format: ({ event }) => event.format,
            frames: [],
            currentFrameIndex: 0,
          }),
          target: "frame-selection",
        },
        SWITCH_EVENT: "event-menu",
        BACK: "event-menu",
      },
    },

    "frame-selection": {
      on: {
        FRAME_SELECTED: {
          actions: assign({
            frameTemplate: ({ event }) => event.frame,
          }),
          target: "capture",
        },
        SKIP_FRAME: {
          actions: assign({
            frameTemplate: undefined,
          }),
          target: "capture",
        },
        SWITCH_EVENT: "event-menu",
        BACK: "format-selection",
        ABANDON_SESSION: {
          target: "format-selection",
          actions: assign({
            frames: [],
            currentFrameIndex: 0,
            composedImageUrl: null,
            composedBlob: null,
            photoId: null,
            printerError: null,
          }),
        },
      },
    },

    capture: {
      entry: assign({
        frames: [],
        currentFrameIndex: 0,
        composedImageUrl: null,
        composedBlob: null,
        photoId: null,
        printerError: null,
      }),
      on: {
        ALL_FRAMES_CAPTURED: {
          actions: assign({
            frames: ({ event }) => event.frames,
          }),
          target: "preview",
        },
        FRAME_CAPTURED: {
          actions: assign({
            frames: ({ context, event }) => [...context.frames, event.blob],
            currentFrameIndex: ({ context }) => context.currentFrameIndex + 1,
          }),
        },
        SHOW_LICENSE_SCREEN: "license",
        SWITCH_EVENT: "event-menu",
        LOGOUT: {
          target: "login",
          actions: assign({ device: undefined, userEmail: null }),
        },
        BACK: "frame-selection",
        ABANDON_SESSION: {
          target: "format-selection",
          actions: assign({
            frames: [],
            currentFrameIndex: 0,
            composedImageUrl: null,
            composedBlob: null,
            photoId: null,
            printerError: null,
          }),
        },
      },
    },

    preview: {
      on: {
        RETAKE: "capture",
        COMPOSE_COMPLETE: {
          actions: assign({
            composedImageUrl: ({ event }) => event.imageUrl,
            composedBlob: ({ event }) => event.blob,
            photoId: ({ event }) => event.photoId,
          }),
          target: "vista-final",
        },
        COMPOSE_FAILED: {
          actions: assign({
            printerError: ({ event }) => event.error,
          }),
        },
        BACK: "capture",
        ABANDON_SESSION: {
          target: "format-selection",
          actions: assign({
            frames: [],
            currentFrameIndex: 0,
            composedImageUrl: null,
            composedBlob: null,
            photoId: null,
            printerError: null,
          }),
        },
      },
    },

    procesando: {
      on: {
        COMPOSE_COMPLETE: {
          actions: assign({
            composedImageUrl: ({ event }) => event.imageUrl,
            composedBlob: ({ event }) => event.blob,
            photoId: ({ event }) => event.photoId,
          }),
          target: "vista-final",
        },
        COMPOSE_FAILED: {
          actions: assign({
            printerError: ({ event }) => event.error,
          }),
          target: "preview",
        },
      },
    },

    "vista-final": {
      on: {
        AUTO_PRINT: "imprimiendo",
        ABANDON_SESSION: {
          target: "format-selection",
          actions: assign({
            frames: [],
            currentFrameIndex: 0,
            composedImageUrl: null,
            composedBlob: null,
            photoId: null,
            printerError: null,
          }),
        },
      },
    },

    imprimiendo: {
      on: {
        PRINT_SUCCESS: "agradecimiento",
        PRINT_FAILED: {
          actions: assign({
            printerError: ({ event }) => event.error,
          }),
        },
        PRINT_RETRY: "imprimiendo",
        SKIP_PRINT: "agradecimiento",
        // The print job already sent to the OS spool can't be recalled,
        // but there's no reason to trap the operator on this screen if
        // they need to bail (e.g. the wrong image was about to print).
        ABANDON_SESSION: {
          target: "format-selection",
          actions: assign({
            frames: [],
            currentFrameIndex: 0,
            composedImageUrl: null,
            composedBlob: null,
            photoId: null,
            printerError: null,
          }),
        },
      },
    },

    agradecimiento: {
      on: {
        THANKS_TIMEOUT: "splash",
        ABANDON_SESSION: {
          target: "format-selection",
          actions: assign({
            frames: [],
            currentFrameIndex: 0,
            composedImageUrl: null,
            composedBlob: null,
            photoId: null,
            printerError: null,
          }),
        },
      },
    },

    license: {
      on: {
        LICENSE_ACTIVATED: {
          actions: assign({
            license: ({ event }) => event.license,
            licenseBlocked: false,
          }),
          target: "capture",
        },
        HIDE_LICENSE_SCREEN: "capture",
        BACK: {
          target: "capture",
          guard: ({ context }) => !context.licenseBlocked,
        },
        ABANDON_SESSION: {
          target: "format-selection",
          guard: ({ context }) => !context.licenseBlocked,
          actions: assign({
            frames: [],
            currentFrameIndex: 0,
            composedImageUrl: null,
            composedBlob: null,
            photoId: null,
            printerError: null,
          }),
        },
      },
    },

    "event-finished": {
      on: {
        SWITCH_EVENT: {
          target: "event-menu",
          actions: assign({ eventFinished: false, eventName: null }),
        },
        LOGOUT: {
          target: "login",
          actions: assign({
            eventFinished: false,
            eventName: null,
            device: undefined,
            userEmail: null,
          }),
        },
      },
    },
  },
});

export function getScreenForState(state: {
  value: string | Record<string, string>;
}): BoothScreen {
  const val =
    typeof state.value === "string"
      ? state.value
      : (Object.keys(state.value)[0] ?? "splash");
  const map: Record<string, BoothScreen> = {
    splash: "splash",
    wizard: "wizard",
    login: "login",
    "plan-selector": "plan-selector",
    "event-menu": "event-menu",
    "format-selection": "format-selection",
    "frame-selection": "frame-selection",
    capture: "capture",
    preview: "preview",
    procesando: "procesando",
    "vista-final": "vista-final",
    imprimiendo: "imprimiendo",
    agradecimiento: "agradecimiento",
    license: "license",
    "event-finished": "event-finished",
  };
  return map[val] ?? "splash";
}
