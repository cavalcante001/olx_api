import {Request, Response} from 'express';
import { validationResult ,matchedData } from 'express-validator';
import { User } from '../models/User';
import { State } from '../models/State';
import { Ad } from '../models/Ad';
import { Category } from '../models/Category';
const bcrypt = require('bcrypt');

export const getStates = async (req: Request, res: Response) => {
    let states = await  State.findAll();
    res.json({states});
}

export const info = async (req: Request, res: Response) => {
    const {id} = res.locals.token;

    const user = await User.findByPk(id);
    const state = await State.findByPk(user?.state);
    const ads = await Ad.findAll({where: {idUser: id}});

    let adList: any = [];

    for (let i in ads) {
        const cat = await Category.findOne({where: {slug: ads[i].category}});
        if(cat) {
            adList.push({
                id: ads[i].id,
                status: ads[i].status,
                images: ads[i].images,
                dateCreated: ads[i].dateCreated,
                title: ads[i].title,
                price: ads[i].price,
                priceNegotiable: ads[i].priceNegotiable,
                description: ads[i].description,
                views: ads[i].views,
                category: cat.slug
            });
        }
    }

    res.json({
        name: user?.name, 
        email: user?.email,
        state: state?.name,
        ads: adList
    });
}
export const editAction = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.json({error: errors.mapped()});
        return;
    }

    const data = matchedData(req);

    const { id } = res.locals.token;
    const user = await User.findByPk(id);

    if(data.name) {
        user!.update({name: data.name});
    }

    if(data.email) {
        const emailCheck = await User.findOne({where: {email: data.email}});
        if(emailCheck) {
            res.json({error: 'E-mail já existente'});
            return;
        }
        user!.update({email: data.email});
    }

    if(data.state) {
        const stateCheck = await State.findByPk(data.state);
        if(!stateCheck) {
            res.json({error: 'Estado não existe'});
            return;
        }

        user!.update({state: data.state});
    }

    if(data.password) {
        user!.update({passwordHash: await bcrypt.hash(data.password, 10)});
    }

    res.json({});
}