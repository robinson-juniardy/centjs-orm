import { OrmQ } from "./orm.enum";
import { orm_metadata } from "./orm.metadata";
import {
  GenericModelType,
  ORMEntityModel,
  ORMJoinType,
  ORMOrderByMethod,
} from "./orm.types";

  
export class OrmInstance<instances> {

    protected _model: new (...args: any[]) => any

    protected _joinPayload: string

    protected _columns: Array<any>

    protected _instance: object

    protected _serializer: boolean

    protected _result: string

    protected _where: string

    protected _inValues: string

    protected _notInValues: string

    protected _search: string

    protected _equals: string

    protected _notEquals: string

    protected _custom: string

    protected _condition: boolean

    protected _order: string

    protected _group: string

    protected _notSerializeColumn: Array<any>

    constructor(model?: new (...args: any[]) => instances) {

        this._model = model

        this._joinPayload = ""

        this._columns = []

        this._instance = GetOrmModelInstance(this._model)

        this._serializer = false

        this._condition = false

        this._result = ""

        this._where = ""

        this._inValues = ""

        this._notInValues = ""

        this._search = ""

        this._equals = ""

        this._notEquals = ""

        this._custom = ""

        this._order = ""

        this._group = ""

        this._notSerializeColumn = []

        this._where = ""
    }

    public condition() {
        this._condition = true
        return this
    }

    public find(column: Array<"*" | keyof instances>, options?: { serialize: boolean }) {
        this._serializer = options.serialize ? true : false        
        let serializeField: Array<any> = []
        let notSerializedField: Array<any> = []

        for (let props of this._instance["property"].filter((v) => column.includes(v.property))) {
            if (options.serialize) {
                serializeField.push(`${this._instance["entityName"]}.${props["property"]} ${props["options"]["serializeName"] ? `AS ${props["options"]["serializeName"]}` : ''}`)
                notSerializedField.push(`${this._instance["entityName"]}.${props["property"]}`)
            } else {
                serializeField.push(`${this._instance["entityName"]}.${props["property"]}`)
                notSerializedField.push(`${this._instance["entityName"]}.${props["property"]}`)
            }
        }

        this._columns = this._columns.concat(serializeField)
        this._notSerializeColumn = this._notSerializeColumn.concat(notSerializedField)
        
        return this
    }

    public join<Refs>(References: new(...args: any[]) => Refs, type: ORMJoinType, deliverColumn?: Array<keyof Refs>) {
        const instanceRef = GetOrmModelInstance(References)
        const instanceModel = GetOrmModelInstance(this._model)
        for (let ref of instanceModel.references.filter((v) => GetOrmModelInstance(v.model).entityName === instanceRef.entityName)) {
            this._joinPayload = this._joinPayload.concat(type, ' ',
                OrmQ.JOIN, ' ',
                instanceRef.entityName, ' ',
                OrmQ.JOIN_ON, ' ', `${instanceRef.entityName}.${ref.key} = ${instanceModel.entityName}.${ref.fk}\n`)
        }
        if (this._serializer) {
            for (let props of instanceRef.property.filter((v) => deliverColumn.includes(v.property as keyof Refs))) {
                    this._columns = this._columns.concat(`${instanceRef.entityName}.${props.property} AS ${props.options.serializeName}`)   
                    this._notSerializeColumn = this._notSerializeColumn.concat(deliverColumn.map((col) => `${instanceRef.entityName}.${String(col)}`))
            }
        } else {
            this._columns = this._columns.concat(deliverColumn.map((col) => `${instanceRef.entityName}.${String(col)}`))
            this._notSerializeColumn = this._notSerializeColumn.concat(deliverColumn.map((col) => `${instanceRef.entityName}.${String(col)}`))

        }
        
        return this
    }

    public nestedJoin<FK, Refs>(fk: new(...args: any[]) => FK, ref: new(...args: any[]) => Refs, type: ORMJoinType, deliverColumn?: Array<keyof Refs>) {
        const instanceRef = GetOrmModelInstance(ref)
        const instanceFK = GetOrmModelInstance(fk)

        for (let R of instanceFK.references.filter((v) => GetOrmModelInstance(v.model).entityName === instanceRef.entityName)) {
            this._joinPayload = this._joinPayload.concat(type, ' ',
                OrmQ.JOIN, ' ',
                instanceRef.entityName, ' ',
                OrmQ.JOIN_ON, ' ', `${instanceFK.entityName}.${R.fk} = ${GetOrmModelInstance(R.model).entityName}.${R.key}\n`)
        }
        this._columns = this._columns.concat(deliverColumn)
        return this
    }


    public selfSearch<M extends instances>(values: Partial<M>) {
        let searchPayload = []
        let searchParams: Array<any> = []
        
        for (let [key, value] of Object.entries(values)) {
            searchParams.push({key,value})
        }

        searchPayload = searchPayload.concat(String(searchParams.map((props) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} LIKE '${props.value}%' `
        })).replaceAll(","," AND\n"))

        this._search = this._search.concat(this._condition ? String(` AND ${searchPayload}`) : String(` AND ${searchPayload}`))
        this._condition = true
        return this
    }

    public SelfEqual<M extends instances>(values: Partial<M>) {
        let equalPayload = []
        let equalParams : Array<any> = []
        
        for (let [key, value] of Object.entries(values)) {
            equalParams.push({key,value})
        }

        equalPayload = equalPayload.concat(String(equalParams.map((props) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} = ${typeof props.value === "string" ? `'${props.value}'` : props.value}`
        })).replaceAll(",", " AND\n"))
        
        this._equals = this._equals.concat(this._condition ? String(`AND ${equalPayload}`) : String(`AND ${equalPayload}`))
        this._condition = true

        return this
    }

    public selfNotEqual<M extends instances>(values: Partial<M>) {
        let equalPayload = []
        let equalParams : Array<any> = []
        
        for (let [key, value] of Object.entries(values)) {
            equalParams.push({key,value})
        }

        equalPayload = equalPayload.concat(String(equalParams.map((props) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} !== ${typeof props.value === "string" ? `'${props.value}'` : props.value}`
        })).replaceAll(",", " AND\n"))
        
        this._equals = this._equals.concat(this._condition ? String(`AND ${equalPayload}`) : String(`AND ${equalPayload}`))
        this._condition = true

        return this
    }

    public otherEqual<M>(options: {
        model:GenericModelType<M>,
        values: Partial<M>
    }) {
        let equalPayload = []
        let equalParams : Array<any> = []
        
        for (let [key, value] of Object.entries(options.values)) {
            equalParams.push({key,value})
        }

        equalPayload = equalPayload.concat(String(equalParams.map((props) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} = ${typeof props.value === "string" ? `'${props.value}'` : props.value}`
        })).replaceAll(",", " AND\n"))
        
        this._equals = this._equals.concat(this._condition ? String(`AND ${equalPayload}`) : String(`AND ${equalPayload}`))
        this._condition = true
        return this
    }

    public otherNotEqual<M>(options: {
        model: GenericModelType<M>,
        values: Partial<M>
    }) {
        let equalPayload = []
        let equalParams : Array<any> = []
        
        for (let [key, value] of Object.entries(options.values)) {
            equalParams.push({key,value})
        }

        equalPayload = equalPayload.concat(String(equalParams.map((props) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} !== ${typeof props.value === "string" ? `'${props.value}'` : props.value}`
        })).replaceAll(",", " AND\n"))
        
        this._equals = this._equals.concat(this._condition ? String(`AND ${equalPayload}`) : String(`AND ${equalPayload}`))
        this._condition = true
        return this
    }

    public selfInValues<M extends instances>(values: Partial<M>) {
        let inValuesPayload = []
        let inValuesParams : Array<any> = []
        
        for (let [key, value] of Object.entries(values)) {
            inValuesParams.push({key,value})
        }

        inValuesPayload = inValuesPayload.concat(String(inValuesParams.map((props, index) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} IN (${String(props.value.map((v) => {
                return typeof v === "string" ? `'${v}'` : v
            })).replaceAll(",","^")})`
        })).replaceAll(",", " AND "))

        let payload = String(inValuesPayload).replaceAll("^", ",")
        this._inValues = this._inValues.concat(this._condition ? String(` \nAND ${payload}`) : String(` \nAND ${payload}`))
        this._condition = true

        return this
    }

    public otherNotInValues<M extends instances>(options: {
        model: GenericModelType<M>
        values: Partial<M>
    }) {
        let NotinValuesPayload = []
        let NotinValuesParams : Array<any> = []
        
        for (let [key, value] of Object.entries(options.values)) {
            NotinValuesParams.push({key,value})
        }

        NotinValuesPayload = NotinValuesPayload.concat(String(NotinValuesParams.map((props, index) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} NOT IN (${String(props.value.map((v) => {
                return typeof v === "string" ? `'${v}'` : v
            })).replaceAll(",","^")})`
        })).replaceAll(",", " AND "))

        let payload = String(NotinValuesPayload).replaceAll("^", ",")
        this._inValues = this._inValues.concat(this._condition ? String(` \nAND ${payload}`) : String(` \nAND ${payload}`))
        this._condition = true

        return this
    }

    public selfNotInValues<M extends instances>(values: Partial<M>) {
        let NotinValuesPayload = []
        let NotinValuesParams : Array<any> = []
        
        for (let [key, value] of Object.entries(values)) {
            NotinValuesParams.push({key,value})
        }

        NotinValuesPayload = NotinValuesPayload.concat(String(NotinValuesParams.map((props, index) => {
            return `${GetOrmModelInstance(this._model).entityName}.${props.key} NOT IN (${String(props.value.map((v) => {
                return typeof v === "string" ? `'${v}'` : v
            })).replaceAll(",","^")})`
        })).replaceAll(",", " AND "))

        let payload = String(NotinValuesPayload).replaceAll("^", ",")
        this._inValues = this._inValues.concat(this._condition ? String(` \nAND ${payload}`) : String(` \nAND ${payload}`))
        this._condition = true

        return this
    }

    public otherInValues<M>(options: {
        model: GenericModelType<M>
        values: Partial<M>
    }) {
        let inValuesPayload = []
        let inValuesParams : Array<any> = []
        
        for (let [key, value] of Object.entries(options.values)) {
            inValuesParams.push({key,value})
        }

        inValuesPayload = inValuesPayload.concat(String(inValuesParams.map((props, index) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} IN (${String(props.value.map((v) => {
                return typeof v === "string" ? `'${v}'` : v
            })).replaceAll(",","^")})`
        })).replaceAll(",", " AND "))

        let payload = String(inValuesPayload).replaceAll("^", ",")
        this._inValues = this._inValues.concat(this._condition ? String(` \nAND ${payload}`) : String(` \nAND ${payload}`))
        this._condition = true

        return this
    }

    public otherSearch<M>(options: {
        model: GenericModelType<M>,
        values: Partial<M>
    }) {
        let searchPayload = []
        let searchParams: Array<any> = []
        
        for (let [key, value] of Object.entries(options.values)) {
            searchParams.push({key,value})
        }

        searchPayload = searchPayload.concat(String(searchParams.map((props) => {
            return `${GetOrmModelInstance(options.model).entityName}.${props.key} LIKE '${props.value ? props.value  : '_' }%' `
        })).replaceAll(",", " AND\n"))

        this._search = this._search.concat(this._condition ? String(` AND ${searchPayload}$`) :String(` AND ${searchPayload}$`))
        this._condition = true
        return this
    }

    public selfOrder(options: [Array<keyof instances>, ORMOrderByMethod]) {
        this._order = this._order.concat(String(`${GetOrmModelInstance(this._model).entityName}.${options[0]}`),' ',options[1])
        return this
    }

    public otherOrder<M>(options: {
        model: new (...args: any[]) => M,
        values: [Array<keyof M>, ORMOrderByMethod]
    }) {
        this._order = this._order.concat(String(`${GetOrmModelInstance(options.model).entityName}.${options.values[0]}`),' ',options.values[1])
        return this
    }

    public groupByAll() {
        this._group = this._group.concat(String(this._notSerializeColumn))
        return this
    }

    public groupByKey<T>(model : GenericModelType<T>, column: Array<keyof T>) {
        this._group = this._group.concat(String(column.map((props) => String(`${GetOrmModelInstance(model).entityName}.${String(props)}`))))
        return this
    }

    public createWhere() {
        this._where = this._where.concat(OrmQ.ENDL,
            this._equals.length > 0 ? this._equals : '',
            this._notEquals.length > 0 ? this._notEquals : '',
            this._search.length > 0 ? this._search : '',
            this._inValues.length > 0 ? this._inValues : '',
            this._notInValues.length > 0 ? this._notInValues : '',
            this._custom.length > 0 ? this._custom : '',
            this._order.length > 0 ?  `${OrmQ.ENDL}ORDER BY ${this._order}` : '',
            this._group.length > 0 ? `${OrmQ.ENDL}GROUP BY ${this._group}` : '').replace("AND","")
        return this
    }

    public Result() {
        this._result = this._result.concat(
            OrmQ.SELECT, OrmQ.ENDL,
            '   ',String(this._columns), OrmQ.ENDL, OrmQ.FROM,' ',
            String(this._instance["entityName"]), OrmQ.ENDL,
            String(this._joinPayload) , this._condition && `WHERE` , this._where
        )
        return this._result
    }
}




export function GetOrmModelInstance<entity>(
  Entity: new (...args: any[]) => entity
) {
  const entityName = Reflect.getMetadata(orm_metadata.MODEL, Entity);

  const EntityInstance: ORMEntityModel[] = Reflect.hasMetadata(
    orm_metadata.INSTANCE,
    Entity
  )
    ? Reflect.getMetadata(orm_metadata.INSTANCE, Entity)
        : [];
    const References = Reflect.getMetadata(
      orm_metadata.REFERENCES,
      Entity
    );

  const instances = new Entity() as any;

  EntityInstance.forEach((props) => {
    instances[props.property as keyof entity] = {
      ...props.options,
    };
  });
    

  return {
    entityName,
    property: EntityInstance,
    references: References
  };
}


