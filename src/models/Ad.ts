import { Model, DataTypes } from "sequelize";
import { sequelize } from "../instances/pg";

export interface AdInterface extends Model {
    id: number,
    images: any,
    status: boolean,
    dateCreated: Date,
    title: string,
    category: string,
    priceNegotiable: boolean,
    description: string,
    views: number,
    idUser: number,
    price: number
}

export const Ad = sequelize.define<AdInterface>('Ad', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    images: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.BOOLEAN
    },
    dateCreated: {
        type: DataTypes.DATE
    },
    title: {
        type: DataTypes.STRING
    },
    category: {
        type: DataTypes.STRING
    },
    priceNegotiable: {
        type: DataTypes.BOOLEAN
    },
    description: {
        type: DataTypes.STRING
    },
    views: {
        type: DataTypes.NUMBER
    },
    idUser: {
        type: DataTypes.INTEGER
    },
    price: {
        type: DataTypes.FLOAT
    }
}, {
    tableName: 'ad',
    timestamps: false
});