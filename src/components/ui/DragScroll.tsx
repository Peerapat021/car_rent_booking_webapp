'use client';

import React, { useRef, useState, useCallback, MouseEvent, useEffect } from 'react';

interface DragScrollProps {
  children: React.ReactNode;
  className?: string;
  onDragChange?: (hasDragged: boolean) => void;
}

const DragScroll: React.FC<DragScrollProps> = ({ children, className = '', onDragChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const hasDraggedRef = useRef(false);
  const DRAG_THRESHOLD = 5;

  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animationFrame = useRef<number | null>(null);

  // --- momentum animation ---
  function animateMomentum() {
    if (!containerRef.current) return;

    velocity.current *= 0.95; // friction
    if (Math.abs(velocity.current) < 0.5) return;

    containerRef.current.scrollLeft -= velocity.current;
    animationFrame.current = requestAnimationFrame(animateMomentum);
  }

  // --- mouse down ---
  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    e.preventDefault();
    setIsDragging(true);
    hasDraggedRef.current = false;

    setStartX(e.clientX);
    setScrollLeft(containerRef.current.scrollLeft);

    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocity.current = 0;

    containerRef.current.style.cursor = 'grabbing';
    containerRef.current.style.userSelect = 'none';

    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);

    onDragChange?.(false);
  }, [onDragChange]);

  // --- mouse move ---
  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const walk = e.clientX - startX;
    if (Math.abs(walk) > DRAG_THRESHOLD && !hasDraggedRef.current) {
      hasDraggedRef.current = true;
    }

    containerRef.current.scrollLeft = scrollLeft - walk;

    // velocity
    const now = performance.now();
    const deltaTime = now - lastTime.current;
    if (deltaTime > 0) {
      velocity.current = (e.clientX - lastX.current) / deltaTime * 20;
      lastX.current = e.clientX;
      lastTime.current = now;
    }
  }, [isDragging, startX, scrollLeft]);

  // --- mouse up ---
  const handleMouseUp = useCallback(() => {
    if (!containerRef.current) return;

    setIsDragging(false);
    containerRef.current.style.cursor = 'grab';
    containerRef.current.style.userSelect = 'auto';

    onDragChange?.(hasDraggedRef.current);

    if (hasDraggedRef.current) {
      animationFrame.current = requestAnimationFrame(animateMomentum);
    }
  }, [onDragChange]);

  // --- block click ---
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) containerRef.current.style.cursor = 'grab';

    const handleDocMouseUp = () => handleMouseUp();
    document.addEventListener('mouseup', handleDocMouseUp);
    return () => document.removeEventListener('mouseup', handleDocMouseUp);
  }, [handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`flex overflow-x-scroll whitespace-nowrap ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onClickCapture={handleClickCapture}
    >
      {children}
    </div>
  );
};

export default DragScroll;
