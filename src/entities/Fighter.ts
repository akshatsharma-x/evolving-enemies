import Phaser from 'phaser';

export type FighterState = 'IDLE' | 'MOVING' | 'ATTACKING' | 'DODGING' | 'RETREATING' | 'DEAD';

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    public hp: number;
    public maxHp: number;
    public moveSpeed: number = 200;
    
    public currentState: FighterState = 'IDLE';
    
    public attackCooldown: number = 500;
    public dodgeCooldown: number = 800;
    public retreatCooldown: number = 1000;
    
    public lastAttackTime: number = 0;
    public lastDodgeTime: number = 0;
    public lastRetreatTime: number = 0;
    
    public attackHitbox!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    
    constructor(scene: Phaser.Scene, x: number, y: number, color: number, maxHp: number = 100) {
        super(scene, x, y, `fighter_placeholder_${color}`);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.maxHp = maxHp;
        this.hp = maxHp;
        
        this.setTexture(this.createPlaceholderTexture(scene, color));
        
        this.setCollideWorldBounds(true);
        (this.body as Phaser.Physics.Arcade.Body).setSize(40, 80);
        
        this.setupHitbox(scene);
    }
    
    private createPlaceholderTexture(scene: Phaser.Scene, color: number): string {
        const key = `fighter_rect_${color}`;
        if (!scene.textures.exists(key)) {
            const graphics = scene.make.graphics({x: 0, y: 0});
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, 40, 80);
            graphics.generateTexture(key, 40, 80);
            graphics.destroy();
        }
        return key;
    }

    private setupHitbox(scene: Phaser.Scene) {
        const graphics = scene.make.graphics({x:0, y:0});
        graphics.fillStyle(0xff0000, 0.5);
        graphics.fillRect(0, 0, 60, 40);
        graphics.generateTexture('hitbox_tex', 60, 40);
        graphics.destroy();

        this.attackHitbox = scene.physics.add.image(this.x, this.y, 'hitbox_tex') as any;
        this.attackHitbox.setActive(false).setVisible(false);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setEnable(false);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    }

    public attack(time: number, target: Fighter) {
        if (this.currentState === 'DEAD' || this.currentState === 'ATTACKING' || this.currentState === 'DODGING') return;
        if (time - this.lastAttackTime < this.attackCooldown) return;
        
        this.currentState = 'ATTACKING';
        this.lastAttackTime = time;
        this.setVelocityX(0);
        
        this.scene.time.delayedCall(100, () => {
            if (this.currentState === 'DEAD') return;
            
            this.attackHitbox.setActive(true).setVisible(true);
            (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setEnable(true);
            
            const facingRight = target.x > this.x;
            this.attackHitbox.setPosition(this.x + (facingRight ? 30 : -30), this.y);
            
            this.scene.time.delayedCall(100, () => {
                if (this.currentState === 'DEAD') return;
                
                this.attackHitbox.setActive(false).setVisible(false);
                (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setEnable(false);
                
                this.scene.time.delayedCall(200, () => {
                    if (this.currentState === 'DEAD') return;
                    this.currentState = 'IDLE';
                });
            });
        });
    }
    
    public dodge(time: number) {
        if (this.currentState === 'DEAD' || this.currentState === 'ATTACKING' || this.currentState === 'DODGING') return;
        if (time - this.lastDodgeTime < this.dodgeCooldown) return;
        
        this.currentState = 'DODGING';
        this.lastDodgeTime = time;
        
        this.setAlpha(0.5);
        
        this.scene.time.delayedCall(200, () => {
            if (this.currentState === 'DEAD') return;
            this.setAlpha(1);
            this.currentState = 'IDLE';
        });
    }
    
    public retreat(time: number, target: Fighter) {
        if (this.currentState === 'DEAD' || this.currentState === 'ATTACKING' || this.currentState === 'DODGING' || this.currentState === 'RETREATING') return;
        if (time - this.lastRetreatTime < this.retreatCooldown) return;
        
        this.currentState = 'RETREATING';
        this.lastRetreatTime = time;
        
        const facingRight = target.x > this.x;
        const retreatVelocity = facingRight ? -this.moveSpeed * 2 : this.moveSpeed * 2;
        this.setVelocityX(retreatVelocity);
        
        this.scene.time.delayedCall(300, () => {
            if (this.currentState === 'DEAD') return;
            this.setVelocityX(0);
            this.currentState = 'IDLE';
        });
    }
    
    public takeDamage(amount: number) {
        if (this.currentState === 'DEAD' || this.currentState === 'DODGING') return false;
        
        this.hp -= amount;
        
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
        
        return true;
    }
    
    private die() {
        this.currentState = 'DEAD';
        this.setVelocityX(0);
        this.setRotation(Math.PI / 2);
        this.attackHitbox.setActive(false).setVisible(false);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setEnable(false);
    }
}
