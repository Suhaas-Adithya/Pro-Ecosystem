/**
 * @license PNCPL-1.0
 * Pro Suite Non-Commercial Public License v1.0
 * Copyright (c) 2026 Pro Suite Open Source Project. All rights reserved.
 * 
 * Standalone Gemma Web Rendering Engine
 * Built completely from scratch without Chromium / WebKit
// Standalone asynchronous Image Cache to draw real visual images on Canvas without flickering
const imageCache = new Map();
const pendingImages = new Set();

/**
 * Parses raw HTML strings into a basic Document Object Model (DOM) JSON tree.
 * @param {string} html Raw HTML text string.
 * @returns {Array<Object>} Hierarchical JSON DOM node array.
 */
export function parseHTMLToDOM(html) {
  const tagRegex = /<(\/?)([a-zA-Z0-9:-]+)([^>]*)>|([^<]+)/g;
  let match;
  const stack = [{ children: [] }];
  
  while ((match = tagRegex.exec(html)) !== null) {
    const [full, isClosing, tagName, attrsStr, textContent] = match;
    
    if (textContent && textContent.trim()) {
      const parent = stack[stack.length - 1];
      parent.children.push({
        type: 'text',
        content: textContent.trim()
      });
    } else if (tagName) {
      const lowercaseTag = tagName.toLowerCase();
      if (isClosing) {
        if (stack.length > 1 && stack[stack.length - 1].tagName === lowercaseTag) {
          const popped = stack.pop();
          const parent = stack[stack.length - 1];
          parent.children.push(popped);
        }
      } else {
        const attributes = {};
        if (attrsStr) {
          const attrRegex = /([a-zA-Z0-9:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
          let attrMatch;
          while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
            attributes[attrMatch[1]] = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
          }
        }
        
        const isSelfClosing = full.endsWith('/>') || ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(lowercaseTag);
        const node = {
          type: 'element',
          tagName: lowercaseTag,
          attributes,
          children: []
        };
        
        if (isSelfClosing) {
          const parent = stack[stack.length - 1];
          parent.children.push(node);
        } else {
          stack.push(node);
        }
      }
    }
  }
  
  while (stack.length > 1) {
    const popped = stack.pop();
    stack[stack.length - 1].children.push(popped);
  }
  
  return stack[0].children;
}

/**
 * Merges DOM trees and CSS style directives to compute layout elements with absolute coordinate coordinates.
 * @param {Array<Object>} dom Nested DOM JSON nodes tree.
 * @param {number} viewportWidth Viewport canvas boundary width (default: 800).
 * @returns {Object} Compiled layout list and required viewport canvas height.
 */
export function compileDOMToLayout(dom, viewportWidth = 800) {
  const layoutElements = [];
  let currentX = 20;
  let currentY = 20;
  const paddingX = 20;
  const maxWidth = viewportWidth - paddingX * 2;
  
  function walk(node, parentStyles = {}) {
    if (!node) return;
    
    if (node.type === 'text') {
      const text = node.content;
      const fontSize = parentStyles.fontSize || 14;
      const color = parentStyles.color || '#e2e8f0'; // Cyber slate white default
      const isBold = parentStyles.isBold || false;
      const isItalic = parentStyles.isItalic || false;
      const isLink = parentStyles.isLink || false;
      const linkUrl = parentStyles.linkUrl || null;
      
      const charWidth = fontSize * 0.55;
      const words = text.split(/\s+/);
      
      words.forEach((word) => {
        const wordWidth = word.length * charWidth;
        if (currentX + wordWidth > maxWidth + paddingX) {
          currentX = paddingX;
          currentY += fontSize * 1.5;
        }
        
        layoutElements.push({
          type: 'text',
          text: word,
          x: currentX,
          y: currentY,
          width: wordWidth,
          height: fontSize,
          fontSize,
          color,
          isBold,
          isItalic,
          isLink,
          linkUrl
        });
        
        currentX += wordWidth + charWidth;
      });
      return;
    }
    
    if (node.type === 'element') {
      const tagName = node.tagName;
      const attributes = node.attributes || {};
      const inlineStyle = attributes.style || "";
      const computedStyles = { ...parentStyles };
      
      // Inline CSS selector parsing
      if (inlineStyle) {
        const styleRules = inlineStyle.split(';');
        styleRules.forEach((rule) => {
          const parts = rule.split(':');
          if (parts.length === 2) {
            const key = parts[0].trim().toLowerCase();
            const val = parts[1].trim().toLowerCase();
            if (key === 'color') computedStyles.color = val;
            if (key === 'font-size') {
              const num = parseInt(val);
              if (!isNaN(num)) computedStyles.fontSize = num;
            }
            if (key === 'font-weight' && (val === 'bold' || parseInt(val) >= 600)) computedStyles.isBold = true;
            if (key === 'font-style' && val === 'italic') computedStyles.isItalic = true;
          }
        });
      }
      
      let heightSpacing = 0;
      if (tagName === 'h1') {
        currentX = paddingX;
        currentY += 24;
        computedStyles.fontSize = 28;
        computedStyles.isBold = true;
        heightSpacing = 38;
      } else if (tagName === 'h2') {
        currentX = paddingX;
        currentY += 20;
        computedStyles.fontSize = 22;
        computedStyles.isBold = true;
        heightSpacing = 30;
      } else if (tagName === 'h3') {
        currentX = paddingX;
        currentY += 16;
        computedStyles.fontSize = 18;
        computedStyles.isBold = true;
        heightSpacing = 24;
      } else if (tagName === 'p') {
        currentX = paddingX;
        currentY += 12;
        computedStyles.fontSize = 14;
        heightSpacing = 20;
      } else if (tagName === 'div') {
        currentX = paddingX;
        currentY += 8;
        heightSpacing = 12;
      } else if (tagName === 'br') {
        currentX = paddingX;
        currentY += 20;
      } else if (tagName === 'hr') {
        currentX = paddingX;
        currentY += 15;
        layoutElements.push({
          type: 'line',
          x1: paddingX,
          y1: currentY,
          x2: viewportWidth - paddingX,
          y2: currentY,
          color: 'rgba(255, 255, 255, 0.08)'
        });
        currentY += 15;
      } else if (tagName === 'a') {
        computedStyles.isLink = true;
        computedStyles.linkUrl = attributes.href || '#';
        computedStyles.color = computedStyles.color || 'hsl(250, 85%, 65%)'; // Brand violet
      } else if (tagName === 'img') {
        currentX = paddingX;
        currentY += 10;
        const imgW = parseInt(attributes.width) || 200;
        const imgH = parseInt(attributes.height) || 120;
        layoutElements.push({
          type: 'image',
          src: attributes.src || 'placeholder.png',
          alt: attributes.alt || 'Visual element',
          x: currentX,
          y: currentY,
          width: imgW,
          height: imgH
        });
        currentY += imgH + 10;
      } else if (tagName === 'input') {
        currentX = paddingX;
        currentY += 8;
        layoutElements.push({
          type: 'input',
          value: attributes.value || "",
          placeholder: attributes.placeholder || "Type here...",
          x: currentX,
          y: currentY,
          width: 250,
          height: 36,
          name: attributes.name || ""
        });
        currentY += 46;
      } else if (tagName === 'button') {
        computedStyles.isBold = true;
        layoutElements.push({
          type: 'button',
          text: attributes.type || 'Button',
          x: currentX,
          y: currentY,
          width: 80,
          height: 32
        });
      }
      
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => walk(child, computedStyles));
      }
      
      if (['h1', 'h2', 'h3', 'p', 'div'].includes(tagName)) {
        currentX = paddingX;
        currentY += heightSpacing;
      }
    }
  }
  
  if (Array.isArray(dom)) {
    dom.forEach((node) => walk(node));
  } else {
    walk(dom);
  }
  
  return {
    elements: layoutElements,
    canvasHeight: Math.max(currentY + 60, 600)
  };
}

/**
 * Natively paints layout elements onto a high-performance 2D Canvas context.
 * Supports active text drawing, lines, and custom border highlights.
 * @param {CanvasRenderingContext2D} ctx Browser canvas 2D context.
 * @param {Array<Object>} elements Parsed vector layout coordinates.
 * @param {Array<Object>} extensions Optional active extensions to execute onPaint lifecycle.
 */
export function paintLayoutToCanvas(ctx, elements, extensions = []) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  elements.forEach((el) => {
    if (el.type === 'text') {
      ctx.font = `${el.isItalic ? 'italic ' : ''}${el.isBold ? '700 ' : '400 '}${el.fontSize}px 'Inter', sans-serif`;
      ctx.fillStyle = el.color;
      ctx.fillText(el.text, el.x, el.y);
      
      // Underline link elements
      if (el.isLink) {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y + 2);
        ctx.lineTo(el.x + el.width, el.y + 2);
        ctx.stroke();
      }
    } else if (el.type === 'line') {
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
    } else if (el.type === 'image') {
      const src = el.src;
      
      // Resolve relative images against Google or active domain safely
      let resolvedSrc = src;
      if (src.startsWith('/')) {
        resolvedSrc = 'https://www.google.com' + src;
      }
      
      const drawPlaceholder = () => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, 12);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = "12px 'Inter', sans-serif";
        ctx.fillText(`🖼️ Image: ${el.src.split('/').pop()}`, el.x + 15, el.y + el.height / 2);
      };
      
      if (imageCache.has(resolvedSrc)) {
        const cachedImg = imageCache.get(resolvedSrc);
        if (cachedImg.complete && cachedImg.naturalWidth !== 0) {
          ctx.drawImage(cachedImg, el.x, el.y, el.width, el.height);
        } else {
          drawPlaceholder();
        }
      } else {
        drawPlaceholder();
        
        // Load the image asynchronously in the background
        if (!pendingImages.has(resolvedSrc)) {
          pendingImages.add(resolvedSrc);
          const img = new Image();
          img.crossOrigin = 'anonymous'; // Support transparent pixels and avoid CORS taint
          img.src = resolvedSrc;
          img.onload = () => {
            imageCache.set(resolvedSrc, img);
            pendingImages.delete(resolvedSrc);
            // Dispatch a window event to trigger repaint on the canvas shell!
            window.dispatchEvent(new CustomEvent('gemma-repaint'));
          };
          img.onerror = () => {
            pendingImages.delete(resolvedSrc);
          };
        }
      }
    } else if (el.type === 'input') {
      // Draw cyber form elements
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Capsule pill shape for larger search bars!
      const borderRadius = el.height >= 40 ? el.height / 2 : 8;
      ctx.roundRect(el.x, el.y - 14, el.width, el.height, borderRadius);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#64748b'; // Muted grey placeholder
      ctx.font = "13px 'Inter', sans-serif";
      ctx.fillText(el.placeholder, el.x + 15, el.y + 8);
    } else if (el.type === 'button') {
      // Draw brand action button (frosted slate with glossy overlay)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(el.x, el.y - 12, el.width, el.height, 8);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 12px 'Inter', sans-serif";
      const btnText = el.text || 'Button';
      const textWidth = ctx.measureText(btnText).width;
      ctx.fillText(btnText, el.x + (el.width - textWidth) / 2, el.y + 8);
    }
  });

  // Execute open-source extension onPaint hook if registered
  extensions.forEach((ext) => {
    if (ext.enabled && typeof ext.onPaint === 'function') {
      try {
        ext.onPaint(ctx);
      } catch (err) {
        console.warn(`[Gemma Extensions] Fail executing onPaint hook:`, err.message);
      }
    }
  });
}

/**
 * Resolves coordinate offset hits on the canvas to determine if an anchor link is triggered.
 * @param {number} clientX Mouse click relative to canvas bounding box.
 * @param {number} clientY Mouse click relative to canvas bounding box.
 * @param {Array<Object>} elements Parsed vector layout coordinates.
 * @returns {string|null} The resolved anchor URL, or null if no hit occurred.
 */
export function resolveAnchorClick(clientX, clientY, elements) {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.isLink && el.linkUrl) {
      // Offset vertical baseline hit coordinates safely
      const buffer = 4;
      if (
        clientX >= el.x - buffer &&
        clientX <= el.x + el.width + buffer &&
        clientY >= el.y - el.height - buffer &&
        clientY <= el.y + buffer
      ) {
        return el.linkUrl;
      }
    }
  }
  return null;
}
