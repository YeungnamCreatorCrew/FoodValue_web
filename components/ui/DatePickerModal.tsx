"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { makeDateString } from "@/lib/date";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface DatePickerModalProps {
  title: string;
  description?: string;
  value: string; // 지금 선택된 날짜 "YYYY-MM-DD"
  maxDate: string; // 이 날짜 이후는 고를 수 없다 (구입일은 오늘까지)
  quickPicks?: { label: string; date: string }[]; // 빠른 선택 (예: 오늘, 어제, 3일 전)
  confirmLabel?: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}

/** 한 달 달력의 칸들. 앞쪽 빈 칸은 null */
function buildCells(year: number, month: number): (number | null)[] {
  const leading = new Date(year, month, 1).getDay(); // 1일의 요일 (0 = 일요일)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** 날짜 선택 창 (달력 + 빠른 선택). [선택 완료]를 눌러야 값이 적용된다. */
export function DatePickerModal({
  title,
  description,
  value,
  maxDate,
  quickPicks = [],
  confirmLabel = "선택 완료",
  onConfirm,
  onClose,
}: DatePickerModalProps) {
  const [selected, setSelected] = useState(value);
  // 달력이 보여 주는 달 (month는 0~11)
  const [view, setView] = useState(() => {
    const [year, month] = value.split("-").map(Number);
    return { year, month: month - 1 };
  });

  const [maxYear, maxMonth] = maxDate.split("-").map(Number);
  const canGoNext = view.year * 12 + view.month < maxYear * 12 + (maxMonth - 1);

  function moveMonth(delta: number) {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  }

  function pick(date: string) {
    setSelected(date);
    const [year, month] = date.split("-").map(Number);
    setView({ year, month: month - 1 }); // 선택한 날짜가 있는 달로 달력을 옮긴다
  }

  const cells = buildCells(view.year, view.month);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <Modal title={title} onClose={onClose} gap="md">
      {description && <p className="text-sm leading-5 text-slate-500">{description}</p>}

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 pb-1 text-base font-medium leading-6">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => moveMonth(-1)}
            className="px-2 text-slate-500"
          >
            ‹
          </button>
          <p className="flex-1 text-center text-slate-900">
            {view.year}년 {view.month + 1}월
          </p>
          <button
            type="button"
            aria-label="다음 달"
            disabled={!canGoNext}
            onClick={() => moveMonth(1)}
            className="px-2 text-slate-500 disabled:opacity-30"
          >
            ›
          </button>
        </div>

        <div className="flex gap-0.5">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="flex h-6 min-w-0 flex-1 items-center justify-center text-xs font-medium leading-5 text-slate-500"
            >
              {weekday}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-0.5">
            {week.map((day, dayIndex) => {
              if (day === null) return <div key={dayIndex} className="h-9 min-w-0 flex-1" />;
              const date = makeDateString(view.year, view.month + 1, day);
              const isFuture = date > maxDate;
              const isSelected = date === selected;
              return (
                <button
                  key={dayIndex}
                  type="button"
                  disabled={isFuture}
                  aria-label={`${view.year}년 ${view.month + 1}월 ${day}일`}
                  aria-pressed={isSelected}
                  onClick={() => pick(date)}
                  className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-lg text-sm leading-6 ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isFuture
                        ? "text-slate-300"
                        : "text-slate-900"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {quickPicks.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1">
          <p className="text-xs font-medium leading-5 whitespace-nowrap text-slate-500">빠른 선택</p>
          {quickPicks.map((quick) => (
            <button
              key={quick.label}
              type="button"
              onClick={() => pick(quick.date)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium leading-5 whitespace-nowrap ${
                quick.date === selected
                  ? "bg-primary text-primary-foreground"
                  : "border border-slate-200 bg-white text-slate-900"
              }`}
            >
              {quick.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex h-10 gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium leading-6 whitespace-nowrap text-slate-900"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => onConfirm(selected)}
          className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
