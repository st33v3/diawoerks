import React from 'react';
import { createRoot } from 'react-dom/client';
import "./style.css";
import { SvgCanvas } from './SvgCanvas';
import { Range } from 'immutable';
import { graphics, ShapeData } from './graphics';
import { globalColor } from './Shape';

function addShapes(cnt: number) {
  const ss = Range(0, cnt).map((i) => new ShapeData({x: Math.random() * 800, y: Math.random() * 600 }));
  graphics.shapes.update(a => a.concat(ss));
}

function changeColor() {
  //random color
  const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  globalColor.set(color);
}

const elm = document.getElementById('app-container')!;
const root = createRoot(elm);
root.render(
  <React.StrictMode>
        <div className="left-pane">
          <div>
            <button onClick={() => addShapes(500)}>Click me</button>
          </div>
          <div>
            <button onClick={() => changeColor()}>Change Color</button>
          </div>
        </div>
        <div className="content-pane">
          <SvgCanvas />
        </div>
  </React.StrictMode>
);

