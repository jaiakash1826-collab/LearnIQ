import { CircuitConfig, CircuitCalculationResult } from '../types.js';

/**
 * Deterministic Physics Calculation Engine for Class 10 Electricity.
 *
 * Implements fundamental laws:
 * - Ohm's law: V = I * R => I = V / R, R = V / I
 * - Series circuits: R_eq = R1 + R2 + ... + Rn; I is constant; V_total = sum(V_i)
 * - Parallel circuits: 1 / R_eq = 1/R1 + 1/R2 + ... + 1/Rn; V is constant; I_total = sum(I_i)
 * - Electric power: P = V * I = I^2 * R = V^2 / R
 * - Heating effect: H = I^2 * R * t
 *
 * Guaranteed to pass verification benchmarks:
 * Case 1: V = 12V, R = 4Ω => I = 3A
 * Case 2: Series 2Ω + 4Ω => R_total = 6Ω
 * Case 3: Parallel 6Ω || 6Ω => R_total = 3Ω
 * Case 4: V = 12V, I = 2A => P = 24W
 */

export function calculateCircuit(config: CircuitConfig): CircuitCalculationResult {
  const assumptions = [
    'Ideal battery (0 internal resistance)',
    'Ideal copper connecting wires (0 resistance)',
    'Ideal ammeter in series (0 resistance)',
    'Ideal voltmeter in parallel (infinite internal impedance)',
    'Bulb modeled as fixed ohmic filament with brightness proportional to power (P = I²R)',
  ];

  const voltage = Math.max(0, Number(config.voltage) || 0);

  // If voltage is 0, no current flows
  if (voltage === 0) {
    return {
      voltage: 0,
      totalResistance: calculateNominalResistance(config),
      totalCurrent: 0,
      totalPower: 0,
      isCircuitClosed: isMainCircuitClosed(config),
      branchResults: config.resistors.map((r) => ({
        id: r.id,
        resistance: r.resistance,
        voltageDrop: 0,
        current: 0,
        power: 0,
        bulbBrightnessPct: 0,
      })),
      assumptions,
      explanation: 'No potential difference applied (V = 0V), so no electric current flows.',
    };
  }

  // Check main switch state
  const mainSwitch = config.switches.find((s) => s.controlsBranch === undefined || s.controlsBranch === null);
  if (mainSwitch && mainSwitch.isOpen) {
    return {
      voltage,
      totalResistance: calculateNominalResistance(config),
      totalCurrent: 0,
      totalPower: 0,
      isCircuitClosed: false,
      branchResults: config.resistors.map((r) => ({
        id: r.id,
        resistance: r.resistance,
        voltageDrop: 0,
        current: 0,
        power: 0,
        bulbBrightnessPct: 0,
      })),
      assumptions,
      explanation: 'Circuit is open at the key switch. Current is 0 A everywhere.',
    };
  }

  if (config.type === 'single') {
    const r1 = config.resistors[0]?.resistance ?? 4;
    const safeR = Math.max(0.001, r1);
    const current = voltage / safeR;
    const power = voltage * current;

    return {
      voltage,
      totalResistance: round(safeR, 3),
      totalCurrent: round(current, 3),
      totalPower: round(power, 3),
      isCircuitClosed: true,
      branchResults: [
        {
          id: config.resistors[0]?.id || 'r1',
          resistance: safeR,
          voltageDrop: round(voltage, 3),
          current: round(current, 3),
          power: round(power, 3),
          bulbBrightnessPct: Math.min(100, round((power / 60) * 100, 1)),
        },
      ],
      assumptions,
      explanation: `Ohm's Law: I = V / R = ${voltage}V / ${safeR}Ω = ${round(current, 3)}A. Power P = V × I = ${round(power, 3)}W.`,
    };
  }

  if (config.type === 'series') {
    // In series, all resistors add up directly: R_eq = R1 + R2 + ...
    const resistances = config.resistors.map((r) => Math.max(0.001, r.resistance));
    const totalResistance = resistances.reduce((acc, curr) => acc + curr, 0);
    const totalCurrent = voltage / totalResistance;
    const totalPower = voltage * totalCurrent;

    const branchResults = config.resistors.map((r) => {
      const vDrop = totalCurrent * r.resistance;
      const power = totalCurrent * totalCurrent * r.resistance;
      return {
        id: r.id,
        resistance: r.resistance,
        voltageDrop: round(vDrop, 3),
        current: round(totalCurrent, 3),
        power: round(power, 3),
        bulbBrightnessPct: Math.min(100, round((power / 40) * 100, 1)),
      };
    });

    return {
      voltage,
      totalResistance: round(totalResistance, 3),
      totalCurrent: round(totalCurrent, 3),
      totalPower: round(totalPower, 3),
      isCircuitClosed: true,
      branchResults,
      assumptions,
      explanation: `Series combination: Total Resistance Req = ${resistances.join(' + ')} = ${round(totalResistance, 3)}Ω. Current through all components is identical: I = ${voltage}V / ${round(totalResistance, 3)}Ω = ${round(totalCurrent, 3)}A.`,
    };
  }

  if (config.type === 'parallel') {
    // In parallel, 1 / Req = sum(1 / Ri) for all closed branches
    let totalConductance = 0;
    const activeBranches: { index: number; r: number; id: string }[] = [];

    config.resistors.forEach((res, idx) => {
      // Check if branch switch is open
      const branchSwitch = config.switches.find((s) => s.controlsBranch === idx);
      const isBranchOpen = branchSwitch ? branchSwitch.isOpen : false;

      if (!isBranchOpen) {
        const safeR = Math.max(0.001, res.resistance);
        totalConductance += 1 / safeR;
        activeBranches.push({ index: idx, r: safeR, id: res.id });
      }
    });

    if (totalConductance === 0) {
      return {
        voltage,
        totalResistance: Infinity,
        totalCurrent: 0,
        totalPower: 0,
        isCircuitClosed: false,
        branchResults: config.resistors.map((r) => ({
          id: r.id,
          resistance: r.resistance,
          voltageDrop: 0,
          current: 0,
          power: 0,
          bulbBrightnessPct: 0,
        })),
        assumptions,
        explanation: 'All parallel branches are switched off. Equivalent resistance is infinite and total current is 0 A.',
      };
    }

    const totalResistance = 1 / totalConductance;
    const totalCurrent = voltage / totalResistance;
    const totalPower = voltage * totalCurrent;

    const branchResults = config.resistors.map((r, idx) => {
      const branchSwitch = config.switches.find((s) => s.controlsBranch === idx);
      const isBranchOpen = branchSwitch ? branchSwitch.isOpen : false;

      if (isBranchOpen) {
        return {
          id: r.id,
          resistance: r.resistance,
          voltageDrop: 0,
          current: 0,
          power: 0,
          bulbBrightnessPct: 0,
        };
      }

      const safeR = Math.max(0.001, r.resistance);
      const branchCurrent = voltage / safeR;
      const branchPower = voltage * branchCurrent;

      return {
        id: r.id,
        resistance: r.resistance,
        voltageDrop: round(voltage, 3), // full voltage across each parallel branch
        current: round(branchCurrent, 3),
        power: round(branchPower, 3),
        bulbBrightnessPct: Math.min(100, round((branchPower / 60) * 100, 1)),
      };
    });

    return {
      voltage,
      totalResistance: round(totalResistance, 3),
      totalCurrent: round(totalCurrent, 3),
      totalPower: round(totalPower, 3),
      isCircuitClosed: true,
      branchResults,
      assumptions,
      explanation: `Parallel combination: 1/Req = Σ(1/R) => Req = ${round(totalResistance, 3)}Ω. Each closed branch receives the full ${voltage}V. Total current drawn = ${round(totalCurrent, 3)}A. Notice that Req is lower than any individual branch resistance!`,
    };
  }

  // Combination circuit (e.g., R1 in series with (R2 || R3))
  const r1 = Math.max(0.001, config.resistors[0]?.resistance || 2);
  const r2 = Math.max(0.001, config.resistors[1]?.resistance || 4);
  const r3 = Math.max(0.001, config.resistors[2]?.resistance || 4);

  // Parallel cluster of R2 and R3
  const rParallel = (r2 * r3) / (r2 + r3);
  const totalResistance = r1 + rParallel;
  const totalCurrent = voltage / totalResistance;
  const v1 = totalCurrent * r1;
  const vParallel = voltage - v1;
  const i2 = vParallel / r2;
  const i3 = vParallel / r3;
  const totalPower = voltage * totalCurrent;

  return {
    voltage,
    totalResistance: round(totalResistance, 3),
    totalCurrent: round(totalCurrent, 3),
    totalPower: round(totalPower, 3),
    isCircuitClosed: true,
    branchResults: [
      {
        id: config.resistors[0]?.id || 'r1',
        resistance: r1,
        voltageDrop: round(v1, 3),
        current: round(totalCurrent, 3),
        power: round(v1 * totalCurrent, 3),
        bulbBrightnessPct: Math.min(100, round(((v1 * totalCurrent) / 40) * 100, 1)),
      },
      {
        id: config.resistors[1]?.id || 'r2',
        resistance: r2,
        voltageDrop: round(vParallel, 3),
        current: round(i2, 3),
        power: round(vParallel * i2, 3),
        bulbBrightnessPct: Math.min(100, round(((vParallel * i2) / 40) * 100, 1)),
      },
      {
        id: config.resistors[2]?.id || 'r3',
        resistance: r3,
        voltageDrop: round(vParallel, 3),
        current: round(i3, 3),
        power: round(vParallel * i3, 3),
        bulbBrightnessPct: Math.min(100, round(((vParallel * i3) / 40) * 100, 1)),
      },
    ],
    assumptions,
    explanation: `Combination circuit: Parallel branch equivalent Rp = (${r2}×${r3})/(${r2}+${r3}) = ${round(rParallel, 3)}Ω. Total resistance Req = R1 + Rp = ${r1} + ${round(rParallel, 3)} = ${round(totalResistance, 3)}Ω. Total current I = ${round(totalCurrent, 3)}A.`,
  };
}

function calculateNominalResistance(config: CircuitConfig): number {
  if (config.type === 'single') return config.resistors[0]?.resistance || 4;
  if (config.type === 'series') return config.resistors.reduce((sum, r) => sum + r.resistance, 0);
  if (config.type === 'parallel') {
    const inv = config.resistors.reduce((sum, r) => sum + 1 / (r.resistance || 1), 0);
    return round(1 / inv, 3);
  }
  return 6;
}

function isMainCircuitClosed(config: CircuitConfig): boolean {
  const mainSwitch = config.switches.find((s) => s.controlsBranch === undefined || s.controlsBranch === null);
  return mainSwitch ? !mainSwitch.isOpen : true;
}

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

// Self-test suite matching Section 25 verification criteria
export function verifyPhysicsBenchmarks(): {
  case1: boolean;
  case2: boolean;
  case3: boolean;
  case4: boolean;
  allPassed: boolean;
  details: string[];
} {
  const details: string[] = [];

  // Case 1: V = 12 V, R = 4 Ω => Expected current = 3 A
  const c1 = calculateCircuit({
    type: 'single',
    name: 'Ohm Law Test',
    description: '',
    voltage: 12,
    resistors: [{ id: 'r1', name: 'R1', resistance: 4 }],
    switches: [{ id: 's1', name: 'Key', isOpen: false }],
    meters: { ammeterConnected: true, voltmeterConnected: true },
  });
  const pass1 = Math.abs(c1.totalCurrent - 3) < 0.001;
  details.push(`Case 1 (12V, 4Ω => 3A): ${pass1 ? 'PASSED' : 'FAILED'} (Got ${c1.totalCurrent}A)`);

  // Case 2: Two resistors of 2 Ω and 4 Ω in series => Req = 6 Ω
  const c2 = calculateCircuit({
    type: 'series',
    name: 'Series Test',
    description: '',
    voltage: 12,
    resistors: [
      { id: 'r1', name: 'R1', resistance: 2 },
      { id: 'r2', name: 'R2', resistance: 4 },
    ],
    switches: [{ id: 's1', name: 'Key', isOpen: false }],
    meters: { ammeterConnected: true, voltmeterConnected: true },
  });
  const pass2 = Math.abs(c2.totalResistance - 6) < 0.001;
  details.push(`Case 2 (2Ω + 4Ω in series => Req 6Ω): ${pass2 ? 'PASSED' : 'FAILED'} (Got ${c2.totalResistance}Ω)`);

  // Case 3: Two resistors of 6 Ω and 6 Ω in parallel => Req = 3 Ω
  const c3 = calculateCircuit({
    type: 'parallel',
    name: 'Parallel Test',
    description: '',
    voltage: 12,
    resistors: [
      { id: 'r1', name: 'R1', resistance: 6 },
      { id: 'r2', name: 'R2', resistance: 6 },
    ],
    switches: [{ id: 's1', name: 'Key', isOpen: false }],
    meters: { ammeterConnected: true, voltmeterConnected: true },
  });
  const pass3 = Math.abs(c3.totalResistance - 3) < 0.001;
  details.push(`Case 3 (6Ω || 6Ω in parallel => Req 3Ω): ${pass3 ? 'PASSED' : 'FAILED'} (Got ${c3.totalResistance}Ω)`);

  // Case 4: V = 12 V, I = 2 A => Expected power = 24 W (R = 6Ω)
  const c4 = calculateCircuit({
    type: 'single',
    name: 'Power Test',
    description: '',
    voltage: 12,
    resistors: [{ id: 'r1', name: 'R1', resistance: 6 }],
    switches: [{ id: 's1', name: 'Key', isOpen: false }],
    meters: { ammeterConnected: true, voltmeterConnected: true },
  });
  const pass4 = Math.abs(c4.totalPower - 24) < 0.001;
  details.push(`Case 4 (12V, 2A => P 24W): ${pass4 ? 'PASSED' : 'FAILED'} (Got ${c4.totalPower}W)`);

  return {
    case1: pass1,
    case2: pass2,
    case3: pass3,
    case4: pass4,
    allPassed: pass1 && pass2 && pass3 && pass4,
    details,
  };
}
