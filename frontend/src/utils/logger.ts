/**
 * Safe stringify to handle circular structures
 */
export const safeStringify = (obj: any, indent = 2) => {
  const cache = new Set();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      return value;
    },
    indent
  );
};

/**
 * Frontend logging utility
 */
export const logError = async (source: string, message: string, error?: any) => {
  console.error(`[${source}] ${message}`, error);
  
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const safeError = error ? safeStringify(error) : null;
    
    await fetch(`${API_BASE_URL}/api/admin/logs/frontend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'ERROR',
        source: `Frontend:${source}`,
        message: message,
        stackTrace: safeError
      })
    });
  } catch (e) {
    console.error('Failed to send log to server:', e);
  }
};
