"use client";

import { useEffect, useState } from "react";

type ScrollHeroProps = {
  children: React.ReactNode;
};

export default function ScrollHero({ children }: ScrollHeroProps) {
  const [headerVisible, setHeaderVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [heroTextColor, setHeroTextColor] = useState("#ffffff");

  useEffect(() => {
    let headerMouseOverride = false;
    let footerMouseOverride = false;
    const headerActivationY = 90;
    const footerActivationMargin = 90;
    const footerNearBottomPx = 420;

    const evaluateScrollVisibility = () => {
      const availableCarsHeader = document.getElementById("available-cars-header");
      return availableCarsHeader
        ? availableCarsHeader.getBoundingClientRect().bottom <= 0
        : window.scrollY >= window.innerHeight;
    };

    const evaluateFooterVisibility = () => {
      const root = document.documentElement;
      const threshold = 80;
      if (root.scrollHeight <= root.clientHeight + 8) {
        return true;
      }
      return window.scrollY + window.innerHeight >= root.scrollHeight - threshold;
    };

    const handleScroll = () => {
      if (!headerMouseOverride) {
        setHeaderVisible(evaluateScrollVisibility());
      }
      if (!footerMouseOverride) {
        setFooterVisible(evaluateFooterVisibility());
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const innerH = window.innerHeight;
      const root = document.documentElement;
      const distanceFromBottom = root.scrollHeight - (window.scrollY + innerH);
      const isNearDocumentBottom = distanceFromBottom <= footerNearBottomPx;

      const isInHeaderAccessZone = event.clientY <= headerActivationY;
      if (isInHeaderAccessZone && !headerMouseOverride) {
        headerMouseOverride = true;
        setHeaderVisible(true);
      } else if (!isInHeaderAccessZone && headerMouseOverride) {
        headerMouseOverride = false;
        setHeaderVisible(evaluateScrollVisibility());
      }

      const isInFooterAccessZone = event.clientY >= innerH - footerActivationMargin;
      if (isInFooterAccessZone && isNearDocumentBottom && !footerMouseOverride) {
        footerMouseOverride = true;
        setFooterVisible(true);
      } else if ((!isInFooterAccessZone || !isNearDocumentBottom) && footerMouseOverride) {
        footerMouseOverride = false;
        setFooterVisible(evaluateFooterVisibility());
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = "/hero.jpg";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const sampleWidth = 80;
      const sampleHeight = 80;
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

      const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
      let luminanceTotal = 0;
      const pixelCount = sampleWidth * sampleHeight;

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        luminanceTotal += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      }

      const averageLuminance = luminanceTotal / pixelCount;
      setHeroTextColor(averageLuminance > 0.58 ? "#111827" : "#ffffff");
    };
  }, []);

  return (
    <div
      className="scroll-hero"
      style={
        {
          "--header-visible": headerVisible ? "1" : "0",
          "--footer-visible": footerVisible ? "1" : "0",
          "--hero-text-color": heroTextColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
