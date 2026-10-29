import { WrappedList } from "wrapped";
import { DataClass } from "utils";
import * as Immutable from "immutable";

export class ShapeData extends DataClass({x: 0, y: 0}){}

const shapes = new WrappedList(null, undefined, Immutable.List<ShapeData>());
export const graphics = {
    shapes
} as const;