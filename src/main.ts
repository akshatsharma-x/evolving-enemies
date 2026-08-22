import Phaser from 'phaser';
import { CombatScene } from './scenes/CombatScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: true // Useful for seeing hitboxes in Phase 0
    }
  },
  scene: [CombatScene]
};

new Phaser.Game(config);
