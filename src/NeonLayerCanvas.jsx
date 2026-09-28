import { useRef, useState } from 'react';
import { minimumHeightForFont } from './pricingConfig';

const SNAP_CM = 0.65;
const PREVIEW_WIDTH_CM = 140;
const PREVIEW_HEIGHT_CM = 50;
const PREVIEW_REFERENCE_TEXT_HEIGHT_CM = 15;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function NeonLayerCanvas({ design, activeLayerId, fonts, colors, onSelect, onDeselect, onMove, onResize, onRotate, previewScaleHeightCm }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const rotateRef = useRef(null);
  const [guides, setGuides] = useState([]);
  if (!design.complete) return <div className="layer-canvas-empty">Taip teks untuk mula melihat design</div>;
  const board = {
    x: design.boardOriginX,
    y: design.boardOriginY,
    width: design.backboardWidthCm,
    height: design.backboardHeightCm,
  };
  const physicalTextHeightCm = Math.max(1, Number(previewScaleHeightCm) || 15);
  const previewPhysicalScale = physicalTextHeightCm / PREVIEW_REFERENCE_TEXT_HEIGHT_CM;
  const dimensionOuterSpace = 14 * previewPhysicalScale;
  // Keep the preview at a stable physical scale so short text does not zoom up
  // to fill the whole mockup. It only zooms out if a design exceeds the stage.
  const viewport = {
    width: Math.max(PREVIEW_WIDTH_CM * previewPhysicalScale, board.width + dimensionOuterSpace),
    height: Math.max(PREVIEW_HEIGHT_CM * previewPhysicalScale, board.height + dimensionOuterSpace),
  };
  viewport.x = board.x - (viewport.width - board.width) / 2;
  viewport.y = board.y - (viewport.height - board.height) / 2;

  const pointFromEvent = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: viewport.x + ((event.clientX - rect.left) / rect.width) * viewport.width,
      y: viewport.y + ((event.clientY - rect.top) / rect.height) * viewport.height,
    };
  };
  const startDrag = (event, layer) => {
    if (layer.locked) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    dragRef.current = { id: layer.id, dx: point.x - layer.x_cm, dy: point.y - layer.y_cm, startX: point.x, startY: point.y, moved: false };
    onSelect(layer.id);
  };
  const drag = (event, layer) => {
    if (!dragRef.current || dragRef.current.id !== layer.id || layer.locked) return;
    const point = pointFromEvent(event);
    if (!dragRef.current.moved && Math.hypot(point.x - dragRef.current.startX, point.y - dragRef.current.startY) < 1) return;
    dragRef.current.moved = true;
    const width = layer.measurement.visualTextWidthCm;
    const height = layer.target_height_cm;
    let x = point.x - dragRef.current.dx;
    let y = point.y - dragRef.current.dy;
    const targetsX = [board.x + design.paddingCm, board.x + board.width / 2 - width / 2, board.x + board.width - design.paddingCm - width];
    const targetsY = [board.y + design.paddingCm, board.y + board.height / 2 - height / 2, board.y + board.height - design.paddingCm - height];
    const nextGuides = [];
    targetsX.forEach((target, index) => { if (Math.abs(x - target) <= SNAP_CM) { x = target; nextGuides.push({ axis: 'x', value: index === 1 ? x + width / 2 : index === 2 ? x + width : x }); } });
    targetsY.forEach((target, index) => { if (Math.abs(y - target) <= SNAP_CM) { y = target; nextGuides.push({ axis: 'y', value: index === 1 ? y + height / 2 : index === 2 ? y + height : y }); } });
    x = clamp(x, board.x, board.x + board.width - width);
    y = clamp(y, board.y, board.y + board.height - height);
    setGuides(nextGuides);
    onMove(layer.id, x, y);
  };
  const endDrag = () => { dragRef.current = null; setGuides([]); };
  const startResize = (event, layer) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    const width = layer.measurement.visualTextWidthCm;
    const height = layer.target_height_cm;
    const centerX = layer.x_cm + width / 2;
    const centerY = layer.y_cm + height / 2;
    resizeRef.current = {
      id: layer.id,
      centerX,
      centerY,
      startDistance: Math.max(1, Math.hypot(point.x - centerX, point.y - centerY)),
      startHeight: layer.target_height_cm,
      startWidth: width,
      minHeight: minimumHeightForFont(layer.font_id),
    };
  };
  const resize = (event) => {
    if (!resizeRef.current) return;
    event.stopPropagation();
    const point = pointFromEvent(event);
    const distance = Math.max(1, Math.hypot(point.x - resizeRef.current.centerX, point.y - resizeRef.current.centerY));
    const nextHeight = clamp(Math.round(resizeRef.current.startHeight * (distance / resizeRef.current.startDistance)), resizeRef.current.minHeight, 50);
    const appliedScale = nextHeight / resizeRef.current.startHeight;
    const nextWidth = resizeRef.current.startWidth * appliedScale;
    onResize(
      resizeRef.current.id,
      nextHeight,
      Number((resizeRef.current.centerX - nextWidth / 2).toFixed(2)),
      Number((resizeRef.current.centerY - nextHeight / 2).toFixed(2)),
    );
  };
  const endResize = (event) => { event.stopPropagation(); resizeRef.current = null; };
  const startRotate = (event, layer, width, height) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    const centerX = layer.x_cm + width / 2;
    const centerY = layer.y_cm + height / 2;
    rotateRef.current = {
      id: layer.id,
      centerX,
      centerY,
      startAngle: Math.atan2(point.y - centerY, point.x - centerX) * 180 / Math.PI,
      startRotation: Number(layer.rotation_deg) || 0,
    };
  };
  const rotate = (event) => {
    if (!rotateRef.current) return;
    event.stopPropagation();
    const point = pointFromEvent(event);
    const angle = Math.atan2(point.y - rotateRef.current.centerY, point.x - rotateRef.current.centerX) * 180 / Math.PI;
    let rotation = rotateRef.current.startRotation + angle - rotateRef.current.startAngle;
    if (event.shiftKey) rotation = Math.round(rotation / 15) * 15;
    onRotate(rotateRef.current.id, Number(rotation.toFixed(1)));
  };
  const endRotate = (event) => { event.stopPropagation(); rotateRef.current = null; };

  const dimensionLineGap = 3 * previewPhysicalScale;
  const dimensionTextGap = 7 * previewPhysicalScale;
  const displayedDesignWidthCm = Math.round(design.designWidthCm);
  const displayedDesignHeightCm = Math.round(design.designHeightCm);
  const widthInches = Math.round(design.designWidthCm / 2.54);
  const heightInches = Math.round(design.designHeightCm / 2.54);

  return <svg ref={svgRef} className="neon-layer-canvas" style={{ '--preview-physical-scale': previewPhysicalScale }} viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`} role="img" aria-label="Editor susunan perkataan neon" onPointerDown={() => onDeselect?.()}>
    <defs>
      <pattern id="neon-grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth=".035" /></pattern>
      <marker id="dimension-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M8,0 L0,4 L8,8" fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="1.4" /></marker>
      {colors.map((color) => <filter key={color.id} id={`glow-${color.id}`} x="-60%" y="-80%" width="220%" height="260%"><feGaussianBlur stdDeviation=".22" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>)}
    </defs>
    <rect className="canvas-acrylic-outline" x={board.x} y={board.y} width={board.width} height={board.height} rx=".35" />
    <rect x={board.x} y={board.y} width={board.width} height={board.height} fill="url(#neon-grid)" />
    {guides.map((guide, index) => guide.axis === 'x'
      ? <line key={index} className="snap-guide" x1={guide.value} x2={guide.value} y1={board.y} y2={board.y + board.height} />
      : <line key={index} className="snap-guide" x1={board.x} x2={board.x + board.width} y1={guide.value} y2={guide.value} />)}
    {design.layers.map((layer) => {
      if (!layer.visible || !layer.measurement?.complete) return null;
      const font = fonts.find((item) => item.id === layer.font_id);
      const color = colors.find((item) => item.id === layer.colour) || colors[0];
      const width = layer.measurement.visualTextWidthCm;
      const height = layer.target_height_cm;
      const selected = layer.id === activeLayerId;
      const centerX = layer.x_cm + width / 2;
      const centerY = layer.y_cm + height / 2;
      const rotation = Number(layer.rotation_deg) || 0;
      const rotateOffset = Math.max(7, height * .48);
      // Keep touch targets clearly visible on mobile instead of shrinking with
      // the artwork. The SVG viewBox keeps this around 10-14px on screen.
      const handleSize = Math.max(2.6, height * .14);
      const wordSizeLabel = `${layer.text} · ${Math.round(width)} × ${Math.round(layer.measurement.visualTextHeightCm)} cm`;
      const bubbleHeight = 5.4 * previewPhysicalScale;
      const bubbleWidth = clamp(16 + (wordSizeLabel.length * .72), 30, 62) * previewPhysicalScale;
      const bubbleY = layer.y_cm - (3.5 * previewPhysicalScale);
      const corners = [[layer.x_cm, layer.y_cm], [layer.x_cm + width, layer.y_cm], [layer.x_cm, layer.y_cm + height], [layer.x_cm + width, layer.y_cm + height]];
      return <g key={layer.id} transform={`rotate(${rotation} ${centerX} ${centerY})`} className={`canvas-layer ${selected ? 'selected' : ''} ${layer.locked ? 'locked' : ''}`} onPointerDown={(event) => startDrag(event, layer)} onPointerMove={(event) => drag(event, layer)} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={() => onSelect(layer.id)}>
        <foreignObject x={layer.x_cm} y={layer.y_cm} width={width} height={height} overflow="visible">
          <div xmlns="http://www.w3.org/1999/xhtml" className="canvas-neon-word neon-word" data-text={layer.text} style={{ '--neon': color.value, '--glow': color.glow, fontFamily: font?.family, fontSize: `${layer.target_height_cm}px`, letterSpacing: `${layer.letter_spacing_cm}px`, cursor: layer.locked ? 'not-allowed' : 'grab' }}>{layer.text}</div>
        </foreignObject>
        {selected && <><rect className="selection-box" x={layer.x_cm} y={layer.y_cm} width={width} height={height} /><line className="rotation-stem" x1={centerX} x2={centerX} y1={layer.y_cm} y2={layer.y_cm - rotateOffset} />{corners.map(([x, y], index) => <rect key={index} className="transform-handle resize-handle" x={x - handleSize / 2} y={y - handleSize / 2} width={handleSize} height={handleSize} onPointerDown={(event) => startResize(event, layer)} onPointerMove={resize} onPointerUp={endResize} onPointerCancel={endResize}><title>Tarik untuk ubah saiz perkataan</title></rect>)}<rect className="transform-handle rotate-handle" x={centerX - handleSize / 2} y={layer.y_cm - rotateOffset - handleSize / 2} width={handleSize} height={handleSize} onPointerDown={(event) => startRotate(event, layer, width, height)} onPointerMove={rotate} onPointerUp={endRotate} onPointerCancel={endRotate}><title>Tarik untuk rotate perkataan</title></rect><g className="word-size-bubble" transform={`rotate(${-rotation} ${centerX} ${bubbleY})`} pointerEvents="none"><rect x={centerX - bubbleWidth / 2} y={bubbleY - bubbleHeight / 2} width={bubbleWidth} height={bubbleHeight} rx={bubbleHeight / 2} /><text x={centerX} y={bubbleY}>{wordSizeLabel}</text></g></>}
      </g>;
    })}
    <g className="canvas-dimensions">
      <line markerStart="url(#dimension-arrow)" markerEnd="url(#dimension-arrow)" x1={design.bounds.minX} x2={design.bounds.maxX} y1={design.bounds.maxY + dimensionLineGap} y2={design.bounds.maxY + dimensionLineGap} /><text x={(design.bounds.minX + design.bounds.maxX) / 2} y={design.bounds.maxY + dimensionTextGap}>{displayedDesignWidthCm} cm / {widthInches} in</text>
      <line markerStart="url(#dimension-arrow)" markerEnd="url(#dimension-arrow)" x1={design.bounds.minX - dimensionLineGap} x2={design.bounds.minX - dimensionLineGap} y1={design.bounds.minY} y2={design.bounds.maxY} /><text transform={`translate(${design.bounds.minX - dimensionTextGap} ${(design.bounds.minY + design.bounds.maxY) / 2}) rotate(-90)`}>{displayedDesignHeightCm} cm / {heightInches} in</text>
    </g>
  </svg>;
}
