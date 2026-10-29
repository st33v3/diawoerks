import { Result } from "utils";
import { AnyWrapped, PropertyBag, propertyBagBuilder, propertyDecl, propertyFactoryBuilder, propertyId, PropertyTypeMirror, PropertyWithDefault, UnsetProperty, WrappedData, WrappedValue } from "wrapped";
import { ShapeData } from "./graphics";

type Color = string;

export const ShapePropIds = {
    shapeColor: propertyId<Color>("Shape.shapeColor")
}



export class ColorMirror extends PropertyTypeMirror<Color> {
    constructor() {
        super("Shape.shapeColor", true, "string", "string");
    }
    public assert(value: unknown): Result<Color, string> {
        if (typeof value !== "string") return Result.failure("Invalid color");
        if (!/^#[0-9A-Fa-f]{6}$/.test(value)) return Result.failure("Invalid color");
        return Result.success(value as Color);
    }

    public static instance = new ColorMirror();
}

export const ShapeProps: PropertyBag = propertyBagBuilder()
    .add(propertyDecl(ShapePropIds.shapeColor, ColorMirror.instance, "Shape.shapeColor"))
    .build();

export const globalColor = new WrappedValue<Color>(null, undefined, "#000000");

export class Shape extends WrappedData<ShapeData> {
    constructor(parent: AnyWrapped | null, key: PropertyKey | undefined, value: ShapeData) {
        super(parent, key, value, Shape.props);
    }

    static props = propertyFactoryBuilder()
        .addFromBag(ShapePropIds.shapeColor, ShapeProps, (decl) => new PropertyWithDefault(UnsetProperty, decl, globalColor))
        .build();
}

export function shapeContractFactory(parent: AnyWrapped, key: PropertyKey, data: ShapeData): Result<Shape, Error> {
    if (!(data instanceof ShapeData)) return Result.failure(new Error("Expecting ShapeData"));      
    return Result.success(new Shape(parent, key, data));
}