import React from 'react';

import { WrappedList } from "wrapped";
import type { ShapeData } from "./graphics";
import { useWrapped } from "./useWrapped";
import { Range } from "immutable";
import { Elem } from "./Elem";
import { shapeContractFactory } from './Shape';

export function Group(props: {list: WrappedList<ShapeData>}) {
    const list = useWrapped(props.list);
    const range = Range(0, list.get().size);
    return (
        <>
        {
            range.map(index => <Elem key={index} data={list.descentContract(index, shapeContractFactory).get()}/>)
        }
        </>
    );
}