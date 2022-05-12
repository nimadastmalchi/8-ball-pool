import { defs, tiny } from './examples/common.js';
import { Many_Lights_Demo } from './examples/many-lights-demo.js';
import { Ball, Game } from './components.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Pool extends Scene {
    constructor() {
        super();

        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 100), vec3(0, 0, 0), vec3(0, 1, 1));

        this.game = new Game();
    }

    make_control_panel() {

    }

    display(context, program_state) {
        var e = window.event;

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location.times(Mat4.rotation(-Math.PI / 2, 0, 0, 1)));
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        const light_position = vec4(0, 0, 100, 1);
        program_state.lights = [new Light(light_position, hex_color("#FFFFFF"), 1000000)];

        if (t > 2.5) {
            this.game.update(dt);
        }
        this.game.draw(context, program_state);
    }
}
