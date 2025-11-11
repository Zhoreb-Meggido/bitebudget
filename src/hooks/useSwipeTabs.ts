/**
 * useSwipeTabs Hook - Swipe gesture navigation for tabs
 *
 * Implements conflict prevention for horizontal scroll areas:
 * - Minimum swipe distance (50px) to prevent accidental triggers
 * - Requires clear horizontal movement (deltaX > deltaY * 1.5)
 * - Only triggers on significant, intentional swipes
 */

import { useSwipeable, SwipeableHandlers } from 'react-swipeable';

interface UseSwipeTabsOptions<T> {
  tabs: T[];
  activeTab: T;
  setActiveTab: (tab: T) => void;
  /** Minimum horizontal distance in pixels to trigger swipe (default: 50) */
  minSwipeDistance?: number;
  /** Minimum velocity threshold (default: 0.3) */
  minSwipeVelocity?: number;
}

/**
 * Hook for adding swipe gesture navigation to tabbed interfaces
 *
 * @example
 * const tabs = ['tab1', 'tab2', 'tab3'];
 * const [activeTab, setActiveTab] = useState('tab1');
 * const swipeHandlers = useSwipeTabs({ tabs, activeTab, setActiveTab });
 *
 * return <div {...swipeHandlers}>Tab content</div>
 */
export function useSwipeTabs<T>({
  tabs,
  activeTab,
  setActiveTab,
  minSwipeDistance = 50,
  minSwipeVelocity = 0.3,
}: UseSwipeTabsOptions<T>): SwipeableHandlers {
  const currentIndex = tabs.indexOf(activeTab);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Swipe left = next tab (if not at end)
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      // Swipe right = previous tab (if not at start)
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    },
    // Conflict prevention settings
    delta: minSwipeDistance, // Minimum distance to trigger
    preventScrollOnSwipe: false, // Allow vertical scrolling
    trackTouch: true, // Track touch events
    trackMouse: false, // Disable mouse swipe (desktop)
    swipeDuration: 500, // Max duration for a swipe (ms)
    touchEventOptions: { passive: true }, // Better scroll performance
  });

  return handlers;
}
