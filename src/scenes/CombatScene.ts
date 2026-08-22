import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { HealthBar } from '../ui/HealthBar';
import { TelemetryRecorder } from '../telemetry/TelemetryRecorder';

export class CombatScene extends Phaser.Scene {
    private player!: Player;
    private enemy!: Enemy;
    private playerHealthBar!: HealthBar;
    private enemyHealthBar!: HealthBar;
    
    private gameOver: boolean = false;
    private gameOverText!: Phaser.GameObjects.Text;
    private restartButton!: Phaser.GameObjects.Text;

    // A fresh recorder is created on every scene restart — scoped to one round.
    private telemetry!: TelemetryRecorder;

    constructor() {
        super({ key: 'CombatScene' });
    }

    create() {
        this.gameOver = false;

        // New recorder for this round, seeded with the current clock time
        this.telemetry = new TelemetryRecorder(this.time.now);
        
        const ground = this.add.rectangle(400, 550, 800, 100, 0x333333);
        this.physics.add.existing(ground, true);
        
        this.player = new Player(this, 200, 400);
        this.enemy = new Enemy(this, 600, 400);
        
        this.player.setTarget(this.enemy);
        this.player.setTelemetry(this.telemetry); // inject recorder
        this.enemy.setTarget(this.player);
        
        this.physics.add.collider(this.player, ground);
        this.physics.add.collider(this.enemy, ground);
        this.physics.add.collider(this.player, this.enemy);
        
        this.physics.add.overlap(this.player.attackHitbox, this.enemy, this.handleHit as any, undefined, this);
        this.physics.add.overlap(this.enemy.attackHitbox, this.player, this.handleHit as any, undefined, this);

        this.playerHealthBar = new HealthBar(this, 20, 20, 200, 20, this.player);
        this.enemyHealthBar = new HealthBar(this, 580, 20, 200, 20, this.enemy);
        
        this.add.text(20, 45, 'Player (A/D Move, J Attack, K Dodge, S Retreat)', { color: '#ffffff' });
        this.add.text(580, 45, 'Enemy (AI)', { color: '#ffffff' });
        
        this.gameOverText = this.add.text(400, 200, 'ROUND OVER', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5).setVisible(false);
        this.restartButton = this.add
            .text(400, 300, 'Restart', {
                fontSize: '32px',
                color: '#00ff00',
                backgroundColor: '#333333',
                padding: { x: 10, y: 5 },
            })
            .setOrigin(0.5)
            .setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { this.scene.restart(); });
    }

    private handleHit(hitbox: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, target: any) {
        const defender = target as import('../entities/Fighter').Fighter;
        
        hitbox.setActive(false).setVisible(false);
        (hitbox.body as Phaser.Physics.Arcade.Body).setEnable(false);

        defender.takeDamage(10);
    }

    update(time: number, _delta: number) {
        if (this.gameOver) return;

        this.player.update(time, _delta);
        this.enemy.update(time, _delta);
        
        this.playerHealthBar.update();
        this.enemyHealthBar.update();
        
        if (this.player.hp <= 0 || this.enemy.hp <= 0) {
            this.gameOver = true;

            const outcome = this.enemy.hp <= 0 ? 'player_win' : 'player_loss';

            // endRound() is void — the POST runs async in the background,
            // never blocking the restart button.
            this.telemetry.endRound(outcome);

            this.gameOverText.setText(`ROUND OVER — ${outcome === 'player_win' ? 'YOU WIN!' : 'YOU LOSE'}`);
            this.gameOverText.setVisible(true);
            this.restartButton.setVisible(true);
        }
    }
}
