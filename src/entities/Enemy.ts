import Phaser from 'phaser';
import { Fighter } from './Fighter';

export class Enemy extends Fighter {
    private target!: Fighter;
    
    private aiState: 'APPROACHING' | 'ATTACKING' | 'RETREATING' | 'WAITING' = 'APPROACHING';
    private waitTime: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 0xff0000); // Red
    }

    public setTarget(target: Fighter) {
        this.target = target;
    }

    update(time: number, _delta: number) {
        if (this.currentState === 'DEAD' || !this.target || this.target.currentState === 'DEAD') {
            this.setVelocityX(0);
            return;
        }
        
        const distanceToTarget = Math.abs(this.x - this.target.x);
        const attackRange = 70;
        
        if (this.aiState === 'APPROACHING') {
            if (distanceToTarget > attackRange) {
                const direction = this.target.x > this.x ? 1 : -1;
                this.setVelocityX(this.moveSpeed * direction);
                this.currentState = 'MOVING';
            } else {
                this.setVelocityX(0);
                this.currentState = 'IDLE';
                this.aiState = 'ATTACKING';
            }
        } 
        else if (this.aiState === 'ATTACKING') {
            if (this.currentState === 'IDLE') {
                this.attack(time, this.target);
                this.aiState = 'RETREATING';
            }
        }
        else if (this.aiState === 'RETREATING') {
            if (this.currentState === 'IDLE') {
                this.retreat(time, this.target);
                this.aiState = 'WAITING';
                this.waitTime = time + 500;
            }
        }
        else if (this.aiState === 'WAITING') {
            if (time > this.waitTime && this.currentState === 'IDLE') {
                this.aiState = 'APPROACHING';
            }
        }
    }
}
