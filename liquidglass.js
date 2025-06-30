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
    if (distance_point_edge.toString() in refraction_offset_cache) {
        // If already calculated and found in cache
        offset = refraction_offset_cache[distance_point_edge.toString()];
    } else {
        offset = (total_length / distance_point_edge) - ((total_length / z_height) - 1);
        refraction_offset_cache[distance_point_edge.toString()] = offset;
    }
    return offset;
}

// This function calculates both x and y offset of a pixel
// (does calc_pixel_refraction_offset twice on both x and y direction, and calcs the diffusing effect)
async function calc_pixel_xy_offset(rect_w, rect_h, z_height, point_x, point_y) {
    // For x-offset
    var x_offset = await calc_pixel_refraction_offset(z_height, Math.min(point_x, rect_w - point_x), rect_w);
    // For y-offset
    var y_offset = await calc_pixel_refraction_offset(z_height, Math.min(point_y, rect_h - point_y), rect_h);
    // Adjust and return result
    x_offset = get_between(Math.round(x_offset), -(rect_w - point_x - 1), (rect_w - point_x - 1));
    y_offset = get_between(Math.round(y_offset), -(rect_h - point_y - 1), (rect_h - point_y - 1));
    if (point_x > z_height) {
        x_offset = -x_offset;
    }
    if (point_y > z_height) {
        y_offset = -y_offset;
    }
    return [x_offset, y_offset];
}