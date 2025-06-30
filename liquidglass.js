var refraction_offset_cache = {};

// This function adjusts a value into a given range
function get_between(value, min, max) {
    var result = value;
    result = Math.max(min, value);
    result = Math.min(max, value);
    return result;
}

// This function calculates the offset of the pixel after deflection, base on its distance to edge
async function calc_pixel_refraction_offset(z_height, v_height, distance_point_edge, distance_center_edge) {
    if (distance_point_edge >= z_height) {
        // If the pixel is within the central region so not reflected
        return 0;
    }
    var offset = 0;
    if (distance_point_edge.toString() in refraction_offset_cache) {
        // If already calculated and found in cache
        offset = refraction_offset_cache[distance_point_edge.toString()];
    } else {
        const point_z_height = (z_height ** 2 - distance_point_edge ** 2) ** 0.5; // calculate the z-height of the surface at the pixel
        const slope_gradient = Math.atan((2 * z_height  - 2 * distance_point_edge) - 0.5 * ((z_height ** 2 - distance_point_edge ** 2) ** 0.5));
        const refracted_gradient = Math.atan((v_height + z_height - point_z_height) / (distance_center_edge - distance_point_edge));
        const angle_incident = Math.asin(1.5 * Math.sin(0.5 * Math.pi - (refracted_gradient - slope_gradient)));
        offset = Math.tan(slope_gradient) * point_z_height;
        refraction_offset_cache[distance_point_edge.toString()] = offset;
    }
    return offset;
}

// This function calculates both x and y offset of a pixel
// (does calc_pixel_refraction_offset twice on both x and y direction, and calcs the diffusing effect)
async function calc_pixel_xy_offset(rect_w, rect_h, z_height, v_height, point_x, point_y) {
    // For x-offset
    var x_offset = await calc_pixel_refraction_offset(z_height, v_height, Math.min(point_x, rect_w - point_x), (rect_w / 2));
    // For y-offset
    var y_offset = await calc_pixel_refraction_offset(z_height, v_height, Math.min(point_y, rect_h - point_y), (rect_h / 2));
    // Adjust and return result
    x_offset = get_between(Math.round(x_offset), 0, (rect_w - point_x));
    y_offset = get_between(Math.round(y_offset), 0, (rect_h - point_y));
    if (point_x > z_height) {
        x_offset = -x_offset;
    }
    if (point_y > z_height) {
        y_offset = -y_offset;
    }
    return [x_offset, y_offset];
}