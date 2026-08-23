interface ScreenOrientation {
    lock(orientation: OrientationLockType): Promise<void>;
    unlock(): void;
    readonly angle: number;
    readonly type: OrientationType;
    onchange: ((this: ScreenOrientation, ev: Event) => any) | null;
    addEventListener<K extends keyof ScreenOrientationEventMap>(type: K, listener: (this: ScreenOrientation, ev: ScreenOrientationEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof ScreenOrientationEventMap>(type: K, listener: (this: ScreenOrientation, ev: ScreenOrientationEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare global {
    interface Screen {
        readonly orientation: ScreenOrientation;
    }
} 