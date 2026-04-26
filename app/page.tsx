"use client";

import { useState } from "react";

// ❌ [SOLID - SRP] Component này làm quá nhiều việc: máy tính thông thường + giải PT bậc 2 + giải PT bậc 3
//    + quản lý flow mode + validate input + format kết quả — tất cả trong 1 component duy nhất.

// ❌ [SOLID - OCP] Muốn thêm PT bậc 4 phải sửa trực tiếp vào handleOK và solveEquation,
//    không có cơ chế mở rộng nào.

type SolverStep = "idle" | "select" | "input" | "result";

const DEGREES = [2, 3];

// ❌ [Khó mở rộng] Muốn thêm bậc 4 phải thêm thủ công vào đây và vào solveEquation
const COEFF_LABELS: Record<number, string[]> = {
  2: ["a", "b", "c"],
  3: ["a", "b", "c", "d"],
};

const DEGREE_LABELS: Record<number, string> = {
  2: "PT bậc 2: ax²+bx+c=0",
  3: "PT bậc 3: ax³+bx²+cx+d=0",
};

export default function Home() {
  // --- Máy tính thường ---
  const [display, setDisplay] = useState("0");
  const [operator, setOperator] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  // --- Solver state ---
  const [solverStep, setSolverStep] = useState<SolverStep>("idle");
  const [degreeIndex, setDegreeIndex] = useState(0);
  const [coefficients, setCoefficients] = useState<number[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [resultIndex, setResultIndex] = useState(0);

  const inSolver = solverStep !== "idle";

  // ❌ [SRP + Function quá dài] Hàm này làm 3 việc: giải bậc 2, giải bậc 3, format kết quả.
  //    Nên tách thành solveQuadratic(), solveCubic(), formatRoots().
  const solveEquation = (degree: number, coeffs: number[]): string[] => {
    const list: string[] = [];

    if (degree === 2) {
      const [a, b, c] = coeffs;

      // ❌ [Lặp code] Validate a === 0 lặp lại ở cả nhánh bậc 2 và bậc 3 bên dưới
      if (a === 0) return ["Hệ số a ≠ 0"];

      const delta = b * b - 4 * a * c;
      if (delta > 0) {
        const x1 = (-b + Math.sqrt(delta)) / (2 * a);
        const x2 = (-b - Math.sqrt(delta)) / (2 * a);
        // ❌ [Lặp code] Format "x = ..." lặp lại ở nhiều chỗ, nên tách formatRoot(label, value)
        list.push(`x1 = ${x1.toFixed(4)}`);
        list.push(`x2 = ${x2.toFixed(4)}`);
      } else if (delta === 0) {
        list.push(`x1 = x2 = ${(-b / (2 * a)).toFixed(4)}`);
      } else {
        const re = (-b / (2 * a)).toFixed(4);
        const im = (Math.sqrt(-delta) / (2 * a)).toFixed(4);
        // ❌ [Lặp code] Format số phức lặp lại ở bậc 3 bên dưới
        list.push(`x1 = ${re} + ${im}i`);
        list.push(`x2 = ${re} - ${im}i`);
      }
    }

    if (degree === 3) {
      const [a, b, c, d] = coeffs;

      // ❌ [Lặp code] Validate a === 0 lặp lại lần 2
      if (a === 0) return ["Hệ số a ≠ 0"];

      const p = (3 * a * c - b * b) / (3 * a * a);
      const q =
        (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
      const disc = -(4 * p * p * p + 27 * q * q);

      if (disc > 0) {
        const m = 2 * Math.sqrt(-p / 3);
        const theta = Math.acos((3 * q) / (p * m)) / 3;
        const offset = b / (3 * a);
        // ❌ [Lặp code] Format x = ... lặp lại lần 3, 4, 5
        list.push(`x1 = ${(m * Math.cos(theta) - offset).toFixed(4)}`);
        list.push(
          `x2 = ${(m * Math.cos(theta - (2 * Math.PI) / 3) - offset).toFixed(4)}`,
        );
        list.push(
          `x3 = ${(m * Math.cos(theta - (4 * Math.PI) / 3) - offset).toFixed(4)}`,
        );
      } else {
        const sqrtD = Math.sqrt(-disc / 108);
        const u = Math.cbrt(-q / 2 + sqrtD);
        const v = Math.cbrt(-q / 2 - sqrtD);
        const re = (-(u + v) / 2 - b / (3 * a)).toFixed(4);
        const im = (((u - v) * Math.sqrt(3)) / 2).toFixed(4);
        // ❌ [Lặp code] Format số phức lặp lại lần 2
        list.push(`x1 = ${(u + v - b / (3 * a)).toFixed(4)}`);
        list.push(`x2 = ${re} + ${im}i`);
        list.push(`x3 = ${re} - ${im}i`);
      }
    }

    return list;
  };

  // --- Nút Mode ---
  const handleMode = () => {
    if (solverStep === "idle") {
      // Vào mode solver, hiển thị PT đầu tiên
      setSolverStep("select");
      setDegreeIndex(0);
      setDisplay(DEGREE_LABELS[DEGREES[0]]);
      return;
    }
    if (solverStep === "select") {
      const nextIndex = degreeIndex + 1;
      if (nextIndex >= DEGREES.length) {
        // Hết PT → thoát về máy tính
        resetSolver();
      } else {
        setDegreeIndex(nextIndex);
        setDisplay(DEGREE_LABELS[DEGREES[nextIndex]]);
      }
      return;
    }
    // Đang nhập hoặc xem kết quả → Mode thoát về máy tính
    resetSolver();
  };

  // ❌ [SRP + Function quá dài] handleOK xử lý cả: xác nhận chọn PT, validate + thu thập hệ số,
  //    gọi solveEquation, điều hướng kết quả — nên tách nhỏ hơn.
  const handleOK = () => {
    if (solverStep === "select") {
      const degree = DEGREES[degreeIndex];
      setCoefficients([]);
      setSolverStep("input");
      setDisplay(`Nhập ${COEFF_LABELS[degree][0]}:`);
      return;
    }

    if (solverStep === "input") {
      const degree = DEGREES[degreeIndex];
      const value = parseFloat(display);

      // ❌ [Lặp code] isNaN check lặp lại mỗi lần nhập hệ số thay vì tách validateCoeff()
      if (isNaN(value)) {
        setDisplay("Nhập số hợp lệ!");
        return;
      }

      const newCoeffs = [...coefficients, value];
      setCoefficients(newCoeffs);

      const totalNeeded = COEFF_LABELS[degree].length;

      if (newCoeffs.length < totalNeeded) {
        // ❌ [Lặp code] isNaN check lặp lại mỗi lần nhập hệ số thay vì tách validateCoeff()
        setDisplay(`Nhập ${COEFF_LABELS[degree][newCoeffs.length]}:`);
        setWaitingForNext(true);
        return;
      }

      // Đủ hệ số → giải
      // ❌ [Lặp code] degree được lấy lại từ DEGREES[degreeIndex] thay vì dùng biến đã có
      const res = solveEquation(DEGREES[degreeIndex], newCoeffs);
      setResults(res);
      setResultIndex(0);
      setSolverStep("result");
      setDisplay(res[0]);
      return;
    }

    if (solverStep === "result") {
      const nextIdx = resultIndex + 1;
      if (nextIdx < results.length) {
        setResultIndex(nextIdx);
        setDisplay(results[nextIdx]);
      } else {
        // Hết nghiệm → về máy tính
        resetSolver();
      }
    }
  };

  const resetSolver = () => {
    setSolverStep("idle");
    setCoefficients([]);
    setResults([]);
    setResultIndex(0);
    setDegreeIndex(0);
    setDisplay("0");
    setWaitingForNext(false);
  };

  // --- Máy tính thường ---
  const appendDigit = (digit: string) => {
    if (inSolver && solverStep !== "input") return;
    if (waitingForNext) {
      setDisplay(digit);
      setWaitingForNext(false);
      return;
    }
    setDisplay((cur) =>
      cur === "0" || cur.endsWith(":") ? digit : cur + digit,
    );
  };

  const computeResult = (prev: number, next: number, op: string) => {
    if (op === "+") return prev + next;
    if (op === "-") return prev - next;
    if (op === "×") return prev * next;
    if (op === "÷") return prev / next; //test edge cases //next !== 0 ? prev / next : NaN;
    return next;
  };

  const handleOperator = (nextOperator: string) => {
    if (inSolver) return;
    const nextValue = Number(display);
    if (previousValue == null) {
      setPreviousValue(nextValue);
    } else if (operator) {
      const result = computeResult(previousValue, nextValue, operator);
      setPreviousValue(result);
      setDisplay(String(result));
    }
    setOperator(nextOperator);
    setWaitingForNext(true);
  };

  const handleEqual = () => {
    if (inSolver) return;
    if (operator == null || previousValue == null) return;
    const result = computeResult(previousValue, Number(display), operator);
    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNext(true);
  };

  const handleClear = () => {
    if (inSolver) {
      resetSolver();
      return;
    }
    setDisplay("0");
    setOperator(null);
    setPreviousValue(null);
    setWaitingForNext(false);
  };

  // Hint hiển thị dưới màn hình
  const hint =
    solverStep === "select"
      ? "Mode: PT tiếp theo / OK: Xác nhận"
      : solverStep === "input"
        ? "Nhập số → OK xác nhận"
        : solverStep === "result"
          ? "OK: nghiệm tiếp / Mode: thoát"
          : "";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <h1 className="text-center text-3xl font-semibold mb-4">
          Máy tính Next.js
        </h1>

        <div className="rounded-2xl bg-slate-950 p-5 mb-1 min-h-[96px] flex flex-col items-end justify-end">
          <span className="text-4xl font-bold text-white break-all text-right">
            {display}
          </span>
        </div>
        <div className="text-right text-xs text-slate-400 mb-4 min-h-[16px]">
          {hint}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Hàng 1 */}
          <button
            className="rounded-2xl bg-slate-200 py-4 text-lg font-semibold hover:bg-slate-300"
            onClick={handleClear}
          >
            C
          </button>
          <button
            className={`rounded-2xl py-4 text-lg font-semibold text-white ${inSolver ? "bg-violet-700" : "bg-violet-600 hover:bg-violet-700"}`}
            onClick={handleMode}
          >
            Mode
          </button>
          <button
            className="rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700"
            onClick={() => handleOperator("÷")}
          >
            ÷
          </button>
          <button
            className="rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700"
            onClick={() => handleOperator("×")}
          >
            ×
          </button>

          {/* Hàng 2–4: số */}
          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((digit) => (
            <button
              key={digit}
              className="rounded-2xl bg-slate-200 py-4 text-lg font-semibold hover:bg-slate-300"
              onClick={() => appendDigit(String(digit))}
            >
              {digit}
            </button>
          ))}

          {/* Hàng 5 */}
          <button
            className="rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700"
            onClick={() => handleOperator("-")}
          >
            -
          </button>
          <button
            className="rounded-2xl bg-slate-200 py-4 text-lg font-semibold hover:bg-slate-300"
            onClick={() => appendDigit("0")}
          >
            0
          </button>
          <button
            className="rounded-2xl bg-emerald-600 py-4 text-lg font-semibold text-white hover:bg-emerald-700"
            onClick={handleEqual}
          >
            =
          </button>
          <button
            className="rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700"
            onClick={() => handleOperator("+")}
          >
            +
          </button>

          {/* Nút OK — full width */}
          <button
            className={`col-span-4 rounded-2xl py-4 text-lg font-semibold text-white transition-colors ${inSolver ? "bg-orange-500 hover:bg-orange-600" : "bg-slate-300 text-slate-500 cursor-default"}`}
            onClick={handleOK}
            disabled={!inSolver}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
