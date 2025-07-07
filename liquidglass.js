///////////////////////////////////////////////////////
//                                                   //
//   #       #####   ####    #    #  #####  ####     //
//   #         #    #    #   #    #    #    #   #    //
//   #         #    #    #   #    #    #    #    #   //
//   #         #    #  # #   #    #    #    #   #    //
//   ######  #####   ### ##   ####   #####  ####     //
//                                                   //
//       #####  #         ##     ####    ####        //
//      #       #        #  #   #       #            //
//      #  ###  #       ######   ####    ####        //
//      #    #  #       #    #       #       #       //
//       #####  ######  #    #  #####   #####        //
//                                                   //
//           2025 by rgzz666 (Wang Sizhe)            //
//                                                   //
///////////////////////////////////////////////////////

// Here are the debug options //
const ASSUME_WEBGPU_NOT_AVAIL = true;
// That's it! Below are the codes. //

var refraction_offset_cache = {};

// This function adjusts a value into a given range
function get_between(value, min, max) {
    var result = value;
    result = Math.max(min, value);
    result = Math.min(max, value);
    return result;
}

// This function calculates the offset of the pixel after deflection, base on its distance to edge
async function calc_pixel_refraction_offset(z_height, distance_point_edge, total_length) {
    if (distance_point_edge >= z_height) {
        // If the pixel is within the central region so not reflected
        return 0;
    }
    var offset = 0;
    if (refraction_offset_cache.hasOwnProperty(distance_point_edge.toString())) {
        // If already calculated and found in cache
        offset = refraction_offset_cache[distance_point_edge.toString()];
        // console.log(`Cache [${distance_point_edge}] ==> ${offset}`);
    } else {
        offset = (total_length / distance_point_edge) - ((total_length / z_height) - 1);
        refraction_offset_cache[distance_point_edge.toString()] = offset;
        // console.log(`Cache [${distance_point_edge}] <== ${offset}`);
    }
    return offset;
}

// This function calculates the edge diffusing effect offset with a given value of distance to center
async function calc_pixel_edge_diffusion_offset_abs(z_height, diffuse_level, distance_point_center, distance_point_edge) {
    if (distance_point_edge > z_height) {
        return 0;
    }
    // const offset_target = Math.ceil(distance_point_center / (z_height - distance_point_edge + 1) ** diffuse_level);
    // const offset = distance_point_center - offset_target;
    const offset = 0;
    // console.log(`${distance_point_center} ==> ${(z_height - distance_point_edge + 1) ** diffuse_level}  ${offset_target}  ${offset}`);
    return offset;
}

// This function decides the direction of edge diffusion offset
async function calc_pixel_edge_diffusion_offset(z_height, max_diffuse, point_pos, total_length, 
    perpendicular_point_pos, perpendicular_total_length) {
    var diffuse_offset = await calc_pixel_edge_diffusion_offset_abs(z_height, max_diffuse, 
        Math.abs(total_length / 2 - point_pos), Math.min(perpendicular_point_pos, perpendicular_total_length - perpendicular_point_pos));
    if (perpendicular_point_pos < perpendicular_total_length / 2) {
        diffuse_offset = -diffuse_offset;
    }
    // console.log(`${point_pos} ==> ${diffuse_offset}`);
    return diffuse_offset;
}

// This function calculates both x and y offset of a pixel
// (does calc_pixel_refraction_offset twice on both x and y direction, and calcs the diffusing effect)
async function calc_pixel_xy_offset(rect_w, rect_h, z_height, max_edge_diffuse, point_x, point_y) {
    // For x-offset
    var x_offset = await calc_pixel_refraction_offset(z_height, Math.min(point_x, rect_w - point_x), rect_w);
    // x_offset += await calc_pixel_edge_diffusion_offset(z_height, max_edge_diffuse, point_y, rect_h,  point_x, rect_w);
    // For y-offset
    var y_offset = await calc_pixel_refraction_offset(z_height, Math.min(point_y, rect_h - point_y), rect_h);
    // y_offset += await calc_pixel_edge_diffusion_offset(z_height, max_edge_diffuse, point_x, rect_w, point_y, rect_h);
    // Adjust and return result
    if (point_x > z_height) {
        x_offset = -x_offset;
    }
    if (point_y > z_height) {
        y_offset = -y_offset;
    }
    x_offset = get_between(Math.round(x_offset), -(point_x - 1), (rect_w - point_x - 1));
    y_offset = get_between(Math.round(y_offset), -(point_y - 1), (rect_h - point_y - 1));
    return [x_offset, y_offset];
}

// This function draws an image for feDisplacementMap
async function draw_displacement_map(width, height, xChanel="R", yChanel="B") {
    if (width === undefined | height === undefined) {
        console.error("Parameters for draw_displacement_map() are not present! \n" + 
                      "The displacement map drawing task will be ended.");
        return;
    }
    const colorChanels = ["R", "G", "B", "A"];
    console.log("Redraw displacement map.");
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext('2d');
    function draw_pixel(pos_x, pos_y, r, g, b, a = 255) {
        const imgData = ctx.getImageData(pos_x, pos_y, 1, 1);
        imgData.data[0] = r;
        imgData.data[1] = g;
        imgData.data[2] = b;
        imgData.data[3] = a;
        ctx.putImageData(imgData, pos_x, pos_y);
    }
    if (navigator.gpu & !ASSUME_WEBGPU_NOT_AVAIL) {
        console.log("WebGPU available!");
    } else {
        console.warn("WebGPU not present! Falling back to CPU rendering, which may be slow. \n" + 
                     "Consider to keep your browser up date or check debug options.");
        if (ASSUME_WEBGPU_NOT_AVAIL) {
            console.log("%cTip " + 
                        "%cWebGPU is assumed to be unavailable according to debug options. \n" + 
                        "Consider changing it in liquidglass.js if necessary.", 
                        "padding: 2px 5px; border-radius: 3px; color: #fff; background: green; font-weight: bold;", 
                        "color: green")
        }
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                a = 1;
                //NotImplemented
            }
        }
    }
}