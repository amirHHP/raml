import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Physical feedback for the moments that should feel like a decision landing.
 * Desktop browsers and devices without a vibrator reject these calls, so every
 * trigger is fire-and-forget: a missing haptic must never interrupt a turn.
 */
function fire(run: () => Promise<void>): void {
  void run().catch(() => undefined);
}

/** Picking a choice card or confirming a form. */
export function tapFeedback(): void {
  fire(() => Haptics.impact({ style: ImpactStyle.Light }));
}

/** The dice leaving the hand. */
export function diceFeedback(): void {
  fire(() => Haptics.impact({ style: ImpactStyle.Medium }));
}

/** A skill check the player passed. */
export function successFeedback(): void {
  fire(() => Haptics.notification({ type: NotificationType.Success }));
}

/** A skill check the player failed, or taking damage. */
export function failureFeedback(): void {
  fire(() => Haptics.notification({ type: NotificationType.Warning }));
}
