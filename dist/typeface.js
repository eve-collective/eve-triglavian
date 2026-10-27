import { GLYPHS_DATA } from './glyphs-data.js';
/**
 * Generate a standard Three.js Typeface.json representation of the Triglavian font.
 * This JSON can be loaded directly by Three.js `FontLoader` to use with `TextGeometry`.
 */
export function generateTypefaceJson(familyName = 'TriglavianGeometric') {
    const glyphs = {
        ' ': {
            ha: 450,
            x_min: 0,
            x_max: 0,
            o: ''
        }
    };
    const BASELINE_SVG_Y = 750.0;
    for (const [char, polys] of Object.entries(GLYPHS_DATA)) {
        let minX = Infinity;
        let maxX = -Infinity;
        const commandTokens = [];
        for (const poly of polys) {
            // Shell contour
            if (poly.shell.length >= 3) {
                for (let i = 0; i < poly.shell.length; i++) {
                    const [sx, sy] = poly.shell[i];
                    const fx = Math.round(sx);
                    const fy = Math.round(BASELINE_SVG_Y - sy);
                    minX = Math.min(minX, fx);
                    maxX = Math.max(maxX, fx);
                    commandTokens.push(i === 0 ? 'm' : 'l', String(fx), String(fy));
                }
            }
            // Hole contours
            for (const hole of poly.holes) {
                if (hole.length >= 3) {
                    for (let i = 0; i < hole.length; i++) {
                        const [hx, hy] = hole[i];
                        const fx = Math.round(hx);
                        const fy = Math.round(BASELINE_SVG_Y - hy);
                        minX = Math.min(minX, fx);
                        maxX = Math.max(maxX, fx);
                        commandTokens.push(i === 0 ? 'm' : 'l', String(fx), String(fy));
                    }
                }
            }
        }
        const glyphWidth = maxX > minX ? maxX - minX : 500;
        const ha = Math.max(Math.round(glyphWidth + 140), 600);
        glyphs[char] = {
            ha,
            x_min: isFinite(minX) ? minX : 0,
            x_max: isFinite(maxX) ? maxX : 500,
            o: commandTokens.join(' ')
        };
    }
    return {
        glyphs,
        familyName,
        ascender: 850,
        descender: -250,
        underlinePosition: -100,
        underlineThickness: 50,
        boundingBox: {
            xMin: 0,
            yMin: -250,
            xMax: 1000,
            yMax: 850
        },
        resolution: 1000,
        original_font_information: {
            format: 'opentype',
            copyright: 'Original Characters Copyright (c) 2018 by CCP hf. All rights reserved. Programmatic geometry toolkit by EVE Collective.'
        }
    };
}
//# sourceMappingURL=typeface.js.map