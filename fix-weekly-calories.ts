/**
 * One-time script to remove weekly calories data (unreliable averages)
 *
 * INSTRUCTIONS:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire function
 * 3. Run: removeWeeklyCalories()
 */

async function removeWeeklyCalories() {
  console.log('🔧 Removing weekly calories data...');

  // Access the database
  const db = window.db || (await import('./src/services/database.service')).db;

  const activities = await db.dailyActivities.toArray();
  let removedCount = 0;

  for (const activity of activities) {
    // If total calories > 5000, it's weekly data that should be removed
    if (activity.totalCalories > 5000) {
      await db.dailyActivities.delete(activity.id!);
      console.log(`❌ Removed ${activity.date}: ${activity.totalCalories} calories (weekly average)`);
      removedCount++;
    }
  }

  console.log(`\n✅ Removed ${removedCount} activities with weekly calories data`);
  console.log('💡 Tip: Re-import with daily/monthly Garmin exports for accurate data');
  return removedCount;
}
