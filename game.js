import { tiny } from './examples/common.js';
import { Ball } from './ball.js'
import { Cue_Stick } from './cue_stick.js';

// Import everything:
import * as exports from './constants.js';
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Keyboard_State {
    static left = false;
    static right = false;
    static down = false;
    static up = false;
    static apply = false;
    static fpv = false;
}

export function play_collision_sound(intensity) {
    let sound = new Audio('./assets/ball-hit.mp3');
    sound.volume = intensity / 2;
    sound.play();
}

export class Game {
    constructor() {
        this.textures = [new Texture("assets/1.png"), new Texture("assets/2.png"), new Texture("assets/3.png"),
                         new Texture("assets/4.png"), new Texture("assets/5.png"), new Texture("assets/6.png"),
                         new Texture("assets/7.png"), new Texture("assets/9.png"),
                         new Texture("assets/10.png"), new Texture("assets/11.png"), new Texture("assets/12.png"),
                         new Texture("assets/13.png"), new Texture("assets/14.png"), new Texture("assets/15.png")];
        this.solids = [true, true, true, true, true, true, true, false, false, false, false, false, false, false];
        this.balls = [];
        let y_loc = 10;
        this.balls = this.balls.concat(this.make_odd_layer(y_loc + 0, 1));
        this.balls = this.balls.concat(this.make_even_layer(y_loc + 2, 2));
        this.balls = this.balls.concat(this.make_odd_layer(y_loc + 4, 3));
        this.balls = this.balls.concat(this.make_even_layer(y_loc + 6, 4));
        this.balls = this.balls.concat(this.make_odd_layer(y_loc + 8, 5));

        this.cue_ball = new Ball(vec3(0, -20, 0), vec3(0, 0, 0), new Texture("assets/0.png"), null, true);
        this.balls.push(this.cue_ball);

        this.cue_stick = new Cue_Stick(vec3(0, -20, 0));

        this.stopped = true;

        this.turn = 0;
        this.solid = null;
        this.first_turn = true;
        this.solid_ball_pocketed = false;
        this.striped_ball_pockted = false;
        this.hit_solid_ball_first = false;
        this.hit_striped_ball_first = false;
        this.finished = false;
        this.place_cue_ball = false;
        this.winner = null;

        this.num_tubed = 0;
        this.timer = 0;
    }

    make_odd_layer(y, n) {
        let balls = [];
        let index = 0;
        if (n === 3) {
            this.eight_ball = new Ball(vec3(0, y, 0), vec3(0, 0, 0), new Texture("assets/8.png"), null, false);
            balls.push(this.eight_ball);
        } else {
            index = Math.floor(Math.random() * this.textures.length);
            balls.push(new Ball(vec3(0, y, 0), vec3(0, 0, 0), this.textures[index], this.solids[index], false));
            this.textures.splice(index, 1);
            this.solids.splice(index, 1);
        }
        --n;

        let num_on_left = n / 2;
        let i = 1;
        while (num_on_left > 0) {
            index = Math.floor(Math.random() * this.textures.length);
            balls.push(new Ball(vec3(- (2 * BALL_RADIUS + BALL_INIT_SPACE) * i++, y, 0), vec3(0, 0, 0), this.textures[index], this.solids[index], false));
            this.textures.splice(index, 1);
            this.solids.splice(index, 1);
            --num_on_left;
        }

        let num_on_right = n / 2;
        i = 1;
        while (num_on_right > 0) {
            index = Math.floor(Math.random() * this.textures.length);
            balls.push(new Ball(vec3((2 * BALL_RADIUS + BALL_INIT_SPACE) * i++, y, 0), vec3(0, 0, 0), this.textures[index], this.solids[index], false));
            this.textures.splice(index, 1);
            this.solids.splice(index, 1);
            --num_on_right;
        }

        return balls;
    }

    make_even_layer(y, n) {
        let balls = [];
        let x = (n / 2.0) * 2 * BALL_RADIUS - BALL_RADIUS + (n / 2.0 - 1) * BALL_INIT_SPACE + BALL_INIT_SPACE / 2.0;
        while (n > 0) {
            let index = Math.floor(Math.random() * this.textures.length);
            balls.push(new Ball(vec3(x, y, 0), vec3(0, 0, 0), this.textures[index], this.solids[index]));
            this.textures.splice(index, 1);
            this.solids.splice(index, 1);
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
        if (!Keyboard_State.fpv || this.place_cue_ball || !this.stopped || this.finished) {
            return default_cam_loc;
        }
        return this.cue_stick.get_cam_matrix();
    }

    all_balls_stopped() {
        for (let ball of this.balls) {
            if (!ball.is_stopped()) {
                return false;
            }
        }
        return true;
    }

    all_balls_pocketed() {
        for (let ball of this.balls) {
            if (ball.is_solid() === null) {
                continue;
            }
            if (ball.is_solid() && this.turn == this.solid && ball.get_pocket() === null) {
                return false;
            }
            if (!ball.is_solid() && this.turn != this.solid && ball.get_pocket() === null) {
                return false;
            }
        }
        return true;
    }
    
    cue_ball_collides() {
        for (let ball of this.balls) {
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

    apply_collision() {
        let ret_val = false;
        for (let i = 0; i < this.balls.length; ++i) {
            if (this.balls[i].get_pocket() != null) {
                continue;
            }
            for (let j = i + 1; j < this.balls.length; ++j) {
                ret_val = true;

                let loc1 = this.balls[i].get_loc();
                let loc2 = this.balls[j].get_loc();
                let dist_vec = loc1.minus(loc2);
                let dist = dist_vec.norm();
                if (dist <= 2 * BALL_RADIUS) {
                    let revert = dist_vec.times((2 * BALL_RADIUS - dist) / dist);
                    this.balls[i].set_loc(loc1.plus(revert.times(1 / 2)));
                    this.balls[j].set_loc(loc2.minus(revert.times(1 / 2)));

                    let old_vel1 = this.balls[i].get_vel();
                    let old_vel2 = this.balls[j].get_vel();

                    this.balls[i].set_vel(old_vel1.minus(loc1.minus(loc2).times(old_vel1.minus(old_vel2).dot(loc1.minus(loc2)) / dist ** 2)).times(COLLISION_VEL_LOSS));
                    this.balls[j].set_vel(old_vel2.minus(loc2.minus(loc1).times(old_vel2.minus(old_vel1).dot(loc2.minus(loc1)) / dist ** 2)).times(COLLISION_VEL_LOSS)); 

                    // Play sound:
                    const SOUND_DIV_FACTOR = 20;
                    let intensity = Math.min(1, (Math.abs(old_vel1.dot(dist_vec) / dist) + Math.abs(old_vel2.dot(dist_vec) / dist)) / SOUND_DIV_FACTOR);
                    play_collision_sound(intensity);

                    if (this.balls[j] === this.cue_ball && !this.hit_solid_ball_first && !this.hit_striped_ball_first) {
                        if (this.balls[i].is_solid() === null) {
                            this.hit_solid_ball_first = true;
                            this.hit_striped_ball_first = true;
                        }
                        else if (this.balls[i].is_solid()) {
                            this.hit_solid_ball_first = true;
                        }
                        else {
                            this.hit_striped_ball_first = true;
                        }
                    }
                }
            }
        }
        return ret_val;
    }

    update(dt) {
        if (this.finished) {
            return;
        }
        this.timer = Math.max(this.timer - 1, 0);
        const TUBE_VEL = 20;
        for (let ball of this.balls) {
            if (!ball.is_tubed()) {
                continue;
            }
            if (this.timer <= 0 && ball.get_vel().norm() == 0 && ball.get_loc()[1] < TABLE_MAX_Y) {
                // Ball starts the tubing process.
                this.timer = 25;
                ball.set_loc(vec3(TABLE_MIN_X + 3, TABLE_MAX_Y + 5, -2));
                ball.set_vel(vec3(0, TUBE_VEL, 0));
            }
            else if (ball.get_loc()[1] <= TABLE_MAX_Y + 10) {
                // Ball is moving right.
                let dl = ball.get_vel().times(dt);
                ball.set_loc(ball.get_loc().plus(dl));
            } else if (ball.get_loc()[0] <= TABLE_MAX_X - 2 * this.num_tubed) {
                // Ball is moving down.
                ball.set_vel(vec3(TUBE_VEL, 0, 0));
                let dl = ball.get_vel().times(dt);
                ball.set_loc(ball.get_loc().plus(dl));
            } else if (ball.get_vel().norm() != 0) {
                // Ball has reached its final destination.
                ball.set_vel(vec3(0, 0, 0));
                ball.set_loc(vec3(TABLE_MAX_X - 2 * this.num_tubed, TABLE_MAX_Y + 10, -2));
                this.num_tubed += 1;
            }
        }
        if (this.place_cue_ball) {
            let cue_ball_loc = this.cue_ball.get_loc();

            if (Keyboard_State.apply) {
                if (this.cue_ball_collides()) {
                    console.log('Choose another location');
                    return;
                }

                this.place_cue_ball = false;
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
            // All balls are stopped.
            let vel = this.cue_stick.update_loc();
            if (vel != null) {
                // The cue stick has hit the cue ball.
                if (this.first_turn) {
                    // Give more power to the first shot:
                    vel = vel.times(2);
                }
                this.cue_ball.set_vel(vel);
                this.stopped = false;
            }
        }
        else {
            // Balls are moving.
            this.apply_collision();
            for (let ball of this.balls) {
                ball.update_loc(dt);
            }
            for (let ball of this.balls) {
                if (ball.is_visible() && ball.get_pocket() != null) {
                    // Ball was just pocketed.
                    if (ball === this.cue_ball) {
                        // Ignore the cue ball.
                        continue;
                    }
                    // If roles still need to be assigned:
                    if (!this.first_turn && this.solid === null) {
                        this.solid = ball.is_solid() ? this.turn : this.turn ^ 1;
                    }
                    // Indicate which type of ball has been pocketed:
                    if (ball.is_solid() === null) {
                        this.winner = this.all_balls_pocketed() ? this.turn : this.turn ^ 1;
                    }
                    else if (ball.is_solid()) {
                        this.solid_ball_pocketed = true;
                    }
                    else {
                        this.striped_ball_pocketed = true;
                    }
                }
            }
            if (this.all_balls_stopped()) {
                // Balls just stopped.
                this.stopped = true;

                if (this.winner != null) {
                    this.finished = true;
                    return;
                }

                let changed_turns = false;
                // Check whether a ball has been pocketed or hit:
                if (this.first_turn) {
                    if (!this.solid_ball_pocketed && !this.striped_ball_pocketed) {
                        changed_turns = true;
                        this.turn ^= 1;
                    }
                }
                else if (this.solid != null) {
                    if ((this.hit_solid_ball_first && this.turn != this.solid) ||
                        (this.hit_striped_ball_first && this.turn == this.solid) ||
                        (!this.hit_solid_ball_first && !this.hit_striped_ball_first)) {
                        changed_turns = true;
                        this.turn ^= 1;
                        this.place_cue_ball = true;
                    }
                    else if ((this.solid_ball_pocketed && this.turn != this.solid) ||
                             (this.striped_ball_pocketed && this.turn == this.solid) ||
                             (!this.solid_ball_pocketed && !this.striped_ball_pocketed)) {
                        changed_turns = true;
                        this.turn ^= 1;
                    }
                }
                else if (!this.solid_ball_pocketed && !this.striped_ball_pocketed) {
                    changed_turns = true;
                    this.turn ^= 1;
                }

                this.solid_ball_pocketed = false;
                this.striped_ball_pocketed = false;
                this.hit_solid_ball_first = false;
                this.hit_striped_ball_first = false;

                // Set new cue ball location:
                if (!this.cue_ball.is_visible()) {
                    this.cue_ball.set_loc(vec3(0, -20, 0));
                    this.cue_ball.set_pocket(null);
                    this.cue_ball.set_visibility(true);
                    this.place_cue_ball = true;
                    if (!changed_turns) {
                        this.turn ^= 1;
                    }
                }

                // Set new cue stick location:
                let cue_ball_loc = this.cue_ball.get_loc();
                this.cue_stick.set_loc(cue_ball_loc);
                let angle = Math.atan(-cue_ball_loc[0] / cue_ball_loc[1]);
                if (cue_ball_loc[1] > 0) {
                    angle += Math.PI;
                }
                this.cue_stick.set_angle(angle);

                if (this.first_turn) {
                    this.first_turn = false;
                }
            }
        }
    }

    draw(context, program_state) {
        TABLE_SHAPE.draw(context, program_state, Mat4.translation(0, 0, -2).times(Mat4.scale(TABLE_MAX_X, TABLE_MAX_Y, 1)), TABLE_MATERIAL);
        for (let ball of this.balls) {
            if (!ball.is_visible() && (ball === this.cue_ball)) {
                // Cue ball is not tubed, so don't draw it
                continue;
            }
            ball.draw(context, program_state);
        }

        if (this.stopped && !this.place_cue_ball && !this.finished) {
            this.cue_stick.draw(context, program_state, STICK_MATERIAL);
        }
        this.make_railings(context, program_state);
        TUBE_SHAPE.draw(context, program_state, Mat4.translation(TABLE_MIN_X + 3, TABLE_MAX_Y + 6, -2).times(Mat4.scale(1.3, 3, 1.3)), TUBE_MATERIAL);
        TUBE_SHAPE.draw(context, program_state, Mat4.translation(TABLE_MIN_X + 21.7, TABLE_MAX_Y + 10.3, -2).times(Mat4.scale(20, 1.3, 1.3)), TUBE_MATERIAL);
    }
}
