const stationPositions = {
  'Paddington': { x: 120, y: 300, label: { x: 0, y: -25 } },
  'Marylebone': { x: 300, y: 300, label: { x: 0, y: -25 } },
  'Baker Street': { x: 430, y: 300, label: { x: -15, y: 30 }, lines: ['Baker', 'Street'] },
  "Regent's Park": { x: 560, y: 300, label: { x: 0, y: -45 }, lines: ["Regent's", 'Park'] },
  'Oxford Circus': { x: 680, y: 300, label: { x: 40, y: -40 }, lines: ['Oxford', 'Circus'] },
  'Piccadilly Circus': { x: 850, y: 300, label: { x: 0, y: -45 }, lines: ['Piccadilly', 'Circus'] },
  'Charing Cross': { x: 980, y: 300, label: { x: 0, y: -45 }, lines: ['Charing', 'Cross'] },

  'Marble Arch': { x: 430, y: 450, label: { x: 0, y: -45 }, lines: ['Marble', 'Arch'] },
  'Bond Street': { x: 560, y: 450, label: { x: -30, y: 30 }, lines: ['Bond', 'Street'] },
  'Tottenham Court Road': { x: 850, y: 450, label: { x: 25, y: -45 }, lines: ['Tottenham', 'Court Road'] },
  'British Museum': { x: 980, y: 450, label: { x: 0, y: -45 }, lines: ['British', 'Museum'] },
  'Holborn': { x: 1100, y: 450, label: { x: 0, y: -25 } },

  'Westbourne Park': { x: 120, y: 170, label: { x: 0, y: -45 }, lines: ['Westbourne', 'Park'] },
  'Royal Oak': { x: 300, y: 170, label: { x: 0, y: -45 }, lines: ['Royal', 'Oak'] },
  'Great Portland Street': { x: 560, y: 100, label: { x: 0, y: -45 }, lines: ['Great Portland', 'Street'] },
  "King's Cross St. Pancras": { x: 850, y: 100, label: { x: 0, y: -45 }, lines: ["King's Cross", 'St. Pancras'] },
  'Farringdon': { x: 980, y: 100, label: { x: 0, y: -25 } },
  'Barbican': { x: 1100, y: 100, label: { x: 0, y: -25 } },

  'Green Park': { x: 680, y: 600, label: { x: 35, y: -40 }, lines: ['Green', 'Park'] },
  'Westminster': { x: 850, y: 600, label: { x: 0, y: -25 } },
  'Waterloo': { x: 980, y: 600, label: { x: 0, y: -25 } },

  'Euston': { x: 800, y: 200, label: { x: -30, y: -25 } },
  'Warren Street': { x: 680, y: 200, label: { x: 0, y: -45 }, lines: ['Warren', 'Street'] },
  'Victoria': { x: 500, y: 600, label: { x: 0, y: -25 } }
};


const colorMap = {
  brown: '#8b5a2b',
  red: '#dc3545',
  yellow: '#ffc107',
  gray: '#6c757d',
  blue: '#0d6efd'
};


function MetroMap(props) {

  return (
    <div className="metro-map-wrapper">
      <svg viewBox="0 0 1200 640" className="metro-map">

        {props.showLines && props.network.lines.map((line) => (
          
          <polyline
            key={line.id}
            points={line.stations.map((station) => {
              const position = stationPositions[station.name];
              return `${position.x},${position.y}`;
            }).join(' ')}
            fill="none"
            stroke={colorMap[line.color] || line.color}
            strokeWidth="9"
          />
        ))}

        {props.network.stations.map((station) => {

          let isStart = false;
          let isEnd = false;

          if (station.id === props.startStationId) {
            isStart = true;
          }

          if (station.id === props.endStationId) {
            isEnd = true;
          }

          const position = stationPositions[station.name];

          if (!position) return null;

          const labelText = position.lines || [station.name];

          return (
            <g key={station.id}>
              <circle
                cx={position.x}
                cy={position.y}
                r="11"
                fill={isStart ? '#28a745' : isEnd ? '#dc3545' : 'white'}
                stroke="#111"
                strokeWidth="3"
              />

              <text
                x={position.x + position.label.x}
                y={position.y + position.label.y}
                className={isStart || isEnd ? 'station-label station-label-important' : 'station-label'}
                textAnchor="middle"
              >

                {labelText.map((name, index) => (
                  <tspan
                    key={name}
                    x={position.x + position.label.x}
                    dy={index === 0 ? 0 : 20}
                  >
                    {name}
                  </tspan>
                ))}

              </text>
            </g>
          );
        })}
      </svg>

      {props.showLines && (
        <div className="metro-legend">
          {props.network.lines.map((line) => (
            <span key={line.id} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: colorMap[line.color] || line.color }}/>
              {line.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default MetroMap;