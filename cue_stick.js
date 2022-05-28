import { tiny } from './examples/common.js';
import { Keyboard_State, play_collision_sound } from './game.js';

// Import everything:
import * as exports from './constants.js';
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene
} = tiny;

export class Cue_Stick {
    constructor(init_loc) {
        this.angle = 0;
        this.final_displacement = -1;
        this.displacement = BALL_RADIUS;
        this.model_transform = Mat4.translation(init_loc[0], init_loc[1], init_loc[2])
                                   .times(Mat4.translation(0, -(this.displacement + BALL_RADIUS + STICK_LENGTH / 2), 0))
                                   .times(Mat4.scale(STICK_WIDTH, STICK_LENGTH, STICK_WIDTH))
                                   .times(Mat4.rotation(Math.PI / 2, 1, 0, 0));
        this.init_loc = init_loc;
        this.released = false;
    }

    get_loc() {
        return vec3(this.model_transform[0][3], this.model_transform[1][3], this.model_transform[2][3]);
    }

    get_cam_matrix() {
        // Direction vector of cue stick:
        let d = this.init_loc.minus(this.get_loc());
        // Normal vector to direction of cue stick:
        let n = vec3(d[1], -d[0], 0);

        return Mat4.inverse(Mat4.rotation(-Math.PI / 20, n[0], n[1], 0).times(this.model_transform.times(Mat4.translation(0, 0, 100))));
    }

    set_angle(new_angle) {
        this.angle = new_angle;
    }

    set_loc(new_loc) {
        this.init_loc = new_loc;
    }

    update_loc() {
        if ((!Keyboard_State.down && this.displacement > BALL_RADIUS) || this.released) {
            if (!this.released) {
                // First frame in which the cue stick is released.
                this.final_displacement = this.displacement;
                this.released = true;
            }
            if (this.displacement <= 0) {
                play_collision_sound(Math.min(1, this.final_displacement / 50));
                this.released = false;
                this.displacement = BALL_RADIUS;
                return vec3(Math.sin(-this.angle), Math.cos(-this.angle), 0).times(5 * this.final_displacement);
            }
            this.displacement -= this.final_displacement * 0.1;
        }
        else {
            // Cue stick has not been released.
            if (Keyboard_State.left) {
                this.angle -= 0.005;
            }
            if (Keyboard_State.right) {
                this.angle += 0.005;
            }
            if (Keyboard_State.down) {
                this.displacement += 0.1;
            }
        }

        this.model_transform = Mat4.translation(this.init_loc[0], this.init_loc[1], this.init_loc[2])
                                   .times(Mat4.rotation(this.angle, 0, 0, 1))
                                   .times(Mat4.translation(0, -(this.displacement + BALL_RADIUS + STICK_LENGTH / 2), 0))
                                   .times(Mat4.scale(STICK_WIDTH, STICK_LENGTH, STICK_WIDTH))
                                   .times(Mat4.rotation(Math.PI / 2, 1, 0, 0));
        return null;
    }

    draw(context, program_state, material) {
        STICK_SHAPE.draw(context, program_state, this.model_transform, material);
    }
}
