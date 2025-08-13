(() => {
  const block = document.getElementById("glass-block");

  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  block.addEventListener("mousedown", (e) => {
    isDragging = true;
    const rect = block.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    block.style.transition = "none"; // cancel transitions during drag
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      block.style.transition = ""; // restore transitions
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let newLeft = e.clientX - dragOffsetX;
    let newTop = e.clientY - dragOffsetY;

    // Optional: limit dragging inside viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = block.getBoundingClientRect();

    if (newLeft < 0) newLeft = 0;
    else if (newLeft + rect.width > vw) newLeft = vw - rect.width;

    if (newTop < 0) newTop = 0;
    else if (newTop + rect.height > vh) newTop = vh - rect.height;

    block.style.left = newLeft + "px";
    block.style.top = newTop + "px";
  });
})();
