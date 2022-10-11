"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoredProcedure = exports.OrmInstance = exports.GetOrmModelInstance = exports.Column = exports.References = exports.Model = void 0;
require("reflect-metadata");
var orm_metadata;
(function (orm_metadata) {
    orm_metadata["MODEL"] = "model";
    orm_metadata["COLUMN"] = "column";
    orm_metadata["INSTANCE"] = "instance";
    orm_metadata["FOREIGN"] = "foreign_key";
    orm_metadata["REFERENCES"] = "references";
})(orm_metadata || (orm_metadata = {}));
var OrmQ;
(function (OrmQ) {
    OrmQ["SELECT"] = "SELECT";
    OrmQ["ENDL"] = "\n";
    OrmQ["ALL"] = "*";
    OrmQ["FROM"] = "FROM";
    OrmQ["WHERE"] = "WHERE";
    OrmQ["JOIN"] = "JOIN";
    OrmQ["JOIN_ON"] = "ON";
    OrmQ["EQUALS"] = "=";
    OrmQ["IN_OPERATOR"] = "IN";
    OrmQ["OR_OPERATOR"] = "OR";
    OrmQ["INSERT"] = "INSERT";
    OrmQ["INSERT_VALUES"] = "VALUES";
    OrmQ["ORDER_BY"] = "ORDER BY";
    OrmQ["GROUP_BY"] = "GROUP BY";
})(OrmQ || (OrmQ = {}));
function Model(name) {
    return (target) => {
        Reflect.defineMetadata(orm_metadata.MODEL, name, target);
    };
}
exports.Model = Model;
function References(references) {
    return (target, propertyKey) => {
        const Reference = Reflect.hasMetadata(orm_metadata.REFERENCES, target.constructor)
            ? Reflect.getMetadata(orm_metadata.REFERENCES, target.constructor)
            : [];
        Reference.push({
            model: references.model,
            key: references.key,
            fk: propertyKey,
        });
        Reflect.defineMetadata(orm_metadata.REFERENCES, Reference, target.constructor);
    };
}
exports.References = References;
function Column(options) {
    return (target, propertyKey) => {
        const Columns = Reflect.hasMetadata(orm_metadata.INSTANCE, target.constructor)
            ? Reflect.getMetadata(orm_metadata.INSTANCE, target.constructor)
            : [];
        const References = Reflect.getMetadata(orm_metadata.REFERENCES, target.constructor);
        Columns.push({
            property: propertyKey,
            options: options,
        });
        Reflect.defineMetadata(orm_metadata.INSTANCE, Columns, target.constructor);
    };
}
exports.Column = Column;
function GetOrmModelInstance(Entity) {
    const entityName = Reflect.getMetadata(orm_metadata.MODEL, Entity);
    const EntityInstance = Reflect.hasMetadata(orm_metadata.INSTANCE, Entity)
        ? Reflect.getMetadata(orm_metadata.INSTANCE, Entity)
        : [];
    const References = Reflect.getMetadata(orm_metadata.REFERENCES, Entity);
    const instances = new Entity();
    EntityInstance.forEach((props) => {
        instances[props.property] = {
            ...props.options,
        };
    });
    return {
        entityName,
        property: EntityInstance,
        references: References,
    };
}
exports.GetOrmModelInstance = GetOrmModelInstance;
class OrmInstance {
    _model;
    _joinPayload;
    _columns;
    _instance;
    _serializer;
    _result;
    _where;
    _inValues;
    _notInValues;
    _search;
    _equals;
    _notEquals;
    _custom;
    _condition;
    _order;
    _group;
    _notSerializeColumn;
    constructor(model) {
        this._model = model;
        this._joinPayload = "";
        this._columns = [];
        this._instance = GetOrmModelInstance(this._model);
        this._serializer = false;
        this._condition = false;
        this._result = "";
        this._where = "";
        this._inValues = "";
        this._notInValues = "";
        this._search = "";
        this._equals = "";
        this._notEquals = "";
        this._custom = "";
        this._order = "";
        this._group = "";
        this._notSerializeColumn = [];
        this._where = "";
    }
    condition() {
        this._condition = true;
        return this;
    }
    find(column, options) {
        this._serializer = options.serialize ? true : false;
        let serializeField = [];
        let notSerializedField = [];
        for (let props of this._instance["property"].filter((v) => column.includes(v.property))) {
            if (options.serialize) {
                serializeField.push(`${this._instance["entityName"]}.${props["property"]} ${props["options"]["serializeName"]
                    ? `AS ${props["options"]["serializeName"]}`
                    : ""}`);
                notSerializedField.push(`${this._instance["entityName"]}.${props["property"]}`);
            }
            else {
                serializeField.push(`${this._instance["entityName"]}.${props["property"]}`);
                notSerializedField.push(`${this._instance["entityName"]}.${props["property"]}`);
            }
        }
        this._columns = this._columns.concat(serializeField);
        this._notSerializeColumn =
            this._notSerializeColumn.concat(notSerializedField);
        return this;
    }
    join(References, type, deliverColumn) {
        const instanceRef = GetOrmModelInstance(References);
        const instanceModel = GetOrmModelInstance(this._model);
        for (let ref of instanceModel.references.filter((v) => GetOrmModelInstance(v.model).entityName === instanceRef.entityName)) {
            this._joinPayload = this._joinPayload.concat(type, " ", OrmQ.JOIN, " ", instanceRef.entityName, " ", OrmQ.JOIN_ON, " ", `${instanceRef.entityName}.${ref.key} = ${instanceModel.entityName}.${ref.fk}\n`);
        }
        if (this._serializer) {
            for (let props of instanceRef.property.filter((v) => deliverColumn.includes(v.property))) {
                this._columns = this._columns.concat(`${instanceRef.entityName}.${props.property} AS ${props.options.serializeName}`);
                this._notSerializeColumn = this._notSerializeColumn.concat(deliverColumn.map((col) => `${instanceRef.entityName}.${String(col)}`));
            }
        }
        else {
            this._columns = this._columns.concat(deliverColumn.map((col) => `${instanceRef.entityName}.${String(col)}`));
            this._notSerializeColumn = this._notSerializeColumn.concat(deliverColumn.map((col) => `${instanceRef.entityName}.${String(col)}`));
        }
        return this;
    }
    nestedJoin(fk, ref, type, deliverColumn) {
        const instanceRef = GetOrmModelInstance(ref);
        const instanceFK = GetOrmModelInstance(fk);
        for (let R of instanceFK.references.filter((v) => GetOrmModelInstance(v.model).entityName === instanceRef.entityName)) {
            this._joinPayload = this._joinPayload.concat(type, " ", OrmQ.JOIN, " ", instanceRef.entityName, " ", OrmQ.JOIN_ON, " ", `${instanceFK.entityName}.${R.fk} = ${GetOrmModelInstance(R.model).entityName}.${R.key}\n`);
        }
        this._columns = this._columns.concat(deliverColumn);
        return this;
    }
    selfSearch(values) {
        let searchPayload = [];
        let searchParams = [];
        for (let [key, value] of Object.entries(values)) {
            searchParams.push({ key, value });
        }
        searchPayload = searchPayload.concat(String(searchParams.map((props) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} LIKE '${props.value}%' `;
        })).replaceAll(",", " AND\n"));
        this._search = this._search.concat(this._condition
            ? String(` AND ${searchPayload}`)
            : String(` AND ${searchPayload}`));
        this._condition = true;
        return this;
    }
    SelfEqual(values) {
        let equalPayload = [];
        let equalParams = [];
        for (let [key, value] of Object.entries(values)) {
            equalParams.push({ key, value });
        }
        equalPayload = equalPayload.concat(String(equalParams.map((props) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} = ${typeof props.value === "string" ? `'${props.value}'` : props.value}`;
        })).replaceAll(",", " AND\n"));
        this._equals = this._equals.concat(this._condition
            ? String(`AND ${equalPayload}`)
            : String(`AND ${equalPayload}`));
        this._condition = true;
        return this;
    }
    selfNotEqual(values) {
        let equalPayload = [];
        let equalParams = [];
        for (let [key, value] of Object.entries(values)) {
            equalParams.push({ key, value });
        }
        equalPayload = equalPayload.concat(String(equalParams.map((props) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} !== ${typeof props.value === "string" ? `'${props.value}'` : props.value}`;
        })).replaceAll(",", " AND\n"));
        this._equals = this._equals.concat(this._condition
            ? String(`AND ${equalPayload}`)
            : String(`AND ${equalPayload}`));
        this._condition = true;
        return this;
    }
    otherEqual(options) {
        let equalPayload = [];
        let equalParams = [];
        for (let [key, value] of Object.entries(options.values)) {
            equalParams.push({ key, value });
        }
        equalPayload = equalPayload.concat(String(equalParams.map((props) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} = ${typeof props.value === "string" ? `'${props.value}'` : props.value}`;
        })).replaceAll(",", " AND\n"));
        this._equals = this._equals.concat(this._condition
            ? String(`AND ${equalPayload}`)
            : String(`AND ${equalPayload}`));
        this._condition = true;
        return this;
    }
    otherNotEqual(options) {
        let equalPayload = [];
        let equalParams = [];
        for (let [key, value] of Object.entries(options.values)) {
            equalParams.push({ key, value });
        }
        equalPayload = equalPayload.concat(String(equalParams.map((props) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} !== ${typeof props.value === "string" ? `'${props.value}'` : props.value}`;
        })).replaceAll(",", " AND\n"));
        this._equals = this._equals.concat(this._condition
            ? String(`AND ${equalPayload}`)
            : String(`AND ${equalPayload}`));
        this._condition = true;
        return this;
    }
    selfInValues(values) {
        let inValuesPayload = [];
        let inValuesParams = [];
        for (let [key, value] of Object.entries(values)) {
            inValuesParams.push({ key, value });
        }
        inValuesPayload = inValuesPayload.concat(String(inValuesParams.map((props, index) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} IN (${String(props.value.map((v) => {
                return typeof v === "string" ? `'${v}'` : v;
            })).replaceAll(",", "^")})`;
        })).replaceAll(",", " AND "));
        let payload = String(inValuesPayload).replaceAll("^", ",");
        this._inValues = this._inValues.concat(this._condition
            ? String(` \nAND ${payload}`)
            : String(` \nAND ${payload}`));
        this._condition = true;
        return this;
    }
    otherNotInValues(options) {
        let NotinValuesPayload = [];
        let NotinValuesParams = [];
        for (let [key, value] of Object.entries(options.values)) {
            NotinValuesParams.push({ key, value });
        }
        NotinValuesPayload = NotinValuesPayload.concat(String(NotinValuesParams.map((props, index) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} NOT IN (${String(props.value.map((v) => {
                return typeof v === "string" ? `'${v}'` : v;
            })).replaceAll(",", "^")})`;
        })).replaceAll(",", " AND "));
        let payload = String(NotinValuesPayload).replaceAll("^", ",");
        this._inValues = this._inValues.concat(this._condition
            ? String(` \nAND ${payload}`)
            : String(` \nAND ${payload}`));
        this._condition = true;
        return this;
    }
    selfNotInValues(values) {
        let NotinValuesPayload = [];
        let NotinValuesParams = [];
        for (let [key, value] of Object.entries(values)) {
            NotinValuesParams.push({ key, value });
        }
        NotinValuesPayload = NotinValuesPayload.concat(String(NotinValuesParams.map((props, index) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} NOT IN (${String(props.value.map((v) => {
                return typeof v === "string" ? `'${v}'` : v;
            })).replaceAll(",", "^")})`;
        })).replaceAll(",", " AND "));
        let payload = String(NotinValuesPayload).replaceAll("^", ",");
        this._inValues = this._inValues.concat(this._condition
            ? String(` \nAND ${payload}`)
            : String(` \nAND ${payload}`));
        this._condition = true;
        return this;
    }
    otherInValues(options) {
        let inValuesPayload = [];
        let inValuesParams = [];
        for (let [key, value] of Object.entries(options.values)) {
            inValuesParams.push({ key, value });
        }
        inValuesPayload = inValuesPayload.concat(String(inValuesParams.map((props, index) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} IN (${String(props.value.map((v) => {
                return typeof v === "string" ? `'${v}'` : v;
            })).replaceAll(",", "^")})`;
        })).replaceAll(",", " AND "));
        let payload = String(inValuesPayload).replaceAll("^", ",");
        this._inValues = this._inValues.concat(this._condition
            ? String(` \nAND ${payload}`)
            : String(` \nAND ${payload}`));
        this._condition = true;
        return this;
    }
    otherSearch(options) {
        let searchPayload = [];
        let searchParams = [];
        for (let [key, value] of Object.entries(options.values)) {
            searchParams.push({ key, value });
        }
        searchPayload = searchPayload.concat(String(searchParams.map((props) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} LIKE '${props.value ? props.value : "_"}%' `;
        })).replaceAll(",", " AND\n"));
        this._search = this._search.concat(this._condition
            ? String(` AND ${searchPayload}$`)
            : String(` AND ${searchPayload}$`));
        this._condition = true;
        return this;
    }
    selfOrder(options) {
        this._order = this._order.concat(String(`${GetOrmModelInstance(this._model).entityName}.${options[0]}`), " ", options[1]);
        return this;
    }
    otherOrder(options) {
        this._order = this._order.concat(String(`${GetOrmModelInstance(options.model).entityName}.${options.values[0]}`), " ", options.values[1]);
        return this;
    }
    groupByAll() {
        this._group = this._group.concat(String(this._notSerializeColumn));
        return this;
    }
    groupByKey(model, column) {
        this._group = this._group.concat(String(column.map((props) => String(`${GetOrmModelInstance(model).entityName}.${String(props)}`))));
        return this;
    }
    createWhere() {
        this._where = this._where
            .concat(OrmQ.ENDL, this._equals.length > 0 ? this._equals : "", this._notEquals.length > 0 ? this._notEquals : "", this._search.length > 0 ? this._search : "", this._inValues.length > 0 ? this._inValues : "", this._notInValues.length > 0 ? this._notInValues : "", this._custom.length > 0 ? this._custom : "", this._order.length > 0 ? `${OrmQ.ENDL}ORDER BY ${this._order}` : "", this._group.length > 0 ? `${OrmQ.ENDL}GROUP BY ${this._group}` : "")
            .replace("AND", "");
        return this;
    }
    Result() {
        this._result = this._result.concat(OrmQ.SELECT, OrmQ.ENDL, "   ", String(this._columns), OrmQ.ENDL, OrmQ.FROM, " ", String(this._instance["entityName"]), OrmQ.ENDL, String(this._joinPayload), this._condition && `WHERE`, this._where);
        return this._result;
    }
}
exports.OrmInstance = OrmInstance;
class StoredProcedure {
    static exec(params) {
        let instancePayload = new Array();
        for (let [key, value] of Object.entries(params)) {
            if (typeof value === "string") {
                instancePayload.push(`@${String(key)} = '${value}'`);
            }
            else {
                instancePayload.push(`@${String(key)} = ${value}`);
            }
        }
        const payload = `EXEC ${this.sp_name} ${instancePayload}`;
        return payload;
    }
}
exports.StoredProcedure = StoredProcedure;
//# sourceMappingURL=index.js.map