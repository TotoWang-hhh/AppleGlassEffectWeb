///////////////////////////////////////////////////////
//                                                   //
//   #       #####   ####    #    #  #####  ####     //
//   #         #    #    #   #    #    #    #   #    //
//   #         #    #    #   #    #    #    #    #   //
//   #         #    #  # #   #    #    #    #   #    //
//   ######  #####   ### ##   ####   #####  ####     //
//                                                   //
//        ####  #         ##     ####    ####        //
//       #      #        #  #   #       #            //
//      #  ###  #       ######   ####    ####        //
//       #   #  #       #    #       #       #       //
//        ####  ######  #    #  #####   #####        //
//                                                   //
//           2025 by rgzz666 (Wang Sizhe)            //
//                                                   //
///////////////////////////////////////////////////////

// Here are the debug options //
const ASSUME_WEBGPU_NOT_AVAIL = true;
// That's it! Below are the codes. //


// This function adjusts a value into a given range
function get_between(value, min, max) {
    var result = value;
    result = Math.max(min, value);
    result = Math.min(max, value);
    return result;
}

// This function calculates the offset of the pixel after deflection, base on its distance to edge
async function calc_pixel_refraction_offset(z_height, distance_point_edge, total_length) {
    var offset;
    if (distance_point_edge >= z_height) {
        // If the pixel is within the central region so not reflected
        offset = 0;
    } else {
        // offset = (total_length / distance_point_edge) - ((total_length / z_height) - 1);
        const epsilon = 0.001;
        offset = Math.log((z_height + epsilon) / (distance_point_edge + epsilon)) * 
                 (total_length / Math.log(z_height + 1));
    }
    return offset;
}

// This function calculates the edge diffusing effect offset with a given value of distance to center
async function calc_pixel_edge_diffusion_offset(z_height, diffuse_level, distance_point_center, distance_point_edge) {
    if (distance_point_edge > z_height) {
        return 0;
    }
    // const offset_target = Math.ceil(distance_point_center / (z_height - distance_point_edge + 1) ** diffuse_level);
    // const offset = distance_point_center - offset_target;
    // const offset = 0;
    const stretch_ratio = Math.cail(- ((distance_point_edge) ** 2)) * diffuse_level;
    const offset = (distance_point_center / stretch_ratio) * (stretch_ratio - 1);
    // console.log(`${distance_point_center} ==> ${(z_height - distance_point_edge + 1) ** diffuse_level}  ${offset_target}  ${offset}`);
    return offset;
}

// This function calculates both x and y offset of a pixel
// (does calc_pixel_refraction_offset twice on both x and y direction, and calcs the diffusing effect)
async function calc_pixel_xy_offset(rect_w, rect_h, z_height, max_edge_diffuse, point_x, point_y) {
    // For x-offset
    var x_offset = await calc_pixel_refraction_offset(z_height, Math.min(point_x, rect_w - point_x), rect_w);
    // x_offset += await calc_pixel_edge_diffusion_offset(z_height, max_edge_diffuse, point_y, rect_h,  point_x, rect_w);
    // For y-offset
    var y_offset = await calc_pixel_refraction_offset(z_height, Math.min(point_y, rect_h - point_y), rect_h);
    y_offset += await calc_pixel_edge_diffusion_offset(z_height, .5, Math.abs(rect_h - point_x) / 2, 
                                                       Math.min(point_x, rect_w - point_x));
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
async function draw_displacement_map(width, height, z_height, max_edge_diffuse, xChanel="R", yChanel="B") {
    if (width === undefined | height === undefined) {
        console.error("Size parameters for draw_displacement_map() are not present! \n" + 
                      "The displacement map drawing task will be ended.");
        return;
    }
    const colorChanels = ["R", "G", "B", "A"];
    const xChanelIndex = colorChanels.indexOf(xChanel);
    const yChanelIndex = colorChanels.indexOf(yChanel);
    if (xChanelIndex === undefined | yChanelIndex === undefined) {
        console.error("Chanel selector parameters for draw_displacement_map() are not correct! \n" + 
                      "The displacement map drawing task will be ended.");
        return;
    }

    // Below is the processing part
    // Initialization
    console.log("Redraw displacement map.");
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    const scale = Math.max(width, height);

    function draw_pixel(pos_x, pos_y, color) {
        if (color[3] === undefined) {
            color[3] = 255;
        }
        const pixelData = ctx.createImageData(1, 1);
        pixelData.data.set(color);
        ctx.putImageData(pixelData, pos_x, pos_y);
    }

    // Render
    if (navigator.gpu & !ASSUME_WEBGPU_NOT_AVAIL) {
        console.log("WebGPU available!");
    } else {
        console.warn("WebGPU not present! Falling back to CPU rendering, which may be slow. \n" + 
                     "Consider to keep your browser up date or check debug options.");
        if (ASSUME_WEBGPU_NOT_AVAIL) {
            console.log("%cTip " + 
                        "%cWebGPU is assumed to be unavailable according to debug options. \n" + 
                        "Consider changing it in console or liquidglass.js if necessary.", 
                        "padding: 2px 5px; border-radius: 3px; color: #fff; background: green; font-weight: bold;", 
                        "color: green");
        }
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                var [x_offset, y_offset] = await calc_pixel_xy_offset(width, height, z_height, max_edge_diffuse, x, y);
                var pixel_color = [128, 128, 128, 255];
                pixel_color[xChanelIndex] = 128 + Math.round(x_offset * (128 / scale));
                pixel_color[yChanelIndex] = 128 + Math.round(y_offset * (128 / scale));
                draw_pixel(x, y, pixel_color);
            }
        }
        
        // Convert to base64
        const blob = await offscreen.convertToBlob({ type: 'image/png' });
        const base64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        return base64;
    }
}