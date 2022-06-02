import { tiny } from './examples/common.js';
import { play_collision_sound } from './game.js';
import { TABLE_MAX_X, TABLE_MIN_Y } from './constants.js';

const {
    vec3, Mat4
} = tiny;

export class Ball {
    constructor(init_loc, init_vel, texture, solid) {
        this.loc = init_loc;
        this.vel = init_vel;
        this.solid = solid;
        this.texture = texture;
        this.pocket = null;
        this.visible = true;
        this.rotation_transform = Mat4.rotation(-Math.PI / 2, 0, 1, 0);
        this.tubed = false;
    }

    get_loc() {
        return this.loc;
    }

    get_vel() {
        return this.vel;
    }

    get_pocket() {
        return this.pocket;
    }

    is_solid() {
        return this.solid;
    }

    is_stopped() {
        return this.vel.equals(vec3(0, 0, 0));
    }

    is_visible() {
        return this.visible;
    }

    is_tubed() {
        return this.tubed;
    }

    set_loc(new_loc) {
        this.loc = new_loc;
    }

    set_vel(new_vel) {
        this.vel = new_vel;
    }

    set_pocket(new_pocket) {
        this.pocket = new_pocket;
    }

    set_visibility(new_visibility) {
        this.visible = new_visibility;
    }

    set_tubed(tubed) {
        this.tubed = tubed;
    }

    update_loc(dt) {
        if (this.tubed) {
            return;
        }
        if (this.pocket != null) {
            // Ball has been pocketed.
            if (this.loc[2] < -2) {
                // Ball has finished sliding into the pocket.
                this.set_vel(vec3(0, 0, 0));
                if (this.solid != null && this.visible) {
                    this.tubed = true;
                }
                this.visible = false;
            } else if (this.vel[2] === 0) {
                // Ball was just pocketed.
                this.vel = vec3(this.pocket[0], this.pocket[1], -2).minus(this.loc).times(10);
            } else {
                // Ball is sliding into the pocket.
                let dl = this.vel.times(dt);
                this.loc = this.loc.plus(dl);
            }
        }
        else {
            // Ball is still on the table.
            let dl = this.vel.times(dt);
            this.loc = this.loc.plus(dl);
            this.set_vel(this.get_vel().times(FRICTION_VEL_LOSS));

            if (this.vel.norm() < 0.25) {
                this.vel = vec3(0, 0, 0);
            }

            // Check for pocket:
            for (const pocket_loc of POCKET_LOCS) {
                let dist_vec = this.loc.minus(pocket_loc);
                if (dist_vec.dot(dist_vec) < 4) {
                    this.pocket = pocket_loc;
                }
            }

            // Ensure ball is within bounds:
            const SOUND_DIV_FACTOR = 60;
            if (this.loc[0] < TABLE_MIN_X + BALL_RADIUS || this.loc[0] > TABLE_MAX_X - BALL_RADIUS) {
                this.vel = vec3(-this.vel[0], this.vel[1], this.vel[2]).times(COLLISION_VEL_LOSS);
                this.loc[0] = this.loc[0] < TABLE_MIN_X + BALL_RADIUS ? TABLE_MIN_X + BALL_RADIUS : TABLE_MAX_X - BALL_RADIUS;
                let intensity = Math.min(1, Math.abs(this.vel[0]) / SOUND_DIV_FACTOR);
                play_collision_sound(intensity);
            }
            else if (this.loc[1] < TABLE_MIN_Y + BALL_RADIUS || this.loc[1] > TABLE_MAX_Y - BALL_RADIUS) {
                this.vel = vec3(this.vel[0], -this.vel[1], this.vel[2]).times(COLLISION_VEL_LOSS);
                this.loc[1] = this.loc[1] < TABLE_MIN_Y + BALL_RADIUS ? TABLE_MIN_Y + BALL_RADIUS : TABLE_MAX_Y - BALL_RADIUS;
                let intensity = Math.min(1, Math.abs(this.vel[1]) / SOUND_DIV_FACTOR);
                play_collision_sound(intensity);
            }
        }
    }

    draw(context, program_state) {
        if (this.vel.norm() != 0) {
            this.rotation_transform = Mat4.rotation(this.vel.norm() / 100.0, -this.vel[1], this.vel[0], 0).times(this.rotation_transform);
        }
        let model_transform = Mat4.translation(this.loc[0], this.loc[1], this.loc[2]).times(this.rotation_transform);
        BALL_SHAPE.draw(context, program_state, model_transform, BALL_MATERIAL.override({ texture: this.texture }));
    }
}
