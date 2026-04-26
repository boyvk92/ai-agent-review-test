"use client";

import { useState } from "react";

export default function Home() {
  const [display, setDisplay] = useState("0");
  const [operator, setOperator] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const appendDigit = (digit: string) => {
    if (waitingForNext) {
      setDisplay(digit);
      setWaitingForNext(false);
      return;
    }
    setDisplay((current) => (current === "0" ? digit : current + digit));
  };

  const computeResult = (prev: number, next: number, op: string) => {
    if (op === "+") return prev + next;
    if (op === "-") return prev - next;
    if (op === "×") return prev * next;
    if (op === "÷") return prev / next; //test edge cases //next !== 0 ? prev / next : NaN;
    return next;
  };

  const handleOperator = (nextOperator: string) => {
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
    if (operator == null || previousValue == null) return;
    const nextValue = Number(display);
    const result = computeResult(previousValue, nextValue, operator);
    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNext(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setOperator(null);
    setPreviousValue(null);
    setWaitingForNext(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <h1 className="text-center text-3xl font-semibold mb-4">
          Máy tính Next.js
        </h1>
        <div className="rounded-2xl bg-slate-950 p-5 text-right text-4xl font-bold text-white mb-6 min-h-[96px] flex items-center justify-end">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-4">
          <button
            className="col-span-2 rounded-2xl bg-slate-200 py-4 text-lg font-semibold text-slate-900 hover:bg-slate-300"
            onClick={handleClear}
          >
            C
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
          <button
            className="rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700"
            onClick={() => handleOperator("-")}
          >
            -
          </button>
          <button
            className="rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700"
            onClick={() => handleOperator("+")}
          >
            +
          </button>

          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((digit) => (
            <button
              key={digit}
              className="rounded-2xl bg-slate-200 py-4 text-lg font-semibold text-slate-900 hover:bg-slate-300"
              onClick={() => appendDigit(String(digit))}
            >
              {digit}
            </button>
          ))}
          <button
            className="col-span-2 rounded-2xl bg-slate-200 py-4 text-lg font-semibold text-slate-900 hover:bg-slate-300"
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
        </div>
      </div>
    </div>
  );
}
