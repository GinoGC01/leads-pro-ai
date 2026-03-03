/**
 * GridService — Coordinate Displacement Engine for Geographic Expansion.
 *
 * Splits a search area into NxN grid cells, each with its own center coordinates
 * and a reduced radius. This forces Google Places API to return different results
 * per cell, bypassing the 60-result hard limit per query.
 *
 * The cell radius is multiplied by √2 (~1.415) to ensure the inscribed circles
 * fully overlap and cover 100% of the square grid area (no dead zones in corners).
 */
class GridService {
    /**
     * Generate an array of grid cells with displaced center coordinates.
     * @param {number} lat - Center latitude of the original search area.
     * @param {number} lng - Center longitude of the original search area.
     * @param {number} radiusMeters - Total radius of the area to cover (meters).
     * @param {number} gridSize - Grid density (3 = 3×3 = 9 cells, 5 = 5×5 = 25 cells).
     * @returns {Array<{lat: number, lng: number, cellRadius: number, label: string}>}
     */
    static generateGrid(lat, lng, radiusMeters, gridSize = 3) {
        const cells = [];

        // Side length of each cell = total diameter / gridSize
        const cellSide = (radiusMeters * 2) / gridSize;

        // Cell radius for Google API = half the cell diagonal (√2 factor for full coverage)
        const cellRadius = Math.round((cellSide / 2) * 1.415);

        // Geodesic step calculation:
        // 1 degree of latitude ≈ 111,320 meters (constant)
        // 1 degree of longitude ≈ 111,320 * cos(latitude) meters (varies with lat)
        const metersPerDegLat = 111320;
        const metersPerDegLng = 111320 * Math.cos(lat * Math.PI / 180);

        const latStep = cellSide / metersPerDegLat;
        const lngStep = cellSide / metersPerDegLng;

        const halfGrid = Math.floor(gridSize / 2);

        for (let row = -halfGrid; row <= halfGrid; row++) {
            for (let col = -halfGrid; col <= halfGrid; col++) {
                cells.push({
                    lat: parseFloat((lat + (row * latStep)).toFixed(6)),
                    lng: parseFloat((lng + (col * lngStep)).toFixed(6)),
                    cellRadius,
                    label: `Celda (${row + halfGrid + 1},${col + halfGrid + 1})`
                });
            }
        }

        console.log(`[GridService] Grid ${gridSize}×${gridSize} generado: ${cells.length} celdas, radio/celda: ${cellRadius}m (overlap ×1.415)`);
        return cells;
    }

    /**
     * Estimate the maximum API cost for a grid search.
     * @param {number} gridSize - Grid density (3, 5, 7...)
     * @param {number} costPerRequest - Cost per API request in USD (default: V1 Pro SKU $0.032)
     * @param {number} maxPagesPerCell - Max pages per cell (Google V1 limit = 3)
     * @returns {{ totalCells: number, maxRequests: number, maxCostUSD: number }}
     */
    static estimateCost(gridSize, costPerRequest = 0.032, maxPagesPerCell = 3) {
        const totalCells = gridSize * gridSize;
        const maxRequests = totalCells * maxPagesPerCell;
        const maxCostUSD = parseFloat((maxRequests * costPerRequest).toFixed(2));

        return { totalCells, maxRequests, maxCostUSD };
    }
}

export default GridService;
