import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function correctAndFormatSVG(rawSVG: string) {
  try {
    // Basic validation - check if it's a string and contains SVG-like content
    if (!rawSVG || typeof rawSVG !== 'string') {
      console.warn('Invalid SVG input: not a string or empty');
      return rawSVG || '';
    }

    // Check if it actually contains SVG content
    if (!rawSVG.trim().includes('<svg')) {
      console.warn('Invalid SVG input: does not contain <svg tag');
      return rawSVG;
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rawSVG, 'image/svg+xml');

    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.warn('SVG parsing failed:', parseError.textContent);
      // Return the original content instead of throwing an error
      return rawSVG;
    }

    // Check if we actually got an SVG element
    const svgElement = xmlDoc.querySelector('svg');
    if (!svgElement) {
      console.warn('No SVG element found in parsed content');
      return rawSVG;
    }

    xmlDoc.querySelectorAll('rect, line').forEach(el => {
      if (!el.innerHTML.trim()) {
        el.innerHTML = '';
      }
    });

    const arrowhead = xmlDoc.querySelector('marker polygon');
    if (arrowhead && !arrowhead.hasAttribute('class')) {
      arrowhead.setAttribute('class', 'arrowhead');
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  } catch (error) {
    console.error('Error processing SVG:', error);
    // Return the original content instead of throwing an error
    return rawSVG;
  }
}
