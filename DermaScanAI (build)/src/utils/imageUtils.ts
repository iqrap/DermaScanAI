// src/utils/imageUtils.ts
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress an image before upload to reduce bandwidth and processing time.
 * Resizes to max 1024px on the longest side, outputs JPEG at 80% quality.
 */
export async function compressImage(
  uri: string,
  maxSize: number = 1024,
  quality: number = 0.8
): Promise<{ uri: string; width: number; height: number }> {
  try {
    // Get image dimensions first
    const { width: origWidth, height: origHeight } = await ImageManipulator.manipulateAsync(
      uri,
      [], // no transforms, just to get dimensions
      { base64: false }
    ).then((r) => ({ width: r.width, height: r.height }));

    // Calculate resize dimensions preserving aspect ratio
    let resizeWidth: number | undefined;
    let resizeHeight: number | undefined;

    if (origWidth > maxSize || origHeight > maxSize) {
      if (origWidth > origHeight) {
        resizeWidth = maxSize;
        resizeHeight = Math.round((origHeight / origWidth) * maxSize);
      } else {
        resizeHeight = maxSize;
        resizeWidth = Math.round((origWidth / origHeight) * maxSize);
      }
    }

    const actions: ImageManipulator.Action[] = [];
    if (resizeWidth && resizeHeight) {
      actions.push({ resize: { width: resizeWidth, height: resizeHeight } });
    }

    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return { uri: result.uri, width: result.width, height: result.height };
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    // Fallback to original URI if compression fails
    return { uri, width: 0, height: 0 };
  }
}

/**
 * Debounce a function call - useful for preventing rapid API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), waitMs);
  };
}
