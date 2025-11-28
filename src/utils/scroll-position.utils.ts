/**
 * Scroll Position Manager
 * Preserves and restores scroll positions during data reloads
 */

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

export class ScrollPositionManager {
  private static instance: ScrollPositionManager;
  private savedPositions: Map<string, ScrollPosition> = new Map();
  private readonly POSITION_EXPIRY_MS = 5000; // Positions expire after 5 seconds

  private constructor() {}

  public static getInstance(): ScrollPositionManager {
    if (!ScrollPositionManager.instance) {
      ScrollPositionManager.instance = new ScrollPositionManager();
    }
    return ScrollPositionManager.instance;
  }

  /**
   * Save current scroll position for a given key (e.g., 'dashboard', 'journal')
   */
  public savePosition(key: string): void {
    const position: ScrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now()
    };
    this.savedPositions.set(key, position);
    console.log(`📍 Saved scroll position for ${key}: (${position.x}, ${position.y})`);
  }

  /**
   * Restore scroll position for a given key
   * Returns true if position was restored, false if no position found or expired
   */
  public restorePosition(key: string, smooth: boolean = false): boolean {
    const position = this.savedPositions.get(key);

    if (!position) {
      return false;
    }

    // Check if position has expired
    if (Date.now() - position.timestamp > this.POSITION_EXPIRY_MS) {
      this.savedPositions.delete(key);
      return false;
    }

    // Restore position
    window.scrollTo({
      left: position.x,
      top: position.y,
      behavior: smooth ? 'smooth' : 'auto'
    });

    console.log(`📍 Restored scroll position for ${key}: (${position.x}, ${position.y})`);

    // Clean up after restore
    this.savedPositions.delete(key);
    return true;
  }

  /**
   * Get saved position without restoring
   */
  public getPosition(key: string): ScrollPosition | null {
    const position = this.savedPositions.get(key);

    if (!position) {
      return null;
    }

    // Check if expired
    if (Date.now() - position.timestamp > this.POSITION_EXPIRY_MS) {
      this.savedPositions.delete(key);
      return null;
    }

    return position;
  }

  /**
   * Clear saved position for a key
   */
  public clearPosition(key: string): void {
    this.savedPositions.delete(key);
  }

  /**
   * Clear all saved positions
   */
  public clearAll(): void {
    this.savedPositions.clear();
  }
}

// Export singleton instance
export const scrollPositionManager = ScrollPositionManager.getInstance();
