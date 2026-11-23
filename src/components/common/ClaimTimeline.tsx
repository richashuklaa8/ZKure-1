import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { TimelineStep } from '../../types';

export const ClaimTimeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => {
  return (
    <div className="space-y-3">
      {steps.map((item, idx) => {
        const isDone = item.status === 'Completed';
        return (
          <div key={item.step} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isDone ? 'bg-teal-50 text-[#0D9488]' : 'bg-amber-50 text-amber-600'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-px h-6 mt-1 ${isDone ? 'bg-teal-200' : 'bg-slate-200'}`} />
              )}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{item.label}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    isDone ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
