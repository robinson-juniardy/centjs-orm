export type EntityName = string;
export type ORMOrderByMethod = "ASC" | "DESC";
export type ORMJoinType = "LEFT" | "RIGHT" | "INNER";
export type varchar = string | string[];
export type integer = number | number[] | BigInt | BigInt[];
export type decimal = Float32List;
export type bool = boolean | boolean[];
export type date = Date | Date[] | string | string[];
export type TGetRefeferences<M> = keyof M;
export type GenericModelType<T> = new (...args: any[]) => T;
export type valueOf<T> = T[keyof T];
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
type TCondition = "=" | "!==" | "IN" | "NOT IN";
type TConditionValue = string | number | boolean | symbol | Array<any>;

export interface ORMColumnEntity {
  serializeName?: string;
  primary?: boolean;
  nullable?: boolean;
  default?: string | number | symbol | boolean;
}

export interface ORMEntityModel {
  property: string;
  options?: ORMColumnEntity;
}

export interface OrmForeignKeyModel {
  propertyKey: string;
}

export interface OrmCreateRef<ref> {
  refName: string;
  foreignName: string;
  field: keyof ref;
}

export interface IReferences<ref> {
  model: new (...args: any[]) => ref;
  key: keyof ref;
  fk?: string;
}

export type IOrmJoin<ref> = Array<{
  references: OrmCreateRef<ref>;
}>;

export interface ORMFetchAllOption<model, ref> {
  serialize?: boolean;
  groupBy?: Array<keyof model>;
  orderBy?: [keyof model, ORMOrderByMethod];
  join?: Array<{
    references: OrmCreateRef<ref>;
  }>;
  where?: {
    equal?: Partial<{ [Property in keyof model]: model[Property] }>;
    inVal?: any;
  };
}

export interface IWhereOptions<model> {
  findSearch?: Array<{
    key: keyof model;
    value: TConditionValue;
  }>;
  condition?: Array<{
    operator: TCondition;
    key: keyof model;
    value: TConditionValue;
  }>;
  custom?: string;
}
