/**
 * Image utilities for track artwork (e.g. picking by target width).
 */

import type { TrackImage } from "../types";

/**
 * Picks the image whose width is closest to the target (for responsive art).
 *
 * @param images - List of images with width/height
 * @param targetWidth - Desired display width to match
 * @returns The closest image or null if the list is empty
 */
export const getImageByWidth = (
    images: TrackImage[],
    targetWidth: number
): TrackImage | null => {
    if (images.length === 0) return null;

    return images.reduce((closest, current) => {
        const currentDiff = Math.abs(current.width - targetWidth);
        const closestDiff = Math.abs(closest.width - targetWidth);
        return currentDiff <= closestDiff ? current : closest;
    }, images[0]);
};
