import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/*
  CodeInput — animated boxed digit input (OTP style).
  One transparent input drives N animated boxes (robust paste + mobile keypad).
  props:
    length      : number of boxes (e.g. 4 or 6)
    value       : controlled digit string
    onChange    : (value) => void   (digits only, capped at length)
    onComplete  : (value) => void   fires when value reaches `length`
    mask        : show • instead of the digit
    error       : trigger a shake + red glow
    autoFocus   : focus on mount
    disabled    : disable input
    autoComplete: input autocomplete (default 'one-time-code')
*/
export function CodeInput({
  length = 4,
  value = '',
  onChange,
  onComplete,
  mask = false,
  error = false,
  autoFocus = false,
  disabled = false,
  autoComplete = 'one-time-code',
}) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  function handle(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange?.(v);
    if (v.length === length) onComplete?.(v);
  }

  const big = length <= 4;
  const boxCls = big ? 'h-14 w-12' : 'h-12 w-9 sm:w-10';
  const gapCls = big ? 'gap-2.5' : 'gap-1.5 sm:gap-2';

  return (
    <motion.div
      animate={error ? { x: [0, -9, 9, -7, 7, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.45 }}
      className={`relative flex justify-center ${gapCls}`}
      dir="ltr"
      onClick={() => ref.current?.focus()}
    >
      <input
        ref={ref}
        value={value}
        onChange={handle}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={autoComplete}
        maxLength={length}
        autoFocus={autoFocus}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="رمز التحقق"
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
      {Array.from({ length }).map((_, i) => {
        const filled = i < value.length;
        const active = focused && i === value.length && !disabled;
        return (
          <div
            key={i}
            className={`relative grid ${boxCls} place-items-center rounded-2xl border-2 bg-beige font-display text-2xl font-black text-ink transition-all duration-200 dark:bg-night-900 dark:text-cream ${
              error
                ? 'border-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.18)]'
                : active
                ? 'border-copper shadow-[0_0_0_4px_rgba(154,83,24,0.18)]'
                : filled
                ? 'border-copper/55'
                : 'border-ink/15 dark:border-white/15'
            }`}
          >
            <AnimatePresence>
              {filled && (
                <motion.span
                  key={value[i] + ':' + i}
                  initial={{ scale: 0, opacity: 0, y: 4 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                >
                  {mask ? '•' : value[i]}
                </motion.span>
              )}
            </AnimatePresence>
            {active && !filled && (
              <motion.span
                className="absolute h-6 w-0.5 rounded bg-copper"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

/*
  SuccessCheck — glowing green checkmark morph with an animated draw.
  Shown briefly after a successful login.
*/
export function SuccessCheck({ label = 'تم بنجاح', sub }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="relative grid place-items-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0.55 }}
          animate={{ scale: 2.3, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.3 }}
          className="absolute h-20 w-20 rounded-[1.4rem] bg-green-400/30"
        />
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 15 }}
          className="grid h-20 w-20 place-items-center rounded-[1.4rem] bg-gradient-to-br from-green-400 to-green-600 shadow-[0_0_44px_-6px_rgba(34,197,94,0.75)] ring-1 ring-green-300/50"
        >
          <motion.svg width="42" height="42" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.18, duration: 0.45, ease: 'easeOut' }}
            />
          </motion.svg>
        </motion.div>
      </div>
      <div>
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="font-display text-xl font-black text-ink dark:text-cream"
        >
          {label}
        </motion.h3>
        {sub && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-1 font-body text-sm text-ink/55 dark:text-cream/55"
          >
            {sub}
          </motion.p>
        )}
      </div>
    </div>
  );
}
