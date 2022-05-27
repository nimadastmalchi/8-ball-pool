import { tiny } from './examples/common.js';
import { Ball } from './ball.js'
import { Cue_Stick } from './cue_stick.js';

// Import everything:
import * as exports from './constants.js';
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene
} = tiny;

export class Keyboard_State {
    static left = false;
    static right = false;
    static down = false;
    static up = false;
    static apply = false;
    static fpv = false;
}

export class Game_State {
    static turn = 0;
    static place_cue_ball = false;
    // Added:
    static solid = null;
    static played_turn = false;
    static solid_ball_pocketed = false;
    static striped_ball_pockted = false;
    static finished = false;
}

export function play_collision_sound() {
    let sound = new Audio('./assets/ball-hit.mp3');
    sound.play();
}

export class Game {
    constructor() {
        this.colors = ["#FF0000", "#FF0000", "#00FF00", "#00FF00", "#0000FF", "#0000FF", "#FFFF00", "#FFFF00", "#FFA500", "#FFA500", "#A020F0", "#A020F0", "#67001A", "#67001A", "#000000"];
        this.balls = [];
        this.balls = this.balls.concat(this.make_odd_layer(0, 1));
        this.balls = this.balls.concat(this.make_even_layer(2, 2));
        this.balls = this.balls.concat(this.make_odd_layer(4, 3));
        this.balls = this.balls.concat(this.make_even_layer(6, 4));
        this.balls = this.balls.concat(this.make_odd_layer(8, 5));

        this.cue_ball = new Ball(vec3(0, -20, 0), vec3(0, 0, 0), hex_color("#FFFFFF"), false);
        this.balls.push(this.cue_ball);

        this.cue_stick = new Cue_Stick(vec3(0, -20, 0));

        this.stopped = true;
    }

    make_odd_layer(y, n) {
        let balls = [];
        let color_index = Math.floor(Math.random() * this.colors.length);
        balls.push(new Ball(vec3(0, y, 0), vec3(0, 0, 0), hex_color(this.colors[color_index]), false));
        this.colors.splice(color_index, 1);
        --n;

        let num_on_left = n / 2;
        let i = 1;
        while (num_on_left > 0) {
            color_index = Math.floor(Math.random() * this.colors.length);
            balls.push(new Ball(vec3(- (2 * BALL_RADIUS + BALL_INIT_SPACE) * i++, y, 0), vec3(0, 0, 0), hex_color(this.colors[color_index]), false));
            this.colors.splice(color_index, 1);
            --num_on_left;
        }

        let num_on_right = n / 2;
        i = 1;
        while (num_on_right > 0) {
            color_index = Math.floor(Math.random() * this.colors.length);
            balls.push(new Ball(vec3((2 * BALL_RADIUS + BALL_INIT_SPACE) * i++, y, 0), vec3(0, 0, 0), hex_color(this.colors[color_index]), false));
            this.colors.splice(color_index, 1);
            --num_on_right;
        }

        return balls;
    }

    make_even_layer(y, n) {
        let balls = [];
        let x = (n / 2.0) * 2 * BALL_RADIUS - BALL_RADIUS + (n / 2.0 - 1) * BALL_INIT_SPACE + BALL_INIT_SPACE / 2.0;
        while (n > 0) {
            let color_index = Math.floor(Math.random() * this.colors.length);
            balls.push(new Ball(vec3(x, y, 0), vec3(0, 0, 0), hex_color(this.colors[color_index]), false));
            this.colors.splice(color_index, 1);
            x -= 2 * BALL_RADIUS + BALL_INIT_SPACE;
            --n;
        }
        return balls;
    }

    make_railings(context, program_state) {
        RAILING_SHAPE.draw(context, program_state, Mat4.translation(TABLE_MIN_X - 2, 0, -2).times(Mat4.scale(2, TABLE_MAX_Y + 4, 2)), RAILING_MATERIAL);
        RAILING_SHAPE.draw(context, program_state, Mat4.translation(TABLE_MAX_X + 2, 0, -2).times(Mat4.scale(2, TABLE_MAX_Y + 4, 2)), RAILING_MATERIAL);
        RAILING_SHAPE.draw(context, program_state, Mat4.translation(0, TABLE_MAX_Y + 2, -2).times(Mat4.scale(TABLE_MAX_X, 2, 2)), RAILING_MATERIAL);
        RAILING_SHAPE.draw(context, program_state, Mat4.translation(0, TABLE_MIN_Y - 2, -2).times(Mat4.scale(TABLE_MAX_X, 2, 2)), RAILING_MATERIAL);
    }

    get_cam_matrix() {
        let default_cam_loc = Mat4.rotation(-Math.PI / 2, 0, 0, 1).times(Mat4.look_at(vec3(0, 0, 75), vec3(0, 0, 0), vec3(0, 1, 1)));
        if (!Keyboard_State.fpv || Game_State.place_cue_ball) {
            return default_cam_loc;
        }
        else {
            if (!this.stopped) {
                return default_cam_loc;
            }
            else {
                return this.cue_stick.get_cam_matrix();
            }
        }
    }

    all_balls_stopped() {
        for (let i = 0; i < this.balls.length; ++i) {
            if (!this.balls[i].is_stopped()) {
                return false;
            }
        }
        return true;
    }

    update(dt) {
        if (Game_State.place_cue_ball) {
            let cue_ball_loc = this.cue_ball.get_loc();

            // TODO: Ensure cue ball is not colliding with other balls
            if (Keyboard_State.apply) {
                if (this.cue_ball_collides()) {
                    console.log('Choose another location');
                    return;
                }

                Game_State.place_cue_ball = false;
                this.cue_stick.set_loc(cue_ball_loc);
                let angle = Math.atan(-cue_ball_loc[0] / cue_ball_loc[1]);
                if (cue_ball_loc[1] > 0) {
                    angle += Math.PI;
                }
                this.cue_stick.set_angle(angle);
            }
            else {
                let dl = 0.1;
                if (Keyboard_State.right) {
                    cue_ball_loc = cue_ball_loc.plus(vec3(0, dl, 0));
                }
                if (Keyboard_State.left) {
                    cue_ball_loc = cue_ball_loc.plus(vec3(0, -dl, 0));
                }
                if (Keyboard_State.up) {
                    cue_ball_loc = cue_ball_loc.plus(vec3(-dl, 0, 0));
                }
                if (Keyboard_State.down) {
                    cue_ball_loc = cue_ball_loc.plus(vec3(dl, 0, 0));
                }
                this.cue_ball.set_loc(cue_ball_loc);
            }
        }
        else if (this.stopped) {
            let vel = this.cue_stick.update_loc();
            if (vel != null) {
                // The cue stick has hit the cue ball.
                this.cue_ball.set_vel(vel);
                this.stopped = false;
            }
        }
        else {
            this.apply_collsion();
            for (let i = 0; i < this.balls.length; ++i) {
                this.balls[i].update_loc(dt);
            }
            if (this.all_balls_stopped()) {
                this.stopped = true;

                // Set new cue ball location:
                if (!this.cue_ball.is_visible()) {
                    this.cue_ball.set_loc(vec3(0, -20, 0));
                    this.cue_ball.set_pocket(null);
                    this.cue_ball.set_visibility(true);
                    Game_State.place_cue_ball = true;
                    Game_State.turn ^= 1;
                }

                // Set new cue stick location:
                let cue_ball_loc = this.cue_ball.get_loc();
                this.cue_stick.set_loc(cue_ball_loc);
                let angle = Math.atan(-cue_ball_loc[0] / cue_ball_loc[1]);
                if (cue_ball_loc[1] > 0) {
                    angle += Math.PI;
                }
                this.cue_stick.set_angle(angle);
            }
        }
    }

    cue_ball_collides() {
        for (const ball of this.balls) {
            if (ball === this.cue_ball) {
                continue;
            }
            let loc1 = this.cue_ball.get_loc();
            let loc2 = ball.get_loc();
            let dist_vec = loc1.minus(loc2);
            let dist = dist_vec.norm();
            if (dist <= 2 * BALL_RADIUS) {
                return true;
            }
        }
        return false;
    }

    apply_collsion() {
        let ret_val = false;
        for (let i = 0; i < this.balls.length; ++i) {
            for (let j = i + 1; j < this.balls.length; ++j) {
                ret_val = true;

                let loc1 = this.balls[i].get_loc();
                let loc2 = this.balls[j].get_loc();
                let dist_vec = loc1.minus(loc2);
                let dist = dist_vec.norm();
                if (dist <= 2 * BALL_RADIUS) {
                    play_collision_sound();

                    let revert = dist_vec.times((2 * BALL_RADIUS - dist) / dist);
                    this.balls[i].set_loc(loc1.plus(revert.times(1 / 2)));
                    this.balls[j].set_loc(loc2.minus(revert.times(1 / 2)));

                    let old_vel1 = this.balls[i].get_vel();
                    let old_vel2 = this.balls[j].get_vel();

                    this.balls[i].set_vel(old_vel1.minus(loc1.minus(loc2).times(old_vel1.minus(old_vel2).dot(loc1.minus(loc2)) / dist ** 2)).times(COLLISION_VEL_LOSS));
                    this.balls[j].set_vel(old_vel2.minus(loc2.minus(loc1).times(old_vel2.minus(old_vel1).dot(loc2.minus(loc1)) / dist ** 2)).times(COLLISION_VEL_LOSS)); 
                }
            }
        }
        return ret_val;
    }

    draw(context, program_state) {
        TABLE_SHAPE.draw(context, program_state, Mat4.translation(0, 0, -2).times(Mat4.scale(TABLE_MAX_X, TABLE_MAX_Y, 1)), TABLE_MATERIAL);
        for (const ball of this.balls) {
            if (ball.is_visible()) {
                ball.draw(context, program_state);
            }
        }
        if (this.stopped && !Game_State.place_cue_ball) {
            this.cue_stick.draw(context, program_state);
        }
        this.make_railings(context, program_state);
    }
}
