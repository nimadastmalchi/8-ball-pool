import { tiny } from './examples/common.js';

const {
    vec3, Mat4
} = tiny;

export class Ball {
    constructor(init_loc, init_vel, color, solid) {
        this.model_transform = Mat4.translation(init_loc[0], init_loc[1], init_loc[2]).times(Mat4.scale(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS));
        this.loc = init_loc;
        this.vel = init_vel;
        this.solid = solid;
        this.color = color;
        this.pocket = null;
        this.visible = true;
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

    is_visible() {
        return this.visible;
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

    update_loc(dt) {
        if (this.pocket != null) {
            if (this.loc[2] < -2) {
                this.set_vel(vec3(0, 0, 0));
                this.visible = false;
            }
            else {
                let x_sign = this.vel[0] >= 0 ? 1 : -1;
                let y_sign = this.vel[1] >= 0 ? 1 : -1;

                let vel_dir = this.pocket.plus(vec3(x_sign * 6, y_sign * 6, -10)).minus(this.loc).normalized();
                this.set_vel(vel_dir.times(20));

                let dl = this.vel.times(dt);
                this.loc = this.loc.plus(dl);
                this.model_transform = Mat4.translation(this.loc[0], this.loc[1], this.loc[2]);
            }
        }
        else {
            let dl = this.vel.times(dt);
            this.loc = this.loc.plus(dl);
            this.model_transform = Mat4.translation(this.loc[0], this.loc[1], this.loc[2]);
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
            if (this.loc[0] < TABLE_MIN_X + BALL_RADIUS || this.loc[0] > TABLE_MAX_X - BALL_RADIUS) {
                this.vel = vec3(-this.vel[0], this.vel[1], this.vel[2]).times(COLLISION_VEL_LOSS);
                this.loc[0] = this.loc[0] < TABLE_MIN_X + BALL_RADIUS ? TABLE_MIN_X + BALL_RADIUS : TABLE_MAX_X - BALL_RADIUS;
            } else if (this.loc[1] < TABLE_MIN_Y + BALL_RADIUS || this.loc[1] > TABLE_MAX_Y - BALL_RADIUS) {
                this.vel = vec3(this.vel[0], -this.vel[1], this.vel[2]).times(COLLISION_VEL_LOSS);
                this.loc[1] = this.loc[1] < TABLE_MIN_Y + BALL_RADIUS ? TABLE_MIN_Y + BALL_RADIUS : TABLE_MAX_Y - BALL_RADIUS;
            }
        }
    }

    draw(context, program_state) {
        // Function set_loc() may be called after the update() function, so ensure this.model_transform is up to date:
        this.model_transform = Mat4.translation(this.loc[0], this.loc[1], this.loc[2]);
        BALL_SHAPE.draw(context, program_state, this.model_transform, BALL_MATERIAL.override({ color: this.color }));
    }
}
