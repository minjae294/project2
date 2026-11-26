export interface AngleZone {
  id: string;
  angleRange: string;
  representativeAngle: number;
  nameKo: string;
  nameEn: string;
  source: 'PPT 원안' | '임상 보완 추가' | 'PPT 원안 구체화';
  respirationEffect: string;
  pulseHemodynamicEffect: string;
  indications: string;
  contraindicationsAndCare: string;
  kneeGatchRecommended: string;
  maxContinuousMinutes: string;
}

export const EXPANDED_ANGLE_ZONES: AngleZone[] = [
  {
    id: 'trendelenburg-plr',
    angleRange: '-10° ~ -15° (또는 0° + 다리 20°)',
    representativeAngle: -12,
    nameKo: '머리 낮춤 / 다리만 올리기',
    nameEn: '응급 혈압 회복 자세',
    source: '임상 보완 추가',
    respirationEffect:
      '상체까지 거꾸로 기울이면 배 속 장기가 가슴을 눌러 숨쉬기가 매우 힘들고 토할 때 기도로 넘어갈 위험이 큽니다. 대신 상체는 평평하게 두고 다리만 올리면 숨쉬기를 지키면서 혈압을 올릴 수 있습니다.',
    pulseHemodynamicEffect:
      '다리 쪽 피가 심장으로 한꺼번에 몰려 혈압을 잠깐 올릴 수 있지만, 심장이 약한 분은 오히려 심장에 무리가 가고 맥박이 불규칙해질 수 있습니다.',
    indications: '갑자기 혈압이 뚝 떨어졌을 때 응급 처치 (다리만 올리기 권장)',
    contraindicationsAndCare:
      '숨이 차거나 심장이 약한 분, 뇌압이 높은 분, 속이 울렁거리는 분은 절대 금지. 10분 이상 유지하지 마세요.',
    kneeGatchRecommended: '0° (다리만 15~30° 올림)',
    maxContinuousMinutes: '10분 이내 (응급 시에만)',
  },
  {
    id: 'supine',
    angleRange: '0°',
    representativeAngle: 0,
    nameKo: '반듯하게 누운 자세',
    nameEn: '완전 수평 (평평한 침대)',
    source: 'PPT 원안',
    respirationEffect:
      '배 속 장기가 폐 아래쪽(횡격막)을 위로 밀어 올려 폐가 펴질 공간이 좁아지고, 한 번에 들이마시는 숨의 양이 줄어듭니다.',
    pulseHemodynamicEffect:
      '심장으로 돌아오는 피가 많아져 심장에 부담이 생깁니다. 심장이 약한 환자는 맥박이 불규칙하거나 빨라질 수 있습니다.',
    indications: '허리·척추를 평평하게 고정해야 할 때, 갑자기 어지럽고 혈압이 떨어졌을 때',
    contraindicationsAndCare:
      '숨이 찬 환자나 콧줄 식사 중인 환자가 오래 누워 있으면 호흡곤란이 심해지고 음식물이 기도로 넘어갈(흡인성 폐렴) 위험이 큽니다.',
    kneeGatchRecommended: '0° ~ 5°',
    maxContinuousMinutes: '호흡 괜찮은 경우만 제한적 유지',
  },
  {
    id: 'reverse-trendelenburg',
    angleRange: '+10° ~ +15° (침대 전체 기울기)',
    representativeAngle: 12,
    nameKo: '침대 전체 비스듬히 세우기',
    nameEn: '허리 굽힘 없는 경사 자세',
    source: '임상 보완 추가',
    respirationEffect:
      '허리를 꺾지 않고 침대 판 전체를 머리 쪽이 높게 기울여, 중력으로 배 속 장기가 아래로 내려가 숨쉬기가 편해집니다.',
    pulseHemodynamicEffect:
      '엉치뼈가 눌리거나 쓸리지 않으면서 혈액 흐름을 부드럽게 조절해 맥박·혈압 변화가 적습니다.',
    indications:
      '허리(척추)·골반·고관절 수술 직후라 상체를 꺾어 세우면 안 되는 환자의 호흡 및 역류 예방',
    contraindicationsAndCare:
      '몸이 발치 쪽으로 미끄러지지 않도록 발 받침대를 대고, 혈압이 떨어지지 않는지 살피세요.',
    kneeGatchRecommended: '0° (몸을 일직선으로 유지)',
    maxContinuousMinutes: '2시간마다 피부·다리 상태 확인',
  },
  {
    id: 'low-fowler',
    angleRange: '15° ~ 30°',
    representativeAngle: 25,
    nameKo: '조금 세운 자세',
    nameEn: '낮은 반앉기',
    source: 'PPT 원안',
    respirationEffect:
      '폐 아래 근육(횡격막)이 아래로 내려가 0°보다 숨쉬기가 훨씬 수월해지고, 사레들림(흡인성 폐렴) 예방에 도움이 됩니다.',
    pulseHemodynamicEffect:
      '심장 부담이 줄어들고 몸을 편안하게 하는 신경이 작동해 맥박이 안정됩니다.',
    indications:
      '상태가 안정된 환자의 휴식 및 수면, 머리 압력(뇌압) 관리가 필요할 때(30° 기준)',
    contraindicationsAndCare:
      '콧줄로 식사(영양액)를 넣을 때는 역류를 막기 위해 최소 30° 이상 세우는 것이 안전합니다.',
    kneeGatchRecommended: '5° ~ 10°',
    maxContinuousMinutes: '2시간마다 자세 확인',
  },
  {
    id: 'semi-fowler',
    angleRange: '30° ~ 45°',
    representativeAngle: 38,
    nameKo: '반쯤 앉은 자세 (기본 표준)',
    nameEn: '가장 안정적인 치료 각도',
    source: 'PPT 원안',
    respirationEffect:
      '숨찬 환자에게 가장 표준이 되는 각도입니다. 가슴(흉곽)이 가장 잘 열리고 역류와 폐렴을 가장 효과적으로 막아줍니다.',
    pulseHemodynamicEffect:
      '심장으로 들어오는 혈액량이 적당히 조절되어 맥박과 혈압이 가장 균형 잡힌 상태를 유지합니다.',
    indications:
      '안정 시 기본 유지, 숨참 증상(호흡곤란), 콧줄 식사(영양액 주입) 시 필수 유지 각도',
    contraindicationsAndCare:
      '30° 넘게 오래 세우면 엉치뼈(꼬리뼈 위) 욕창 위험이 커지므로 무릎 받침(10~15°)을 함께 올리고 2시간마다 옆으로 돌아눕혀 주세요.',
    kneeGatchRecommended: '10° ~ 15° (미끄러짐·욕창 방지)',
    maxContinuousMinutes: '120분 (욕창 위험 시 60분 이내)',
  },
  {
    id: 'mid-high-fowler',
    angleRange: '45° ~ 60°',
    representativeAngle: 52,
    nameKo: '중간 높이 앉은 자세 (적응 단계)',
    nameEn: '높은 자세 전 안전 확인 단계',
    source: '임상 보완 추가',
    respirationEffect:
      '30~45°로도 숨찬 증상이 덜 가실 때, 폐 아래 공간을 한 번 더 넓혀주고 가슴 앞쪽이 편히 펴지게 돕습니다.',
    pulseHemodynamicEffect:
      '피가 다리 쪽으로 내려가기 시작하는 구간이라, 60° 이상 확 세우기 전에 어지럽거나 혈압이 떨어지지 않는지 안전하게 확인합니다.',
    indications:
      '중간 정도 숨참이 계속될 때, 60~90°로 올리기 전 혈압·맥박 적응 확인 단계',
    contraindicationsAndCare:
      '각도를 올린 뒤 3~5분째에 어지럼증이나 혈압 저하가 없는지 먼저 살펴보세요.',
    kneeGatchRecommended: '12° ~ 15°',
    maxContinuousMinutes: '60 ~ 90분 (욕창 위험 시 30~45분)',
  },
  {
    id: 'high-fowler',
    angleRange: '60° ~ 90°',
    representativeAngle: 75,
    nameKo: '높이 앉은 자세',
    nameEn: '급성 호흡곤란·심장 부담 완화',
    source: 'PPT 원안',
    respirationEffect:
      '가슴이 완전히 열리고 중력이 배 속 장기를 아래로 당겨 폐 바닥까지 공기가 가장 잘 들어갑니다.',
    pulseHemodynamicEffect:
      '혈액이 다리 쪽으로 쏠려 맥박이 다소 빨라질 수 있고, 갑자기 어지럽거나 혈압이 떨어지는(기립성 저혈압) 현상을 주의해야 합니다.',
    indications:
      '갑자기 숨이 매우 찰 때, 심장 기능 저하(폐에 물 참), 식사할 때',
    contraindicationsAndCare:
      '혈압 하락, 피로감, 엉치뼈 욕창 위험이 매우 크므로 숨이 가라앉으면 다시 30~45°로 낮춰주세요.',
    kneeGatchRecommended: '10° ~ 15°',
    maxContinuousMinutes: '30 ~ 60분 집중 관찰',
  },
  {
    id: 'orthopneic-tripod',
    angleRange: '90° + 앞으로 기대기',
    representativeAngle: 90,
    nameKo: '테이블 베개에 기대기 자세',
    nameEn: '극심한 숨참 응급 자세',
    source: 'PPT 원안 구체화',
    respirationEffect:
      '식사 테이블 위 베개에 팔과 상체를 앞으로 기대면 목·어깨 근육까지 총동원되어 숨쉬기가 한결 편해집니다.',
    pulseHemodynamicEffect:
      '심장으로 몰리는 피를 가장 적게 만들어 폐가 물에 잠기는 느낌을 빠르게 덜어줍니다. 다만 맥박과 혈압을 자주 확인해야 합니다.',
    indications:
      '누우면 도저히 숨을 못 쉴 때(기좌호흡), 급성 천식·심부전 호흡곤란',
    contraindicationsAndCare:
      '테이블 바퀴 잠금과 침대 난간 고정을 반드시 확인하고, 20~30분마다 피곤해하지 않는지 혈압과 함께 확인하세요.',
    kneeGatchRecommended: '5° ~ 10°',
    maxContinuousMinutes: '20 ~ 30분마다 상태 재확인',
  },
];

export type SacralSkinStatus = 'intact' | 'blanchable_erythema' | 'ulcer_stage2_plus';
export type LateralTiltPosition = 'left_30' | 'center' | 'right_30';
export type VitalStatusLevel = 'normal' | 'caution' | 'critical';

export interface PatientInputs {
  rr: number; // 1분 호흡수
  hr: number; // 1분 맥박수
  spo2: number; // 산소포화도 (%)
  sbp: number; // 최고 혈압 (mmHg)
  dbp: number; // 최저 혈압 (mmHg)
  baselineSbp: number; // 각도 올리기 전 기준 혈압
  baselineHr: number; // 기준 맥박
  borgScore: number; // 숨찬 정도 0-10
  painNrs: number; // 아픈 정도 0-10
  currentHob: number; // 현재 등받이 각도 0-90
  sacralSkinStatus: SacralSkinStatus;
  lateralTilt: LateralTiltPosition;
  // 상태 체크 항목
  spinalOrHipContraindication: boolean;
  iicpRisk: boolean;
  enteralNutrition: boolean;
  orthostaticHistory: boolean;
  pressureInjuryHighRisk: boolean;
  heartFailureOrPulmonaryEdema: boolean;
  copdTargetMode: boolean;
}

export interface VitalStatusResult {
  level: VitalStatusLevel;
  label: '안정' | '주의' | '위험';
  glyph: '●' | '▲' | '✖';
  reasons: string[];
  map: number;
}

export function formatCheckedConditions(input: PatientInputs): string {
  const checked: string[] = [];
  if (input.enteralNutrition) checked.push('콧줄로 식사 중');
  if (input.heartFailureOrPulmonaryEdema) checked.push('심장 약함/폐에 물 참');
  if (input.orthostaticHistory) checked.push('앉을 때 혈압 저하 이력');
  if (input.pressureInjuryHighRisk) checked.push('엉치뼈 욕창 고위험');
  if (input.iicpRisk) checked.push('뇌압 상승 주의');
  if (input.spinalOrHipContraindication) checked.push('허리·고관절 굽힘 금지');
  if (input.copdTargetMode) checked.push('만성 폐질환자 모드');
  if (input.sacralSkinStatus === 'blanchable_erythema') checked.push('엉치뼈 붉게 눌림');
  if (input.sacralSkinStatus === 'ulcer_stage2_plus') checked.push('엉치뼈 욕창 상처');
  return checked.length > 0 ? checked.join(', ') : '특이사항 체크 없음';
}

// 요구사항 (3),(4): 숨찬 정도 >=8점, 호흡 <12 / >20, 맥박 <60 / >100, 산소 <94%(폐질환 <88%), 수축기 <90, 평균동맥압 <65 -> 주의 / 심화 시 위험
export function evaluatePatientVitalStatus(input: PatientInputs): VitalStatusResult {
  const { rr, hr, spo2, sbp, dbp, borgScore, copdTargetMode } = input;
  const map = Math.round((sbp + 2 * dbp) / 3);
  const spo2CautionFloor = copdTargetMode ? 88 : 94;
  const spo2CriticalFloor = copdTargetMode ? 85 : 90;

  const criticalReasons: string[] = [];
  if (rr >= 30) criticalReasons.push(`호흡수 ${rr}회/분 (30회 이상 위험)`);
  if (rr <= 8) criticalReasons.push(`호흡수 ${rr}회/분 (8회 이하 호흡 저하 위험)`);
  if (hr >= 130) criticalReasons.push(`맥박 ${hr}회/분 (130회 이상 빈맥 위험)`);
  if (hr <= 45) criticalReasons.push(`맥박 ${hr}회/분 (45회 이하 서맥 위험)`);
  if (spo2 <= spo2CriticalFloor) {
    criticalReasons.push(`산소포화도 ${spo2}% (${spo2CriticalFloor}% 이하 위험)`);
  }
  if (sbp < 85) criticalReasons.push(`수축기 혈압 ${sbp} mmHg (85 미만 저혈압 위험)`);
  if (map < 60) criticalReasons.push(`평균동맥압 ${map} mmHg (60 미만 관류 저하 위험)`);

  if (criticalReasons.length > 0) {
    return {
      level: 'critical',
      label: '위험',
      glyph: '✖',
      reasons: criticalReasons,
      map,
    };
  }

  const cautionReasons: string[] = [];
  if (rr > 20) cautionReasons.push(`호흡수 ${rr}회/분 (20회 초과)`);
  if (rr < 12) cautionReasons.push(`호흡수 ${rr}회/분 (12회 미만)`);
  if (hr > 100) cautionReasons.push(`맥박 ${hr}회/분 (100회 초과)`);
  if (hr < 60) cautionReasons.push(`맥박 ${hr}회/분 (60회 미만)`);
  if (spo2 < spo2CautionFloor) {
    cautionReasons.push(
      `산소포화도 ${spo2}% (${copdTargetMode ? '만성 폐질환 기준 88% 미만' : '94% 미만'})`
    );
  }
  if (sbp < 90) cautionReasons.push(`수축기 혈압 ${sbp} mmHg (90 미만)`);
  if (map < 65) cautionReasons.push(`평균동맥압 ${map} mmHg (65 미만)`);
  if (borgScore >= 8) cautionReasons.push(`숨찬 정도 ${borgScore}/10점 (8점 이상 주의)`);

  if (cautionReasons.length > 0) {
    return {
      level: 'caution',
      label: '주의',
      glyph: '▲',
      reasons: cautionReasons,
      map,
    };
  }

  return {
    level: 'normal',
    label: '안정',
    glyph: '●',
    reasons: [
      `호흡 ${rr}회/분, 맥박 ${hr}회/분, 산소 ${spo2}%, 혈압 ${sbp}/${dbp}(평균동맥압 ${map}) mmHg, 숨찬 정도 ${borgScore}/10점 모두 안정 범위`,
    ],
    map,
  };
}

export const roundTo5 = (deg: number) => Math.round(deg / 5) * 5;

export interface ProtocolDecision {
  severity: 'nominal' | 'adjust' | 'caution' | 'critical';
  vitalStatus: VitalStatusResult;
  statusTitle: string;
  shortReason: string;
  actionSummary: string;
  recommendedHob: number;
  recommendedKneeGatch: number;
  reverseTrendelenburgDeg: number;
  legRaiseDeg: number;
  tripodSupport: boolean;
  stabilizationMinutes: number;
  requiresStepwiseCheck: boolean;
  ruleConflicts: string[];
  stepPlan: string[];
  physiologicalRationale: string[];
  safetyWarnings: string[];
  pressureCareAdvice: string;
}

export function evaluateBedAngleProtocol(input: PatientInputs): ProtocolDecision {
  const {
    rr,
    hr,
    spo2,
    sbp,
    dbp,
    baselineSbp,
    baselineHr,
    borgScore,
    painNrs,
    currentHob,
    sacralSkinStatus,
    spinalOrHipContraindication,
    iicpRisk,
    enteralNutrition,
    orthostaticHistory,
    pressureInjuryHighRisk,
    heartFailureOrPulmonaryEdema,
    copdTargetMode,
  } = input;

  const vitalStatus = evaluatePatientVitalStatus(input);
  const map = vitalStatus.map;
  const sbpDrop = baselineSbp - sbp;
  const hrRise = hr - baselineHr;
  const spo2CautionFloor = copdTargetMode ? 88 : 94;
  const spo2CriticalFloor = copdTargetMode ? 85 : 90;

  const warnings: string[] = [];
  const rationale: string[] = [];
  const stepPlan: string[] = [];
  const ruleConflicts: string[] = [];

  const checkedConditions = formatCheckedConditions(input);
  const vitalReasonText = vitalStatus.reasons.join(', ');
  const measuredSummary = `호흡 ${rr}회/분, 맥박 ${hr}회/분, 산소 ${spo2}%, 혈압 ${sbp}/${dbp}(평균동맥압 ${map}) mmHg, 숨찬 정도 ${borgScore}/10점`;

  // 요구사항 (2): 콧줄 식사 중인데 각도가 30° 미만이면 규칙 충돌 경고
  if (enteralNutrition && currentHob < 30) {
    if (spinalOrHipContraindication) {
      ruleConflicts.push(
        `규칙 충돌 경고: '콧줄로 식사 중'(30° 이상 필요)과 '허리·고관절 굽힘 금지'(현재 등받이 ${currentHob}°)가 충돌합니다. 등받이를 굽히는 대신 침대 전체를 +15° 기울이거나 식사 속도·체위 허용 여부를 의료진과 상의하세요.`
      );
    } else {
      ruleConflicts.push(
        `규칙 충돌 경고: '콧줄로 식사 중'인데 현재 등받이 각도가 ${currentHob}°(30° 미만)입니다. 식사 중 역류·폐렴 예방을 위해 최소 30° 이상 유지가 필요합니다.`
      );
    }
  }

  // 요구사항 (2),(5): 욕창 위험 + 45° 초과 60분 / 체위변경 간격(90분·60분 프로토콜 가정값) 안내
  const hasPressureRisk = pressureInjuryHighRisk || sacralSkinStatus !== 'intact';
  if (hasPressureRisk) {
    const intervalMin = sacralSkinStatus !== 'intact' ? 60 : 90;
    if (currentHob > 45) {
      warnings.push(
        `45° 초과 · 욕창 주의(60분 제한 — 프로토콜 가정값): 특이사항(${checkedConditions})과 높은 각도(>45°)가 겹쳐 연속 60분 이내로 유지하고, 체위변경 간격(${intervalMin}분)에 맞춰 압력을 분산하세요.`
      );
    } else {
      warnings.push(
        `욕창 주의(체위변경 ${intervalMin}분 간격 — 프로토콜 가정값): 특이사항(${checkedConditions})에 따라 ${intervalMin}분마다 자세를 바꾸고 무릎 받침(15°)을 함께 사용하세요.`
      );
    }
  }

  // 1. 요구사항 (7): 위험 상태 — 저혈압·허리금기·서맥·빈맥 등 낮은 각도 사유가 있으면 추천 이유에 명시하고 현재 각도 유지, 사유 없는 호흡 위험은 45~60°(가정값) 우선 추천
  if (vitalStatus.level === 'critical') {
    const isHypotensive = sbp < 85 || map < 60;
    const isSevereRespiratory = rr >= 30 || spo2 <= spo2CriticalFloor;

    const holdReasons: string[] = [];
    if (isHypotensive) {
      holdReasons.push(
        `저혈압·평균동맥압 저하(수축기 ${sbp}·MAP ${map} mmHg)로 뇌 혈류를 지켜야 함`
      );
      warnings.push(
        `수축기 혈압 ${sbp} mmHg(평균동맥압 ${map} mmHg)로 매우 낮습니다. 상체를 갑자기 세우면 뇌 혈류가 떨어지므로 의료진 확인 전까지 현재 각도(${currentHob}°)를 유지하고, 의료진 지시 시 등받이 낮춤·다리 올림을 확인하세요.`
      );
    }
    if (spinalOrHipContraindication) {
      holdReasons.push('허리·고관절 굽힘 금지 조건으로 상체 굴곡 제한');
      warnings.push(
        '허리·고관절 굽힘 금지가 체크되어 있어 등받이를 세우지 말고 의료진 확인 후 침대 전체 경사 여부를 결정하세요.'
      );
    }
    if (rr <= 8 || hr <= 45) {
      holdReasons.push(
        `서맥·호흡 저하(${rr <= 8 ? `호흡 ${rr}회` : `맥박 ${hr}회`}/분)로 급격한 체위 변화 위험`
      );
      warnings.push(
        `호흡수 ${rr}회/분 또는 맥박 ${hr}회/분으로 서맥·호흡저하 위험 상태입니다. 자세 변경 전 즉시 의료진에게 알려 원인을 확인하세요.`
      );
    }
    if (hr >= 130) {
      holdReasons.push(
        `심한 빈맥(맥박 ${hr}회/분)으로 상체 상승 시 맥박·혈압 변동 위험`
      );
      warnings.push(
        `맥박이 ${hr}회/분으로 빈맥 위험 상태입니다. 각도를 무리하게 바꾸면 맥박·혈압 변동이 커질 수 있으므로 의료진 확인 전까지 현재 각도(${currentHob}°)를 유지하세요.`
      );
    }
    if (isSevereRespiratory) {
      warnings.push(
        `호흡수 ${rr}회/분, 산소포화도 ${spo2}%로 호흡 위험 수준입니다. 먼저 의료진에게 알린 뒤 각도를 올려야 할 경우 10~15°씩 단계적으로 올리며 매 단계 맥박(${hr}회/분)과 혈압을 재측정하세요.`
      );
    }

    // 호흡 위험이며 낮은 각도 유지 사유가 없는 경우: 45~60°(가정값) 우선 추천 (단, 뇌압 주의 시 30° 제한 사유 명시)
    const canElevateForRespiratory =
      isSevereRespiratory &&
      !isHypotensive &&
      !spinalOrHipContraindication &&
      rr > 8 &&
      hr > 45 &&
      hr < 130;

    if (canElevateForRespiratory) {
      const respTargetHob = iicpRisk
        ? 30
        : orthostaticHistory
          ? 45
          : rr >= 32 || spo2 <= spo2CriticalFloor - 2
            ? 60
            : 55;
      const elevationReason = iicpRisk
        ? `호흡 위험(호흡 ${rr}회·산소 ${spo2}%)이지만 뇌압 상승 주의로 30° 초과를 제한해야 하므로 30°를 추천합니다.`
        : `호흡 위험(호흡 ${rr}회/분, 산소 ${spo2}%)이며 저혈압·빈맥·허리금기 등 낮은 각도 유지 사유가 없어, 호흡곤란 완화를 위한 높은 각도 ${respTargetHob}°(45~60° 가정값)로 단계적 상승(10~15°씩·맥박 재측정)을 우선 추천합니다.`;

      if (iicpRisk) {
        warnings.push('뇌압 상승 주의가 체크되어 있어 30°를 넘기지 말고 산소 투여 및 의료진 확인을 우선하세요.');
      }

      return {
        severity: 'critical',
        vitalStatus,
        statusTitle: iicpRisk
          ? '호흡 위험(뇌압 주의) — 의료진 알림 및 30° 제한'
          : `호흡 위험 — 의료진 알림 후 ${respTargetHob}°(45~60° 가정값) 단계 상승 추천`,
        shortReason: elevationReason,
        actionSummary: `입력값(${measuredSummary}) 및 특이사항(${checkedConditions}) 기준 판정 근거(${vitalReasonText})로 위험 상태입니다. ${elevationReason}`,
        recommendedHob: roundTo5(respTargetHob),
        recommendedKneeGatch: respTargetHob > 30 ? 12 : 0,
        reverseTrendelenburgDeg: 0,
        legRaiseDeg: 0,
        tripodSupport: false,
        stabilizationMinutes: 3,
        requiresStepwiseCheck: respTargetHob - currentHob > 15,
        ruleConflicts,
        stepPlan: [
          `1단계(우선): 즉시 [의료진에게 알리기]를 완료하고 호흡수(${rr}회/분)·산소(${spo2}%)·맥박(${hr}회/분)을 보고하세요.`,
          `2단계(단계 상승): 현재 ${currentHob}°에서 목표 ${respTargetHob}°(45~60° 가정값)까지 한 번에 올리지 말고 10~15°씩 단계적으로 올리며 맥박·혈압을 재측정하세요.`,
          '3단계(재측정): 15분 뒤(가정값) 호흡수·맥박·산소포화도를 재측정해 호전 여부를 확인하세요.',
        ],
        physiologicalRationale: [
          `판정 근거: ${vitalReasonText} (평균동맥압 ${map} mmHg, 숨찬 정도 ${borgScore}/10점, 특이사항: ${checkedConditions}).`,
          elevationReason,
        ],
        safetyWarnings: warnings,
        pressureCareAdvice:
          '위험 상태 대응(의료진 알림 → 재측정)을 우선 진행하고, 안정화 후 체위변경을 시행하세요.',
      };
    }

    const keptHob = spinalOrHipContraindication ? 0 : roundTo5(currentHob);
    const lowAngleReasonText =
      holdReasons.length > 0
        ? holdReasons.join(' · ')
        : `위험 근거(${vitalReasonText}) 안정 확인 전 급격한 각도 변동 방지`;

    return {
      severity: 'critical',
      vitalStatus,
      statusTitle: `위험 상태 — ${lowAngleReasonText}로 현재 ${keptHob}° 유지`,
      shortReason: `${keptHob}° 유지 이유: ${lowAngleReasonText}. (위험 근거: ${vitalReasonText} · 의료진 확인 전까지 유지, 상승 필요 시 10~15° 단계별 맥박 재측정)`,
      actionSummary: `입력값(${measuredSummary}) 및 특이사항(${checkedConditions}) 기준 판정 근거(${vitalReasonText})로 위험 상태입니다. [${keptHob}° 유지 이유: ${lowAngleReasonText}] 의료진 확인 후 각도를 올려야 할 경우 10~15°씩 단계적으로 올리며 맥박(${hr}회/분)을 재측정하세요.`,
      recommendedHob: keptHob,
      recommendedKneeGatch: keptHob > 30 ? 12 : 0,
      reverseTrendelenburgDeg: spinalOrHipContraindication ? 10 : 0,
      legRaiseDeg: 0,
      tripodSupport: false,
      stabilizationMinutes: 3,
      requiresStepwiseCheck: true,
      ruleConflicts,
      stepPlan: [
        `1단계(우선): ${lowAngleReasonText} 때문에 현재 ${keptHob}°를 유지하고 즉시 [의료진에게 알리기]를 진행하세요.`,
        `2단계(올릴 경우): 의료진이 각도 변경을 지시하면 10~15°씩 단계적으로 조절하며 매 단계마다 맥박(현재 ${hr}회/분)·혈압(${sbp}/${dbp})을 재측정하세요.`,
        '3단계(재측정): 알림 후 15분 뒤(가정값) 재측정을 입력해 호전 여부를 확인하세요.',
      ],
      physiologicalRationale: [
        `판정 근거: ${vitalReasonText} (평균동맥압 ${map} mmHg, 숨찬 정도 ${borgScore}/10점, 특이사항: ${checkedConditions}).`,
        `${keptHob}° 유지 이유: ${lowAngleReasonText}.`,
      ],
      safetyWarnings: warnings,
      pressureCareAdvice:
        '위험 상태 대응(의료진 알림 → 재측정)을 우선 진행하고, 안정화 후 체위변경을 시행하세요.',
    };
  }

  // 2. 혈압 떨어짐 / 저혈압·평균동맥압 65 미만 주의
  if (
    sbp < 90 ||
    map < 65 ||
    (sbpDrop >= 20 && currentHob > 30) ||
    (hrRise >= 25 && currentHob > 45 && sbp < 105)
  ) {
    const targetHob = iicpRisk ? 30 : 15;
    warnings.push(
      `수축기 혈압 ${sbp} mmHg(기준 ${baselineSbp} mmHg 대비 ${sbpDrop >= 0 ? `-${sbpDrop}` : `+${Math.abs(sbpDrop)}`} mmHg, 평균동맥압 ${map} mmHg), 맥박 ${hr}회/분으로 혈압 저하 주의 상태여서 ${targetHob}°로 낮출 것을 제안합니다.`
    );
    if (iicpRisk) {
      warnings.push(
        '뇌압 상승 주의가 체크되어 있어 0° 완전 수평은 피하고 30°를 유지하며 혈압을 확인하세요.'
      );
    }

    return {
      severity: 'caution',
      vitalStatus,
      statusTitle: '혈압·평균동맥압 저하 주의 — 낮은 각도 제안',
      shortReason: `수축기 ${sbp}·평균동맥압 ${map} mmHg 저하 주의(맥박 ${hr}회) → 혈류 회복 위해 ${targetHob}° 제안(${checkedConditions}).`,
      actionSummary: `입력값(${measuredSummary}), 특이사항(${checkedConditions})과 판정 근거(${vitalReasonText})에 따라 혈압 회복을 위해 등받이 ${targetHob}°를 추천합니다.`,
      recommendedHob: roundTo5(targetHob),
      recommendedKneeGatch: 5,
      reverseTrendelenburgDeg: 0,
      legRaiseDeg: sbp < 90 && !iicpRisk ? 15 : 0,
      tripodSupport: false,
      stabilizationMinutes: 5,
      requiresStepwiseCheck: false,
      ruleConflicts,
      stepPlan: [
        `간호사 확인 후 현재 ${currentHob}°에서 ${targetHob}°로 낮춥니다.`,
        `5분 동안 쉰 뒤 수축기 혈압(현재 ${sbp} mmHg), 평균동맥압(${map} mmHg), 맥박(${hr}회/분) 회복 여부를 재측정합니다.`,
      ],
      physiologicalRationale: [
        `판정 근거: ${vitalReasonText} · 숨찬 정도 ${borgScore}/10점 · 특이사항(${checkedConditions}).`,
        `등받이를 ${targetHob}°로 낮추면 다리 쪽 혈액이 심장으로 잘 돌아와 혈압(${sbp}/${dbp} mmHg) 회복과 맥박(${hr}회/분) 안정에 도움이 됩니다.`,
      ],
      safetyWarnings: warnings,
      pressureCareAdvice:
        '각도를 낮춘 뒤에도 숨이 차면 담당 의료진에게 수액·산소 조치를 상의하세요.',
    };
  }

  // 3. 허리/고관절 굽힘 금지 -> 침대 전체 기울이기
  if (spinalOrHipContraindication) {
    const tiltDeg = rr > 20 || enteralNutrition ? 15 : 10;
    rationale.push(
      `판정 근거: ${vitalReasonText}, 숨찬 정도 ${borgScore}/10점, 특이사항(${checkedConditions})을 반영해 등받이 0° + 침대 전체 +${tiltDeg}° 기울기를 추천합니다.`
    );
    rationale.push(
      `침대 전체 +${tiltDeg}° 경사는 허리 굽힘 없이 배 속 장기를 아래로 내려 호흡(${rr}회/분)과 역류 예방을 돕습니다.`
    );
    warnings.push('몸이 발치 쪽으로 미끄러지지 않도록 발 받침대를 꼭 고정하세요.');

    return {
      severity:
        enteralNutrition && currentHob < 30
          ? 'caution'
          : vitalStatus.level === 'caution'
            ? 'caution'
            : rr > 20
              ? 'adjust'
              : 'nominal',
      vitalStatus,
      statusTitle: '허리 굽힘 금지 — 침대 전체 기울기 제안',
      shortReason: `허리·고관절 굽힘 금지(${checkedConditions}) · 호흡 ${rr}회·맥박 ${hr}회 → 등받이 0° + 침대 전체 +${tiltDeg}° 기울기 추천.`,
      actionSummary: `입력값(${measuredSummary})과 특이사항(${checkedConditions})의 판정 근거(${vitalReasonText})에 따라 등받이 0° + 침대 전체 +${tiltDeg}° 기울기를 추천합니다.`,
      recommendedHob: 0,
      recommendedKneeGatch: 0,
      reverseTrendelenburgDeg: tiltDeg,
      legRaiseDeg: 0,
      tripodSupport: false,
      stabilizationMinutes: 5,
      requiresStepwiseCheck: false,
      ruleConflicts,
      stepPlan: [
        `등받이 0° 확인 후 침대 전체를 +${tiltDeg}° 기울입니다(간호사 확인 후 적용).`,
        `5~10분 뒤 호흡수(${rr}회/분), 맥박(${hr}회/분), 발 받침대 눌림 여부를 확인합니다.`,
      ],
      physiologicalRationale: rationale,
      safetyWarnings: warnings,
      pressureCareAdvice:
        '허리를 일자로 유지한 채 통나무 굴리듯 조심스럽게 옆으로 돌려 엉치뼈를 쉬게 해주세요.',
    };
  }

  // 4. 일반적인 호흡·맥박·숨찬 정도 맞춤 각도 판단 (요구사항 1, 8: 안정 환자에게는 실제 근거 사용 + 5° 단위 반올림)
  let targetHob = 35;
  let tripodSupport = false;
  let severity: ProtocolDecision['severity'] =
    vitalStatus.level === 'caution' ? 'caution' : 'nominal';
  let statusTitle = '현재의 치료적 체위를 유지합니다';
  let actionSummary = `입력값(${measuredSummary}), 특이사항(${checkedConditions}), 판정 근거(${vitalReasonText})가 안정 범위여서 35° 반쯤 앉은 자세를 추천합니다.`;

  const isSevereDyspnea =
    rr >= 26 ||
    spo2 <= spo2CriticalFloor + 2 ||
    borgScore >= 8 ||
    borgScore >= 6 ||
    (heartFailureOrPulmonaryEdema && rr >= 21);
  const isModerateDyspnea = rr > 20 || spo2 < spo2CautionFloor || borgScore >= 4;
  const isStableVitals = vitalStatus.level === 'normal' && borgScore <= 3;

  // 요구사항 (1): 판정이 '안정'인 환자에게는 '호흡곤란' 대신 실제 근거 표기
  const stableBasisLabel = heartFailureOrPulmonaryEdema
    ? '누우면 숨이 차는 증상(심장 부담) 예방'
    : enteralNutrition
      ? '콧줄 식사 역류 예방'
      : borgScore >= 4
        ? `주관적 숨참 느낌(${borgScore}/10점) 완화`
        : '안정 범위 유지';

  if (isSevereDyspnea) {
    if (iicpRisk) {
      targetHob = 30;
      severity = 'caution';
      statusTitle = '뇌압 주의 — 30° 추천 및 산소 확인';
      actionSummary = `입력값(${measuredSummary}) 및 특이사항(${checkedConditions}) 중 뇌압 상승 주의가 있어 목 혈관 압박을 막는 30° 유지를 추천합니다.`;
      rationale.push(
        `판정 근거: ${vitalReasonText}, 숨찬 정도 ${borgScore}/10점, 특이사항(${checkedConditions}). 뇌압 상승 위험으로 30° 초과를 제한합니다.`
      );
    } else if (heartFailureOrPulmonaryEdema && (rr >= 28 || borgScore >= 7)) {
      targetHob = 85;
      tripodSupport = true;
      severity = vitalStatus.level === 'caution' ? 'caution' : 'adjust';
      statusTitle = '심한 숨참 — 테이블 베개 기대기(85°) 추천';
      actionSummary = `입력값(${measuredSummary})과 특이사항(${checkedConditions})을 반영한 판정 근거(${vitalReasonText})에 따라 가슴을 완전히 여는 85° 테이블 기대기 자세를 추천합니다.`;
      rationale.push(
        `판정 근거: 호흡 ${rr}회/분, 맥박 ${hr}회/분, 산소 ${spo2}%, 숨찬 정도 ${borgScore}/10점, 특이사항(${checkedConditions}). 85° 기대기 자세가 심장·폐 부담을 덜어줍니다.`
      );
    } else {
      targetHob = orthostaticHistory ? 55 : 70;
      severity = vitalStatus.level === 'caution' ? 'caution' : 'adjust';
      statusTitle =
        vitalStatus.level === 'normal'
          ? `${stableBasisLabel} — ${targetHob}° 자세 추천`
          : `숨참 완화 — ${targetHob}° 높게 앉은 자세 추천`;
      actionSummary = `입력값(${measuredSummary}), 특이사항(${checkedConditions}), 판정 근거(${vitalReasonText})를 고려해 등받이 ${targetHob}°를 추천합니다.`;
      rationale.push(
        `판정 근거: 호흡 ${rr}회/분, 맥박 ${hr}회/분, 산소 ${spo2}%, 숨찬 정도 ${borgScore}/10점, 특이사항(${checkedConditions}). ${
          vitalStatus.level === 'normal' ? stableBasisLabel : '숨참 완화'
        }를 위해 ${targetHob}°로 폐 아래 공간을 넓혀줍니다.`
      );
      if (orthostaticHistory) {
        warnings.push(
          `앉을 때 혈압 저하 이력이 체크되어 바로 70°로 올리지 않고 55°에서 혈압(${sbp}/${dbp})과 맥박(${hr}회) 변화를 먼저 확인합니다.`
        );
      }
    }
  } else if (isModerateDyspnea) {
    targetHob = enteralNutrition ? 45 : 40;
    if (rr >= 23 && currentHob >= 35 && currentHob <= 45) {
      targetHob = 50;
      severity = vitalStatus.level === 'caution' ? 'caution' : 'adjust';
      statusTitle = '중간 높이(50°)로 단계 상향 제안';
      actionSummary = `현재 ${currentHob}°에서도 입력값(${measuredSummary})의 부담이 이어져 특이사항(${checkedConditions})과 판정 근거(${vitalReasonText})를 고려해 50°를 추천합니다.`;
      rationale.push(
        `판정 근거: 호흡 ${rr}회/분, 맥박 ${hr}회/분, 산소 ${spo2}%, 숨찬 정도 ${borgScore}/10점, 특이사항(${checkedConditions}). 50°는 60° 이상 고각도 부담을 줄이면서 호흡을 돕습니다.`
      );
    } else {
      severity =
        vitalStatus.level === 'caution'
          ? 'caution'
          : Math.abs(currentHob - targetHob) <= 5
            ? 'nominal'
            : 'adjust';
      statusTitle =
        Math.abs(currentHob - targetHob) <= 5
          ? `반쯤 앉은 자세(${targetHob}°) 유지 및 관찰`
          : vitalStatus.level === 'normal'
            ? `${stableBasisLabel} — ${targetHob}° 추천`
            : `호흡 개선을 위해 ${targetHob}° 추천`;
      actionSummary = `입력값(${measuredSummary}), 특이사항(${checkedConditions}), 판정 근거(${vitalReasonText})에 따라 등받이 ${targetHob}°를 추천합니다.`;
      rationale.push(
        `판정 근거: 호흡 ${rr}회/분, 맥박 ${hr}회/분, 산소 ${spo2}%, 숨찬 정도 ${borgScore}/10점, 특이사항(${checkedConditions}). ${targetHob}°가 흉곽을 균형 있게 열어줍니다.`
      );
    }
  } else if (isStableVitals) {
    if (iicpRisk) {
      targetHob = 30;
    } else if (enteralNutrition) {
      targetHob = 35;
    } else if (currentHob >= 30 && currentHob <= 45) {
      targetHob = roundTo5(currentHob);
    } else if (currentHob >= 15 && currentHob < 30 && !enteralNutrition && borgScore <= 1) {
      targetHob = 30;
    } else {
      targetHob = 35;
    }

    if (currentHob >= 60) {
      severity = 'adjust';
      statusTitle = `호흡·맥박 안정됨 — 피로·욕창 예방 위해 ${targetHob}°로 낮춤 제안`;
      actionSummary = `입력값(${measuredSummary})이 안정 범위로 회복되어 ${currentHob}° 유지에 따른 피로·욕창을 막기 위해 ${targetHob}°를 추천합니다(특이사항: ${checkedConditions}).`;
      rationale.push(
        `판정 근거: ${vitalReasonText}, 특이사항(${checkedConditions}). 안정된 상태에서 ${currentHob}°를 오래 유지하면 엉치뼈 욕창 위험이 커져 ${targetHob}°가 알맞습니다.`
      );
    } else if (currentHob < 30 && (enteralNutrition || currentHob < 15)) {
      severity = 'adjust';
      statusTitle = `역류·폐 압박 예방 — ${targetHob}° 추천`;
      actionSummary = `입력값(${measuredSummary})은 안정 범위이나 현재 각도 ${currentHob}°가 낮고 특이사항(${checkedConditions})을 반영해 ${targetHob}°를 추천합니다.`;
      rationale.push(
        `판정 근거: ${vitalReasonText}, 특이사항(${checkedConditions}). ${currentHob}°는 폐 압박이나 역류 위험이 있어 ${targetHob}° 유지가 좋습니다.`
      );
    } else {
      severity = 'nominal';
      statusTitle = '현재의 치료적 체위를 유지합니다';
      actionSummary = `입력값(${measuredSummary}), 특이사항(${checkedConditions}), 판정 근거(${vitalReasonText})가 모두 안정 범위여서 ${targetHob}° 유지를 추천합니다.`;
      rationale.push(
        `판정 근거: ${vitalReasonText}, 특이사항(${checkedConditions}). ${targetHob}°에서 호흡(${rr}회/분)과 맥박(${hr}회/분)이 가장 안정적으로 유지됩니다.`
      );
    }
  } else {
    targetHob = currentHob >= 30 && currentHob <= 45 ? roundTo5(currentHob) : 35;
    severity = 'caution';
    statusTitle = `주의 수치 감지 — ${targetHob}° 유지 및 원인 확인`;
    actionSummary = `입력값(${measuredSummary}), 특이사항(${checkedConditions}) 중 판정 근거(${vitalReasonText})로 주의 상태여서 ${targetHob}°에서 5~10분 관찰을 추천합니다.`;
    rationale.push(
      `판정 근거: ${vitalReasonText}, 숨찬 정도 ${borgScore}/10점, 통증 ${painNrs}/10점, 특이사항(${checkedConditions}). 자세 영향과 통증·발열 요인을 함께 확인하세요.`
    );
    if (hr > 100 && currentHob > 45) {
      targetHob = 35;
      warnings.push(
        `현재 ${currentHob}° 높은 각도에서 맥박이 ${hr}회/분(100회 초과)으로 빨라졌을 수 있어 35°로 낮추는 것을 추천합니다.`
      );
    }
  }

  if (painNrs >= 7 && targetHob > 40) {
    warnings.push(
      `통증이 ${painNrs}/10점으로 심합니다. 상체를 과하게 굽히면 아픈 부위가 당겨 호흡(${rr}회/분)이 더 빨라질 수 있으니 통증 조절과 함께 30~40°를 고려하세요.`
    );
  }

  if (sacralSkinStatus === 'ulcer_stage2_plus' && !isSevereDyspnea && !isModerateDyspnea) {
    if (targetHob > 30) {
      targetHob = 30;
    }
    tripodSupport = false;
    warnings.push(
      '엉치뼈 욕창 상처 있음: 30° 초과 유지를 피하고 60분(프로토콜 가정값)마다 자세를 바꿔 압력을 빼주세요.'
    );
  } else if (sacralSkinStatus === 'blanchable_erythema' && !(hasPressureRisk && targetHob > 45)) {
    warnings.push(
      '엉치뼈 피부가 붉게 눌림: 무릎 받침(15°)을 병행하고 60분(프로토콜 가정값) 간격으로 체위를 변경하세요.'
    );
  }

  if (enteralNutrition && targetHob < 30) {
    targetHob = 30;
    warnings.push(
      '콧줄로 식사 중이므로 역류와 흡인성 폐렴을 막기 위해 최소 30° 이상을 유지해야 합니다.'
    );
  }

  // 요구사항 (8): 추천 각도는 가까운 5° 단위로 맞춤
  targetHob = roundTo5(targetHob);

  if (copdTargetMode) {
    rationale.push(
      `만성 폐질환자 모드 적용: 현재 산소포화도 ${spo2}%를 목표 범위(88~92%, 주의 <88%, 위험 ≤85%) 기준으로 판정했습니다.`
    );
  }

  const kneeGatch =
    targetHob > 30
      ? hasPressureRisk
        ? 15
        : 12
      : targetHob >= 15
        ? 8
        : 0;

  if (targetHob > 45 && !hasPressureRisk) {
    warnings.push(
      `45° 초과 자세는 무릎 받침을 ${kneeGatch}° 올리고, 60분(프로토콜 가정값) 이상 연속 유지하지 않도록 확인하세요.`
    );
  }

  const angleDelta = targetHob - currentHob;
  const requiresStepwiseCheck = angleDelta > 20;

  if (requiresStepwiseCheck) {
    const midAngle = roundTo5((currentHob + targetHob) / 2);
    stepPlan.push(
      `1단계: 한 번에 올리지 않고 먼저 ${midAngle}°까지 올린 뒤 3분간 맥박(${hr}회/분)·어지러움을 확인합니다.`
    );
    stepPlan.push(`2단계: 괜찮으면 목표 ${targetHob}°까지 올리고 무릎 받침도 ${kneeGatch}° 올립니다.`);
    stepPlan.push('3단계: 5~10분 기다린 뒤 호흡수·맥박·산소포화도를 다시 재서 간호사가 확인·기록합니다.');
  } else if (angleDelta !== 0) {
    stepPlan.push(
      `1단계: 간호사 확인 후 현재 ${currentHob}°에서 목표 ${targetHob}°로 조절하고 무릎 받침을 ${kneeGatch}° 맞춥니다.`
    );
    stepPlan.push('2단계: 몸이 새 각도에 적응하도록 5~10분 기다립니다.');
    stepPlan.push('3단계: 호흡수와 맥박이 편안해졌는지 확인하고 간호 기록을 저장합니다.');
  } else {
    stepPlan.push(`현재 각도(${targetHob}°)와 무릎 받침(${kneeGatch}°)을 그대로 유지합니다.`);
    stepPlan.push('5~10분 간격으로 호흡수와 맥박 변화를 지켜보고 기록합니다.');
  }

  // 요구사항 (1), (3), (5): '호흡 우선 + 압력 분산'은 여기 한 곳에만 쓰고, 30~45° 반좌위는 체위변경 간격에 맞춰 함께 확인
  const defaultIntervalMin = sacralSkinStatus !== 'intact' ? 60 : pressureInjuryHighRisk ? 90 : 120;
  const pressureCareAdvice = hasPressureRisk
    ? targetHob > 45 && (isSevereDyspnea || isModerateDyspnea)
      ? `호흡 우선 + 압력 분산 안내: ${
          vitalStatus.level === 'normal'
            ? `${stableBasisLabel}(숨참 ${borgScore}점)`
            : `호흡 부담(호흡 ${rr}회/분, 산소 ${spo2}%, 숨참 ${borgScore}점)`
        }을 위해 ${targetHob}°를 우선 적용하되, 45° 초과 60분 제한 및 체위변경 ${defaultIntervalMin}분 간격(프로토콜 가정값)에 맞춰 압력을 분산하세요.`
      : `욕창 주의(프로토콜 가정값): 무릎 받침 ${kneeGatch}° 병행 · 체위변경 간격 ${defaultIntervalMin}분마다 왼쪽 30° → 정면 → 오른쪽 30° 순으로 자세를 바꾸세요.${
          targetHob > 45 ? ' (45° 초과는 60분 이내 제한)' : ''
        }`
    : targetHob > 45
      ? '45° 초과 유지 중: 60분(프로토콜 가정값) 기준으로 엉치뼈 눌림을 확인하고 숨이 편해지면 30~45° 반좌위로 낮추세요.'
      : targetHob >= 30
        ? `30~45° 반좌위 유지 중: 무릎 받침 ${kneeGatch}° 유지 · 체위변경 간격(120분)에 맞춰 자세와 피부를 함께 확인하세요.`
        : '낮은 각도 구간: 체위변경 간격(120분)에 맞춰 왼쪽 30° → 정면 → 오른쪽 30° 순으로 자세를 바꾸세요.';

  const shortReason = `호흡 ${rr}회·맥박 ${hr}회·산소 ${spo2}%·혈압 ${sbp}/${dbp}(MAP ${map})·숨참 ${borgScore}점 (${checkedConditions}) → ${
    vitalStatus.level === 'normal' ? stableBasisLabel : vitalStatus.label
  } 기준으로 ${targetHob}° 추천.`;

  return {
    severity,
    vitalStatus,
    statusTitle,
    shortReason,
    actionSummary,
    recommendedHob: targetHob,
    recommendedKneeGatch: kneeGatch,
    reverseTrendelenburgDeg: 0,
    legRaiseDeg: 0,
    tripodSupport,
    stabilizationMinutes: requiresStepwiseCheck || targetHob >= 60 ? 10 : 5,
    requiresStepwiseCheck,
    ruleConflicts,
    stepPlan,
    physiologicalRationale: rationale,
    safetyWarnings: warnings,
    pressureCareAdvice,
  };
}

export interface AngleAuditResult {
  isWrongAngle: boolean;
  needsDoctorAlertFirst: boolean;
  reasonSummary: string;
  targetHob: number;
  targetKneeGatch: number;
  targetRevTilt: number;
  targetLegRaise: number;
  targetTripod: boolean;
  decision: ProtocolDecision;
}

export function checkAngleAppropriateness(
  inputHob: number,
  measuredInputs: PatientInputs
): AngleAuditResult {
  const decision = evaluateBedAngleProtocol({
    ...measuredInputs,
    currentHob: inputHob,
  });

  const needsDoctorAlertFirst = decision.vitalStatus.level === 'critical';
  const checkedStr = formatCheckedConditions(measuredInputs);
  const measuredStr = `호흡 ${measuredInputs.rr}회/분, 맥박 ${measuredInputs.hr}회/분, 산소 ${measuredInputs.spo2}%, 혈압 ${measuredInputs.sbp}/${measuredInputs.dbp}(평균동맥압 ${decision.vitalStatus.map}) mmHg, 숨찬 정도 ${measuredInputs.borgScore}/10점, 특이사항(${checkedStr})`;

  // 요구사항 (4),(7): 현재 각도와 같은 각도는 변경 제안으로 만들지 않으며, 위험 상태의 호흡 추천 각도(45~60°)는 실제로 바뀔 때만 제안
  if (needsDoctorAlertFirst) {
    const hasActualAngleChange =
      (decision.reverseTrendelenburgDeg > 0 && inputHob !== 0) ||
      decision.recommendedHob !== inputHob;
    return {
      isWrongAngle: hasActualAngleChange,
      needsDoctorAlertFirst: true,
      reasonSummary: hasActualAngleChange
        ? `${decision.shortReason} (현재 ${inputHob}° → ${decision.recommendedHob}° 단계적 조절 제안, 먼저 의료진에게 알리세요)`
        : `${decision.shortReason} (현재 ${inputHob}° 유지 · 먼저 의료진에게 알리세요)`,
      targetHob: decision.recommendedHob,
      targetKneeGatch: decision.recommendedKneeGatch,
      targetRevTilt: decision.reverseTrendelenburgDeg,
      targetLegRaise: 0,
      targetTripod: false,
      decision,
    };
  }

  const isSpinalFlexionViolation =
    measuredInputs.spinalOrHipContraindication && inputHob > 0;
  const isEnteralLowViolation =
    measuredInputs.enteralNutrition && inputHob < 30 && decision.recommendedHob >= 30;
  const isHypotensiveHighViolation =
    (measuredInputs.sbp < 90 ||
      decision.vitalStatus.map < 65 ||
      measuredInputs.baselineSbp - measuredInputs.sbp >= 20) &&
    inputHob > 30;
  const isOutsideTargetRange =
    decision.reverseTrendelenburgDeg === 0 &&
    Math.abs(inputHob - decision.recommendedHob) > 10;

  const hasActualAngleChange =
    (decision.reverseTrendelenburgDeg > 0 && inputHob !== 0) ||
    decision.recommendedHob !== inputHob;

  const isWrongAngle =
    hasActualAngleChange &&
    (isSpinalFlexionViolation ||
      isEnteralLowViolation ||
      isHypotensiveHighViolation ||
      isOutsideTargetRange);

  let reasonSummary = `입력한 ${inputHob}°는 현재 상태(${measuredStr})와 판정 근거(${decision.vitalStatus.reasons.join(', ')})에 알맞은 각도입니다.`;

  if (isSpinalFlexionViolation) {
    reasonSummary = `입력한 ${inputHob}°는 '허리·고관절 굽힘 금지' 조건에 어긋납니다(${measuredStr}). 등받이 0° + 침대 전체 +${decision.reverseTrendelenburgDeg}° 기울기로 변경을 제안합니다.`;
  } else if (isHypotensiveHighViolation) {
    reasonSummary = `입력한 ${inputHob}°에서 혈압 ${measuredInputs.sbp}/${measuredInputs.dbp}(평균동맥압 ${decision.vitalStatus.map}) mmHg, 맥박 ${measuredInputs.hr}회/분으로 혈압 저하 부담이 확인되어 ${decision.recommendedHob}°로 낮출 것을 제안합니다(${measuredStr}).`;
  } else if (isEnteralLowViolation) {
    reasonSummary = `입력한 ${inputHob}°는 '콧줄로 식사 중' 기준(30° 미만 금지)에 충돌합니다(${measuredStr}). ${decision.recommendedHob}°로 올릴 것을 제안합니다.`;
  } else if (isWrongAngle) {
    reasonSummary = `입력한 ${inputHob}°는 현재 상태(${measuredStr}, 판정 근거: ${decision.vitalStatus.reasons.join(', ')})에 맞지 않아 ${decision.recommendedHob}°로 변경을 제안합니다.`;
  }

  return {
    isWrongAngle,
    needsDoctorAlertFirst: false,
    reasonSummary,
    targetHob: decision.recommendedHob,
    targetKneeGatch: decision.recommendedKneeGatch,
    targetRevTilt: decision.reverseTrendelenburgDeg,
    targetLegRaise: decision.legRaiseDeg,
    targetTripod: decision.tripodSupport,
    decision,
  };
}

export function simulateVitalsAtAngle(
  base: PatientInputs,
  testHob: number
): Pick<PatientInputs, 'rr' | 'hr' | 'spo2' | 'sbp' | 'dbp'> {
  let rr = base.rr;
  let hr = base.hr;
  let spo2 = base.spo2;
  let sbp = base.sbp;
  let dbp = base.dbp;

  if (testHob < 15) {
    const burden = base.heartFailureOrPulmonaryEdema || base.enteralNutrition ? 5 : 3;
    rr = Math.min(34, Math.max(base.rr + burden, 21));
    hr = Math.min(138, base.hr + (base.heartFailureOrPulmonaryEdema ? 14 : 8));
    spo2 = Math.max(86, base.spo2 - 2);
  } else if (testHob >= 15 && testHob < 30) {
    rr = base.rr > 22 ? base.rr - 1 : Math.max(14, base.rr);
    hr = Math.max(62, base.hr - 5);
    spo2 = base.spo2;
  } else if (testHob >= 30 && testHob <= 45) {
    rr = Math.max(15, Math.min(base.rr, 18));
    hr = Math.max(66, Math.min(base.hr, 82));
    spo2 = Math.min(99, Math.max(base.spo2, 96));
    sbp = Math.max(110, base.baselineSbp);
  } else if (testHob > 45 && testHob < 60) {
    rr = Math.max(16, base.rr - 2);
    hr = Math.min(126, base.hr + 6);
    spo2 = Math.min(99, base.spo2 + 1);
  } else {
    rr = Math.max(16, base.rr - 3);
    hr = Math.min(138, base.hr + 15);
    spo2 = Math.min(99, base.spo2 + 2);
    if (base.orthostaticHistory || base.baselineSbp <= 122) {
      sbp = Math.max(80, base.sbp - 24);
      dbp = Math.max(50, base.dbp - 12);
    }
  }

  return { rr, hr, spo2, sbp, dbp };
}

export interface VitalHistoryPoint {
  timeLabel: string;
  rr: number;
  hr: number;
  hob: number;
  spo2: number;
  isExample?: boolean;
  isSimulatedRecovery?: boolean;
  eventType?: 'time' | 'input' | 'confirmed' | 'preview';
  eventLabel?: string;
}

export const formatTiltKo = (tilt: LateralTiltPosition) =>
  tilt === 'left_30' ? '왼쪽 30°' : tilt === 'right_30' ? '오른쪽 30°' : '정면';

export const formatRepositionAgoLabel = (minutes: number, tilt: LateralTiltPosition) => {
  const tiltDesc =
    tilt === 'left_30' ? '왼쪽 30° 돌림' : tilt === 'right_30' ? '오른쪽 30° 돌림' : '정면 누움';
  if (minutes < 5) return `방금 (${tiltDesc})`;
  return `${minutes}분 전 (${tiltDesc})`;
};

export const HIGH_ANGLE_HOB_THRESHOLD = 45;
export const HIGH_ANGLE_LIMIT_MINUTES = 60; // 45° 초과 유지 경고 기준(프로토콜 가정값 60분)

// 기본 체위변경 간격(프로토콜 가정값): 일반 120분, 욕창 위험 체크 90분, 피부 붉게 눌림/상처 60분
export function getDefaultRepositionInterval(input: PatientInputs): number {
  if (input.sacralSkinStatus !== 'intact') return 60;
  if (input.pressureInjuryHighRisk) return 90;
  return 120;
}

// 체위변경 순환 순서: 왼쪽 30° → 정면 → 오른쪽 30° → 정면
export function getNextCycleTilt(
  currentTilt: LateralTiltPosition,
  lastSideTilt: 'left_30' | 'right_30' = 'right_30'
): LateralTiltPosition {
  if (currentTilt === 'left_30' || currentTilt === 'right_30') {
    return 'center';
  }
  return lastSideTilt === 'left_30' ? 'right_30' : 'left_30';
}

// 끝이 있는 위험 대응 흐름:
// 위험 발생(alert_required) → 의료진 알림 완료·지시 입력(awaiting_order) → 처치 중 관찰(observing)
// → (연속 2회 호전 없음 시 상급 의료진/신속대응 1회 안내 후) 지시 대기·지속 관찰(continuous_observation) → 호전 시 종료(resolved)
export type CriticalFlowStage =
  | 'idle'
  | 'alert_required'
  | 'awaiting_order'
  | 'observing'
  | 'continuous_observation'
  | 'resolved';

export type CriticalOutcome = 'improved' | 'unchanged' | 'worsened';

export type CriticalRiskCategory = 'respiration' | 'pulse' | 'oxygen' | 'bp';

export interface CriticalEpisodeTimelineEntry {
  id: string;
  stepType: 'alert' | 'order' | 'recheck' | 'outcome';
  clockLabel: string;
  title: string;
  detail: string;
  vitalsSummary?: string;
}

export interface CriticalAlertState {
  stage: CriticalFlowStage;
  episodeId?: string;
  episodeStartedClock?: string;
  alertedAtClock?: string;
  orderEnteredAtClock?: string;
  doctorOrderNote?: string;
  doctorOrderedHob?: number | null;
  episodeRiskCategories: CriticalRiskCategory[]; // 에피소드 종료 전까지 유지 (기준선 깜빡임 방지)
  notifiedSnapshot?: { rr: number; hr: number; spo2: number; sbp: number; dbp: number };
  noImprovementCount: number; // 호전 없음 1회, 2회...
  consecutiveSafeRechecks: number; // 여유 기준 연속 확인 (2회 연속 시 호전 종료)
  seniorEscalationShown: boolean; // 연속 2회 호전 없음 시 '상급 의료진·신속대응 요청 고려' 딱 1회만 표시
  seniorEscalationAcknowledged?: boolean;
  safetyChangeConfirmed?: boolean; // 해당 위험 에피소드 중 의료진에게 체위·각도 변경 가능 여부 확인 체크 (1회 체크 시 에피소드 종료까지 유지)
  newCategoryAlertNote?: string; // 기존에 없던 새 종류(예: 혈압) 추가 시 1회 안내
  lastRecheckAtClock?: string;
  lastOutcome?: CriticalOutcome;
  lastOutcomeDetail?: string;
  timeline: CriticalEpisodeTimelineEntry[];
}

export const DEFAULT_CRITICAL_ALERT_STATE: CriticalAlertState = {
  stage: 'idle',
  episodeRiskCategories: [],
  noImprovementCount: 0,
  consecutiveSafeRechecks: 0,
  seniorEscalationShown: false,
  seniorEscalationAcknowledged: false,
  safetyChangeConfirmed: false,
  timeline: [],
};

export function getCriticalRiskCategories(input: PatientInputs): CriticalRiskCategory[] {
  const cats: CriticalRiskCategory[] = [];
  const map = Math.round((input.sbp + 2 * input.dbp) / 3);
  const spo2Floor = input.copdTargetMode ? 85 : 90;
  if (input.rr >= 30 || input.rr <= 8) cats.push('respiration');
  if (input.hr >= 130 || input.hr <= 45) cats.push('pulse');
  if (input.spo2 <= spo2Floor) cats.push('oxygen');
  if (input.sbp < 85 || map < 60) cats.push('bp');
  return cats;
}

export function formatCriticalCategoryKo(cat: CriticalRiskCategory): string {
  switch (cat) {
    case 'respiration':
      return '호흡수 이상';
    case 'pulse':
      return '맥박 이상';
    case 'oxygen':
      return '산소포화도 저하';
    case 'bp':
      return '혈압·평균동맥압 저하';
  }
}

// 위험 해소용 여유 기준(히스테리시스): 기준선(예: 맥박 130) 전후 깜빡임 방지, 맥박 120 이하 등 여유 기준으로 2회 연속 확인 시 종료 인정
export function areVitalsRelaxedSafe(input: PatientInputs): boolean {
  const map = Math.round((input.sbp + 2 * input.dbp) / 3);
  const spo2SafeFloor = input.copdTargetMode ? 88 : 93;
  return (
    input.rr >= 10 &&
    input.rr <= 26 &&
    input.hr >= 52 &&
    input.hr <= 120 &&
    input.spo2 >= spo2SafeFloor &&
    input.sbp >= 92 &&
    map >= 65
  );
}

export function normalizeCriticalAlertState(
  raw?: Partial<CriticalAlertState> | null
): CriticalAlertState {
  if (!raw || !raw.stage) return DEFAULT_CRITICAL_ALERT_STATE;
  // 이전 버전 stage 호환 매핑
  const rawStage = raw.stage as string;
  let stage: CriticalFlowStage = 'idle';
  if (rawStage === 'alert_required') stage = 'alert_required';
  else if (rawStage === 'awaiting_order') stage = 'awaiting_order';
  else if (rawStage === 'observing' || rawStage === 'awaiting_recheck' || rawStage === 'recheck_due') {
    stage = 'observing';
  } else if (rawStage === 'continuous_observation') {
    stage = 'continuous_observation';
  } else if (rawStage === 'resolved' || rawStage === 'recheck_done') {
    stage = 'resolved';
  }

  return {
    ...DEFAULT_CRITICAL_ALERT_STATE,
    ...raw,
    stage,
    episodeRiskCategories: Array.isArray(raw.episodeRiskCategories) ? raw.episodeRiskCategories : [],
    noImprovementCount: typeof raw.noImprovementCount === 'number' ? raw.noImprovementCount : 0,
    consecutiveSafeRechecks:
      typeof raw.consecutiveSafeRechecks === 'number' ? raw.consecutiveSafeRechecks : 0,
    seniorEscalationShown: Boolean(raw.seniorEscalationShown),
    seniorEscalationAcknowledged: Boolean(raw.seniorEscalationAcknowledged),
    safetyChangeConfirmed: Boolean(raw.safetyChangeConfirmed),
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
  };
}

export interface WardPatient {
  id: string;
  bedNumber: string;
  patientName: string;
  ageSex: string;
  diagnosis: string;
  inputs: PatientInputs;
  elapsedMinutes: number; // 누적 경과 시간(분)
  repositionStartedAtElapsed: number; // 현재 자세를 시작한 누적 경과 시각(분)
  minutesSinceReposition: number; // 현재 자세 유지 시간(분, 항상 elapsedMinutes 이하)
  customRepositionIntervalMin?: number | null; // 환자별 수정 가능한 체위변경 간격(분)
  lastSideTilt: 'left_30' | 'right_30'; // 왼쪽 30° -> 정면 -> 오른쪽 30° -> 정면 순서 판별용
  repositionProposedForCycle: boolean; // 현재 기준 간격에서 제안이 이미 1회 발생했는지
  repositionHoldCount: number; // 연속 보류 횟수
  repositionSnoozeMinutesLeft: number; // 보류 시 15분 재알림 남은 시간(분)
  minutesAbove45: number; // 45° 초과일 때만 흐르는 유지 시간(분)
  highAngleProposedForCycle: boolean; // 45° 초과 60분 경고가 이미 1회 발생했는지
  criticalAlert?: CriticalAlertState; // 위험 알림 상태 흐름
  lastRepositionedLabel: string;
  history: VitalHistoryPoint[];
}

export interface RepositionRecordMeta {
  prevTilt: LateralTiltPosition;
  newTilt: LateralTiltPosition;
  maintainedMinutes: number;
  isHold: boolean;
  isDelay?: boolean;
  delayMinutes?: number;
  holdCount?: number;
  holdReason?: string;
}

export interface CriticalEpisodeRecordMeta {
  episodeId: string;
  startedClock: string;
  statusLabel: string;
  riskCategories: CriticalRiskCategory[];
  doctorOrderNote?: string;
  doctorOrderedHob?: number | null;
  noImprovementCount: number;
  consecutiveSafeRechecks: number;
  seniorEscalationShown: boolean;
  timeline: CriticalEpisodeTimelineEntry[];
}

export interface EmrNursingRecord {
  id: string;
  timestamp: string;
  createdAtMs?: number;
  isPractice?: boolean;
  bedNumber: string;
  patientName: string;
  prevHob: number;
  appliedHob: number;
  kneeGatch: number;
  revTilt: number;
  lateralTilt: LateralTiltPosition;
  preVitals: { rr: number; hr: number; spo2: number; bp: string };
  postVitals?: { rr: number; hr: number; spo2: number; bp: string };
  stabilizationMinutes: number;
  repositionMeta?: RepositionRecordMeta;
  criticalEpisodeMeta?: CriticalEpisodeRecordMeta;
  verdict: string;
}

export const INITIAL_WARD_PATIENTS: WardPatient[] = [
  {
    id: 'bed-301',
    bedNumber: '301호',
    patientName: '김○○',
    ageSex: '68세 / 남',
    diagnosis: '폐렴 · 숨이 참',
    elapsedMinutes: 0,
    repositionStartedAtElapsed: 0,
    minutesSinceReposition: 0,
    customRepositionIntervalMin: null,
    lastSideTilt: 'right_30',
    repositionProposedForCycle: false,
    repositionHoldCount: 0,
    repositionSnoozeMinutesLeft: 0,
    minutesAbove45: 0,
    highAngleProposedForCycle: false,
    criticalAlert: DEFAULT_CRITICAL_ALERT_STATE,
    lastRepositionedLabel: '방금 (정면 누움)',
    inputs: {
      rr: 25,
      hr: 102,
      spo2: 92,
      sbp: 132,
      dbp: 82,
      baselineSbp: 130,
      baselineHr: 92,
      borgScore: 5,
      painNrs: 2,
      currentHob: 15,
      sacralSkinStatus: 'intact',
      lateralTilt: 'center',
      spinalOrHipContraindication: false,
      iicpRisk: false,
      enteralNutrition: false,
      orthostaticHistory: false,
      pressureInjuryHighRisk: true,
      heartFailureOrPulmonaryEdema: false,
      copdTargetMode: false,
    },
    history: [
      { timeLabel: '14:00', rr: 19, hr: 84, hob: 35, spo2: 96, isExample: true },
      { timeLabel: '15:30', rr: 21, hr: 90, hob: 25, spo2: 95, isExample: true },
      { timeLabel: '17:00', rr: 23, hr: 96, hob: 15, spo2: 93, isExample: true },
      { timeLabel: '18:20', rr: 25, hr: 102, hob: 15, spo2: 92, isExample: true },
    ],
  },
  {
    id: 'bed-302',
    bedNumber: '302호',
    patientName: '이○○',
    ageSex: '74세 / 여',
    diagnosis: '심장 약함 · 누우면 숨이 참',
    elapsedMinutes: 0,
    repositionStartedAtElapsed: 0,
    minutesSinceReposition: 0,
    customRepositionIntervalMin: null,
    lastSideTilt: 'right_30',
    repositionProposedForCycle: false,
    repositionHoldCount: 0,
    repositionSnoozeMinutesLeft: 0,
    minutesAbove45: 0,
    highAngleProposedForCycle: false,
    criticalAlert: DEFAULT_CRITICAL_ALERT_STATE,
    lastRepositionedLabel: '방금 (정면 누움)',
    inputs: {
      rr: 28,
      hr: 116,
      spo2: 91,
      sbp: 138,
      dbp: 86,
      baselineSbp: 142,
      baselineHr: 104,
      borgScore: 8,
      painNrs: 1,
      currentHob: 35,
      sacralSkinStatus: 'blanchable_erythema',
      lateralTilt: 'center',
      spinalOrHipContraindication: false,
      iicpRisk: false,
      enteralNutrition: false,
      orthostaticHistory: false,
      pressureInjuryHighRisk: true,
      heartFailureOrPulmonaryEdema: true,
      copdTargetMode: false,
    },
    history: [
      { timeLabel: '14:00', rr: 22, hr: 98, hob: 45, spo2: 94, isExample: true },
      { timeLabel: '15:30', rr: 24, hr: 104, hob: 45, spo2: 93, isExample: true },
      { timeLabel: '17:00', rr: 26, hr: 110, hob: 35, spo2: 92, isExample: true },
      { timeLabel: '18:20', rr: 28, hr: 116, hob: 35, spo2: 91, isExample: true },
    ],
  },
  {
    id: 'bed-303',
    bedNumber: '303호',
    patientName: '박○○',
    ageSex: '59세 / 남',
    diagnosis: '허리 수술 회복 · 콧줄 식사',
    elapsedMinutes: 0,
    repositionStartedAtElapsed: 0,
    minutesSinceReposition: 0,
    customRepositionIntervalMin: null,
    lastSideTilt: 'left_30',
    repositionProposedForCycle: false,
    repositionHoldCount: 0,
    repositionSnoozeMinutesLeft: 0,
    minutesAbove45: 0,
    highAngleProposedForCycle: false,
    criticalAlert: DEFAULT_CRITICAL_ALERT_STATE,
    lastRepositionedLabel: '방금 (왼쪽 30° 돌림)',
    inputs: {
      rr: 22,
      hr: 86,
      spo2: 95,
      sbp: 120,
      dbp: 76,
      baselineSbp: 122,
      baselineHr: 84,
      borgScore: 3,
      painNrs: 4,
      currentHob: 0,
      sacralSkinStatus: 'intact',
      lateralTilt: 'left_30',
      spinalOrHipContraindication: true,
      iicpRisk: false,
      enteralNutrition: true,
      orthostaticHistory: false,
      pressureInjuryHighRisk: false,
      heartFailureOrPulmonaryEdema: false,
      copdTargetMode: false,
    },
    history: [
      { timeLabel: '14:00', rr: 18, hr: 80, hob: 0, spo2: 96, isExample: true },
      { timeLabel: '15:30', rr: 19, hr: 82, hob: 0, spo2: 96, isExample: true },
      { timeLabel: '17:00', rr: 21, hr: 85, hob: 0, spo2: 95, isExample: true },
      { timeLabel: '18:20', rr: 22, hr: 86, hob: 0, spo2: 95, isExample: true },
    ],
  },
  {
    id: 'bed-304',
    bedNumber: '304호',
    patientName: '최○○',
    ageSex: '71세 / 여',
    diagnosis: '만성 폐질환 안정기 · 콧줄 식사',
    elapsedMinutes: 0,
    repositionStartedAtElapsed: 0,
    minutesSinceReposition: 0,
    customRepositionIntervalMin: null,
    lastSideTilt: 'right_30',
    repositionProposedForCycle: false,
    repositionHoldCount: 0,
    repositionSnoozeMinutesLeft: 0,
    minutesAbove45: 0,
    highAngleProposedForCycle: false,
    criticalAlert: DEFAULT_CRITICAL_ALERT_STATE,
    lastRepositionedLabel: '방금 (오른쪽 30° 돌림)',
    inputs: {
      rr: 18,
      hr: 78,
      spo2: 91,
      sbp: 124,
      dbp: 78,
      baselineSbp: 124,
      baselineHr: 78,
      borgScore: 2,
      painNrs: 0,
      currentHob: 35,
      sacralSkinStatus: 'intact',
      lateralTilt: 'right_30',
      spinalOrHipContraindication: false,
      iicpRisk: false,
      enteralNutrition: true,
      orthostaticHistory: false,
      pressureInjuryHighRisk: false,
      heartFailureOrPulmonaryEdema: false,
      copdTargetMode: true,
    },
    history: [
      { timeLabel: '14:00', rr: 22, hr: 88, hob: 45, spo2: 89, isExample: true },
      { timeLabel: '15:30', rr: 20, hr: 84, hob: 35, spo2: 90, isExample: true },
      { timeLabel: '17:00', rr: 18, hr: 79, hob: 35, spo2: 91, isExample: true },
      { timeLabel: '18:20', rr: 18, hr: 78, hob: 35, spo2: 91, isExample: true },
    ],
  },
];

export interface PracticeScenarioPreset {
  id: 'normal' | 'dyspnea' | 'hf_worsen' | 'tachycardia' | 'hypoxia' | 'hypotension';
  label: string;
  shortDesc: string;
  patch: Partial<PatientInputs>;
  resetCritical?: boolean;
}

export const PRACTICE_SCENARIO_PRESETS: PracticeScenarioPreset[] = [
  {
    id: 'normal',
    label: '정상',
    shortDesc: '호흡 16 · 맥박 76 · 산소 98% · 혈압 120/78',
    resetCritical: true,
    patch: {
      rr: 16,
      hr: 76,
      spo2: 98,
      sbp: 120,
      dbp: 78,
      baselineSbp: 120,
      baselineHr: 76,
      borgScore: 1,
      painNrs: 1,
      currentHob: 35,
      heartFailureOrPulmonaryEdema: false,
      spinalOrHipContraindication: false,
      iicpRisk: false,
      orthostaticHistory: false,
      copdTargetMode: false,
    },
  },
  {
    id: 'dyspnea',
    label: '호흡곤란',
    shortDesc: '호흡 27 · 맥박 108 · 산소 91% · 숨참 7점',
    resetCritical: true,
    patch: {
      rr: 27,
      hr: 108,
      spo2: 91,
      sbp: 130,
      dbp: 82,
      baselineSbp: 128,
      baselineHr: 92,
      borgScore: 7,
      currentHob: 15,
      spinalOrHipContraindication: false,
      iicpRisk: false,
      copdTargetMode: false,
    },
  },
  {
    id: 'hf_worsen',
    label: '심부전 악화',
    shortDesc: '호흡 31 · 맥박 118 · 산소 89% · 폐부종 체크',
    patch: {
      rr: 31,
      hr: 118,
      spo2: 89,
      sbp: 136,
      dbp: 86,
      baselineSbp: 138,
      baselineHr: 102,
      borgScore: 8,
      currentHob: 20,
      heartFailureOrPulmonaryEdema: true,
      pressureInjuryHighRisk: true,
      spinalOrHipContraindication: false,
      iicpRisk: false,
      copdTargetMode: false,
    },
  },
  {
    id: 'tachycardia',
    label: '맥박 빠름(위험)',
    shortDesc: '맥박 138 · 호흡 27 · 산소 91% (위험 알림)',
    patch: {
      rr: 27,
      hr: 138,
      spo2: 91,
      sbp: 106,
      dbp: 68,
      baselineSbp: 122,
      baselineHr: 92,
      borgScore: 7,
      spinalOrHipContraindication: false,
      copdTargetMode: false,
    },
  },
  {
    id: 'hypoxia',
    label: '산소 저하',
    shortDesc: '산소 87% · 호흡 28 · 맥박 106 (위험 알림)',
    patch: {
      rr: 28,
      hr: 106,
      spo2: 87,
      sbp: 122,
      dbp: 78,
      baselineSbp: 122,
      baselineHr: 90,
      borgScore: 7,
      copdTargetMode: false,
      spinalOrHipContraindication: false,
    },
  },
  {
    id: 'hypotension',
    label: '저혈압',
    shortDesc: '혈압 82/54(MAP 63) · 맥박 112 · 현재 45°',
    patch: {
      rr: 22,
      hr: 112,
      spo2: 95,
      sbp: 82,
      dbp: 54,
      baselineSbp: 122,
      baselineHr: 88,
      borgScore: 4,
      currentHob: 45,
      orthostaticHistory: true,
      spinalOrHipContraindication: false,
      copdTargetMode: false,
    },
  },
];

export interface PptAngleZoneSummary {
  zoneLabel: string;
  zoneTitle: string;
  respirationLine: string;
  pulseLine: string;
  pressureLine: string;
  longDurationWarning: string | null;
}

export function getPptAngleZoneSummary(angle: number, durationMin: number): PptAngleZoneSummary {
  if (angle < 15) {
    return {
      zoneLabel: '0° 구간',
      zoneTitle: '반듯하게 누운 자세 (완전 수평)',
      respirationLine: '배 속 장기가 폐 아래쪽(횡격막)을 밀어 올려 폐가 펴질 공간이 좁아지고 숨쉬기가 답답해집니다.',
      pulseLine: '심장으로 돌아오는 피가 많아져 심장이 약한 환자는 맥박이 빨라지거나 부담을 느낄 수 있습니다.',
      pressureLine: '체중이 고르게 퍼져 엉치뼈 집중 압력은 적지만, 콧줄 식사·숨찬 환자는 역류와 폐렴 위험이 커집니다.',
      longDurationWarning:
        durationMin >= 60
          ? `주의: 0° 자세를 ${durationMin >= 60 ? `${durationMin / 60}시간` : `${durationMin}분`} 유지하면 폐 압박, 숨참 악화, 위 내용물 역류(흡인성 폐렴) 위험이 커집니다.`
          : null,
    };
  }
  if (angle < 30) {
    return {
      zoneLabel: '15~30° 구간',
      zoneTitle: '조금 세운 자세 (낮은 반앉기)',
      respirationLine: '횡격막이 아래로 내려가 0°보다 숨쉬기가 편해지고, 누웠을 때의 사레들림 위험을 줄여줍니다.',
      pulseLine: '심장 부담이 줄고 안정 신경이 작동해 맥박과 혈압이 비교적 편안하게 유지됩니다.',
      pressureLine: '엉치뼈 눌림은 적은 편이나, 콧줄 식사 시에는 역류 예방을 위해 최소 30° 이상이 안전합니다.',
      longDurationWarning:
        durationMin >= 120
          ? `주의: 한 자세로 ${durationMin / 60}시간 이상 유지하면 엉치뼈·등 부위 압력이 쌓이므로 체위변경(몸 돌리기)이 필요합니다.`
          : null,
    };
  }
  if (angle < 60) {
    return {
      zoneLabel: angle <= 45 ? '30~45° 구간' : '45~60° 적응 구간',
      zoneTitle: angle <= 45 ? '반쯤 앉은 자세 (반좌위 기본 표준)' : '중간 높이 앉은 자세 (고각도 적응 단계)',
      respirationLine:
        angle <= 45
          ? '가슴이 잘 열려 숨찬 환자에게 가장 표준이 되며, 역류와 흡인성 폐렴을 가장 효과적으로 막아줍니다.'
          : '30~45°보다 폐 아래 공간을 한 번 더 넓혀주어 중간 이상의 숨참을 덜어주는 안전 확인 단계입니다.',
      pulseLine:
        angle <= 45
          ? '심장으로 들어오는 피가 알맞게 조절되어 맥박과 혈압이 가장 균형 잡힌 상태를 유지합니다.'
          : '피가 다리 쪽으로 내려가기 시작하므로 어지럼증이나 혈압 하락, 맥박 상승이 없는지 확인해야 합니다.',
      pressureLine:
        '30° 초과 시 엉치뼈에 체중이 실리므로 무릎 받침(12~15°)을 함께 올리고 2시간(욕창 위험 시 60~90분)마다 자세를 바꿔야 합니다.',
      longDurationWarning:
        angle > 45 && durationMin >= 60
          ? `주의: 45° 초과 각도를 ${durationMin >= 60 ? `${durationMin / 60}시간` : `${durationMin}분`} 유지하면 엉치뼈 전단력·욕창 위험(60분 가정값)이 급격히 커집니다.`
          : durationMin >= 120
            ? `주의: ${durationMin / 60}시간 유지 시 체위변경(몸 돌리기) 간격(120분)에 맞춰 왼쪽·정면·오른쪽으로 자세를 바꿔주세요.`
            : null,
    };
  }
  return {
    zoneLabel: '60~90° 구간',
    zoneTitle: '높이 앉은 자세 (급성 호흡곤란 완화)',
    respirationLine: '가슴이 완전히 열리고 중력이 배 속 장기를 아래로 당겨 폐 바닥까지 공기가 가장 잘 들어갑니다.',
    pulseLine: '피가 다리로 쏠려 맥박이 빨라지거나 갑자기 혈압이 떨어지는(기립성 저혈압) 현상을 주의해야 합니다.',
    pressureLine: '체중이 엉치뼈에 강하게 쏠려 욕창 위험이 매우 크므로 무릎 받침을 올리고 숨이 가라앉으면 30~45°로 낮춰야 합니다.',
    longDurationWarning:
      durationMin >= 60
        ? `강한 주의: ${angle}° 높은 각도를 ${durationMin >= 60 ? `${durationMin / 60}시간` : `${durationMin}분`} 유지하면 기립성 저혈압·어지럼증·피로와 심각한 엉치뼈 욕창 위험이 커집니다.`
        : '주의: 60° 이상 고각도는 30~60분 단위로 혈압·맥박과 엉치뼈 피부를 집중 관찰하세요.',
  };
}

export interface MissionCaseItem {
  id: string;
  patientLabel: string;
  summary: string;
  inputs: PatientInputs;
  choices: { hob: number; revTilt?: number; label: string }[];
}

const BASE_MISSION_INPUTS: PatientInputs = {
  rr: 18,
  hr: 80,
  spo2: 96,
  sbp: 122,
  dbp: 78,
  baselineSbp: 122,
  baselineHr: 80,
  borgScore: 2,
  painNrs: 1,
  currentHob: 15,
  sacralSkinStatus: 'intact',
  lateralTilt: 'center',
  spinalOrHipContraindication: false,
  iicpRisk: false,
  enteralNutrition: false,
  orthostaticHistory: false,
  pressureInjuryHighRisk: false,
  heartFailureOrPulmonaryEdema: false,
  copdTargetMode: false,
};

export const MISSION_CASES: MissionCaseItem[] = [
  {
    id: 'm-dyspnea',
    patientLabel: '72세 · 폐렴 입원 환자',
    summary: '현재 15°, 호흡 27회/분, 맥박 106회/분, 산소 91%, 숨찬 정도 7/10점, 특이사항 없음',
    inputs: {
      ...BASE_MISSION_INPUTS,
      rr: 27,
      hr: 106,
      spo2: 91,
      borgScore: 7,
      currentHob: 15,
    },
    choices: [
      { hob: 0, label: '0° (평평하게 눕힘)' },
      { hob: 15, label: '15° (낮은 반앉기 유지)' },
      { hob: 35, label: '35° (반좌위)' },
      { hob: 70, label: '70° (높이 앉은 자세)' },
    ],
  },
  {
    id: 'm-hypotension',
    patientLabel: '66세 · 혈압 저하 주의 환자',
    summary: '현재 45°, 수축기 혈압 86/56(평균동맥압 66) mmHg, 맥박 114회/분, 어지럼 호소',
    inputs: {
      ...BASE_MISSION_INPUTS,
      rr: 20,
      hr: 114,
      spo2: 96,
      sbp: 86,
      dbp: 56,
      baselineSbp: 122,
      borgScore: 3,
      currentHob: 45,
      orthostaticHistory: true,
    },
    choices: [
      { hob: 15, label: '15° (혈류 회복 위해 낮춤)' },
      { hob: 35, label: '35° (반좌위 유지)' },
      { hob: 60, label: '60° (높이 앉은 자세)' },
      { hob: 85, label: '85° (기대기 자세)' },
    ],
  },
  {
    id: 'm-spinal-enteral',
    patientLabel: '59세 · 허리 수술 + 콧줄 식사 환자',
    summary: '허리·고관절 굽힘 금지, 콧줄 식사 중, 호흡 22회/분, 맥박 86회/분, 현재 0°',
    inputs: {
      ...BASE_MISSION_INPUTS,
      rr: 22,
      hr: 86,
      spo2: 95,
      borgScore: 3,
      currentHob: 0,
      spinalOrHipContraindication: true,
      enteralNutrition: true,
    },
    choices: [
      { hob: 0, revTilt: 15, label: '등받이 0° + 침대 전체 +15° 기울기' },
      { hob: 35, label: '등받이 35° (허리 굽혀 세움)' },
      { hob: 60, label: '등받이 60° (높이 앉힘)' },
      { hob: 15, label: '등받이 15° (조금 세움)' },
    ],
  },
  {
    id: 'm-enteral-stable',
    patientLabel: '70세 · 콧줄 식사 중 안정 환자',
    summary: '현재 15°, 호흡 18회/분, 맥박 78회/분, 산소 97%, 콧줄로 식사 중',
    inputs: {
      ...BASE_MISSION_INPUTS,
      rr: 18,
      hr: 78,
      spo2: 97,
      borgScore: 1,
      currentHob: 15,
      enteralNutrition: true,
    },
    choices: [
      { hob: 0, label: '0° (완전 수평)' },
      { hob: 15, label: '15° (현재 유지)' },
      { hob: 35, label: '35° (역류 예방 반좌위)' },
      { hob: 75, label: '75° (고각도 유지)' },
    ],
  },
  {
    id: 'm-hf-orthopnea',
    patientLabel: '75세 · 심부전(폐에 물) 급성 숨참',
    summary: '심부전·폐부종 체크, 호흡 29회/분, 맥박 116회/분, 산소 91%, 숨참 8/10점',
    inputs: {
      ...BASE_MISSION_INPUTS,
      rr: 29,
      hr: 116,
      spo2: 91,
      sbp: 136,
      dbp: 84,
      borgScore: 8,
      currentHob: 35,
      heartFailureOrPulmonaryEdema: true,
    },
    choices: [
      { hob: 0, label: '0° (눕힘)' },
      { hob: 30, label: '30° (반좌위)' },
      { hob: 55, label: '55° (적응 단계)' },
      { hob: 85, label: '85° (테이블 베개 기대기)' },
    ],
  },
  {
    id: 'm-iicp-dyspnea',
    patientLabel: '64세 · 뇌압(IICP) 상승 주의 + 숨참',
    summary: '뇌압 상승 주의 체크, 호흡 26회/분, 맥박 98회/분, 산소 92%, 숨참 6/10점',
    inputs: {
      ...BASE_MISSION_INPUTS,
      rr: 26,
      hr: 98,
      spo2: 92,
      borgScore: 6,
      currentHob: 15,
      iicpRisk: true,
    },
    choices: [
      { hob: 0, label: '0° (수평 유지)' },
      { hob: 30, label: '30° (뇌압 보호 상한)' },
      { hob: 60, label: '60° (높이 앉힘)' },
      { hob: 85, label: '85° (최대 세움)' },
    ],
  },
  {
    id: 'm-critical-tachy',
    patientLabel: '69세 · 맥박 급상승 위험 상태',
    summary: '현재 30°, 맥박 138회/분(위험), 호흡 27회/분, 산소 91%, 혈압 106/68 mmHg',
    inputs: {
      ...BASE_MISSION_INPUTS,
      rr: 27,
      hr: 138,
      spo2: 91,
      sbp: 106,
      dbp: 68,
      borgScore: 7,
      currentHob: 30,
    },
    choices: [
      { hob: 30, label: '의료진 알림 후 현재 30° 유지' },
      { hob: 75, label: '즉시 75°로 올림' },
      { hob: 0, label: '즉시 0°로 내림' },
      { hob: 90, label: '즉시 90°로 세움' },
    ],
  },
  {
    id: 'm-ulcer-stable',
    patientLabel: '78세 · 엉치뼈 욕창 상처 + 안정 상태',
    summary: '엉치뼈 욕창 상처 있음, 호흡 17회/분, 맥박 76회/분, 산소 97%, 현재 45°',
    inputs: {
      ...BASE_MISSION_INPUTS,
      rr: 17,
      hr: 76,
      spo2: 97,
      borgScore: 1,
      currentHob: 45,
      sacralSkinStatus: 'ulcer_stage2_plus',
      pressureInjuryHighRisk: true,
    },
    choices: [
      { hob: 0, label: '0° (무조건 눕힘)' },
      { hob: 30, label: '30° (욕창 압력 완화 상한)' },
      { hob: 60, label: '60° (높게 유지)' },
      { hob: 80, label: '80° (식사 자세 유지)' },
    ],
  },
];

