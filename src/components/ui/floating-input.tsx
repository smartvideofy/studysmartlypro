import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  hint?: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, success, hint, type, id, ...props }, ref) => {
    const generatedId = React.useId();
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const inputId = id || generatedId;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const isFloating = isFocused || hasValue || !!props.value || !!props.defaultValue;

    return (
      <div className="relative">
        <div className="relative">
          <input
            type={type}
            id={inputId}
            className={cn(
              "peer flex h-12 w-full rounded-xl border bg-[hsl(var(--glass-bg))] backdrop-blur-xl px-4 pt-5 pb-2 text-base ring-offset-background transition-all duration-200",
              "placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-destructive/50 focus-visible:ring-destructive/30 focus-visible:border-destructive"
                : success
                ? "border-success/50 focus-visible:ring-success/30 focus-visible:border-success"
                : "border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary/40",
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder={label}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          
          {/* Floating Label */}
          <motion.label
            htmlFor={inputId}
            initial={false}
            animate={{
              y: isFloating ? -10 : 0,
              scale: isFloating ? 0.85 : 1,
              color: error 
                ? "hsl(var(--destructive))" 
                : isFocused 
                ? "hsl(var(--primary))" 
                : "hsl(var(--muted-foreground))",
            }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 origin-left pointer-events-none",
              "text-base select-none"
            )}
          >
            {label}
          </motion.label>

          {/* Status Icons */}
          <AnimatePresence mode="wait">
            {success && !error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <Check className="w-5 h-5 text-success" strokeWidth={2.5} />
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <AlertCircle className="w-5 h-5 text-destructive" strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error/Hint Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              id={`${inputId}-error`}
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-1.5 text-sm text-destructive flex items-center gap-1"
            >
              {error}
            </motion.p>
          )}
          {!error && hint && (
            <motion.p
              id={`${inputId}-hint`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 text-sm text-muted-foreground"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

// Floating Textarea variant
export interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  success?: boolean;
  hint?: string;
  maxLength?: number;
  showCount?: boolean;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ className, label, error, success, hint, id, maxLength, showCount = false, ...props }, ref) => {
    const generatedId = React.useId();
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const [charCount, setCharCount] = React.useState(0);
    const inputId = id || generatedId;

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(!!e.target.value);
      setCharCount(e.target.value.length);
      props.onChange?.(e);
    };

    const isFloating = isFocused || hasValue || !!props.value || !!props.defaultValue;

    return (
      <div className="relative">
        <div className="relative">
          <textarea
            id={inputId}
            className={cn(
              "peer flex min-h-[120px] w-full rounded-xl border bg-[hsl(var(--glass-bg))] backdrop-blur-xl px-4 pt-6 pb-2 text-base ring-offset-background transition-all duration-200 resize-none",
              "placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-destructive/50 focus-visible:ring-destructive/30 focus-visible:border-destructive"
                : success
                ? "border-success/50 focus-visible:ring-success/30 focus-visible:border-success"
                : "border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary/40",
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder={label}
            maxLength={maxLength}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          
          {/* Floating Label */}
          <motion.label
            htmlFor={inputId}
            initial={false}
            animate={{
              y: isFloating ? -20 : 8,
              scale: isFloating ? 0.85 : 1,
              color: error 
                ? "hsl(var(--destructive))" 
                : isFocused 
                ? "hsl(var(--primary))" 
                : "hsl(var(--muted-foreground))",
            }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              "absolute left-4 top-4 origin-left pointer-events-none",
              "text-base select-none"
            )}
          >
            {label}
          </motion.label>

          {/* Character Count */}
          {showCount && maxLength && (
            <div className="absolute right-3 bottom-2 text-xs text-muted-foreground">
              <span className={charCount > maxLength * 0.9 ? "text-warning" : ""}>
                {charCount}
              </span>
              /{maxLength}
            </div>
          )}
        </div>

        {/* Error/Hint Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              id={`${inputId}-error`}
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-1.5 text-sm text-destructive flex items-center gap-1"
            >
              {error}
            </motion.p>
          )}
          {!error && hint && (
            <motion.p
              id={`${inputId}-hint`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 text-sm text-muted-foreground"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
FloatingTextarea.displayName = "FloatingTextarea";

export { FloatingInput, FloatingTextarea };
