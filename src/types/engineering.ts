export type DrawingTool = 'Draw Line' | 'Draw Arc' | 'Measure Distance / Angle' | 'Annotate';
export type UnitPreference = 'mm' | 'inches';
export type SheetSize = 'A3' | 'A4';
export type ThemeMode = 'blueprint' | 'draftboard';
export type ExportStyle = 'clean_vector' | 'hand_drawn';

export interface TitleBlockInfo {
  studentName?: string;
  rollNumber?: string;
  institution?: string;
  includePersonalInfo?: boolean;
  title: string;
  scale: string;
  projectionMethod: '1st Angle' | '3rd Angle';
  date: string;
  sheetNo: string;
}

export interface ImpossibilityError {
  type: 'FV_EXCEEDS_TL' | 'TV_EXCEEDS_TL' | 'SUM_ANGLES_EXCEED_90' | 'NEGATIVE_VALUES';
  title: string;
  message: string;
  educationalExplanation: string;
  suggestedFix: string;
}

export interface AmbiguityPrompt {
  missingVar: string;
  promptText: string;
  suggestedDefault: number;
}

export interface ChallengeQuestion {
  stepIndex: number;
  question: string;
  formulaHint: string;
  options: { label: string; value: string; isCorrect: boolean }[];
  explanation: string;
}

export type QuadrantType = 'First (I)' | 'Second (II)' | 'Third (III)' | 'Fourth (IV)' | 'Mixed / Multi-Quadrant';

export interface CalculatedPointView {
  x: number;
  y: number;
  label: string;
}

export interface QuadrantPointParserItem {
  condition_hp: 'above' | 'below' | 'in_hp';
  distance_hp_mm: number;
  condition_vp: 'in_front' | 'behind' | 'in_vp';
  distance_vp_mm: number;
  calculated_coordinates: {
    front_view_a_prime?: CalculatedPointView;
    top_view_a?: CalculatedPointView;
    front_view_b_prime?: CalculatedPointView;
    top_view_b?: CalculatedPointView;
    [key: string]: CalculatedPointView | undefined;
  };
}

export interface LineViewRendering {
  start_point: string;
  end_point: string;
  length_mm: number;
  angle_with_xy: number;
}

export interface ProjectorLineRendering {
  type: string;
  start: string;
  end: string;
}

export interface PlottingEngineConfig {
  reference_axis: {
    id: string;
    type: string;
    y_coordinate: number;
  };
  quadrant_parser: {
    point_A: QuadrantPointParserItem;
    point_B: QuadrantPointParserItem;
  };
  line_rendering: {
    front_view_line: LineViewRendering;
    top_view_line: LineViewRendering;
    projectors: ProjectorLineRendering[];
  };
}

export interface ParsedParameters {
  true_length_mm: number;
  condition_hp_a?: 'above' | 'below' | 'in_hp';
  condition_vp_a?: 'in_front' | 'behind' | 'in_vp';
  point_a_above_hp_mm: number;
  point_a_in_front_vp_mm: number;
  condition_hp_b?: 'above' | 'below' | 'in_hp';
  condition_vp_b?: 'in_front' | 'behind' | 'in_vp';
  point_b_above_hp_mm?: number;
  point_b_in_front_vp_mm?: number;
  front_view_length_mm?: number;
  top_view_length_mm?: number;
  distance_between_projectors_mm?: number;
  theta_inclination_hp?: number; // True angle to HP in degrees
  phi_inclination_vp?: number; // True angle to VP in degrees
  quadrant?: QuadrantType;
}

export interface CalculatedAnswers {
  theta_inclination_hp: number; // degrees
  phi_inclination_vp: number; // degrees
  front_view_length_mm: number;
  top_view_length_mm: number;
  distance_between_projectors_mm: number;
  alpha_apparent_elevation_deg: number; // Apparent angle in FV
  beta_apparent_plan_deg: number; // Apparent angle in TV
  point_b_above_hp_mm: number;
  point_b_in_front_vp_mm: number;
  delta_h_elevation_diff_mm: number;
  delta_d_plan_diff_mm: number;
}

export interface SolutionStep {
  step_number: number;
  title: string;
  instruction_text: string;
  tool_to_activate: DrawingTool;
  conceptual_hint: string;
  element_ids: string[];
}

export interface FormulaBreakdown {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  description: string;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface ProjectionGeometry2D {
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  originX: number;
  originY: number; // Y coordinate of XY reference line
  xyStart: Point2D;
  xyEnd: Point2D;
  
  // Front View points (above XY, so y < originY in screen coordinates)
  a_prime: Point2D;
  b_prime: Point2D; // Final Front View end point
  b1_prime: Point2D; // True length end point in Front View (angle theta)
  b2_prime: Point2D; // Apparent elevation when line is parallel to HP
  
  // Top View points (below XY, so y > originY in screen coordinates)
  a: Point2D;
  b: Point2D; // Final Top View end point
  b1: Point2D; // Apparent plan when line is parallel to VP
  b2: Point2D; // True length end point in Top View (angle phi)
  
  // Loci Y coordinates (in screen space)
  locus_a_prime_y: number;
  locus_b_prime_y: number;
  locus_a_y: number;
  locus_b_y: number;
  
  // Arcs
  fv_arc: {
    center: Point2D;
    radius: number;
    startAngleRad: number;
    endAngleRad: number;
  };
  tv_arc: {
    center: Point2D;
    radius: number;
    startAngleRad: number;
    endAngleRad: number;
  };
}

export interface SpacePoints3D {
  A: [number, number, number]; // [x, y (height above HP), z (depth in front of VP)]
  B: [number, number, number];
  a_prime: [number, number, number]; // Projected on VP (z=0)
  b_prime: [number, number, number];
  a: [number, number, number]; // Projected on HP (y=0)
  b: [number, number, number];
}

export interface SolvedProblemBlueprint {
  parsed_parameters: ParsedParameters;
  calculated_answers: CalculatedAnswers;
  step_by_step_solution: SolutionStep[];
  formulas_used: string[];
  formula_breakdowns: FormulaBreakdown[];
  geometry2D: ProjectionGeometry2D;
  space3D: SpacePoints3D;
  problem_summary: string;
  plotting_engine_config?: PlottingEngineConfig;
}
