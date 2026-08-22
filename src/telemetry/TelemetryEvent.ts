/**
 * Data contract for the telemetry system.
 *
 * These types are the shared schema between the Phaser client and the future
 * FastAPI backend. Field names must stay stable — changing them here requires
 * a paired migration on the backend.
 */

export type ActionType = 'attack' | 'dodge' | 'retreat' | 'move';

/** One discrete player action captured at the moment it is initiated. */
export interface TelemetryEvent {
  /** Phaser game-clock time (ms) at the instant the action started */
  timestamp: number;
  /** What the player did */
  action: ActionType;
  /** Player's canvas-space position at the moment of the action */
  player_position: { x: number; y: number };
  /** Enemy's canvas-space position at the moment of the action */
  enemy_position: { x: number; y: number };
  /** Euclidean pixel distance between the two fighters */
  distance_to_enemy: number;
  /** Player's current HP at the moment of the action */
  player_health: number;
  /** Enemy's current HP at the moment of the action */
  enemy_health: number;
  /** Milliseconds since the previous event (0 for the first event of the round) */
  time_since_last_action_ms: number;
}

/**
 * Per-round summary POSTed to the backend.
 * Contains both the raw event log and the derived aggregate stats.
 */
export interface RoundPayload {
  /** Stable unique ID for deduplication / idempotent upserts on the backend */
  round_id: string;
  /** ISO-8601 timestamp of when the round ended (client clock) */
  ended_at: string;
  /** Whether the player won or lost */
  outcome: 'player_win' | 'player_loss';
  /** Total number of events captured */
  total_events: number;
  /**
   * Count of each action type across the round.
   * e.g. { attack: 8, dodge: 3, retreat: 2, move: 14 }
   */
  action_counts: Record<ActionType, number>;
  /**
   * Number of times action A was immediately followed by action B.
   * Key format: "<from>-><to>", e.g. "dodge->attack"
   */
  transition_counts: Record<string, number>;
  /** Full ordered event log — used for ML training in later phases */
  events: TelemetryEvent[];
}
