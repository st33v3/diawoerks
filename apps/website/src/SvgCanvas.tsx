import React from 'react';
import { Group } from './group';
import { graphics } from './graphics';

export function SvgCanvas() {
    return (
      <svg width="100%" height="100%">
        <defs>
          {/* Define the repeating dot pattern tile */}
          <pattern id="dot-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="0.9" fill="#333333" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        <Group list={graphics.shapes}/>
      </svg>
    );
}

