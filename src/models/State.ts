import { Model, DataTypes } from "sequelize";
import { sequelize } from "../instances/pg";

export interface StateInterface extends Model {
    id: number,
    name: string,
}

export const State = sequelize.define<StateInterface>('States', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    name: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'states',
    timestamps: false
});