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
async function calc_pixel_edge_diffusion_offset_abs(z_height, max_diffuse, distance_point_edge) {
    if (distance_point_edge > z_height) {
        return 0;
    }
    var offset = max_diffuse * ((1 - (distance_point_edge / z_height)) ** 2);
    return offset;
}

// This function decides the direction of edge diffusion offset
async function calc_pixel_edge_diffusion_offset(z_height, max_diffuse, point_pos, total_length) {
    var diffuse_offset = await calc_pixel_edge_diffusion_offset_abs(z_height, max_diffuse, 
        Math.min(point_pos, total_length - point_pos), total_length);
    if (point_pos > total_length - point_pos) {
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
    x_offset += await calc_pixel_edge_diffusion_offset(z_height, max_edge_diffuse, point_y, rect_h);
    // For y-offset
    var y_offset = await calc_pixel_refraction_offset(z_height, Math.min(point_y, rect_h - point_y), rect_h);
    y_offset += await calc_pixel_edge_diffusion_offset(z_height, max_edge_diffuse, point_x, rect_w);
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