import { defs, tiny } from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

const BALL_RADIUS = 1;
const BALL_SHAPE = new defs.Subdivision_Sphere(4);
const BALL_MATERIAL = new Material(new defs.Phong_Shader(), { ambient: 1, diffusivity: .6, color: hex_color("#FFFFFF") });

const COLLISION_VEL_LOSS = 0.9;
const FRICTION_VEL_LOSS = 0.995;

export class Ball {
    constructor(init_loc, init_vel, color, solid) {
        this.model_transform = Mat4.identity();
        this.model_transform = this.model_transform.times(Mat4.translation(init_loc[0], init_loc[1], init_loc[2])).times(Mat4.scale(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS));
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

    set_vel(new_vel) {
        this.vel = new_vel;
    }

    update_loc(dt) {
        let dl = this.vel.times(dt);
        this.loc = this.loc.plus(dl);
        this.model_transform = this.model_transform.times(Mat4.translation(dl[0], dl[1], dl[2]));

        // Ensure ball is within bounds:
    }

    draw(context, program_state) {
        BALL_SHAPE.draw(context, program_state, this.model_transform, BALL_MATERIAL.override({ color: this.color }));
    }
}

export class Game {
    constructor() {
        this.balls = Array(2);
        this.balls[0] = new Ball(vec3(0, 0, 0), vec3(5, 5, 5), hex_color("#FFFFFF"), false);
        this.balls[1] = new Ball(vec3(5, 5, 5), vec3(-1, -1, -1), hex_color("#FFFFFF"), false);
    }

    update(dt) {
        this.collision_check();
        for (let i = 0; i < this.balls.length; ++i) {
            this.balls[i].update_loc(dt);
            this.balls[i].set_vel(this.balls[i].get_vel().times(FRICTION_VEL_LOSS));
        }
    }

    collision_check() {
        for (let i = 0; i < this.balls.length; ++i) {
            for (let j = i + 1; j < this.balls.length; ++j) {
                let loc1 = this.balls[i].get_loc();
                let loc2 = this.balls[j].get_loc();
                let dist_vec = loc1.minus(loc2);
                let dist_squared = dist_vec.dot(dist_vec);
                if (dist_squared <= (2 * BALL_RADIUS) ** 2) {
                    let old_vel1 = this.balls[i].get_vel();
                    let old_vel2 = this.balls[j].get_vel();

                    let new_vel1 = old_vel1.minus(loc1.minus(loc2).times(old_vel1.minus(old_vel2).dot(loc1.minus(loc2)) * (1 / dist_squared))).times(COLLISION_VEL_LOSS);

                    let new_vel2 = old_vel2.minus(loc2.minus(loc1).times(old_vel2.minus(old_vel1).dot(loc2.minus(loc1)) * (1 / dist_squared))).times(COLLISION_VEL_LOSS);

                    this.balls[i].set_vel(new_vel1);
                    this.balls[j].set_vel(new_vel2);
                }
            }
        }
    }

    draw(context, program_state) {
        for (let i = 0; i < this.balls.length; ++i) {
            this.balls[i].draw(context, program_state);
        }
    }
}
