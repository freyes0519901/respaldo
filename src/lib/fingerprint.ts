/**
 * NeuroTips — Device Fingerprint Generator
 * 
 * Genera un hash único del dispositivo/navegador del usuario.
 * Se usa para prevenir abuso de trials gratuitos.
 * 
 * USO EN REGISTRO:
 *   import { getFingerprint } from '@/lib/fingerprint';
 *   const fp = await getFingerprint();
 *   // Enviar fp junto con el registro: { ...formData, fingerprint: fp }
 */

const getCanvasFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(50, 0, 80, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('NeuroTips🧠', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('NeuroTips🧠', 4, 17);
    
    return canvas.toDataURL();
  } catch {
    return '';
  }
};

const getWebGLFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    
    const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    
    return `${vendor}~${renderer}`;
  } catch {
    return '';
  }
};

const hashString = async (str: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback: simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
};

export const getFingerprint = async (): Promise<string> => {
  try {
    const components: string[] = [];
    
    // Screen
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    
    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    
    // Language
    components.push(navigator.language || '');
    components.push((navigator.languages || []).join(','));
    
    // Platform
    components.push(navigator.platform || '');
    
    // Hardware concurrency (CPU cores)
    components.push(String(navigator.hardwareConcurrency || 0));
    
    // Device memory (if available)
    components.push(String((navigator as any).deviceMemory || 0));
    
    // Touch support
    components.push(String(navigator.maxTouchPoints || 0));
    
    // Canvas fingerprint
    components.push(getCanvasFingerprint());
    
    // WebGL fingerprint
    components.push(getWebGLFingerprint());
    
    // Plugins (desktop)
    try {
      const plugins = Array.from(navigator.plugins || [])
        .map(p => `${p.name}:${p.description}`)
        .join('|');
      components.push(plugins);
    } catch {
      components.push('');
    }
    
    // Audio context
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      components.push(String(audioCtx.sampleRate));
      audioCtx.close();
    } catch {
      components.push('');
    }
    
    const raw = components.join('|||');
    return await hashString(raw);
  } catch {
    return '';
  }
};
