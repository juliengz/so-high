import Phaser from 'phaser';

export default class GameEnd extends Phaser.Scene {
    constructor() {
        super('game-end')
    }

    create() {
        const width = this.scale.width
        const height = this.scale.height

        this.add.text(width * 0.5, height * 0.5, 'Game End', {fontSize: 48})
            .setOrigin(0.5)
    }
}