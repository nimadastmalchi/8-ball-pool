import { defs, tiny } from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene
} = tiny;

const BALL_RADIUS = 1;
const BALL_INIT_SPACE = 0.2;
const BALL_SHAPE = new defs.Subdivision_Sphere(8);
const BALL_MATERIAL = new Material(new defs.Phong_Shader(), { ambient: 0.5, diffusivity: .6, color: hex_color("#FFFFFF") });

const STICK_LENGTH = 40;
const STICK_WIDTH = 0.25;
const STICK_SHAPE = new defs.Capped_Cylinder(5, 25, [[0, 2], [0, 1]]);
const STICK_MATERIAL = new Material(new defs.Phong_Shader(), { ambient: 0.5, diffusivity: .6, color: hex_color("#C4A484") });

const TABLE_SHAPE = new defs.Cube();
const TABLE_MATERIAL = new Material(new defs.Phong_Shader(), { ambient: 1, diffusivity: 0.25, specularity: 0.1, color: hex_color("#013220") });

const COLLISION_VEL_LOSS = 0.95;
const FRICTION_VEL_LOSS = 0.9925;

const TABLE_MIN_X = -20;
const TABLE_MAX_X = 20;
const TABLE_MIN_Y = -40;
const TABLE_MAX_Y = 40;

export class KeyboardState {
    static left_arrow = false;
    static right_arrow = false;
    static powering = false;
    static fpv = false;
}

export class Ball {
    constructor(init_loc, init_vel, color, solid) {
        this.model_transform = Mat4.translation(init_loc[0], init_loc[1], init_loc[2]).times(Mat4.scale(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS));
        this.loc = init_loc;
        this.vel = init_vel;
        this.solid = solid;
        this.color = color;
    }

    get_loc() {
        return this.loc;
    }

    get_vel() {
        return this.vel;
    }

    is_stopped() {
        return this.vel.equals(vec3(0, 0, 0));
    }

    set_loc(new_loc) {
        this.loc = new_loc;
    }

    set_vel(new_vel) {
        this.vel = new_vel;
    }

    update_loc(dt) {
        let dl = this.vel.times(dt);
        this.loc = this.loc.plus(dl);
        this.model_transform = Mat4.translation(this.loc[0], this.loc[1], this.loc[2]);
        this.set_vel(this.get_vel().times(FRICTION_VEL_LOSS));

        if (this.vel.norm() < 0.25) {
            this.vel = vec3(0, 0, 0);
        }

        // Ensure ball is within bounds:
        if (this.loc[0] < TABLE_MIN_X + BALL_RADIUS || this.loc[0] > TABLE_MAX_X - BALL_RADIUS) {
            this.vel = vec3(-this.vel[0], this.vel[1], this.vel[2]).times(COLLISION_VEL_LOSS);
            this.loc[0] = this.loc[0] < TABLE_MIN_X + BALL_RADIUS ? TABLE_MIN_X + BALL_RADIUS : TABLE_MAX_X - BALL_RADIUS;
        } else if (this.loc[1] < TABLE_MIN_Y + BALL_RADIUS || this.loc[1] > TABLE_MAX_Y - BALL_RADIUS) {
            this.vel = vec3(this.vel[0], -this.vel[1], this.vel[2]).times(COLLISION_VEL_LOSS);
            this.loc[1] = this.loc[1] < TABLE_MIN_Y + BALL_RADIUS ? TABLE_MIN_Y + BALL_RADIUS : TABLE_MAX_Y - BALL_RADIUS;
        }
    }

    draw(context, program_state) {
        BALL_SHAPE.draw(context, program_state, this.model_transform, BALL_MATERIAL.override({ color: this.color }));
    }
}

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
        return Mat4.inverse(this.model_transform.times(Mat4.translation(0, 0, 25)));
    }

    set_loc(new_loc) {
        this.init_loc = new_loc;
    }

    update_loc() {
        if ((!KeyboardState.powering && this.displacement > BALL_RADIUS) || this.released) {
            if (!this.released) {
                // First frame in which the cue stick is released.
                this.final_displacement = this.displacement;
                this.released = true;
            }
            if (this.displacement <= 0) {
                this.released = false;
                this.displacement = BALL_RADIUS;
                return vec3(Math.sin(-this.angle), Math.cos(-this.angle), 0).times(5 * this.final_displacement);
            }
            this.displacement -= this.final_displacement * 0.1;
        } else {
            // Cue stick has not been released.
            if (KeyboardState.left_arrow) {
                this.angle -= 0.005;
            }
            if (KeyboardState.right_arrow) {
                this.angle += 0.005;
            }
            if (KeyboardState.powering) {
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

    draw(context, program_state) {
        STICK_SHAPE.draw(context, program_state, this.model_transform, STICK_MATERIAL);
    }
}

export class Game {
    constructor() {
        let space = 0.1;
        this.balls = [];
        this.balls = this.balls.concat(this.make_odd_layer(0, 1));
        this.balls = this.balls.concat(this.make_even_layer(2, 2));
        this.balls = this.balls.concat(this.make_odd_layer(4, 3));
        this.balls = this.balls.concat(this.make_even_layer(6, 4));
        this.balls = this.balls.concat(this.make_odd_layer(8, 5));

        this.cue_ball = new Ball(vec3(0, -20, 0), vec3(0, 0, 0), hex_color("#FF0000"), false);
        this.balls.push(this.cue_ball);

        this.cue_stick = new Cue_Stick(vec3(0, -20, 0));

        this.turn = true;
        this.stopped = true;
    }

    make_odd_layer(y, n) {
        let balls = [];
        balls.push(new Ball(vec3(0, y, 0), vec3(0, 0, 0), hex_color("#FFFFFF"), false));
        --n;

        let num_on_left = n / 2;
        let i = 1;
        while (num_on_left > 0) {
            balls.push(new Ball(vec3(- (2 * BALL_RADIUS + BALL_INIT_SPACE) * i++, y, 0), vec3(0, 0, 0), hex_color("#FFFFFF"), false));
            --num_on_left;
        }

        let num_on_right = n / 2;
        i = 1;
        while (num_on_right > 0) {
            balls.push(new Ball(vec3((2 * BALL_RADIUS + BALL_INIT_SPACE) * i++, y, 0), vec3(0, 0, 0), hex_color("#FFFFFF"), false));
            --num_on_right;
        }

        return balls;
    }

    make_even_layer(y, n) {
        let balls = [];
        let x = (n / 2.0) * 2 * BALL_RADIUS - BALL_RADIUS + (n / 2.0 - 1) * BALL_INIT_SPACE + BALL_INIT_SPACE / 2.0;
        while (n > 0) {
            balls.push(new Ball(vec3(x, y, 0), vec3(0, 0, 0), hex_color("#FFFFFF"), false));
            x -= 2 * BALL_RADIUS + BALL_INIT_SPACE;
            --n;
        }
        return balls;
    }

    get_cam_matrix() {
        let default_cam_loc = Mat4.rotation(-Math.PI / 2, 0, 0, 1).times(Mat4.look_at(vec3(0, 0, 75), vec3(0, 0, 0), vec3(0, 1, 1)));
        if (!KeyboardState.fpv) {
            return default_cam_loc;
        } else {
            if (!this.stopped) {
                return default_cam_loc;
            } else {
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
        if (this.stopped) {
            let vel = this.cue_stick.update_loc();
            if (vel != null) {
                // The cue stick has hit the cue ball.
                this.cue_ball.set_vel(vel);
                this.stopped = false;
            }
        } else {
            this.collision_check();
            for (let i = 0; i < this.balls.length; ++i) {
                this.balls[i].update_loc(dt);
            }
            if (this.all_balls_stopped()) {
                this.stopped = true;
                this.cue_stick.set_loc(this.cue_ball.get_loc());
            }
        }
    }

    collision_check() {
        for (let i = 0; i < this.balls.length; ++i) {
            for (let j = i + 1; j < this.balls.length; ++j) {
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
                }
            }
        }
    }

    draw(context, program_state) {
        TABLE_SHAPE.draw(context, program_state, Mat4.translation(0, 0, -2).times(Mat4.scale(TABLE_MAX_X, TABLE_MAX_Y, 1)), TABLE_MATERIAL);
        for (let i = 0; i < this.balls.length; ++i) {
            this.balls[i].draw(context, program_state);
        }
        if (this.stopped) {
            this.cue_stick.draw(context, program_state);
        }
    }
}
