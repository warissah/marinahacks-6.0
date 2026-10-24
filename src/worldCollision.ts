
const R = 0.3

function hitsBox(
  x: number,
  z: number,
  cx: number,
  cz: number,
  width: number,
  depth: number
) {
  const nx = Math.max(
    cx - width / 2,
    Math.min(x, cx + width / 2)
  )

  const nz = Math.max(
    cz - depth / 2,
    Math.min(z, cz + depth / 2)
  )

  return (
    (x - nx) ** 2 +
    (z - nz) ** 2 < R ** 2
  )
}

export function allowed(x: number, z: number) {
  // ============================================
  // ORIGINAL ROOMS
  // ============================================

  const parlor =
    x > -3.5 + R &&
    x < 3.5 - R &&
    z > -3 + R &&
    z < 3 - R

  const cellar =
    x > 3.5 + R &&
    x < 6.5 - R &&
    z > -2 + R &&
    z < 2 - R

  const hallway =
    x > -3.5 + R &&
    x < 3.5 - R &&
    z > 3 + R &&
    z < 6 - R

  const ritual =
    x > 3.5 + R &&
    x < 6.5 - R &&
    z > 3 + R &&
    z < 6 - R

  // ============================================
  // EXISTING DOORWAYS
  // ============================================

  const parlorToCellar =
    x >= 3.5 - R &&
    x <= 3.5 + R &&
    Math.abs(z) <= 0.7 - R

  const parlorToHall =
    z >= 3 - R &&
    z <= 3 + R &&
    Math.abs(x + 2) <= 0.7 - R

  const hallToRitual =
    x >= 3.5 - R &&
    x <= 3.5 + R &&
    Math.abs(z - 4.5) <= 0.7 - R

  // ============================================
  // NEW: FORGOTTEN BEDROOM
  // ============================================

  const bedroom =
    x > -11.55 &&
    x < -6.45 &&
    z > 2.05 &&
    z < 7.0

  // ============================================
  // NEW: BEDROOM CORRIDOR
  // ============================================

  // This corridor overlaps the bedroom interior
  // and the existing hallway. The overlap prevents
  // invisible collision barriers at the entrances.

  const bedroomCorridor =
    x > -6.7 &&
    x < -2.9 &&
    z > 3.55 + R &&
    z < 5.45 - R

  // ============================================
  // CHECK WALKABLE AREAS
  // ============================================

  if (!(
    parlor ||
    cellar ||
    hallway ||
    ritual ||
    bedroom ||
    bedroomCorridor ||
    parlorToCellar ||
    parlorToHall ||
    hallToRitual
  )) {
    return false
  }

  // ============================================
  // ORIGINAL FURNITURE COLLISIONS
  // ============================================

  if (
    Math.hypot(x, z) < 0.96 + R
  ) {
    return false
  }

  if (
    hitsBox(x, z, -2.45, -2.55, 1.55, 0.85)
  ) {
    return false
  }

  if (
    hitsBox(x, z, 5.3, -1.65, 1.45, 0.65)
  ) {
    return false
  }

  if (
    hitsBox(x, z, 2.3, 1.7, 1.2, 1.2)
  ) {
    return false
  }

  if (
    hitsBox(x, z, 5.25, 4.55, 1.4, 0.95)
  ) {
    return false
  }

  if (
    hitsBox(x, z, 0, 5.88, 1.1, 0.12)
  ) {
    return false
  }

  // ============================================
  // NEW: BEDROOM FURNITURE COLLISIONS
  // ============================================

  // Bed
  if (
    hitsBox(x, z, -10.05, 5.35, 2.22, 1.53)
  ) {
    return false
  }

  // Writing desk
  if (
    hitsBox(x, z, -9.8, 3.15, 1.7, 0.82)
  ) {
    return false
  }

  // Wardrobe
  if (
    hitsBox(x, z, -7.2, 6.05, 0.83, 1.12)
  ) {
    return false
  }

  return true
}
