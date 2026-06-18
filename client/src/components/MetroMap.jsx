const stationPositions = {
  'Paddington': { x: 120, y: 300, label: { x: 0, y: -25 } },
  'Marylebone': { x: 300, y: 300, label: { x: 0, y: -25 } },
  'Baker Street': { x: 430, y: 300, label: { x: -15, y: 30 } },
  "Regent's Park": { x: 560, y: 300, label: { x: 0, y: -45 } },
  'Oxford Circus': { x: 680, y: 300, label: { x: 40, y: -40 } },
  'Piccadilly Circus': { x: 850, y: 300, label: { x: 0, y: -45 } },
  'Charing Cross': { x: 980, y: 300, label: { x: 0, y: -45 } },

  'Marble Arch': { x: 430, y: 450, label: { x: 0, y: -45 } },
  'Bond Street': { x: 560, y: 450, label: { x: -30, y: 30 } },
  'Tottenham Court Road': { x: 850, y: 450, label: { x: 25, y: -45 } },
  'British Museum': { x: 980, y: 450, label: { x: 0, y: -45 } },
  'Holborn': { x: 1100, y: 450, label: { x: 0, y: -25 } },

  'Westbourne Park': { x: 120, y: 170, label: { x: 0, y: -45 } },
  'Royal Oak': { x: 300, y: 170, label: { x: 0, y: -45 } },
  'Great Portland Street': { x: 560, y: 100, label: { x: 0, y: -45 } },
  "King's Cross St. Pancras": { x: 850, y: 100, label: { x: 0, y: -45 } },
  'Farringdon': { x: 980, y: 100, label: { x: 0, y: -25 } },
  'Barbican': { x: 1100, y: 100, label: { x: 0, y: -25 } },

  'Green Park': { x: 680, y: 600, label: { x: 35, y: -40 } },
  'Westminster': { x: 850, y: 600, label: { x: 0, y: -25 } },
  'Waterloo': { x: 980, y: 600, label: { x: 0, y: -25 } },

  'Euston': { x: 800, y: 200, label: { x: -30, y: -25 } },
  'Warren Street': { x: 680, y: 200, label: { x: 0, y: -45 } },
  'Victoria': { x: 500, y: 600, label: { x: 0, y: -25 } }
};

const labelLines = {
  'Baker Street': ['Baker', 'Street'],
  "Regent's Park": ["Regent's", 'Park'],
  'Oxford Circus': ['Oxford', 'Circus'],
  'Piccadilly Circus': ['Piccadilly', 'Circus'],
  'Charing Cross': ['Charing', 'Cross'],
  'Marble Arch': ['Marble', 'Arch'],
  'Tottenham Court Road': ['Tottenham', 'Court Road'],
  'British Museum': ['British', 'Museum'],
  'Great Portland Street': ['Great Portland', 'Street'],
  "King's Cross St. Pancras": ["King's Cross", 'St. Pancras'],
  'Green Park': ['Green', 'Park'],
  'Warren Street': ['Warren', 'Street'],
  'Bond Street': ['Bond', 'Street'],
  'Westbourne Park': ['Westbourne', 'Park'],
  'Royal Oak': ['Royal', 'Oak'],
};

const colorMap = {
  brown: '#8b5a2b',
  red: '#dc3545',
  yellow: '#ffc107',
  gray: '#6c757d',
  blue: '#0d6efd'
};

function MetroMap({ network, showLines, startStationId = null, endStationId = null }) {
  const groupedLines = network.lines.map((line) => {
    const stations = network.lineStations
      .filter((ls) => ls.lineId === line.id)
      .sort((a, b) => a.position - b.position);

    return {
      ...line,
      stations
    };
  });

  return (
    <div className="metro-map-wrapper">
      <svg viewBox="0 0 1200 640" className="metro-map">
        {showLines && groupedLines.map((line) => (
          <polyline
            key={line.id}
            points={line.stations
              .map((s) => {
                const position = stationPositions[s.stationName];
                return `${position.x},${position.y}`;
              })
              .join(' ')}
            fill="none"
            stroke={colorMap[line.color] || line.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {network.stations.map((station) => {

          const isStart = station.id === startStationId;
          const isEnd = station.id === endStationId;

          const position = stationPositions[station.name];

          if (!position) return null;

          const lines = labelLines[station.name] || [station.name];

          return (
            <g key={station.id}>
              <circle
                cx={position.x}
                cy={position.y}
                r="11"
                fill={
                  isStart
                    ? '#28a745'
                    : isEnd
                      ? '#dc3545'
                      : 'white'
                }
                stroke="#111"
                strokeWidth="3"
              />

              <text
                x={position.x + position.label.x}
                y={position.y + position.label.y}
                className={isStart || isEnd ? 'station-label station-label-important' : 'station-label'}
                textAnchor="middle"
              >
                {lines.map((line, index) => (
                  <tspan
                    key={line}
                    x={position.x + position.label.x}
                    dy={index === 0 ? 0 : 20}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>

      {showLines && (
        <div className="metro-legend">
          {network.lines.map((line) => (
            <span key={line.id} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: colorMap[line.color] || line.color }}
              />
              {line.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default MetroMap;