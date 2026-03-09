"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { getBanners } from "@/lib/services/client/banners/get";

// ข้อมูลสำหรับสไลด์
interface Slide {
  id: number;
  imageUrl: string;
  title: string;
  linkUrl?: string | null;
  linkTarget?: string;
}

export default function Slider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // ดึงข้อมูล banner จาก API
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const data = await getBanners();
        // กรอง banner ที่ published และมีรูปภาพ
        const published = data
          .filter((b: any) => b.banner_status === "published" && b.banner_image_url)
          .map((b: any) => ({
            id: b.banner_id,
            imageUrl: b.banner_image_url,
            title: b.banner_title || "",
            linkUrl: b.banner_link_url,
            linkTarget: b.banner_link_target || "_self",
          }));
        setSlides(published.length > 0 ? published : []);
      } catch (err) {
        console.error("Failed to load banners:", err);
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };
    loadBanners();
  }, []);

  const slidesCount = slides.length;

  const goToNextSlide = useCallback(() => {
    setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slidesCount);
  }, [slidesCount]);

  const goToPrevSlide = () => {
    setCurrentSlideIndex(
      (prevIndex) => (prevIndex - 1 + slidesCount) % slidesCount
    );
  };

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };

  useEffect(() => {
    const interval = setInterval(goToNextSlide, 5000);
    return () => clearInterval(interval);
  }, [goToNextSlide]);

  const trackStyle = {
    transform: `translateX(-${currentSlideIndex * 100}%)`,
  };

  const touchTrackStyle = {
    transitionProperty: "transform",
    transitionDuration: "500ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const [touchStartX, setTouchStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwiping) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) goToNextSlide();
      else goToPrevSlide();
    }
    setIsSwiping(false);
  };




  if (loading) {
    return (
      <div className="flex flex-col items-center justify-start lg:justify-center font-sans my-3 sm:my-5 lg:mt-0 lg:mb-15">
        <div className="relative w-full max-w-5xl h-60 md:h-80 lg:h-120 mx-auto rounded-xl shadow-2xl overflow-hidden bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (

    <>
      <div className="flex flex-col items-center justify-start lg:justify-center font-sans my-3 sm:my-5 lg:mt-0 lg:mb-15">
        <div
          className="relative w-full max-w-5xl h-60 md:h-80 lg:h-120 mx-auto rounded-xl shadow-2xl bg-gray-200"
          style={{ overflow: 'clip' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex gap-0 h-full"
            style={{ ...trackStyle, ...touchTrackStyle, willChange: 'transform' }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="shrink-0 h-full relative"
                style={{ width: '100%', minWidth: '100%' }}
              >
                <Image
                  src={slide.imageUrl}
                  alt={slide.title || "Banner"}
                  className="w-full h-full object-cover"
                  fill
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://placehold.co/800x400/CCCCCC/000000?text=Image+Load+Error`;
                  }}
                />
              </div>
            ))}
          </div>

          {/* Prev Button */}
          <button
            onClick={goToPrevSlide}
            className="hidden md:absolute md:top-1/2 md:left-6 md:transform md:-translate-y-1/2 md:bg-black/50 md:hover:bg-black/70 md:text-white md:p-1 md:rounded-full md:shadow-xl 
    md:transition md:duration-300 md:z-10 md:cursor-pointer 
    md:flex md:items-center md:justify-center "
            aria-label="Previous Slide"
          >
            <FaAngleLeft className="md:w-9 md:h-9 " />
          </button>

          {/* Next Button */}
          <button
            onClick={goToNextSlide}
            className="hidden md:absolute md:top-1/2 md:right-6 md:transform md:-translate-y-1/2 md:bg-black/50 md:hover:bg-black/70 md:text-white md:p-1 md:rounded-full md:shadow-xl md:transition md:duration-300 md:z-10 md:cursor-pointer md:flex md:items-center md:justify-center  "
            aria-label="Next Slide"
          >
            <FaAngleRight className="md:w-9 md:h-9" />
          </button>

          {/* Dots */}
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 md:space-x-4">
            {slides.map((slide, index) => (
              <span
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`
            rounded-full cursor-pointer transition duration-300 shadow-lg border-2 border-white 
            w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3   md:h-3 lg:w-4 lg:h-4 
            ${index === currentSlideIndex
                    ? "bg-black scale-125"
                    : "bg-white bg-opacity-50 hover:bg-opacity-75"
                  }
          `}
                aria-label={`Go to slide ${index + 1}`}
                role="button"
              />
            ))}
          </div>


        </div>
      </div>
    </>
  )
}