/**
 * Astronomy Engine 기반 출생시점 행성 위치 계산
 * 좌표계: 태양중심 J2000 mean equator (EQJ), 단위 AU
 *
 * 출처: astronomy-engine v2 (MIT)
 * https://github.com/cosinekitty/astronomy
 */

import { Body, HelioVector, MakeTime } from 'astronomy-engine';

export type PlanetKey =
  | 'Mercury' | 'Venus' | 'Earth' | 'Mars'
  | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune';

export interface PlanetPosition {
  key: PlanetKey;
  nameKo: string;
  x: number;               // 태양중심 X (AU)
  y: number;               // 태양중심 Y (AU)
  z: number;               // 태양중심 Z (AU)
  distance: number;        // 태양까지 거리 (AU)
  semiMajorAxisAU: number; // 평균 공전 반경 (AU)
  ohaeng?: '水' | '金' | '火' | '木' | '土';
  isPrimary: boolean;      // 오행 대응 5행성 여부
}

// 평균 공전 반경 출처: NASA Planetary Fact Sheet
// https://nssdc.gsfc.nasa.gov/planetary/factsheet/
const PLANET_META: Record<PlanetKey, {
  body: Body;
  nameKo: string;
  semiMajorAxisAU: number;
  ohaeng?: '水' | '金' | '火' | '木' | '土';
  isPrimary: boolean;
}> = {
  Mercury: { body: Body.Mercury, nameKo: '수성', semiMajorAxisAU: 0.387,  ohaeng: '水', isPrimary: true  },
  Venus:   { body: Body.Venus,   nameKo: '금성', semiMajorAxisAU: 0.723,  ohaeng: '金', isPrimary: true  },
  Earth:   { body: Body.Earth,   nameKo: '지구', semiMajorAxisAU: 1.0,                  isPrimary: false },
  Mars:    { body: Body.Mars,    nameKo: '화성', semiMajorAxisAU: 1.524,  ohaeng: '火', isPrimary: true  },
  Jupiter: { body: Body.Jupiter, nameKo: '목성', semiMajorAxisAU: 5.203,  ohaeng: '木', isPrimary: true  },
  Saturn:  { body: Body.Saturn,  nameKo: '토성', semiMajorAxisAU: 9.537,  ohaeng: '土', isPrimary: true  },
  Uranus:  { body: Body.Uranus,  nameKo: '천왕성', semiMajorAxisAU: 19.191,              isPrimary: false },
  Neptune: { body: Body.Neptune, nameKo: '해왕성', semiMajorAxisAU: 30.069,              isPrimary: false },
};

export function calculatePlanetPositions(birthDate: Date): PlanetPosition[] {
  const time = MakeTime(birthDate);
  return (Object.keys(PLANET_META) as PlanetKey[]).map((key) => {
    const meta = PLANET_META[key];
    const vec = HelioVector(meta.body, time);
    const distance = Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
    return {
      key,
      nameKo: meta.nameKo,
      x: vec.x, y: vec.y, z: vec.z,
      distance,
      semiMajorAxisAU: meta.semiMajorAxisAU,
      ohaeng: meta.ohaeng,
      isPrimary: meta.isPrimary,
    };
  });
}

/**
 * 로그 스케일 반경 매핑
 * 수성(0.39 AU) ~ 해왕성(30 AU)의 극단적 거리 차이를 시각적으로 압축.
 * log(1+x) 스케일. 캡션에 "로그 스케일" 명시 필수.
 *
 * 궤도 반경(semiMajorAxisAU) 또는 실제 거리(distance) 어느 쪽이든 입력 가능.
 */
export function logScaleRadius(
  distanceAU: number,
  maxAU: number = 30,
  maxPixel: number = 220,
): number {
  return (Math.log1p(distanceAU) / Math.log1p(maxAU)) * maxPixel;
}
