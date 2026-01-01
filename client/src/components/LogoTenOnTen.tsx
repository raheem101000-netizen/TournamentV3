import { cn } from "@/lib/utils";

interface LogoTenOnTenProps {
  size?: number;
  className?: string;
}

const DOT_COLORS = [
  "#FFD4D4", "#C8F0E0", "#B8E0F0", "#E8C8E8", "#FFF8DC", 
  "#F0F0FF", "#D0F0F8", "#FFE8D8", "#E8D8E8", "#D0E8F8",
  "#FFF0D8", "#FFD8E0", "#D8F8F8", "#C8FFC8", "#FFE0E8",
  "#D8F0D8", "#E8D8C8", "#F8F0C8", "#F0D8F0", "#C8B8D8",
];

const DIGIT_PATTERNS: Record<string, number[][]> = {
  "1": [
    [0,0,1,0],
    [0,1,1,0],
    [1,0,1,0],
    [0,0,1,0],
    [0,0,1,0],
    [0,0,1,0],
    [1,1,1,1],
  ],
  "0": [
    [0,1,1,0],
    [1,0,0,1],
    [1,0,0,1],
    [1,0,0,1],
    [1,0,0,1],
    [1,0,0,1],
    [0,1,1,0],
  ],
  "/": [
    [0,0,0,1],
    [0,0,0,1],
    [0,0,1,0],
    [0,0,1,0],
    [0,1,0,0],
    [1,0,0,0],
    [1,0,0,0],
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
  const dotSize = size * 0.018;
  const gap = size * 0.010;
  const charWidth = 4 * (dotSize + gap);
  const charSpacing = size * 0.020;
  
  const chars = ["1", "0", "/", "1", "0"];
  const slashExtraSpace = size * 0.04;
  const totalWidth = chars.length * charWidth + (chars.length - 1) * charSpacing + slashExtraSpace * 2;
  const totalHeight = 7 * (dotSize + gap);
  
  const outerRingThickness = size * 0.014;
  const ringGap = size * 0.045;
  const innerRingThickness = size * 0.025;
  
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
          boxShadow: `0 0 ${size * 0.05}px rgba(255,255,255,0.2), inset 0 0 ${size * 0.025}px rgba(255,255,255,0.1)`
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
