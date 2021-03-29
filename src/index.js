import Phaser from 'phaser';
import Game from './scenes/Game.js'
import GameOver from './scenes/GameOver.js'
import GameEnd from './scenes/GameEnd.js'

export default new Phaser.Game({
    type: Phaser.AUTO,
    width: 480,
    height: 640,
    scene: [Game, GameOver, GameEnd],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 300
            },
            debug: true
        }
    }
})