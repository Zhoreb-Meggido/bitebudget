/**
 * One-time fix script to correct weekly calories data
 *
 * INSTRUCTIONS:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire function
 * 3. Run: fixWeeklyCalories()
 */

async function fixWeeklyCalories() {
  console.log('🔧 Fixing weekly calories data...');

  // Access the database
  const db = window.db || (await import('./src/services/database.service')).db;

  const activities = await db.dailyActivities.toArray();
  let fixedCount = 0;

  for (const activity of activities) {
    // If total calories > 5000, it's weekly data that needs to be divided by 7
    if (activity.totalCalories > 5000) {
      const updated = {
        ...activity,
        totalCalories: Math.round(activity.totalCalories / 7),
        activeCalories: Math.round(activity.activeCalories / 7),
        restingCalories: Math.round(activity.restingCalories / 7),
        updated_at: new Date().toISOString(),
      };

      await db.dailyActivities.update(activity.id!, updated);
      console.log(`✅ Fixed ${activity.date}: ${activity.totalCalories} → ${updated.totalCalories}`);
      fixedCount++;
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} activities with weekly calories data`);
  return fixedCount;
}
