/**
 * User Activity Tracker
 * Detects when user is actively interacting with the app vs idle
 */

export class UserActivityTracker {
  private static instance: UserActivityTracker;
  private lastActivityTime: number = Date.now();
  private isUserActive: boolean = true;
  private activityTimeout: number | null = null;
  private readonly IDLE_THRESHOLD_MS = 10000; // 10 seconds of no activity = idle

  private constructor() {
    this.setupActivityListeners();
  }

  public static getInstance(): UserActivityTracker {
    if (!UserActivityTracker.instance) {
      UserActivityTracker.instance = new UserActivityTracker();
    }
    return UserActivityTracker.instance;
  }

  /**
   * Setup listeners for user activity
   */
  private setupActivityListeners(): void {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'touchmove',
      'click',
      'wheel'
    ];

    const handleActivity = () => {
      this.lastActivityTime = Date.now();

      if (!this.isUserActive) {
        this.isUserActive = true;
        console.log('👤 User is now active');
      }

      // Reset idle timeout
      if (this.activityTimeout) {
        clearTimeout(this.activityTimeout);
      }

      // Set new timeout to mark as idle
      this.activityTimeout = window.setTimeout(() => {
        this.isUserActive = false;
        console.log('💤 User is now idle');
      }, this.IDLE_THRESHOLD_MS);
    };

    // Attach listeners with passive flag for better scroll performance
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timeout
    this.activityTimeout = window.setTimeout(() => {
      this.isUserActive = false;
    }, this.IDLE_THRESHOLD_MS);
  }

  /**
   * Check if user is currently active (has interacted in last 10 seconds)
   */
  public isActive(): boolean {
    return this.isUserActive;
  }

  /**
   * Check if user is idle (no interaction for 10+ seconds)
   */
  public isIdle(): boolean {
    return !this.isUserActive;
  }

  /**
   * Get milliseconds since last activity
   */
  public getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * Wait until user is idle, then execute callback
   * Returns a promise that resolves when user becomes idle
   */
  public async waitForIdle(): Promise<void> {
    if (this.isIdle()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const checkIdle = setInterval(() => {
        if (this.isIdle()) {
          clearInterval(checkIdle);
          resolve();
        }
      }, 1000); // Check every second
    });
  }
}

// Export singleton instance
export const userActivityTracker = UserActivityTracker.getInstance();
