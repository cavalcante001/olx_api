import { Model, DataTypes } from "sequelize";
import { sequelize } from "../instances/pg";

export interface UserInterface extends Model {
    id: number,
    name: string,
    email: string,
    state: string,
    passwordHash: string,
}

export const User = sequelize.define<UserInterface>('Users', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    name: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    state: {
        type: DataTypes.STRING
    },
    passwordHash: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'users',
    timestamps: false
});