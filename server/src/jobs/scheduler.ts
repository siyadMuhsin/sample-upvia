import cron from 'node-cron';
import { earlyWarningService } from '../modules/early-warnings/early-warning.service';
import { scanAndCreatePendingFollowUps } from '../modules/graduates/graduate.service';
import { skillGapService } from '../modules/skill-gap/skill-gap.service';

/**
 * Registers the platform's recurring background jobs. Previously nothing in
 * this codebase ran on a schedule, so early-warning alerts, graduate
 * milestone surveys, and the skill-gap intelligence engine only ever updated
 * when a human happened to hit the corresponding endpoint.
 */
export function startScheduledJobs(): void {
  // 00:00 daily — evaluate all early-warning rules.
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await earlyWarningService.evaluateAllRules();
      console.log(`[Scheduler] Early-warning evaluation complete: ${result.createdCount} new alerts.`);
    } catch (error) {
      console.error('[Scheduler] Early-warning evaluation failed:', error);
    }
  });

  // 01:00 daily — scan graduates for due 3/6/12/24-month milestones and
  // pre-create pending follow-up survey stubs.
  cron.schedule('0 1 * * *', async () => {
    try {
      const result = await scanAndCreatePendingFollowUps();
      console.log(`[Scheduler] Graduate milestone scan complete: ${result.created} pending follow-ups created.`);
    } catch (error) {
      console.error('[Scheduler] Graduate milestone scan failed:', error);
    }
  });

  // 02:00 daily — recompute the skill-gap correlation engine so curriculum
  // gap data reflects current opportunity demand and course coverage.
  cron.schedule('0 2 * * *', async () => {
    try {
      const result = await skillGapService.refreshSkillGaps();
      console.log(`[Scheduler] Skill-gap refresh complete: ${result.upserted} program/skill pairs updated.`);
    } catch (error) {
      console.error('[Scheduler] Skill-gap refresh failed:', error);
    }
  });

  console.log('[Scheduler] Background jobs registered (early-warnings 00:00, graduate milestones 01:00, skill-gaps 02:00).');
}
