import Phaser from 'phaser';
import { Fighter } from './Fighter';

export class Player extends Fighter {
    private keys: {
        A: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        J: Phaser.Input.Keyboard.Key;
        K: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
    };
    
    private target!: Fighter;

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
    
    public setTarget(target: Fighter) {
        this.target = target;
    }

    update(time: number, _delta: number) {
        if (this.currentState === 'DEAD') return;
        
        if (this.keys.J.isDown) {
            this.attack(time, this.target);
        } else if (this.keys.K.isDown) {
            this.dodge(time);
        } else if (this.keys.S.isDown) {
            this.retreat(time, this.target);
        }
        
        if (this.currentState === 'IDLE' || this.currentState === 'MOVING') {
            if (this.keys.A.isDown) {
                this.setVelocityX(-this.moveSpeed);
                this.currentState = 'MOVING';
            } else if (this.keys.D.isDown) {
                this.setVelocityX(this.moveSpeed);
                this.currentState = 'MOVING';
            } else {
                this.setVelocityX(0);
                this.currentState = 'IDLE';
            }
        }
    }
}
