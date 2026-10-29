import React from 'react';
import type { WrappedData } from "wrapped";
import type { ShapeData } from "./graphics";
import { ShapePropIds } from "./Shape";
import { useWrapped, useWrappedProperty } from "./useWrapped";

export function Elem(props: {data: WrappedData<ShapeData>}) {
    const data = useWrapped(props.data);
    const color = useWrappedProperty(props.data, ShapePropIds.shapeColor);
    return (
        <circle cx={data.get().x} cy={data.get().y} r={5} fill={color.get()}/>
    );
};