/**
 * InfraSight AI Vision Detection Engine
 * Simulates YOLOv8 / ViT edge computer vision model for civic defect detection.
 */

function analyzeImage(filename = '', buffer = null) {
  const nameLower = (filename || '').toLowerCase();
  
  let detectedClass = 'pothole';
  let label = 'Pothole';
  let confidence = 0.94;
  let bbox = [0.18, 0.45, 0.64, 0.42]; // [left, top, width, height] as fraction
  let severity = 0.88;

  if (nameLower.includes('light') || nameLower.includes('lamp') || nameLower.includes('pole')) {
    detectedClass = 'streetlight';
    label = 'Defective Streetlight';
    confidence = 0.92;
    bbox = [0.42, 0.08, 0.25, 0.72];
    severity = 0.74;
  } else if (nameLower.includes('garb') || nameLower.includes('waste') || nameLower.includes('trash') || nameLower.includes('bin')) {
    detectedClass = 'garbage';
    label = 'Garbage Overflow';
    confidence = 0.95;
    bbox = [0.25, 0.35, 0.52, 0.55];
    severity = 0.62;
  } else if (nameLower.includes('drain') || nameLower.includes('pipe') || nameLower.includes('water') || nameLower.includes('flood')) {
    detectedClass = 'drain';
    label = 'Drainage Blockage / Burst';
    confidence = 0.93;
    bbox = [0.15, 0.35, 0.70, 0.50];
    severity = 0.85;
  } else if (nameLower.includes('footpath') || nameLower.includes('walk') || nameLower.includes('slab')) {
    detectedClass = 'road';
    label = 'Damaged Footpath Slab';
    confidence = 0.91;
    bbox = [0.20, 0.40, 0.60, 0.45];
    severity = 0.58;
  } else if (nameLower.includes('signal') || nameLower.includes('traffic')) {
    detectedClass = 'traffic_signal';
    label = 'Traffic Signal Malfunction';
    confidence = 0.98;
    bbox = [0.32, 0.12, 0.38, 0.58];
    severity = 0.96;
  } else {
    // Default pothole or inspect buffer length variance
    if (buffer && buffer.length % 3 === 0) {
      detectedClass = 'drain';
      label = 'Water Hazard / Pipeline';
      confidence = 0.91;
      bbox = [0.22, 0.38, 0.58, 0.48];
      severity = 0.82;
    } else if (buffer && buffer.length % 3 === 1) {
      detectedClass = 'garbage';
      label = 'Garbage Dump Overflow';
      confidence = 0.93;
      bbox = [0.28, 0.32, 0.50, 0.50];
      severity = 0.65;
    } else {
      detectedClass = 'pothole';
      label = 'Deep Pothole';
      confidence = 0.95;
      bbox = [0.18, 0.45, 0.64, 0.42];
      severity = 0.92;
    }
  }

  return {
    success: true,
    detected_class: detectedClass,
    label,
    confidence,
    severity,
    detections: [
      {
        class: detectedClass,
        confidence,
        bbox,
        label: `${label} · ${Math.round(confidence * 100)}%`
      }
    ]
  };
}

module.exports = {
  analyzeImage
};
