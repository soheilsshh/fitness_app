import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSessionQuiz, type QuizQuestion } from '@/data/sessionQuizzes';

interface SessionQuizProps {
  videoId: number;
  sessionTitle: string;
  xpReward: number;
  onPassed: () => void;
  onCancel: () => void;
}

type Phase = 'answering' | 'result';

const SessionQuiz = ({ videoId, sessionTitle, xpReward, onPassed, onCancel }: SessionQuizProps) => {
  const questions = useMemo(() => getSessionQuiz(videoId) ?? [], [videoId]);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [phase, setPhase] = useState<Phase>('answering');
  const [score, setScore] = useState(0);

  if (questions.length !== 3) {
    return (
      <div className="mt-4 border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
        آزمون این جلسه هنوز آماده نیست.
        <div className="mt-3 flex gap-2">
          <Button type="button" onClick={onCancel} className="rounded-none" variant="outline">
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  const allAnswered = answers.every((a) => a !== null);

  const submit = () => {
    if (!allAnswered) return;
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct += 1;
    });
    setScore(correct);
    setPhase('result');
  };

  const passed = score === 3;

  const retry = () => {
    setAnswers(questions.map(() => null));
    setScore(0);
    setPhase('answering');
  };

  return (
    <div className="mt-4 border border-[#26fce3]/35 bg-[#080c0c] p-3 sm:p-4" dir="rtl">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#58cac0]">QUIZ · ۳ سؤال</p>
          <h4 className="mt-1 text-sm font-bold text-white">{sessionTitle}</h4>
          <p className="mt-1 text-[11px] text-white/45">
            برای دریافت {xpReward} XP باید هر ۳ سؤال را درست جواب بدهی.
          </p>
        </div>
        <span className="font-mono text-xs text-white/40">
          {answers.filter((a) => a !== null).length}/3
        </span>
      </div>

      {phase === 'answering' && (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <QuestionBlock
              key={q.id}
              index={qi}
              question={q}
              selected={answers[qi]}
              onSelect={(opt) => {
                setAnswers((prev) => {
                  const next = [...prev];
                  next[qi] = opt;
                  return next;
                });
              }}
            />
          ))}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={submit}
              disabled={!allAnswered}
              className="min-h-[44px] flex-1 cursor-pointer rounded-none border-0 bg-gradient-to-l from-[#187272] via-[#2a9c96] to-[#26fce3] font-bold text-[#0e0e0e] disabled:opacity-40"
            >
              ثبت پاسخ‌ها
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="min-h-[44px] cursor-pointer rounded-none border-white/15 bg-transparent"
            >
              انصراف
            </Button>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="space-y-4">
          <div
            className={`flex items-center gap-2 border px-3 py-3 ${
              passed
                ? 'border-[#26fce3]/40 bg-[#26fce3]/10 text-[#26fce3]'
                : 'border-amber-400/35 bg-amber-400/10 text-amber-200'
            }`}
          >
            {passed ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" aria-hidden />
            )}
            <div>
              <p className="text-sm font-bold">
                {passed ? 'قبول شدی!' : `نتیجه: ${score} از ۳ درست`}
              </p>
              <p className="text-[11px] opacity-80">
                {passed
                  ? `الان می‌تونی ${xpReward} XP بگیری.`
                  : 'برای دریافت XP باید هر ۳ پاسخ درست باشد. دوباره تلاش کن.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {questions.map((q, qi) => {
              const selected = answers[qi];
              const ok = selected === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`border px-3 py-2 text-xs ${
                    ok ? 'border-[#26fce3]/25 bg-[#26fce3]/[0.05]' : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <p className="font-semibold text-white">{q.prompt}</p>
                  <p className={`mt-1 ${ok ? 'text-[#26fce3]' : 'text-amber-200/90'}`}>
                    پاسخ تو: {selected !== null ? q.options[selected] : '—'}
                    {!ok && (
                      <span className="mt-0.5 block text-white/50">
                        درست: {q.options[q.correctIndex]}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {passed ? (
              <Button
                type="button"
                onClick={onPassed}
                className="min-h-[44px] flex-1 cursor-pointer rounded-none border-0 bg-gradient-to-l from-[#187272] via-[#2a9c96] to-[#26fce3] font-bold text-[#0e0e0e]"
              >
                تأیید و دریافت {xpReward} XP
              </Button>
            ) : (
              <Button
                type="button"
                onClick={retry}
                className="min-h-[44px] flex-1 cursor-pointer rounded-none border-0 bg-gradient-to-l from-[#187272] via-[#2a9c96] to-[#26fce3] font-bold text-[#0e0e0e]"
              >
                تلاش دوباره
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="min-h-[44px] cursor-pointer rounded-none border-white/15 bg-transparent"
            >
              بعداً
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

function QuestionBlock({
  index,
  question,
  selected,
  onSelect,
}: {
  index: number;
  question: QuizQuestion;
  selected: number | null;
  onSelect: (opt: number) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold text-white">
        <span className="me-2 font-mono text-[#26fce3]">{index + 1}.</span>
        {question.prompt}
      </legend>
      <div className="space-y-1.5" role="radiogroup" aria-label={`سؤال ${index + 1}`}>
        {question.options.map((opt, oi) => {
          const active = selected === oi;
          return (
            <button
              key={oi}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(oi)}
              className={`flex min-h-[44px] w-full cursor-pointer items-center gap-2 border px-3 py-2 text-right text-xs transition-colors duration-150 touch-manipulation sm:text-sm ${
                active
                  ? 'border-[#26fce3]/50 bg-[#26fce3]/10 text-white'
                  : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border text-[10px] font-bold ${
                  active ? 'border-[#26fce3] bg-[#26fce3] text-[#0e0e0e]' : 'border-white/25 text-white/40'
                }`}
              >
                {['الف', 'ب', 'ج'][oi]}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default SessionQuiz;
