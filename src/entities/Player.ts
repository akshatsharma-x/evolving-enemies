import Phaser from 'phaser';
import { Fighter } from './Fighter';
import type { TelemetryRecorder } from '../telemetry/TelemetryRecorder';

export class Player extends Fighter {
    private keys: {
        A: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        J: Phaser.Input.Keyboard.Key;
        K: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
    };
    
    private target!: Fighter;
    private telemetry: TelemetryRecorder | null = null;

    // Edge-trigger state — one event per key-press, not per frame held
    private wasJDown: boolean = false;
    private wasKDown: boolean = false;
    private wasSDown: boolean = false;
    // Track movement start so we emit one 'move' per press, not per frame
    private wasMoving: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 0x0000ff); // Blue
        
        this.keys = {
            A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            J: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            K: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K),
            S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        };
    }
    
    public setTarget(target: Fighter): void {
        this.target = target;
    }

    /** Attach the round's recorder. Call once per scene create(). */
    public setTelemetry(recorder: TelemetryRecorder): void {
        this.telemetry = recorder;
    }

    update(time: number, _delta: number): void {
        if (this.currentState === 'DEAD') return;
        
        const jDown = this.keys.J.isDown;
        const kDown = this.keys.K.isDown;
        const sDown = this.keys.S.isDown;

        // ── Combat actions: fire on leading key edge, record only if accepted ─
        if (jDown && !this.wasJDown) {
            const prev = this.currentState;
            this.attack(time, this.target);
            if (this.currentState === 'ATTACKING' && prev !== 'ATTACKING') {
                this.telemetry?.record('attack', time,
                    { x: this.x, y: this.y }, { x: this.target.x, y: this.target.y },
                    this.hp, this.target.hp);
            }
        } else if (kDown && !this.wasKDown) {
            const prev = this.currentState;
            this.dodge(time);
            if (this.currentState === 'DODGING' && prev !== 'DODGING') {
                this.telemetry?.record('dodge', time,
                    { x: this.x, y: this.y }, { x: this.target.x, y: this.target.y },
                    this.hp, this.target.hp);
            }
        } else if (sDown && !this.wasSDown) {
            const prev = this.currentState;
            this.retreat(time, this.target);
            if (this.currentState === 'RETREATING' && prev !== 'RETREATING') {
                this.telemetry?.record('retreat', time,
                    { x: this.x, y: this.y }, { x: this.target.x, y: this.target.y },
                    this.hp, this.target.hp);
            }
        }
        
        // ── Movement: emit 'move' once on leading edge of each key press ──────
        if (this.currentState === 'IDLE' || this.currentState === 'MOVING') {
            if (this.keys.A.isDown) {
                this.setVelocityX(-this.moveSpeed);
                if (!this.wasMoving) {
                    this.telemetry?.record('move', time,
                        { x: this.x, y: this.y }, { x: this.target.x, y: this.target.y },
                        this.hp, this.target.hp);
                }
                this.currentState = 'MOVING';
                this.wasMoving = true;
            } else if (this.keys.D.isDown) {
                this.setVelocityX(this.moveSpeed);
                if (!this.wasMoving) {
                    this.telemetry?.record('move', time,
                        { x: this.x, y: this.y }, { x: this.target.x, y: this.target.y },
                        this.hp, this.target.hp);
                }
                this.currentState = 'MOVING';
                this.wasMoving = true;
            } else {
                this.setVelocityX(0);
                this.currentState = 'IDLE';
                this.wasMoving = false;
            }
        } else {
            // In ATTACKING / DODGING / RETREATING — movement is locked
            this.wasMoving = false;
        }

        // ── Update edge-trigger state ─────────────────────────────────────────
        this.wasJDown = jDown;
        this.wasKDown = kDown;
        this.wasSDown = sDown;
    }
}
