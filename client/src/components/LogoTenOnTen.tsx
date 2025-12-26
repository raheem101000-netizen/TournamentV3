import { cn } from "@/lib/utils";

interface LogoTenOnTenProps {
  size?: number;
  className?: string;
}

const DOT_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", 
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8B500", "#FF69B4", "#00CED1", "#32CD32", "#FF4500",
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
  const dotSize = size * 0.028;
  const gap = size * 0.012;
  const charWidth = 3 * (dotSize + gap);
  const charSpacing = size * 0.02;
  
  const chars = ["1", "0", "/", "1", "0"];
  const totalWidth = chars.length * charWidth + (chars.length - 1) * charSpacing;
  const totalHeight = 5 * (dotSize + gap);
  
  const outerRingThickness = size * 0.025;
  const ringGap = size * 0.015;
  const innerRingThickness = size * 0.01;
  
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
          boxShadow: `0 0 ${size * 0.08}px rgba(255,255,255,0.3), inset 0 0 ${size * 0.04}px rgba(255,255,255,0.2)`
        }}
      />
      <div 
        className="absolute rounded-full border-white/40"
        style={{ 
          width: size - (outerRingThickness * 2) - (ringGap * 2), 
          height: size - (outerRingThickness * 2) - (ringGap * 2),
          borderWidth: innerRingThickness,
        }}
      />
      <svg 
        width={totalWidth} 
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="relative z-10"
      >
        {chars.map((char, index) => {
          const offsetX = index * (charWidth + charSpacing);
          return renderCharacter(char, offsetX, dotSize, gap);
        })}
      </svg>
    </div>
  );
}
