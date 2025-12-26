import { cn } from "@/lib/utils";

interface LogoTenOnTenProps {
  size?: number;
  className?: string;
}

const DOT_COLORS = [
  "#FFB3B3", "#A8E6CF", "#87CEEB", "#DDA0DD", "#FFFACD", 
  "#E6E6FA", "#B0E0E6", "#FFDAB9", "#D8BFD8", "#ADD8E6",
  "#FFE4B5", "#FFB6C1", "#AFEEEE", "#98FB98", "#FFC0CB",
];

const DIGIT_PATTERNS: Record<string, number[][]> = {
  "1": [
    [0,1,0],
    [1,1,0],
    [0,1,0],
    [0,1,0],
    [1,1,1],
  ],
  "0": [
    [1,1,1],
    [1,0,1],
    [1,0,1],
    [1,0,1],
    [1,1,1],
  ],
  "/": [
    [0,0,1],
    [0,0,1],
    [0,1,0],
    [1,0,0],
    [1,0,0],
  ],
};

function getRandomColor() {
  return DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];
}

function renderCharacter(char: string, offsetX: number, dotSize: number, gap: number) {
  const pattern = DIGIT_PATTERNS[char];
  if (!pattern) return null;
  
  const dots: JSX.Element[] = [];
  
  pattern.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === 1) {
        const x = offsetX + colIndex * (dotSize + gap);
        const y = rowIndex * (dotSize + gap);
        dots.push(
          <circle
            key={`${char}-${rowIndex}-${colIndex}`}
            cx={x + dotSize / 2}
            cy={y + dotSize / 2}
            r={dotSize / 2}
            fill={getRandomColor()}
          />
        );
      }
    });
  });
  
  return dots;
}

export function LogoTenOnTen({ size = 192, className }: LogoTenOnTenProps) {
  const dotSize = size * 0.024;
  const gap = size * 0.01;
  const charWidth = 3 * (dotSize + gap);
  const charSpacing = size * 0.018;
  
  const chars = ["1", "0", "/", "1", "0"];
  const slashExtraSpace = size * 0.03;
  const totalWidth = chars.length * charWidth + (chars.length - 1) * charSpacing + slashExtraSpace * 2;
  const totalHeight = 5 * (dotSize + gap);
  
  const outerRingThickness = size * 0.012;
  const ringGap = size * 0.05;
  const innerRingThickness = size * 0.03;
  
  return (
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <div 
        className="absolute rounded-full border-white"
        style={{ 
          width: size, 
          height: size,
          borderWidth: outerRingThickness,
        }}
      />
      <div 
        className="absolute rounded-full border-white"
        style={{ 
          width: size - (outerRingThickness * 2) - (ringGap * 2), 
          height: size - (outerRingThickness * 2) - (ringGap * 2),
          borderWidth: innerRingThickness,
          boxShadow: `0 0 ${size * 0.06}px rgba(255,255,255,0.25), inset 0 0 ${size * 0.03}px rgba(255,255,255,0.15)`
        }}
      />
      <svg 
        width={totalWidth} 
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="relative z-10"
      >
        {chars.map((char, index) => {
          let offsetX = index * (charWidth + charSpacing);
          if (index >= 2) offsetX += slashExtraSpace;
          if (index >= 3) offsetX += slashExtraSpace;
          return renderCharacter(char, offsetX, dotSize, gap);
        })}
      </svg>
    </div>
  );
}
