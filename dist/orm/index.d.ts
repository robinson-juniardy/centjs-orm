import "reflect-metadata";
export declare type EntityName = string;
export declare type ORMOrderByMethod = "ASC" | "DESC";
export declare type ORMJoinType = "LEFT" | "RIGHT" | "INNER";
export declare type varchar = string | string[];
export declare type integer = number | number[] | BigInt | BigInt[];
export declare type decimal = Float32List;
export declare type bool = boolean | boolean[];
export declare type date = Date | Date[] | string | string[];
export declare type TGetRefeferences<M> = keyof M;
export declare type GenericModelType<T> = new (...args: any[]) => T;
export declare type valueOf<T> = T[keyof T];
export declare type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
declare type TCondition = "=" | "!==" | "IN" | "NOT IN";
declare type TConditionValue = string | number | boolean | symbol | Array<any>;
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
export declare type IOrmJoin<ref> = Array<{
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
        equal?: Partial<{
            [Property in keyof model]: model[Property];
        }>;
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
export declare function Model(name: EntityName): ClassDecorator;
export declare function References<ref>(references: IReferences<ref>): (target: any, propertyKey: string) => void;
export declare function Column(options: ORMColumnEntity): (target: any, propertyKey: string) => void;
export declare function GetOrmModelInstance<entity>(Entity: new (...args: any[]) => entity): {
    entityName: any;
    property: ORMEntityModel[];
    references: any;
};
export declare class OrmInstance<instances> {
    protected _model: new (...args: any[]) => any;
    protected _joinPayload: string;
    protected _columns: Array<any>;
    protected _instance: object;
    protected _serializer: boolean;
    protected _result: string;
    protected _where: string;
    protected _inValues: string;
    protected _notInValues: string;
    protected _search: string;
    protected _equals: string;
    protected _notEquals: string;
    protected _custom: string;
    protected _condition: boolean;
    protected _order: string;
    protected _group: string;
    protected _notSerializeColumn: Array<any>;
    constructor(model?: new (...args: any[]) => instances);
    condition(): this;
    find(column: Array<"*" | keyof instances>, options?: {
        serialize: boolean;
    }): this;
    join<Refs>(References: new (...args: any[]) => Refs, type: ORMJoinType, deliverColumn?: Array<keyof Refs>): this;
    nestedJoin<FK, Refs>(fk: new (...args: any[]) => FK, ref: new (...args: any[]) => Refs, type: ORMJoinType, deliverColumn?: Array<keyof Refs>): this;
    selfSearch<M extends instances>(values: Partial<M>): this;
    SelfEqual<M extends instances>(values: Partial<M>): this;
    selfNotEqual<M extends instances>(values: Partial<M>): this;
    otherEqual<M>(options: {
        model: GenericModelType<M>;
        values: Partial<M>;
    }): this;
    otherNotEqual<M>(options: {
        model: GenericModelType<M>;
        values: Partial<M>;
    }): this;
    selfInValues<M extends instances>(values: Partial<M>): this;
    otherNotInValues<M extends instances>(options: {
        model: GenericModelType<M>;
        values: Partial<M>;
    }): this;
    selfNotInValues<M extends instances>(values: Partial<M>): this;
    otherInValues<M>(options: {
        model: GenericModelType<M>;
        values: Partial<M>;
    }): this;
    otherSearch<M>(options: {
        model: GenericModelType<M>;
        values: Partial<M>;
    }): this;
    selfOrder(options: [Array<keyof instances>, ORMOrderByMethod]): this;
    otherOrder<M>(options: {
        model: new (...args: any[]) => M;
        values: [Array<keyof M>, ORMOrderByMethod];
    }): this;
    groupByAll(): this;
    groupByKey<T>(model: GenericModelType<T>, column: Array<keyof T>): this;
    createWhere(): this;
    Result(): string;
}
export declare abstract class StoredProcedure {
    static exec<sp extends StoredProcedure>(this: new (...args: any[]) => sp, params: Partial<sp>): string;
}
export {};
//# sourceMappingURL=index.d.ts.map