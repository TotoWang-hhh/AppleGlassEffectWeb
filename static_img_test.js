const target_canvas = document.getElementById("glass_target");
const ctx = target_canvas.getContext('2d');

function load_bg_and_render() {
    const img = new Image();
    img.src = './Test_BG3.jpg';
    img.onload = function() {
        target_canvas.width = Math.round(img.width / 4);
        target_canvas.height = Math.round(img.height / 4);
        ctx.drawImage(img, 0, 0, target_canvas.width, target_canvas.height);
        setTimeout(() => {
            render_all();
        }, 100);
    };
}

function draw_pixel(pos_x, pos_y, r, g, b, a = 255) {
    const imgData = ctx.getImageData(pos_x, pos_y, 1, 1);
    imgData.data[0] = r;
    imgData.data[1] = g;
    imgData.data[2] = b;
    imgData.data[3] = a;
    ctx.putImageData(imgData, pos_x, pos_y);
}

function get_pixel(pos_x, pos_y) {
    const imgData = ctx.getImageData(pos_x, pos_y, 1, 1);
    const color = imgData.data
    return color;
}

async function render_pixel(x, y, width, height) {
    var [offset_x, offset_y] = await calc_pixel_xy_offset(width, height, 15, 50, x, y);
    var [rr, rg, rb, ra] = get_pixel(x + offset_x, y + offset_y);
    draw_pixel(x, y, rr, rg, rb);
}

async function render_all() {
    const width = target_canvas.width;
    const height = target_canvas.height;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            await render_pixel(x, y, width, height);
        }
    }
}

window.onload = load_bg_and_render;