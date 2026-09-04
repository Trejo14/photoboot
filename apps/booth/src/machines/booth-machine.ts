import { setup, assign } from "xstate";
import type { DeviceInfo } from "@/lib/db";
import type { LicenseInfo } from "@/lib/license";
import type { PhotoFormat } from "@/lib/formats";
import type { FrameTemplate } from "@/lib/frame-templates";

export interface BoothContext {
  device: DeviceInfo | undefined;
  license: LicenseInfo | undefined;
  licenseBlocked: boolean;
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
  | { type: "BOOT_COMPLETE"; device?: DeviceInfo; license?: LicenseInfo }
  | { type: "WIZARD_COMPLETE" }
  | { type: "LOGIN_SUCCESS" }
  | { type: "SELECT_PLAN"; plan: "free" | "pro" | "lifetime" }
  | { type: "BACK_TO_LOGIN" }
  | { type: "REGISTER_SUCCESS"; device: DeviceInfo }
  | { type: "FORMAT_SELECTED"; format: PhotoFormat }
  | { type: "FRAME_SELECTED"; frame: FrameTemplate }
  | { type: "SKIP_FRAME" }
  | { type: "FRAME_CAPTURED"; blob: Blob }
  | { type: "ALL_FRAMES_CAPTURED"; frames: Blob[] }
  | { type: "RETAKE" }
  | { type: "COMPOSE_COMPLETE"; imageUrl: string; blob: Blob; photoId: string }
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
  | "license";

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
    license: undefined,
    licenseBlocked: false,
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
            target: "format-selection",
            guard: "hasDevice",
            actions: assign({
              device: ({ event }) => event.device,
              license: ({ event }) => event.license,
            }),
          },
          {
            target: "login",
            actions: assign({
              device: ({ event }) => event.device,
              license: ({ event }) => event.license,
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
          { target: "format-selection", guard: "hasDevice" },
          { target: "event-menu" },
        ],
      },
    },

    "plan-selector": {
      on: {
        SELECT_PLAN: [
          { target: "format-selection", guard: "hasDevice" },
          { target: "event-menu" },
        ],
        BACK_TO_LOGIN: "login",
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
        LOGOUT: "login",
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
      },
    },

    agradecimiento: {
      on: {
        THANKS_TIMEOUT: "splash",
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
      },
    },
  },
});

export function getScreenForState(state: { value: string | Record<string, string> }): BoothScreen {
  const val = typeof state.value === "string" ? state.value : Object.keys(state.value)[0] ?? "splash";
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
  };
  return map[val] ?? "splash";
}
