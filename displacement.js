// displacement.js
export default async function initDisplacement(canvas, bgImageUrl, mapDataUrl) {
  if (!navigator.gpu) {
    console.error('WebGPU not supported.');
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'premultiplied' });

  // Load images to ImageBitmap
  const [bgBitmap, mapBitmap] = await Promise.all([
    loadImageBitmap(bgImageUrl),
    loadImageBitmap(mapDataUrl)
  ]);

  const bgTexture = createTextureFromBitmap(device, bgBitmap);
  const mapTexture = createTextureFromBitmap(device, mapBitmap);

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  // Shaders
  const shaderModule = device.createShaderModule({
    code: `
      struct VertexOut {
        @builtin(position) position: vec4<f32>,
        @location(0) uv: vec2<f32>
      };

      @vertex
      fn vs(@builtin(vertex_index) vi: u32) -> VertexOut {
        var pos = array<vec2<f32>, 6>(
          vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
          vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
        );
        var uv = array<vec2<f32>, 6>(
          vec2<f32>(0.0, 1.0), vec2<f32>(1.0, 1.0), vec2<f32>(0.0, 0.0),
          vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0), vec2<f32>(1.0, 0.0)
        );
        var output: VertexOut;
        output.position = vec4<f32>(pos[vi], 0.0, 1.0);
        output.uv = uv[vi];
        return output;
      }

      @group(0) @binding(0) var bgTex: texture_2d<f32>;
      @group(0) @binding(1) var mapTex: texture_2d<f32>;
      @group(0) @binding(2) var smp: sampler;

      @fragment
      fn fs(in: VertexOut) -> @location(0) vec4<f32> {
        let map = textureSample(mapTex, smp, in.uv).rg;
        let offset = (map - vec2(0.5, 0.5)) * 0.2; // 控制扭曲强度
        let displacedUV = in.uv + offset;
        return textureSample(bgTex, smp, displacedUV);
      }
    `
  });

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs'
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs',
      targets: [{ format }]
    },
    primitive: { topology: 'triangle-list' }
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: bgTexture.createView() },
      { binding: 1, resource: mapTexture.createView() },
      { binding: 2, resource: sampler },
    ]
  });

  function frame() {
    const encoder = device.createCommandEncoder();
    const view = context.getCurrentTexture().createView();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view,
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        loadOp: 'clear',
        storeOp: 'store',
      }]
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

async function loadImageBitmap(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await createImageBitmap(blob);
}

function createTextureFromBitmap(device, bitmap) {
  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING |
           GPUTextureUsage.COPY_DST |
           GPUTextureUsage.RENDER_ATTACHMENT
  });
  device.queue.copyExternalImageToTexture(
    { source: bitmap },
    { texture },
    [bitmap.width, bitmap.height]
  );
  return texture;
}
