const target_canvas = document.getElementById("glass_target");
const status_indicator = document.getElementById("status_indicator");
const ctx = target_canvas.getContext('2d', { willReadFrequently: true });
var originalImageData;

function set_status(text) {
    status_indicator.innerText = text;
    return text;
}

function store_original_image_data(originalImageDataRaw) {
    const width = originalImageDataRaw.width;
    const height = originalImageDataRaw.height;
    const data = originalImageDataRaw.data;
    originalImageData = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            row.push([
                data[idx],     // r
                data[idx + 1], // g
                data[idx + 2], // b
                data[idx + 3]  // a
            ]);
        }
        originalImageData.push(row);
    }
}

function load_bg_and_render() {
    set_status("Loading image");
    const img = new Image();
    img.src = './Test_BG3.jpg';
    img.onload = function() {
        target_canvas.width = Math.round(img.width / 2);
        target_canvas.height = Math.round(img.height / 2);
        ctx.drawImage(img, 0, 0, target_canvas.width, target_canvas.height);
        const originalImageDataRaw = ctx.getImageData(0, 0, target_canvas.width, target_canvas.height);
        store_original_image_data(originalImageDataRaw);
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
    if (pos_x < 0 | pos_x > target_canvas.width-1 | pos_y < 0 | pos_y > target_canvas.height-1) {
        return [100, 0, 255, 0];
    }
    const color = originalImageData[pos_y][pos_x];
    return color;
}

async function render_pixel(x, y, width, height) {
    var [offset_x, offset_y] = await calc_pixel_xy_offset(width, height, 70, 2, x, y);
    var [rr, rg, rb, ra] = get_pixel(x + offset_x, y + offset_y);
    draw_pixel(x, y, rr, rg, rb);
    // if (y > target_canvas.height - 30 | y < 30) {
    //     draw_pixel(x + offset_x, y + offset_y, 255, 0, 0);
    //     console.log(`${Math.min(y, height - y)} ==> ${offset_y}`);
    // }
}

async function render_all() {
    const width = target_canvas.width;
    const height = target_canvas.height;
    set_status("Rendering...");
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            set_status(`Rendering: (${x}/${width} , ${y}/${height})`);
            await render_pixel(x, y, width, height);
        }
    }
    set_status("Done!");
}

window.onload = load_bg_and_render;