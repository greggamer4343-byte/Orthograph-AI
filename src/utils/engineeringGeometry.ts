import {
  ParsedParameters,
  CalculatedAnswers,
  SolutionStep,
  FormulaBreakdown,
  ProjectionGeometry2D,
  SpacePoints3D,
  SolvedProblemBlueprint,
  UnitPreference,
  ImpossibilityError,
  AmbiguityPrompt,
  ChallengeQuestion,
  PlottingEngineConfig,
  QuadrantType,
} from '../types/engineering';

export function determineQuadrant(
  condHp: 'above' | 'below' | 'in_hp',
  condVp: 'in_front' | 'behind' | 'in_vp'
): QuadrantType {
  if (condHp === 'above' && condVp === 'in_front') return 'First (I)';
  if (condHp === 'above' && condVp === 'behind') return 'Second (II)';
  if (condHp === 'below' && condVp === 'behind') return 'Third (III)';
  if (condHp === 'below' && condVp === 'in_front') return 'Fourth (IV)';
  return 'First (I)';
}

export function generatePlottingEngineConfig(
  condHpA: 'above' | 'below' | 'in_hp',
  distHpA: number,
  condVpA: 'in_front' | 'behind' | 'in_vp',
  distVpA: number,
  condHpB: 'above' | 'below' | 'in_hp',
  distHpB: number,
  condVpB: 'in_front' | 'behind' | 'in_vp',
  distVpB: number,
  ptAx: number,
  ptBx: number,
  fvLength: number,
  tvLength: number,
  alphaDeg: number,
  betaDeg: number
): PlottingEngineConfig {
  // Cartesian Y coordinates (Y=0 is XY line, +Y above, -Y below)
  const a_prime_y = (condHpA === 'below' ? -1 : condHpA === 'in_hp' ? 0 : 1) * distHpA;
  const a_y = (condVpA === 'in_front' ? -1 : condVpA === 'in_vp' ? 0 : 1) * distVpA;

  const b_prime_y = (condHpB === 'below' ? -1 : condHpB === 'in_hp' ? 0 : 1) * distHpB;
  const b_y = (condVpB === 'in_front' ? -1 : condVpB === 'in_vp' ? 0 : 1) * distVpB;

  return {
    reference_axis: {
      id: 'XY_Line',
      type: 'horizontal_axis',
      y_coordinate: 0,
    },
    quadrant_parser: {
      point_A: {
        condition_hp: condHpA,
        distance_hp_mm: Math.round(distHpA),
        condition_vp: condVpA,
        distance_vp_mm: Math.round(distVpA),
        calculated_coordinates: {
          front_view_a_prime: {
            x: ptAx,
            y: Number(a_prime_y.toFixed(1)),
            label: "a'",
          },
          top_view_a: {
            x: ptAx,
            y: Number(a_y.toFixed(1)),
            label: 'a',
          },
        },
      },
      point_B: {
        condition_hp: condHpB,
        distance_hp_mm: Math.round(distHpB),
        condition_vp: condVpB,
        distance_vp_mm: Math.round(distVpB),
        calculated_coordinates: {
          front_view_b_prime: {
            x: Number(ptBx.toFixed(1)),
            y: Number(b_prime_y.toFixed(1)),
            label: "b'",
          },
          top_view_b: {
            x: Number(ptBx.toFixed(1)),
            y: Number(b_y.toFixed(1)),
            label: 'b',
          },
        },
      },
    },
    line_rendering: {
      front_view_line: {
        start_point: "a'",
        end_point: "b'",
        length_mm: Number(fvLength.toFixed(1)),
        angle_with_xy: Number(alphaDeg.toFixed(1)),
      },
      top_view_line: {
        start_point: 'a',
        end_point: 'b',
        length_mm: Number(tvLength.toFixed(1)),
        angle_with_xy: Number(betaDeg.toFixed(1)),
      },
      projectors: [
        { type: 'vertical_construction_line', start: "a'", end: 'a' },
        { type: 'vertical_construction_line', start: "b'", end: 'b' },
      ],
    },
  };
}

export function validateProblemGeometry(params: Partial<ParsedParameters>): ImpossibilityError | null {
  const TL = params.true_length_mm;
  const FV = params.front_view_length_mm;
  const TV = params.top_view_length_mm;
  const theta = params.theta_inclination_hp;
  const phi = params.phi_inclination_vp;

  // 1. Negative or zero length checks
  if (TL !== undefined && TL <= 0) {
    return {
      type: 'NEGATIVE_VALUES',
      title: 'Invalid True Length',
      message: `True Length cannot be ${TL} mm.`,
      educationalExplanation: 'A physical line segment in engineering drafting must have a positive, non-zero length to be projected onto reference planes.',
      suggestedFix: 'Provide a positive True Length (e.g., 60 mm or 75 mm).',
    };
  }

  // 2. FV > TL impossibility check
  if (FV !== undefined && TL !== undefined && FV > TL) {
    return {
      type: 'FV_EXCEEDS_TL',
      title: 'Front View Exceeds True Length',
      message: `Front View (${FV} mm) is greater than True Length (${TL} mm).`,
      educationalExplanation:
        'In orthographic projection, when a line in space is tilted at an angle φ to the Vertical Plane, its projected apparent length is given by FV = TL · cos(φ). Because the cosine of any real angle can never exceed 1 (cos φ ≤ 1), the apparent Front View can NEVER exceed the True Length (FV ≤ TL). Projecting a line onto a 2D plane foreshortens it or keeps it equal—it can never stretch it!',
      suggestedFix: `Set Front View to be less than or equal to ${TL} mm (for instance, ${Math.round(TL * 0.85)} mm).`,
    };
  }

  // 3. TV > TL impossibility check
  if (TV !== undefined && TL !== undefined && TV > TL) {
    return {
      type: 'TV_EXCEEDS_TL',
      title: 'Top View Exceeds True Length',
      message: `Top View (${TV} mm) is greater than True Length (${TL} mm).`,
      educationalExplanation:
        'Similarly, the Top View (Plan) length is given by TV = TL · cos(θ), where θ is the inclination to the Horizontal Plane. Because cos(θ) ≤ 1, the Top View cannot be longer than the True Length (TV ≤ TL).',
      suggestedFix: `Set Top View to be less than or equal to ${TL} mm (for instance, ${Math.round(TL * 0.75)} mm).`,
    };
  }

  // 4. Sum of inclinations check (sin²θ + sin²φ ≤ 1)
  if (theta !== undefined && phi !== undefined) {
    const radTheta = (theta * Math.PI) / 180;
    const radPhi = (phi * Math.PI) / 180;
    const sinSqSum = Math.pow(Math.sin(radTheta), 2) + Math.pow(Math.sin(radPhi), 2);
    if (sinSqSum > 1.05 || theta + phi > 90) {
      return {
        type: 'SUM_ANGLES_EXCEED_90',
        title: 'Geometrically Incompatible Inclinations',
        message: `θ = ${theta}° and φ = ${phi}° cannot coexist for a straight line.`,
        educationalExplanation:
          'For any straight line in 3D space, the sum of the squares of direction cosines equals 1 (cos²α + cos²β + cos²γ = 1). This yields the fundamental engineering graphics theorem: sin²(θ) + sin²(φ) ≤ 1, which implies (θ + φ) ≤ 90° for a single quadrant. The projections of a line onto mutually perpendicular planes (HP and VP) cannot exceed the total 3D vector length.',
        suggestedFix: `Ensure θ + φ ≤ 90°. For example, try θ = 30° and φ = 40° (sum = 70°).`,
      };
    }
  }

  return null;
}

export function detectAmbiguities(params: Partial<ParsedParameters>): AmbiguityPrompt | null {
  if (
    params.true_length_mm === undefined &&
    params.front_view_length_mm === undefined &&
    params.top_view_length_mm === undefined
  ) {
    return {
      missingVar: 'True Length (TL)',
      promptText: 'I could not detect a line length (True Length, Front View, or Top View). Is the line length given in your problem?',
      suggestedDefault: 70,
    };
  }

  if (
    params.point_a_above_hp_mm === undefined &&
    params.point_a_in_front_vp_mm === undefined
  ) {
    return {
      missingVar: 'End A Coordinates',
      promptText: 'The location of starting point A relative to HP and VP was not detected. Standard reference: 25 mm above HP & 20 mm in front of VP.',
      suggestedDefault: 25,
    };
  }

  return null;
}

export function generateChallengeQuestions(blueprint: SolvedProblemBlueprint): ChallengeQuestion[] {
  const { calculated_answers, parsed_parameters } = blueprint;
  const theta = calculated_answers.theta_inclination_hp;
  const phi = calculated_answers.phi_inclination_vp;

  return [
    {
      stepIndex: 4, // Step 5: Draw TL in Front View
      question: `Given True Length TL = ${parsed_parameters.true_length_mm} mm and Top View TV = ${calculated_answers.top_view_length_mm} mm, what is the True Inclination θ with the Horizontal Plane (HP)?`,
      formulaHint: 'Formula: cos(θ) = TV / TL  ⇒  θ = arccos(TV / TL)',
      options: [
        { label: `${theta}°`, value: `${theta}`, isCorrect: true },
        { label: `${Math.round(theta + 12)}°`, value: `${Math.round(theta + 12)}`, isCorrect: false },
        { label: `${Math.max(10, Math.round(theta - 15))}°`, value: `${Math.max(10, Math.round(theta - 15))}`, isCorrect: false },
        { label: `${Math.round(90 - theta)}°`, value: `${Math.round(90 - theta)}`, isCorrect: false },
      ],
      explanation: `Correct! Because the Top View length equals the horizontal projection TL·cos(θ), we have cos(θ) = ${calculated_answers.top_view_length_mm} / ${parsed_parameters.true_length_mm} = ${(calculated_answers.top_view_length_mm / parsed_parameters.true_length_mm).toFixed(3)}, giving θ = ${theta}°.`,
    },
    {
      stepIndex: 6, // Step 7: Draw TL in Top View
      question: `Given True Length TL = ${parsed_parameters.true_length_mm} mm and Front View FV = ${calculated_answers.front_view_length_mm} mm, what is the True Inclination φ with the Vertical Plane (VP)?`,
      formulaHint: 'Formula: cos(φ) = FV / TL  ⇒  φ = arccos(FV / TL)',
      options: [
        { label: `${Math.round(phi + 10)}°`, value: `${Math.round(phi + 10)}`, isCorrect: false },
        { label: `${phi}°`, value: `${phi}`, isCorrect: true },
        { label: `${Math.max(15, Math.round(phi - 8))}°`, value: `${Math.max(15, Math.round(phi - 8))}`, isCorrect: false },
        { label: `${Math.round(90 - phi)}°`, value: `${Math.round(90 - phi)}`, isCorrect: false },
      ],
      explanation: `Correct! The Front View length equals the vertical projection TL·cos(φ), giving cos(φ) = ${calculated_answers.front_view_length_mm} / ${parsed_parameters.true_length_mm} = ${(calculated_answers.front_view_length_mm / parsed_parameters.true_length_mm).toFixed(3)}, hence φ = ${phi}°.`,
    },
    {
      stepIndex: 10, // Step 11: Final Views
      question: `Will the apparent Front View angle α be steeper or shallower than the true angle θ?`,
      formulaHint: 'Hint: Compare tan(α) = Δh / D vs tan(θ) = Δh / TV. (Since D < TV, D is smaller than TV).',
      options: [
        { label: `Steeper (α > θ) — Apparent angle is always greater`, value: 'steeper', isCorrect: true },
        { label: `Shallower (α < θ) — True angle is always greater`, value: 'shallower', isCorrect: false },
        { label: `Equal (α = θ) — Angles remain identical`, value: 'equal', isCorrect: false },
      ],
      explanation: `Correct! Because the projector distance D = √(FV² - Δh²) is strictly shorter than the full Top View length TV, the denominator shrinks: tan(α) = Δh / D > Δh / TV = tan(θ). Therefore, apparent angle α (${calculated_answers.alpha_apparent_elevation_deg}°) is always greater than true angle θ (${calculated_answers.theta_inclination_hp}°)!`,
    },
  ];
}

export function formatLength(mmValue: number | undefined, unit: UnitPreference = 'mm', includeUnit = true): string {
  if (mmValue === undefined) return '';
  if (unit === 'inches') {
    const inVal = Number((mmValue / 25.4).toFixed(2));
    return includeUnit ? `${inVal} in` : `${inVal}`;
  }
  const formatted = Number(mmValue.toFixed(1));
  return includeUnit ? `${formatted} mm` : `${formatted}`;
}

export function solveLineProjection(params: Partial<ParsedParameters>, unit: UnitPreference = 'mm'): SolvedProblemBlueprint {
  // Baseline defaults for missing values
  let TL = params.true_length_mm ?? 70;
  let h_A = params.point_a_above_hp_mm ?? 25;
  let d_A = params.point_a_in_front_vp_mm ?? 20;

  let theta = params.theta_inclination_hp;
  let phi = params.phi_inclination_vp;
  let FV = params.front_view_length_mm;
  let TV = params.top_view_length_mm;
  let h_B = params.point_b_above_hp_mm;
  let d_B = params.point_b_in_front_vp_mm;
  let D = params.distance_between_projectors_mm;

  // Resolve angles / lengths:
  // Case A: FV & TV given, but not theta / phi
  if (FV !== undefined && TV !== undefined && theta === undefined && phi === undefined) {
    // Check if TL is also given; if not, TL can be calculated if D or delta values given
    if (TL <= 0) {
      TL = 70;
    }
    // Clamping to avoid NaN if user typed TV > TL or FV > TL
    const clampedTV = Math.min(TV, TL * 0.98);
    const clampedFV = Math.min(FV, TL * 0.98);
    theta = (Math.acos(clampedTV / TL) * 180) / Math.PI;
    phi = (Math.acos(clampedFV / TL) * 180) / Math.PI;
  }
  // Case B: theta and phi given
  else if (theta !== undefined && phi !== undefined) {
    const radTheta = (theta * Math.PI) / 180;
    const radPhi = (phi * Math.PI) / 180;
    TV = TL * Math.cos(radTheta);
    FV = TL * Math.cos(radPhi);
  }
  // Case C: theta and FV given
  else if (theta !== undefined && FV !== undefined) {
    const radTheta = (theta * Math.PI) / 180;
    TV = TL * Math.cos(radTheta);
    const clampedFV = Math.min(FV, TL * 0.98);
    phi = (Math.acos(clampedFV / TL) * 180) / Math.PI;
  }
  // Case D: phi and TV given
  else if (phi !== undefined && TV !== undefined) {
    const radPhi = (phi * Math.PI) / 180;
    FV = TL * Math.cos(radPhi);
    const clampedTV = Math.min(TV, TL * 0.98);
    theta = (Math.acos(clampedTV / TL) * 180) / Math.PI;
  }
  // Case E: only theta given
  else if (theta !== undefined) {
    const radTheta = (theta * Math.PI) / 180;
    TV = TL * Math.cos(radTheta);
    phi = 30; // standard default
    const radPhi = (phi * Math.PI) / 180;
    FV = TL * Math.cos(radPhi);
  }
  // Case F: only phi given
  else if (phi !== undefined) {
    const radPhi = (phi * Math.PI) / 180;
    FV = TL * Math.cos(radPhi);
    theta = 40; // standard default
    const radTheta = (theta * Math.PI) / 180;
    TV = TL * Math.cos(radTheta);
  }
  // Case G: Default fallback (classic textbook values)
  else {
    theta = 35;
    phi = 45;
    const radTheta = (theta * Math.PI) / 180;
    const radPhi = (phi * Math.PI) / 180;
    TV = TL * Math.cos(radTheta);
    FV = TL * Math.cos(radPhi);
  }

  // Ensure validity (theta + phi < 90 in practical 3D space)
  if (theta + phi >= 90) {
    // Scale slightly to make geometrically valid in 3D
    const factor = 85 / (theta + phi);
    theta = Math.round(theta * factor * 10) / 10;
    phi = Math.round(phi * factor * 10) / 10;
    const radTheta = (theta * Math.PI) / 180;
    const radPhi = (phi * Math.PI) / 180;
    TV = TL * Math.cos(radTheta);
    FV = TL * Math.cos(radPhi);
  }

  const radTheta = (theta * Math.PI) / 180;
  const radPhi = (phi * Math.PI) / 180;

  const delta_h = TL * Math.sin(radTheta);
  const delta_d = TL * Math.sin(radPhi);

  if (h_B === undefined) {
    h_B = h_A + delta_h;
  }
  if (d_B === undefined) {
    d_B = d_A + delta_d;
  }

  // Distance between end projectors D:
  // D^2 = FV^2 - delta_h^2 = TV^2 - delta_d^2
  const calcD2 = Math.max(1, FV * FV - delta_h * delta_h);
  D = Math.sqrt(calcD2);

  // Apparent angles
  const alpha = (Math.atan2(delta_h, D) * 180) / Math.PI;
  const beta = (Math.atan2(delta_d, D) * 180) / Math.PI;

  const cond_hp_a: 'above' | 'below' | 'in_hp' = params.condition_hp_a ?? 'above';
  const cond_vp_a: 'in_front' | 'behind' | 'in_vp' = params.condition_vp_a ?? 'in_front';
  const cond_hp_b: 'above' | 'below' | 'in_hp' = params.condition_hp_b ?? cond_hp_a;
  const cond_vp_b: 'in_front' | 'behind' | 'in_vp' = params.condition_vp_b ?? cond_vp_a;
  const quadrant: QuadrantType = params.quadrant ?? determineQuadrant(cond_hp_a, cond_vp_a);

  const calculated: CalculatedAnswers = {
    theta_inclination_hp: Number(theta.toFixed(1)),
    phi_inclination_vp: Number(phi.toFixed(1)),
    front_view_length_mm: Number(FV.toFixed(1)),
    top_view_length_mm: Number(TV.toFixed(1)),
    distance_between_projectors_mm: Number(D.toFixed(1)),
    alpha_apparent_elevation_deg: Number(alpha.toFixed(1)),
    beta_apparent_plan_deg: Number(beta.toFixed(1)),
    point_b_above_hp_mm: Number(h_B.toFixed(1)),
    point_b_in_front_vp_mm: Number(d_B.toFixed(1)),
    delta_h_elevation_diff_mm: Number(delta_h.toFixed(1)),
    delta_d_plan_diff_mm: Number(delta_d.toFixed(1)),
  };

  const parsed: ParsedParameters = {
    true_length_mm: Math.round(TL),
    condition_hp_a: cond_hp_a,
    condition_vp_a: cond_vp_a,
    point_a_above_hp_mm: Math.round(h_A),
    point_a_in_front_vp_mm: Math.round(d_A),
    condition_hp_b: cond_hp_b,
    condition_vp_b: cond_vp_b,
    point_b_above_hp_mm: Math.round(h_B),
    point_b_in_front_vp_mm: Math.round(d_B),
    front_view_length_mm: Number(FV.toFixed(1)),
    top_view_length_mm: Number(TV.toFixed(1)),
    distance_between_projectors_mm: Number(D.toFixed(1)),
    theta_inclination_hp: Number(theta.toFixed(1)),
    phi_inclination_vp: Number(phi.toFixed(1)),
    quadrant,
  };

  // Formulate formulas used and detailed formula breakdown
  const formulas_used = [
    'TV = TL · cos(θ) ⟹ θ = arccos(TV / TL)',
    'FV = TL · cos(φ) ⟹ φ = arccos(FV / TL)',
    'Δh = TL · sin(θ) = h_B - h_A',
    'Δd = TL · sin(φ) = d_B - d_A',
    'D = √(FV² - Δh²) = √(TV² - Δd²)',
    'tan(α) = Δh / D ⟹ α = arctan(Δh / D)',
    'tan(β) = Δd / D ⟹ β = arctan(Δd / D)',
  ];

  const formula_breakdowns: FormulaBreakdown[] = [
    {
      label: 'True Inclination to HP (θ)',
      formula: 'θ = arccos(TV / TL)',
      substitution: `θ = arccos(${formatLength(calculated.top_view_length_mm, unit)} / ${formatLength(parsed.true_length_mm, unit)})`,
      result: `${calculated.theta_inclination_hp}°`,
      description: 'Angle of the true line AB relative to the Horizontal Plane (seen in Front View when line is made parallel to VP).',
    },
    {
      label: 'True Inclination to VP (φ)',
      formula: 'φ = arccos(FV / TL)',
      substitution: `φ = arccos(${formatLength(calculated.front_view_length_mm, unit)} / ${formatLength(parsed.true_length_mm, unit)})`,
      result: `${calculated.phi_inclination_vp}°`,
      description: 'Angle of the true line AB relative to the Vertical Plane (seen in Top View when line is made parallel to HP).',
    },
    {
      label: 'Elevation Difference (Δh)',
      formula: 'Δh = TL · sin(θ)',
      substitution: `Δh = ${formatLength(parsed.true_length_mm, unit)} · sin(${calculated.theta_inclination_hp}°)`,
      result: `${formatLength(calculated.delta_h_elevation_diff_mm, unit)}`,
      description: 'Vertical distance between the loci of end points A and B above HP (h_B - h_A).',
    },
    {
      label: 'Plan Difference (Δd)',
      formula: 'Δd = TL · sin(φ)',
      substitution: `Δd = ${formatLength(parsed.true_length_mm, unit)} · sin(${calculated.phi_inclination_vp}°)`,
      result: `${formatLength(calculated.delta_d_plan_diff_mm, unit)}`,
      description: 'Distance difference between the loci of end points A and B in front of VP (d_B - d_A).',
    },
    {
      label: 'Distance Between End Projectors (D)',
      formula: 'D = √(FV² - Δh²)',
      substitution: `D = √(${formatLength(calculated.front_view_length_mm, unit, false)}² - ${formatLength(calculated.delta_h_elevation_diff_mm, unit, false)}²)`,
      result: `${formatLength(calculated.distance_between_projectors_mm, unit)}`,
      description: 'Horizontal separation between the vertical projector of A (a-a\') and projector of B (b-b\').',
    },
    {
      label: 'Apparent Front View Angle (α)',
      formula: 'α = arctan(Δh / D)',
      substitution: `α = arctan(${formatLength(calculated.delta_h_elevation_diff_mm, unit, false)} / ${formatLength(calculated.distance_between_projectors_mm, unit, false)})`,
      result: `${calculated.alpha_apparent_elevation_deg}°`,
      description: 'Apparent inclination of the Front View line a\'b\' to the XY reference line.',
    },
    {
      label: 'Apparent Top View Angle (β)',
      formula: 'β = arctan(Δd / D)',
      substitution: `β = arctan(${formatLength(calculated.delta_d_plan_diff_mm, unit, false)} / ${formatLength(calculated.distance_between_projectors_mm, unit, false)})`,
      result: `${calculated.beta_apparent_plan_deg}°`,
      description: 'Apparent inclination of the Top View line ab to the XY reference line.',
    },
  ];

  // 12-Step sequential construction blueprint
  const step_by_step_solution: SolutionStep[] = [
    {
      step_number: 1,
      title: 'Draw Reference XY Line',
      instruction_text: 'Draw a horizontal reference line XY of convenient length. Label X on the left and Y on the right.',
      tool_to_activate: 'Draw Line',
      conceptual_hint: 'The XY line represents the ground line / intersection line between the Vertical Plane (VP) and Horizontal Plane (HP).',
      element_ids: ['xy_line', 'xy_labels'],
    },
    {
      step_number: 2,
      title: 'Plot End A Projector',
      instruction_text: `Draw a vertical projector perpendicular to XY. Mark elevation point a' at ${formatLength(h_A, unit)} above XY and plan point a at ${formatLength(d_A, unit)} below XY.`,
      tool_to_activate: 'Draw Line',
      conceptual_hint: 'In 1st angle projection, the Front View is projected on VP (above XY) and Top View is projected on HP (below XY after unfolding).',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points'],
    },
    {
      step_number: 3,
      title: 'Draw Locus Lines of End A',
      instruction_text: `Draw horizontal dashed lines through a' and a parallel to the XY line. Label them as "Locus of a'" and "Locus of a".`,
      tool_to_activate: 'Draw Line',
      conceptual_hint: 'Any point on the line having the same elevation as A will always lie on the locus of a\'.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a'],
    },
    {
      step_number: 4,
      title: 'Draw Locus Lines of End B',
      instruction_text: `Draw horizontal dashed lines at ${formatLength(calculated.point_b_above_hp_mm, unit)} above XY (Locus of b') and ${formatLength(calculated.point_b_in_front_vp_mm, unit)} below XY (Locus of b).`,
      tool_to_activate: 'Draw Line',
      conceptual_hint: 'Because Δh = TL·sin(θ) and Δd = TL·sin(φ), the locus of b\' is at h_A + Δh and locus of b is at d_A + Δd.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a', 'loci_b'],
    },
    {
      step_number: 5,
      title: 'Draw True Length in Front View (a\'b₁\')',
      instruction_text: `From a', draw a line of length TL = ${formatLength(parsed.true_length_mm, unit)} inclined at θ = ${calculated.theta_inclination_hp}° to the locus of a', cutting the locus of b' at b₁'.`,
      tool_to_activate: 'Draw Line',
      conceptual_hint: 'When a line is made parallel to VP, its Front View reveals its True Length and its true inclination θ to HP.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a', 'loci_b', 'tl_fv', 'theta_angle'],
    },
    {
      step_number: 6,
      title: 'Project b₁\' to Locus of a to find b₁',
      instruction_text: `From b₁', drop a vertical projector perpendicular to XY to cut the locus of a at point b₁. The length ab₁ represents the Top View length (${formatLength(calculated.top_view_length_mm, unit)}).`,
      tool_to_activate: 'Draw Line',
      conceptual_hint: 'Because line AB₁ is parallel to VP, its plan ab₁ is parallel to XY, and its length equals TL·cos(θ) = TV length.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a', 'loci_b', 'tl_fv', 'theta_angle', 'b1_projector', 'b1_point'],
    },
    {
      step_number: 7,
      title: 'Draw True Length in Top View (ab₂)',
      instruction_text: `From a, draw a line of length TL = ${formatLength(parsed.true_length_mm, unit)} inclined at φ = ${calculated.phi_inclination_vp}° to the locus of a, cutting the locus of b at b₂.`,
      tool_to_activate: 'Draw Line',
      conceptual_hint: 'When a line is made parallel to HP, its Top View reveals its True Length and its true inclination φ to VP.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a', 'loci_b', 'tl_fv', 'theta_angle', 'b1_projector', 'b1_point', 'tl_tv', 'phi_angle'],
    },
    {
      step_number: 8,
      title: 'Project b₂ to Locus of a\' to find b₂\'',
      instruction_text: `From b₂, draw a vertical projector perpendicular to XY up to the locus of a' to locate point b₂'. The length a'b₂' equals the Front View length (${formatLength(calculated.front_view_length_mm, unit)}).`,
      tool_to_activate: 'Draw Line',
      conceptual_hint: 'Because line AB₂ is parallel to HP, its elevation a\'b₂\' is parallel to XY, and its length equals TL·cos(φ) = FV length.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a', 'loci_b', 'tl_fv', 'theta_angle', 'b1_projector', 'b1_point', 'tl_tv', 'phi_angle', 'b2_projector', 'b2_point'],
    },
    {
      step_number: 9,
      title: 'Rotate Top View Arc to Locus of b',
      instruction_text: `With center a and radius ab₁ (= TV length ${formatLength(calculated.top_view_length_mm, unit)}), draw an arc intersecting the locus of b at point b.`,
      tool_to_activate: 'Draw Arc',
      conceptual_hint: 'Rotating ab₁ about a restores the line to its actual 3D orientation in space while preserving its plan length.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a', 'loci_b', 'tl_fv', 'theta_angle', 'b1_projector', 'b1_point', 'tl_tv', 'phi_angle', 'b2_projector', 'b2_point', 'arc_tv', 'point_b'],
    },
    {
      step_number: 10,
      title: 'Rotate Front View Arc to Locus of b\'',
      instruction_text: `With center a' and radius a'b₂' (= FV length ${formatLength(calculated.front_view_length_mm, unit)}), draw an arc intersecting the locus of b' at point b'.`,
      tool_to_activate: 'Draw Arc',
      conceptual_hint: 'Rotating a\'b₂\' about a\' restores the front view to its actual inclination α while preserving its elevation length.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a', 'loci_b', 'tl_fv', 'theta_angle', 'b1_projector', 'b1_point', 'tl_tv', 'phi_angle', 'b2_projector', 'b2_point', 'arc_tv', 'point_b', 'arc_fv', 'point_b_prime'],
    },
    {
      step_number: 11,
      title: 'Draw Final Front View and Top View',
      instruction_text: `Join a' to b' with a bold continuous line to form the Front View (apparent length = ${formatLength(calculated.front_view_length_mm, unit)}, α = ${calculated.alpha_apparent_elevation_deg}°). Join a to b with a bold continuous line to form the Top View (apparent length = ${formatLength(calculated.top_view_length_mm, unit)}, β = ${calculated.beta_apparent_plan_deg}°).`,
      tool_to_activate: 'Draw Line',
      conceptual_hint: 'Standard engineering drawing practice requires final apparent views to be drawn with continuous thick (0.5mm / HB pencil) lines.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a', 'loci_b', 'tl_fv', 'theta_angle', 'b1_projector', 'b1_point', 'tl_tv', 'phi_angle', 'b2_projector', 'b2_point', 'arc_tv', 'point_b', 'arc_fv', 'point_b_prime', 'final_fv', 'final_tv', 'apparent_angles'],
    },
    {
      step_number: 12,
      title: 'Verify End Projectors & Annotate Dimensions',
      instruction_text: `Draw the vertical end projector connecting b' and b. Notice that b' and b lie on the EXACT same vertical straight line (Distance between projectors D = ${formatLength(calculated.distance_between_projectors_mm, unit)}). Verify all dimensions with the virtual measurement tool.`,
      tool_to_activate: 'Annotate',
      conceptual_hint: 'This is the golden invariant of orthographic projection: the front view and top view of any point in space MUST lie on the same projector perpendicular to the XY line.',
      element_ids: ['xy_line', 'xy_labels', 'a_projector', 'a_points', 'loci_a', 'loci_b', 'tl_fv', 'theta_angle', 'b1_projector', 'b1_point', 'tl_tv', 'phi_angle', 'b2_projector', 'b2_point', 'arc_tv', 'point_b', 'arc_fv', 'point_b_prime', 'final_fv', 'final_tv', 'apparent_angles', 'end_projector', 'dimensions'],
    },
  ];

  // Calculate 2D SVG canvas coordinates with 4-Quadrant Cartesian Mapping Engine
  const canvasWidth = 860;
  const canvasHeight = 560;
  const originY = 280; // XY line position (Y = 0)

  // Determine scaling factor so drawing fills ~70% of canvas comfortably
  const maxSpanY = Math.max(h_B, d_B, 70);
  const maxSpanX = Math.max(TL, D + 30, 80);
  const scale = Math.min(2.8, Math.min(180 / maxSpanY, 320 / maxSpanX));

  const originX = 220; // X position of projector of A

  // Cartesian mapping to screen Y coordinates:
  // Above HP (+Y in Cartesian) -> screen Y is originY - h * scale
  // Below HP (-Y in Cartesian) -> screen Y is originY + h * scale
  const hp_sign_a = cond_hp_a === 'below' ? 1 : cond_hp_a === 'in_hp' ? 0 : -1;
  const hp_sign_b = cond_hp_b === 'below' ? 1 : cond_hp_b === 'in_hp' ? 0 : -1;

  // In front of VP (moves below XY after 90° clockwise fold) -> screen Y is originY + d * scale
  // Behind VP (moves above XY after 90° clockwise fold) -> screen Y is originY - d * scale
  const vp_sign_a = cond_vp_a === 'behind' ? -1 : cond_vp_a === 'in_vp' ? 0 : 1;
  const vp_sign_b = cond_vp_b === 'behind' ? -1 : cond_vp_b === 'in_vp' ? 0 : 1;

  const a_prime_x = originX;
  const a_prime_y = originY + hp_sign_a * h_A * scale;

  const a_x = originX;
  const a_y = originY + vp_sign_a * d_A * scale;

  const locus_a_prime_y = a_prime_y;
  const locus_b_prime_y = originY + hp_sign_b * h_B * scale;
  const locus_a_y = a_y;
  const locus_b_y = originY + vp_sign_b * d_B * scale;

  // b1_prime (True length in FV at angle theta to horizontal)
  // Length is TL * scale, angle is -theta
  const b1_prime_x = a_prime_x + TL * Math.cos(radTheta) * scale;
  const b1_prime_y = locus_b_prime_y;

  // b1 on locus of a (projected from b1_prime)
  const b1_x = b1_prime_x;
  const b1_y = locus_a_y;

  // b2 (True length in TV at angle phi to horizontal)
  const b2_x = a_x + TL * Math.cos(radPhi) * scale;
  const b2_y = locus_b_y;

  // b2_prime on locus of a_prime (projected from b2)
  const b2_prime_x = b2_x;
  const b2_prime_y = locus_a_prime_y;

  // Final points b_prime and b at distance D from originX
  const b_x = originX + D * scale;
  const b_y = locus_b_y;

  const b_prime_x = originX + D * scale;
  const b_prime_y = locus_b_prime_y;

  // Arcs
  // FV arc: center a_prime, radius = distance(a_prime, b2_prime) = FV * scale
  const fv_radius = FV * scale;
  const fv_start_angle = 0; // horizontal locus of a_prime
  const fv_end_angle = -alpha * (Math.PI / 180);

  // TV arc: center a, radius = distance(a, b1) = TV * scale
  const tv_radius = TV * scale;
  const tv_start_angle = 0; // horizontal locus of a
  const tv_end_angle = beta * (Math.PI / 180);

  const geometry2D: ProjectionGeometry2D = {
    canvasWidth,
    canvasHeight,
    scale,
    originX,
    originY,
    xyStart: { x: 50, y: originY },
    xyEnd: { x: canvasWidth - 50, y: originY },
    a_prime: { x: a_prime_x, y: a_prime_y },
    b_prime: { x: b_prime_x, y: b_prime_y },
    b1_prime: { x: b1_prime_x, y: b1_prime_y },
    b2_prime: { x: b2_prime_x, y: b2_prime_y },
    a: { x: a_x, y: a_y },
    b: { x: b_x, y: b_y },
    b1: { x: b1_x, y: b1_y },
    b2: { x: b2_x, y: b2_y },
    locus_a_prime_y,
    locus_b_prime_y,
    locus_a_y,
    locus_b_y,
    fv_arc: {
      center: { x: a_prime_x, y: a_prime_y },
      radius: fv_radius,
      startAngleRad: fv_start_angle,
      endAngleRad: fv_end_angle,
    },
    tv_arc: {
      center: { x: a_x, y: a_y },
      radius: tv_radius,
      startAngleRad: tv_start_angle,
      endAngleRad: tv_end_angle,
    },
  };

  // Cartesian coordinates for Plotting Engine Output
  const pt_A_x = 10;
  const isParallel = (theta === 0 && phi === 0);
  const pt_B_x = pt_A_x + (isParallel ? TL : D);

  const plotting_engine_config = generatePlottingEngineConfig(
    cond_hp_a,
    h_A,
    cond_vp_a,
    d_A,
    cond_hp_b,
    h_B,
    cond_vp_b,
    d_B,
    pt_A_x,
    pt_B_x,
    FV,
    TV,
    alpha,
    beta
  );

  // 3D coordinates for Three.js
  // Coordinate frame:
  // X = along reference ground line XY
  // Y = height above HP (vertical, positive upwards)
  // Z = distance in front of VP (depth, positive forwards)
  const z_sign_a = cond_vp_a === 'behind' ? -1 : 1;
  const z_sign_b = cond_vp_b === 'behind' ? -1 : 1;
  const y_sign_a = cond_hp_a === 'below' ? -1 : 1;
  const y_sign_b = cond_hp_b === 'below' ? -1 : 1;

  const space3D: SpacePoints3D = {
    A: [0, y_sign_a * h_A, z_sign_a * d_A],
    B: [D, y_sign_b * h_B, z_sign_b * d_B],
    a_prime: [0, y_sign_a * h_A, 0], // on VP (z=0)
    b_prime: [D, y_sign_b * h_B, 0],
    a: [0, 0, z_sign_a * d_A], // on HP (y=0)
    b: [D, 0, z_sign_b * d_B],
  };

  const problem_summary = `Line AB of True Length ${parsed.true_length_mm} mm in ${quadrant}. End A is ${parsed.point_a_above_hp_mm} mm ${cond_hp_a === 'below' ? 'below' : 'above'} HP and ${parsed.point_a_in_front_vp_mm} mm ${cond_vp_a === 'behind' ? 'behind' : 'in front of'} VP. FV is ${calculated.front_view_length_mm} mm and TV is ${calculated.top_view_length_mm} mm. True inclinations: θ = ${calculated.theta_inclination_hp}° to HP, φ = ${calculated.phi_inclination_vp}° to VP.`;

  return {
    parsed_parameters: parsed,
    calculated_answers: calculated,
    step_by_step_solution,
    formulas_used,
    formula_breakdowns,
    geometry2D,
    space3D,
    problem_summary,
    plotting_engine_config,
  };
}

export function parseNaturalLanguageText(text: string): Partial<ParsedParameters> {
  const params: Partial<ParsedParameters> = {};

  // Normalize common student abbreviations and typos
  const clean = text
    .replace(/\babve\b|\babv\b|\babov\b/gi, 'above')
    .replace(/\binfront\s*(?:of)?\s*vp\b|\binfrnt\s*(?:of)?\s*vp\b/gi, 'in front of VP')
    .replace(/\binfront\b|\binfrnt\b/gi, 'in front of')
    .replace(/\bh\.p\.?\b|\bhoriz(?:ontal)?\s*plane\b/gi, 'HP')
    .replace(/\bv\.p\.?\b|\bvert(?:ical)?\s*plane\b/gi, 'VP')
    .replace(/\bdeg(?:s|rees)?\b/gi, '°');

  // Detect Quadrants explicitly
  if (/\b(?:1st|first)\s*quadrant\b/i.test(clean)) {
    params.quadrant = 'First (I)';
    params.condition_hp_a = 'above';
    params.condition_vp_a = 'in_front';
  } else if (/\b(?:2nd|second)\s*quadrant\b/i.test(clean)) {
    params.quadrant = 'Second (II)';
    params.condition_hp_a = 'above';
    params.condition_vp_a = 'behind';
  } else if (/\b(?:3rd|third)\s*quadrant\b/i.test(clean)) {
    params.quadrant = 'Third (III)';
    params.condition_hp_a = 'below';
    params.condition_vp_a = 'behind';
  } else if (/\b(?:4th|fourth)\s*quadrant\b/i.test(clean)) {
    params.quadrant = 'Fourth (IV)';
    params.condition_hp_a = 'below';
    params.condition_vp_a = 'in_front';
  }

  // Detect HP condition keywords
  if (/\b(?:below|under)\s*(?:the\s*)?HP\b/i.test(clean)) {
    params.condition_hp_a = 'below';
  } else if (/\b(?:in|on|resting on)\s*(?:the\s*)?HP\b/i.test(clean)) {
    params.condition_hp_a = 'in_hp';
    params.point_a_above_hp_mm = 0;
  } else if (/\babove\s*(?:the\s*)?HP\b/i.test(clean)) {
    params.condition_hp_a = 'above';
  }

  // Detect VP condition keywords
  if (/\bbehind\s*(?:the\s*)?VP\b/i.test(clean)) {
    params.condition_vp_a = 'behind';
  } else if (/\b(?:in|on)\s*(?:the\s*)?VP\b/i.test(clean)) {
    params.condition_vp_a = 'in_vp';
    params.point_a_in_front_vp_mm = 0;
  } else if (/\bin\s*front\s*of\s*(?:the\s*)?VP\b/i.test(clean)) {
    params.condition_vp_a = 'in_front';
  }

  // Detect Parallel to Both Planes
  if (
    /\bparallel\s*to\s*(?:both\s*(?:the\s*)?)?HP\s*and\s*(?:the\s*)?VP\b/i.test(clean) ||
    /\bparallel\s*to\s*both\s*(?:the\s*)?planes\b/i.test(clean)
  ) {
    params.theta_inclination_hp = 0;
    params.phi_inclination_vp = 0;
  }

  // Extract true length (TL): e.g. "TL=60", "TL: 60", "60 mm long", "true length 80mm", "line AB of length 75 mm"
  const tlMatch = clean.match(/(?:TL|true\s*length|length)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i) ||
                  clean.match(/(?:line\s+[a-z]{1,3}\s+)?(\d+(?:\.\d+)?)\s*(?:mm|cm)?\s*long/i);
  if (tlMatch) {
    params.true_length_mm = parseFloat(tlMatch[1]);
  }

  // Extract End A above/below HP: e.g. "end A 30 mm above HP", "20 mm above HP", "15 mm below HP"
  const aHpMatch = clean.match(/(?:end\s+)?A\s*(?:is)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?\s*(?:above|below)\s*(?:the\s*)?HP/i) ||
                   clean.match(/(?:end\s+)?A\s*(?:above|below)\s*HP\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i) ||
                   clean.match(/(\d+(?:\.\d+)?)\s*(?:mm|cm)?\s*(?:above|below)\s*(?:the\s*)?HP/i) ||
                   clean.match(/(?:pt|point|end)?\s*A\s*[:=]?\s*.*?HP\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (aHpMatch) {
    params.point_a_above_hp_mm = parseFloat(aHpMatch[1]);
  }

  // Extract End A in front / behind VP: e.g. "20 mm in front of VP", "30 mm behind VP"
  const aVpMatch = clean.match(/(?:end\s+)?A\s*(?:is)?\s*.*?(\d+(?:\.\d+)?)\s*(?:mm|cm)?\s*(?:in\s*front\s*of|behind)\s*(?:the\s*)?VP/i) ||
                   clean.match(/(?:end\s+)?A\s*(?:in\s*front\s*(?:of)?|behind)\s*VP\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i) ||
                   clean.match(/(\d+(?:\.\d+)?)\s*(?:mm|cm)?\s*(?:in\s*front\s*of|behind)\s*(?:the\s*)?VP/i) ||
                   clean.match(/(?:pt|point|end)?\s*A\s*[:=]?\s*.*?VP\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (aVpMatch) {
    params.point_a_in_front_vp_mm = parseFloat(aVpMatch[1]);
  }

  // Extract FV length: e.g. "FV=50", "FV: 50", "front view 50 mm", "elevation is 55 mm"
  const fvMatch = clean.match(/(?:front\s*view|elevation|FV)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i) ||
                  clean.match(/FV\s*=\s*(\d+(?:\.\d+)?)/i);
  if (fvMatch) {
    params.front_view_length_mm = parseFloat(fvMatch[1]);
  }

  // Extract TV length: e.g. "TV=45", "TV: 45", "top view 45 mm", "plan is 48 mm"
  const tvMatch = clean.match(/(?:top\s*view|plan|TV)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i) ||
                  clean.match(/TV\s*=\s*(\d+(?:\.\d+)?)/i);
  if (tvMatch) {
    params.top_view_length_mm = parseFloat(tvMatch[1]);
  }

  // Extract theta (inclination to HP): e.g. "theta=30", "θ=30", "30° to HP", "inclined at 30° to HP"
  const thetaMatch = clean.match(/(?:theta|θ)\s*[:=]?\s*(\d+(?:\.\d+)?)/i) ||
                     clean.match(/(?:inclined\s*at\s*)?(\d+(?:\.\d+)?)\s*(?:°)?\s*(?:to|with)\s*(?:the\s*)?HP/i) ||
                     clean.match(/HP\s*(?:angle|inclination)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (thetaMatch) {
    params.theta_inclination_hp = parseFloat(thetaMatch[1]);
  }

  // Extract phi (inclination to VP): e.g. "phi=40", "φ=40", "40° to VP", "inclined at 40° to VP"
  const phiMatch = clean.match(/(?:phi|φ)\s*[:=]?\s*(\d+(?:\.\d+)?)/i) ||
                   clean.match(/(?:inclined\s*at\s*)?(\d+(?:\.\d+)?)\s*(?:°)?\s*(?:to|with)\s*(?:the\s*)?VP/i) ||
                   clean.match(/VP\s*(?:angle|inclination)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (phiMatch) {
    params.phi_inclination_vp = parseFloat(phiMatch[1]);
  }

  // Extract distance between projectors: e.g. "D=40", "distance between projectors 45 mm"
  const dMatch = clean.match(/(?:distance\s*between\s*(?:end\s*)?projectors|projector\s*distance|D)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i);
  if (dMatch) {
    params.distance_between_projectors_mm = parseFloat(dMatch[1]);
  }

  // Extract End B above HP / in front of VP if specified
  const bHpMatch = clean.match(/(?:end\s+)?B\s*(?:is)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?\s*above\s*(?:the\s*)?HP/i) ||
                   clean.match(/B\s*above\s*HP\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (bHpMatch) {
    params.point_b_above_hp_mm = parseFloat(bHpMatch[1]);
  }

  const bVpMatch = clean.match(/(?:end\s+)?B\s*(?:is)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?\s*in\s*front\s*of\s*(?:the\s*)?VP/i) ||
                   clean.match(/B\s*in\s*front\s*VP\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (bVpMatch) {
    params.point_b_in_front_vp_mm = parseFloat(bVpMatch[1]);
  }

  return params;
}

export const PRESET_PROBLEMS = [
  {
    id: 'parallel_both_planes_quad1',
    title: 'Line Parallel to Both Planes (AB = 40 mm)',
    badge: 'Core Engine Spec',
    question: 'A line AB 40 mm long is parallel to both the HP and VP. End A is 20 mm above HP and 30 mm in front of VP. Draw its front view and top view projections.',
    params: {
      true_length_mm: 40,
      point_a_above_hp_mm: 20,
      point_a_in_front_vp_mm: 30,
      condition_hp_a: 'above' as const,
      condition_vp_a: 'in_front' as const,
      theta_inclination_hp: 0,
      phi_inclination_vp: 0,
      quadrant: 'First (I)' as const,
    },
  },
  {
    id: 'quadrant_2_overlap',
    title: '2nd Quadrant Line (Overlapping Above XY)',
    badge: 'Quadrant II',
    question: 'A line AB 50 mm long has end A 25 mm above HP and 35 mm behind VP. It is inclined at 30° to HP and parallel to VP. Draw its projections and observe the overlapping views above the XY line.',
    params: {
      true_length_mm: 50,
      point_a_above_hp_mm: 25,
      point_a_in_front_vp_mm: 35,
      condition_hp_a: 'above' as const,
      condition_vp_a: 'behind' as const,
      theta_inclination_hp: 30,
      phi_inclination_vp: 0,
      quadrant: 'Second (II)' as const,
    },
  },
  {
    id: 'quadrant_3_standard',
    title: '3rd Quadrant Line (3rd Angle Standard)',
    badge: 'Quadrant III',
    question: 'A line AB 65 mm long has end A 30 mm below HP and 25 mm behind VP. The line is inclined at 35° to HP and 35° to VP. Draw its front and top view projections.',
    params: {
      true_length_mm: 65,
      point_a_above_hp_mm: 30,
      point_a_in_front_vp_mm: 25,
      condition_hp_a: 'below' as const,
      condition_vp_a: 'behind' as const,
      theta_inclination_hp: 35,
      phi_inclination_vp: 35,
      quadrant: 'Third (III)' as const,
    },
  },
  {
    id: 'quadrant_4_overlap',
    title: '4th Quadrant Line (Overlapping Below XY)',
    badge: 'Quadrant IV',
    question: 'A line AB 55 mm long has end A 20 mm below HP and 30 mm in front of VP. The line is inclined at 40° to HP and parallel to VP. Draw its projections and observe overlapping views below the XY line.',
    params: {
      true_length_mm: 55,
      point_a_above_hp_mm: 20,
      point_a_in_front_vp_mm: 30,
      condition_hp_a: 'below' as const,
      condition_vp_a: 'in_front' as const,
      theta_inclination_hp: 40,
      phi_inclination_vp: 0,
      quadrant: 'Fourth (IV)' as const,
    },
  },
  {
    id: 'sample_prompt',
    title: 'FV & TV Given (Standard Examination)',
    badge: 'Standard Examination',
    question: 'A line AB 60 mm long has its end A 30 mm above HP and 20 mm in front of VP. The front view is 50 mm long and the top view is 45 mm long. Draw its projections and find the true inclinations θ and φ with HP and VP.',
    params: {
      true_length_mm: 60,
      point_a_above_hp_mm: 30,
      point_a_in_front_vp_mm: 20,
      condition_hp_a: 'above' as const,
      condition_vp_a: 'in_front' as const,
      front_view_length_mm: 50,
      top_view_length_mm: 45,
      quadrant: 'First (I)' as const,
    },
  },
  {
    id: 'both_angles',
    title: 'True Inclinations θ & φ Given',
    badge: 'Classic Rotation',
    question: 'A straight line AB 80 mm long has its end A 20 mm above the HP and 25 mm in front of the VP. The line is inclined at 30° to the HP and 40° to the VP. Draw its front view and top view projections.',
    params: {
      true_length_mm: 80,
      point_a_above_hp_mm: 20,
      point_a_in_front_vp_mm: 25,
      condition_hp_a: 'above' as const,
      condition_vp_a: 'in_front' as const,
      theta_inclination_hp: 30,
      phi_inclination_vp: 40,
      quadrant: 'First (I)' as const,
    },
  },
];
