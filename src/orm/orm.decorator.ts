import "reflect-metadata";
import { orm_metadata } from "./orm.metadata";
import {
  EntityName,
  IReferences,
  ORMColumnEntity,
  ORMEntityModel,
  OrmForeignKeyModel,
} from "./orm.types";

export function Model(name: EntityName): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(orm_metadata.MODEL, name, target);
  };
}

export function References<ref>(references: IReferences<ref>) {
  return (target: any, propertyKey: string) => {
    const Reference: IReferences<ref>[] = Reflect.hasMetadata(
      orm_metadata.REFERENCES,
      target.constructor
    )
      ? Reflect.getMetadata(orm_metadata.REFERENCES, target.constructor)
      : [];

    Reference.push({
      model: references.model,
      key: references.key,
      fk: propertyKey,
    });

    Reflect.defineMetadata(
      orm_metadata.REFERENCES,
      Reference,
      target.constructor
    );
  };
}

export function Column(options: ORMColumnEntity) {
  return (target: any, propertyKey: string) => {
    const Columns: ORMEntityModel[] = Reflect.hasMetadata(
      orm_metadata.INSTANCE,
      target.constructor
    )
      ? Reflect.getMetadata(orm_metadata.INSTANCE, target.constructor)
      : [];
    const References = Reflect.getMetadata(
      orm_metadata.REFERENCES,
      target.constructor
    );

    Columns.push({
      property: propertyKey,
      options: options,
    });

    Reflect.defineMetadata(orm_metadata.INSTANCE, Columns, target.constructor);
  };
}
