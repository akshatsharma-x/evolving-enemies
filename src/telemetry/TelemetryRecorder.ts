import type { ActionType, TelemetryEvent, RoundPayload } from './TelemetryEvent';

const BACKEND_URL = 'http://localhost:8000/rounds';

export class TelemetryRecorder {
  private events: TelemetryEvent[] = [];
  private lastEventTime: number;

  constructor(roundStartTime: number) {
    this.lastEventTime = roundStartTime;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Record a single player action.
   *
   * Only call this when the action is actually committed — i.e. after the
   * Fighter's cooldown guard has accepted it. This ensures the event log
   * reflects what the character *did*, not what the player *tried*.
   */
  public record(
    action: ActionType,
    time: number,
    playerPos: { x: number; y: number },
    enemyPos: { x: number; y: number },
    playerHp: number,
    enemyHp: number,
  ): void {
    const dx = enemyPos.x - playerPos.x;
    const dy = enemyPos.y - playerPos.y;

    const event: TelemetryEvent = {
      timestamp: time,
      action,
      player_position: { x: Math.round(playerPos.x), y: Math.round(playerPos.y) },
      enemy_position:  { x: Math.round(enemyPos.x),  y: Math.round(enemyPos.y)  },
      distance_to_enemy: Math.round(Math.sqrt(dx * dx + dy * dy)),
      player_health: playerHp,
      enemy_health:  enemyHp,
      time_since_last_action_ms: this.events.length === 0 ? 0 : time - this.lastEventTime,
    };

    this.events.push(event);
    this.lastEventTime = time;
  }

  /**
   * Finalise the round: compute stats, log to console, POST to backend.
   *
   * This method is synchronous from the caller's perspective (void return) so
   * the scene restart flow is never gated on network availability.
   */
  public endRound(outcome: 'player_win' | 'player_loss'): void {
    const payload = this.buildPayload(outcome);
    this.logToConsole(payload);
    this.postToBackend(payload); // fire-and-forget
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private buildPayload(outcome: 'player_win' | 'player_loss'): RoundPayload {
    const action_counts: Record<ActionType, number> = {
      attack: 0, dodge: 0, retreat: 0, move: 0,
    };
    const transition_counts: Record<string, number> = {};

    for (let i = 0; i < this.events.length; i++) {
      action_counts[this.events[i].action]++;

      if (i > 0) {
        const key = `${this.events[i - 1].action}->${this.events[i].action}`;
        transition_counts[key] = (transition_counts[key] ?? 0) + 1;
      }
    }

    return {
      round_id: `round_${Date.now()}`,
      ended_at: new Date().toISOString(),
      outcome,
      total_events: this.events.length,
      action_counts,
      transition_counts,
      events: this.events,
    };
  }

  private logToConsole(payload: RoundPayload): void {
    const outcomeLabel = payload.outcome === 'player_win' ? '🏆 WIN' : '💀 LOSS';

    console.group(
      `%c[Telemetry] Round complete  ${outcomeLabel}  •  ${payload.total_events} events`,
      'color:#7ec8e3;font-weight:bold;font-size:13px',
    );

    // ── Action frequency ─────────────────────────────────────────────────────
    console.log('%cAction frequency:', 'font-weight:bold');
    const total = payload.total_events || 1;
    for (const [action, count] of Object.entries(payload.action_counts) as [ActionType, number][]) {
      const pct = ((count / total) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round((count / total) * 20));
      console.log(`  ${action.padEnd(8)}  ${String(count).padStart(3)}  (${pct.padStart(5)}%)  ${bar}`);
    }

    // ── Transition counts ─────────────────────────────────────────────────────
    console.log('%cAction transitions (most common first):', 'font-weight:bold');
    const sorted = Object.entries(payload.transition_counts)
      .sort(([, a], [, b]) => b - a);

    if (sorted.length === 0) {
      console.log('  (fewer than 2 actions recorded)');
    } else {
      for (const [key, count] of sorted) {
        const [from, to] = key.split('->');
        console.log(`  ${from.padEnd(8)} →  ${to.padEnd(8)}  ×${count}`);
      }
    }

    // ── Full event table ──────────────────────────────────────────────────────
    console.log('%cFull event log:', 'font-weight:bold');
    console.table(
      payload.events.map((e) => ({
        t_ms:   e.timestamp.toFixed(0),
        action: e.action,
        px:     e.player_position.x,
        py:     e.player_position.y,
        ex:     e.enemy_position.x,
        dist:   e.distance_to_enemy,
        p_hp:   e.player_health,
        e_hp:   e.enemy_health,
        gap_ms: e.time_since_last_action_ms.toFixed(0),
      })),
    );

    console.groupEnd();
  }

  private async postToBackend(payload: RoundPayload): Promise<void> {
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        console.log('[Telemetry] ✓ Backend accepted round data.');
      } else {
        console.warn(`[Telemetry] Backend returned HTTP ${res.status}. Payload logged above.`);
      }
    } catch {
      // Expected when the backend isn't running yet — log and continue.
      console.info(
        '[Telemetry] Backend unreachable (localhost:8000 not running). ' +
        'Round data is logged to the console above.',
      );
    }
  }
}
