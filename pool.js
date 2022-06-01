import { defs, tiny } from './examples/common.js';
import { Keyboard_State, Game } from './game.js';

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
        this.key_triggered_button("Left", ["a"], () => Keyboard_State.left = true, undefined, () => Keyboard_State.left = false);
        this.key_triggered_button("Right", ["d"], () => Keyboard_State.right = true, undefined, () => Keyboard_State.right = false);
        this.key_triggered_button("Down / Power", ["s"], () => Keyboard_State.down = true, undefined, () => Keyboard_State.down = false);
        this.key_triggered_button("Up", ["w"], () => Keyboard_State.up = true, undefined, () => Keyboard_State.up = false);
        this.key_triggered_button("Apply", ["q"], () => Keyboard_State.apply = true, undefined, () => Keyboard_State.apply = false);
        this.key_triggered_button("Toggle FPV", ["v"], () => Keyboard_State.fpv ^= 1);
        this.key_triggered_button("Restart", ["r"], () => this.game = new Game());
    }

    display(context, program_state) {
        program_state.set_camera(this.game.get_cam_matrix());

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        program_state.lights = [new Light(vec4(0, 0, 10, 1), hex_color("#FFFFFF"), 1000)];

        this.game.update(dt);
        this.game.draw(context, program_state);
    }
}
