type RadarDimension = {
  id: string;
  label: string;
  value: number;
};

type RadarChartProps = {
  dimensions: RadarDimension[];
};

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export function RadarChart({ dimensions }: RadarChartProps) {
  const size = 360;
  const center = size / 2;
  const maxRadius = 122;
  const ringFractions = [0.2, 0.4, 0.6, 0.8, 1];
  const angleStep = 360 / dimensions.length;

  const outlinePoints = dimensions
    .map((_, index) => {
      const point = polarToCartesian(center, center, maxRadius, index * angleStep);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  const valuePoints = dimensions
    .map((dimension, index) => {
      const point = polarToCartesian(
        center,
        center,
        (maxRadius * Math.max(0, Math.min(100, dimension.value))) / 100,
        index * angleStep,
      );
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className="radar-shell">
      <svg
        aria-label="8 维关系气场雷达图"
        className="radar-chart"
        role="img"
        viewBox={`0 0 ${size} ${size}`}
      >
        {ringFractions.map((fraction) => {
          const ringPoints = dimensions
            .map((_, index) => {
              const point = polarToCartesian(center, center, maxRadius * fraction, index * angleStep);
              return `${point.x},${point.y}`;
            })
            .join(" ");

          return <polygon className="radar-ring" key={fraction} points={ringPoints} />;
        })}

        {dimensions.map((dimension, index) => {
          const axisEnd = polarToCartesian(center, center, maxRadius, index * angleStep);
          const labelPoint = polarToCartesian(center, center, maxRadius + 26, index * angleStep);

          return (
            <g key={dimension.id}>
              <line
                className="radar-axis"
                x1={center}
                x2={axisEnd.x}
                y1={center}
                y2={axisEnd.y}
              />
              <text
                className="radar-label"
                textAnchor="middle"
                x={labelPoint.x}
                y={labelPoint.y}
              >
                {dimension.label}
              </text>
            </g>
          );
        })}

        <polygon className="radar-outline" points={outlinePoints} />
        <polygon className="radar-area" points={valuePoints} />

        {dimensions.map((dimension, index) => {
          const point = polarToCartesian(
            center,
            center,
            (maxRadius * Math.max(0, Math.min(100, dimension.value))) / 100,
            index * angleStep,
          );

          return <circle className="radar-point" cx={point.x} cy={point.y} key={dimension.id} r="4.5" />;
        })}
      </svg>
    </div>
  );
}
