import { defs, tiny } from './examples/common.js';
import { Pool } from "./pool.js";

// Pull these names into this module's scope for convenience:
const {
    Vector, Vector3, vec, vec3, vec4, color, Matrix, Mat4, Light, Shape, Material, Shader, Texture, Scene,
    Canvas_Widget, Code_Widget, Text_Widget
} = tiny;

// Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and common.js.
// This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

Object.assign(defs, { Pool });

const Main_Scene = Pool;

export { Main_Scene, Canvas_Widget, Code_Widget, Text_Widget, defs }
