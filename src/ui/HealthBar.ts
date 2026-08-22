import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';

export class HealthBar {
    private bar: Phaser.GameObjects.Graphics;
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private fighter: Fighter;
    
    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, fighter: Fighter) {
        this.bar = scene.add.graphics();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.fighter = fighter;
        
        this.draw();
    }
    
    public update() {
        this.draw();
    }
    
    private draw() {
        this.bar.clear();
        
        // Background
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x, this.y, this.width, this.height);
        
        // Health
        if (this.fighter.hp > 0) {
            const healthPercentage = this.fighter.hp / this.fighter.maxHp;
            
            let color = 0x00ff00;
            if (healthPercentage < 0.3) {
                color = 0xff0000;
            } else if (healthPercentage < 0.6) {
                color = 0xffff00;
            }
            
            this.bar.fillStyle(color);
            this.bar.fillRect(this.x + 2, this.y + 2, (this.width - 4) * healthPercentage, this.height - 4);
        }
    }
}
