import { defs, tiny } from './examples/common.js';
import { KeyboardState, Ball, Game } from './components.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Pool extends Scene {
    constructor() {
        super();

        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 75), vec3(0, 0, 0), vec3(0, 1, 1));

        this.game = new Game();
    }

    make_control_panel() {
        this.key_triggered_button("Left", ["h"], () => KeyboardState.left_arrow = true, undefined, () => KeyboardState.left_arrow = false);
        this.key_triggered_button("Right", ["l"], () => KeyboardState.right_arrow = true, undefined, () => KeyboardState.right_arrow = false);
        this.key_triggered_button("Power", ["j"], () => KeyboardState.powering = true, undefined, () => KeyboardState.powering = false);
        this.key_triggered_button("Toggle FPV", ["v"], () => KeyboardState.fpv ^= 1);
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            //program_state.set_camera(this.initial_camera_location.times(Mat4.rotation(-Math.PI / 2, 0, 0, 1)));
            program_state.set_camera(this.game.get_cam_matrix());
        }
        program_state.set_camera(this.game.get_cam_matrix());

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        program_state.lights = [new Light(vec4(0, 0, 10, 1), hex_color("#FFFFFF"), 100)];

        this.game.update(dt);
        this.game.draw(context, program_state);
    }
}
