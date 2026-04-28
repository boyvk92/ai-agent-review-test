"use client";

import { useState } from "react";

// ❌ [SOLID - SRP] Component này làm quá nhiều việc: quản lý state, xử lý logic toán học,
//    render UI, validate input — tất cả trong 1 file duy nhất.

// ❌ [SOLID - OCP] Muốn thêm bậc 4, bậc 5 phải sửa trực tiếp vào hàm solveEquation bên dưới,
//    thay vì mở rộng ra ngoài.

type Step = "select" | "input" | "result";

export default function EquationSolver({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("select");
  const [degree, setDegree] = useState<2 | 3 | null>(null);
  const [coefficients, setCoefficients] = useState<number[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [results, setResults] = useState<string[]>([]);

  // ❌ [SRP + Function quá dài] Hàm này làm 3 việc: giải bậc 2, giải bậc 3, format kết quả.
  //    Nên tách thành solveQuadratic(), solveCubic(), formatRoots().
  const solveEquation = (degree: number, coeffs: number[]) => {
    const resultList: string[] = [];

    if (degree === 2) {
      const [a, b, c] = coeffs;

      // ❌ [Lặp code] Đoạn validate a === 0 lặp lại ở cả nhánh bậc 2 và bậc 3 bên dưới
      if (a === 0) {
        resultList.push("Hệ số a không được bằng 0");
        setResults(resultList);
        return;
      }

      const delta = b * b - 4 * a * c;

      if (delta > 0) {
        const x1 = (-b + Math.sqrt(delta)) / (2 * a);
        const x2 = (-b - Math.sqrt(delta)) / (2 * a);
        // ❌ [Lặp code] Format kết quả "x = ..." lặp lại ở nhiều chỗ, nên tách thành formatRoot(label, value)
        resultList.push(`x1 = ${x1.toFixed(4)}`);
        resultList.push(`x2 = ${x2.toFixed(4)}`);
      } else if (delta === 0) {
        const x = -b / (2 * a);
        resultList.push(`x1 = x2 = ${x.toFixed(4)}`);
      } else {
        const realPart = (-b / (2 * a)).toFixed(4);
        const imagPart = (Math.sqrt(-delta) / (2 * a)).toFixed(4);
        // ❌ [Lặp code] Format số phức lặp lại ở bậc 3 bên dưới
        resultList.push(`x1 = ${realPart} + ${imagPart}i`);
        resultList.push(`x2 = ${realPart} - ${imagPart}i`);
      }
    }

    if (degree === 3) {
      const [a, b, c, d] = coeffs;

      // ❌ [Lặp code] Validate a === 0 lặp lại lần 2
      if (a === 0) {
        resultList.push("Hệ số a không được bằng 0");
        setResults(resultList);
        return;
      }

      // Cardano method
      const p = (3 * a * c - b * b) / (3 * a * a);
      const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
      const discriminant = -(4 * p * p * p + 27 * q * q);

      if (discriminant > 0) {
        // 3 nghiệm thực
        const m = 2 * Math.sqrt(-p / 3);
        const theta = Math.acos((3 * q) / (p * m)) / 3;
        const offset = b / (3 * a);

        // ❌ [Lặp code] Format kết quả x = ... lặp lại lần 3, lần 4, lần 5
        resultList.push(`x1 = ${(m * Math.cos(theta) - offset).toFixed(4)}`);
        resultList.push(`x2 = ${(m * Math.cos(theta - (2 * Math.PI) / 3) - offset).toFixed(4)}`);
        resultList.push(`x3 = ${(m * Math.cos(theta - (4 * Math.PI) / 3) - offset).toFixed(4)}`);
      } else {
        // 1 nghiệm thực, 2 nghiệm phức
        const sqrtD = Math.sqrt(-discriminant / 108);
        const u = Math.cbrt(-q / 2 + sqrtD);
        const v = Math.cbrt(-q / 2 - sqrtD);
        const x1 = u + v - b / (3 * a);
        const realPart = (-(u + v) / 2 - b / (3 * a)).toFixed(4);
        const imagPart = ((u - v) * Math.sqrt(3) / 2).toFixed(4);

        // ❌ [Lặp code] Format số phức lặp lại lần 2
        resultList.push(`x1 = ${x1.toFixed(4)}`);
        resultList.push(`x2 = ${realPart} + ${imagPart}i`);
        resultList.push(`x3 = ${realPart} - ${imagPart}i`);
      }
    }

    setResults(resultList);
  };

  // ❌ [SRP + Function quá dài] Hàm này xử lý cả: validate input, cập nhật state coefficients,
  //    quyết định chuyển bước, gọi solveEquation — nên tách nhỏ hơn.
  const handleConfirmInput = () => {
    const value = parseFloat(currentInput);

    if (isNaN(value)) {
      alert("Vui lòng nhập số hợp lệ");
      return;
    }

    const newCoeffs = [...coefficients, value];
    setCoefficients(newCoeffs);
    setCurrentInput("");

    const totalNeeded = degree === 2 ? 3 : 4;

    if (newCoeffs.length === totalNeeded) {
      setStep("result");
      // ❌ [Lặp code] degree! được dùng lặp lại nhiều lần thay vì lưu vào biến cục bộ
      solveEquation(degree!, newCoeffs);
    }
  };

  const coefficientLabels: Record<number, string[]> = {
    // ❌ [Khó mở rộng] Muốn thêm bậc 4 phải thêm thủ công vào đây và vào solveEquation,
    //    không có cơ chế tự động nào.
    2: ["a (hệ số x²)", "b (hệ số x)", "c (hằng số)"],
    3: ["a (hệ số x³)", "b (hệ số x²)", "c (hệ số x)", "d (hằng số)"],
  };

  const currentLabel =
    degree != null ? coefficientLabels[degree][coefficients.length] : "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Giải phương trình</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
        </div>

        {/* Bước 1: Chọn bậc */}
        {step === "select" && (
          <div className="flex flex-col gap-3">
            <p className="text-slate-600">Chọn loại phương trình:</p>
            <button
              className="rounded-2xl bg-blue-600 py-4 text-white font-semibold hover:bg-blue-700"
              onClick={() => { setDegree(2); setCoefficients([]); setStep("input"); }}
            >
              Phương trình bậc 2 (ax² + bx + c = 0)
            </button>
            <button
              className="rounded-2xl bg-purple-600 py-4 text-white font-semibold hover:bg-purple-700"
              onClick={() => { setDegree(3); setCoefficients([]); setStep("input"); }}
            >
              Phương trình bậc 3 (ax³ + bx² + cx + d = 0)
            </button>
          </div>
        )}

        {/* Bước 2: Nhập hệ số */}
        {step === "input" && degree != null && (
          <div className="flex flex-col gap-4">
            <p className="text-slate-500 text-sm">
              Đã nhập: {coefficients.map((c, i) => `${coefficientLabels[degree][i].split(" ")[0]}=${c}`).join(", ")}
            </p>
            <p className="font-medium">Nhập {currentLabel}:</p>
            <input
              type="number"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmInput()}
              className="border-2 border-slate-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              className="rounded-2xl bg-emerald-600 py-3 text-white font-semibold hover:bg-emerald-700"
              onClick={handleConfirmInput}
            >
              Xác nhận
            </button>
          </div>
        )}

        {/* Bước 3: Kết quả */}
        {step === "result" && (
          <div className="flex flex-col gap-3">
            <p className="font-medium text-slate-700">Kết quả:</p>
            <div className="bg-slate-950 rounded-2xl p-4 flex flex-col gap-2">
              {results.map((r, i) => (
                <span key={i} className="text-white text-lg font-mono">{r}</span>
              ))}
            </div>
            <button
              className="rounded-2xl bg-slate-200 py-3 font-semibold hover:bg-slate-300"
              onClick={() => { setStep("select"); setCoefficients([]); setResults([]); setDegree(null); }}
            >
              Giải phương trình khác
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
