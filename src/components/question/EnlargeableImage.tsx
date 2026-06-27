"use client";

import { useState } from "react";
import Image from "next/image";

export function EnlargeableImage({ src, alt, year: _year }: { src: string; alt: string; year: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="group relative w-full cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-all duration-normal hover:shadow-md"
        style={{ minHeight: 400 }}
        onClick={() => setOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain transition-opacity duration-normal group-hover:opacity-95"
          sizes="(max-width: 768px) 100vw, 800px"
          priority
          unoptimized
        />
        <div className="absolute inset-0 flex items-end justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="mb-3 rounded-full bg-black/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            Click to enlarge
          </span>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
}
