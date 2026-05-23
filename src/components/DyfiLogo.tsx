export default function DyfiLogo({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Red star — DYFI symbol */}
      <polygon
        points="50,4 61,35 95,35 68,56 79,90 50,68 21,90 32,56 5,35 39,35"
        fill="#dc2626"
        stroke="#b91c1c"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* White "D" text in center */}
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="white"
        letterSpacing="-1"
      >
        D
      </text>
    </svg>
  );
}
