import { defs } from './examples/common.js';

export class Table_Phong extends defs.Phong_Shader {
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

export class Ball_Phong extends defs.Textured_Phong {
    constructor(num_lights = 2) {
        super(num_lights);
        this.texture_displacement = [ 0.0, 0.0 ];
    }

    set_texture_displacement(texture_displacement) {
        this.texture_displacement = texture_displacement;
    }

    send_material(gl, gpu, material) {
        super.send_material(gl, gpu, material);
        gl.uniform2fv(gpu.texture_displacement, this.texture_displacement);
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float speed;
            uniform vec2 texture_displacement;
            void main() {
                vec2 new_f_tex_coord = vec2( f_tex_coord.x + texture_displacement[0], f_tex_coord.y + texture_displacement[1] );
                vec4 tex_color = texture2D( texture, new_f_tex_coord );
                if ( tex_color.w < .01 ) discard;
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}
