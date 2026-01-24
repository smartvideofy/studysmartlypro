import { useCallback, useRef, useState } from "react";
import { haptics } from "@/lib/haptics";

interface UseLongPressOptions {
  threshold?: number;
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}

export function useLongPress(
  callback: () => void,
  options: UseLongPressOptions = {}
) {
  const {
    threshold = 500,
    onStart,
    onFinish,
    onCancel,
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      // Store initial position
      if ("touches" in event) {
        startPosRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else {
        startPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
      }

      isLongPressRef.current = false;
      setIsPressed(true);
      onStart?.();

      timeoutRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        haptics.medium();
        callback();
        onFinish?.();
      }, threshold);
    },
    [callback, threshold, onStart, onFinish]
  );

  const cancel = useCallback(
    (event?: React.TouchEvent | React.MouseEvent) => {
      // Check if we moved too far (for touch events)
      if (event && "touches" in event && timeoutRef.current) {
        const touch = event.touches[0];
        if (touch) {
          const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
          const deltaY = Math.abs(touch.clientY - startPosRef.current.y);
          
          // If moved more than 10px, cancel
          if (deltaX > 10 || deltaY > 10) {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setIsPressed(false);
            onCancel?.();
            return;
          }
        }
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsPressed(false);
      
      if (!isLongPressRef.current) {
        onCancel?.();
      }
    },
    [onCancel]
  );

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPressed(false);
  }, []);

  return {
    handlers: {
      onTouchStart: start,
      onTouchEnd: cancel,
      onTouchMove: cancel,
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
    },
    isPressed,
    isLongPress: isLongPressRef.current,
    clear,
  };
}
