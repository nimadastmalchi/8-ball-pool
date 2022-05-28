import { defs, tiny } from './examples/common.js';

const {
    vec, vec3, hex_color, Material
} = tiny;

class Table_Phong extends defs.Phong_Shader {
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            void main() {
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                // Check whether the fragment is in a pocket:
                if ( distance( vec2( -20.0, 0.0 ), vertex_worldspace.xy ) <= 2.0 ||
                     distance( vec2( 20.0, 0.0 ), vertex_worldspace.xy ) <= 2.0 ||
                     distance( vec2( -19.0, 39.0 ), vertex_worldspace.xy ) <= 2.0 ||
                     distance( vec2( -19.0, -39.0 ), vertex_worldspace.xy ) <= 2.0 ||
                     distance( vec2( 19.0, 39.0 ), vertex_worldspace.xy ) <= 2.0 ||
                     distance( vec2( 19.0, -39.0 ), vertex_worldspace.xy ) <= 2.0 ) {
                     gl_FragColor = vec4( 0.0, 0.0, 0.0, 0.0 );
                }
            } `;
    }
}

export const BALL_RADIUS = 1;
export const BALL_INIT_SPACE = 0.2;
export const BALL_SHAPE = new defs.Subdivision_Sphere(8);
export const BALL_MATERIAL = new Material(new defs.Phong_Shader(), { ambient: 0.5, diffusivity: .6, specularity: 0.2, color: hex_color("#FFFFFF") });

export const STICK_LENGTH = 40;
export const STICK_WIDTH = 0.25;
export const STICK_SHAPE = new defs.Capped_Cylinder(5, 25, [[0, 2], [0, 1]]);
export const STICK_MATERIAL_0 = new Material(new defs.Phong_Shader(), { ambient: 0.5, diffusivity: .6, color: hex_color("#FF0000") });
export const STICK_MATERIAL_1 = new Material(new defs.Phong_Shader(), { ambient: 0.5, diffusivity: .6, color: hex_color("#0000FF") });

export const TABLE_SHAPE = new defs.Cube();
export const TABLE_MATERIAL = new Material(new Table_Phong(), { ambient: 1, diffusivity: 1, specularity: 0, color: hex_color("#014220") });

export const RAILING_SHAPE = new defs.Cube();
export const RAILING_MATERIAL = new Material(new Table_Phong(), { ambient: 1, diffusivity: 1, specularity: 0, color: hex_color("#654321") });

export const COLLISION_VEL_LOSS = 0.95;
export const FRICTION_VEL_LOSS = 0.9925;

export const TABLE_MIN_X = -20;
export const TABLE_MAX_X = 20;
export const TABLE_MIN_Y = -40;
export const TABLE_MAX_Y = 40;

export const POCKET_LOCS = [ vec3(-20, 0, 0), vec3(20, 0, 0), vec3(-19, 39, 0), vec3(-19, -39, 0), vec3(19, 39, 0), vec(19, -39, 0) ]
