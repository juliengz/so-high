import Phaser from 'phaser';
import Carrot from '../game/Carrot.js'

import background from '../assets/bg_layer1.png'
import platform from '../assets/ground_grass.png'
import bunnystand from '../assets/bunny1_stand.png'
import carrot from '../assets/carrot.png'
import bunnyjump from '../assets/bunny1_jump.png'
import jump from '../assets/jump-cartoon.ogg'

export default class Game extends Phaser.Scene {
    /** @type {Phaser.Physics.Arcade.Sprite} */
    player

    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    platforms

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors

    /** @type {Phaser.Physics.Arcade.Group} */
    carrots
    carrotsCollected = 0
    /** @type {Phaser.GameObjects.Text} */
    carrotsCollectedText

    distanceTraveled = 0
    /** @type {Phaser.GameObjects.Text} */
    distanceTraveledText

    timedEvent
    timeText

    constructor() {
        super('game')
    }

    init() {
        this.carrotsCollected = 0
        this.distanceTraveled = 0
    }

    preload() {
        this.load.image('background', background)
        this.load.image('platform', platform)
        this.load.image('bunny-stand', bunnystand)
        this.load.image('carrot', carrot)
        this.load.image('bunny-jump', bunnyjump)
        this.load.audio('jump', jump)

        this.cursors = this.input.keyboard.createCursorKeys()
    }

    create() {
        this.timedEvent = this.time.delayedCall(30000, this.endGame, [], this);

        // Background is sticky
        this.add.image(240, 320, 'background')
            .setScrollFactor(1, 0)


        // ----------------------
        // Player
        // ----------------------

        this.player = this.physics.add.sprite(240, 300, 'bunny-stand')
            .setScale(0.3)

        // ----------------------
        // Platforms
        // ----------------------

        // create the group
        this.platforms = this.physics.add.staticGroup()

        const platform = this.platforms.create(240, 450, 'platform')
        platform.scale = 0.5
        /** @type {Phaser.Physics.Arcade.StaticBody} */
        const body = platform.body
        body.updateFromGameObject()

        // then create 5 platforms from the group
        for (let i = 0; i < 5; ++i) {
            const x = Phaser.Math.Between(80, 400)
            const y = 150 * i
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, 'platform')
            platform.scale = 0.5
            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body
            body.updateFromGameObject()
        }

        // ----------------------
        // Camera
        // ----------------------

        this.cameras.main.startFollow(this.player)


        // set the horizontal dead zone to 1.5x game width
        this.cameras.main.setDeadzone(this.scale.width * 1.5)

        // ----------------------
        // Carrots
        // ----------------------

        this.carrots = this.physics.add.group({
            classType: Carrot
        })
        this.carrots.get(240, 320, 'carrot')

        // ----------------------
        // Collisions
        // ----------------------

        this.physics.add.collider(this.platforms, this.player)
        this.physics.add.collider(this.platforms, this.carrots)
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        // formatted this way to make it easier to read
        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot,
            // called on overlap
            undefined,
            this
        )

        // ----------------------
        // GUI
        // ----------------------

        const style = {color: '#000', fontSize: 24}
        this.carrotsCollectedText = this.add.text(10, 0, 'Carrots: 0', style)
            .setScrollFactor(0)
            .setOrigin(0, 0)

        this.distanceTraveledText = this.add.text(10, 30, 'Distance: 0', style)
            .setScrollFactor(0)
            .setOrigin(0, 0)

        this.timeText = this.add.text(10, 60, 'Distance: 0', style)
            .setScrollFactor(0)
            .setOrigin(0, 0)

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('game')
        })
    }

    update(t, dt) {
        this.platforms.children.iterate(child => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child

            const scrollY = this.cameras.main.scrollY

            if (platform.y >= scrollY + 700) {
                platform.y = scrollY - Phaser.Math.Between(50, 100)
                platform.body.updateFromGameObject()

                // create a carrot above the platform being reused
                this.addCarrotAbove(platform)
            }
        })

        const touchingDown = this.player.body.touching.down

        const vy = this.player.body.velocity.y
        if (vy > 0 && this.player.texture.key !== 'bunny-stand') {
            // switch back to jump when falling
            this.player.setTexture('bunny-stand')
        }

        // left and right input logic
        if (this.cursors.left.isDown && !touchingDown) {
            this.player.setVelocityX(-200)
        } else if (this.cursors.right.isDown && !touchingDown) {
            this.player.setVelocityX(200)
        } else if (this.cursors.up.isDown && touchingDown) {
            this.player.setVelocityY(-300)
            this.player.setTexture('bunny-jump')
            this.sound.play('jump')
        } else {
            // stop movement if not left or right
            this.player.setVelocityX(0)

        }

        this.distanceTraveledText.setText('Distance: ' + parseInt(this.cameras.main.scrollY * -1));
        this.timeText.setText('Time: ' + parseInt(this.timedEvent.getElapsedSeconds()) + 's');

        this.horizontalWrap(this.player)

        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 200) {
            this.scene.start('game-over')
        }
    }

    endGame() {
        this.scene.start('game-end')
    }

    /**
     * @param {Phaser.GameObjects.Sprite} sprite
     */
    horizontalWrap(sprite) {
        const halfWidth = sprite.displayWidth * 0.5
        const gameWidth = this.scale.width
        if (sprite.x < -halfWidth) {
            sprite.x = gameWidth + halfWidth
        } else if (sprite.x > gameWidth + halfWidth) {
            sprite.x = -halfWidth
        }
    }

    /**
     * @param {Phaser.GameObjects.Sprite} sprite
     */
    addCarrotAbove(sprite) {
        const y = sprite.y - sprite.displayHeight

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'carrot')

        // set active and visible
        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)

        // update the physics body size
        carrot.body.setSize(carrot.width, carrot.height)

        // make sure body is enabed in the physics world
        this.physics.world.enable(carrot)

        return carrot
    }

    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Carrot} carrot
     */
    handleCollectCarrot(player, carrot) {
        // hide from display
        this.carrots.killAndHide(carrot)
        // disable from physics world
        this.physics.world.disableBody(carrot.body)
        // increment by 1
        this.carrotsCollected++

        // create new text value and set it
        const value = `Carrots: ${this.carrotsCollected}`
        this.carrotsCollectedText.text = value
    }

    findBottomMostPlatform() {
        const platforms = this.platforms.getChildren()
        let bottomPlatform = platforms[0]

        for (let i = 1; i < platforms.length; ++i) {
            const platform = platforms[i]

            // discard any platforms that are above current
            if (platform.y < bottomPlatform.y) {
                continue
            }
            bottomPlatform = platform
        }

        return bottomPlatform
    }
}