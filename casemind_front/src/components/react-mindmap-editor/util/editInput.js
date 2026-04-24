export function measureTextWidth(text, font) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font || "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const lines = (text || '').split('\n');
  return Math.max(...lines.map(line => ctx.measureText(line).width), 0);
}

export default function editInput(seletedNode, inputNode, positionOnly) {
  const $previewer = inputNode;
  const $container = document.getElementsByClassName('kityminder-core-container');

  let x = seletedNode.getRenderBox().cx - seletedNode.getRenderBox().width / 2;
  let y = seletedNode.getRenderBox().cy + $container[0].offsetTop - 8;
  const nodeWidth = seletedNode.getRenderBox().width;

  if (positionOnly === undefined) {
    $previewer.style.left = Math.round(x) + 'px';
    $previewer.style.top = Math.round(y) + 'px';
    const initialWidth = Math.max(nodeWidth, 120);
    $previewer.style.width = Math.round(initialWidth) + 'px';
  } else {
    x = x + seletedNode.getRenderBox().width / 2;
    return { x, y };
  }
}
