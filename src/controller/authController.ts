import {Request, Response} from 'express';
import { validationResult ,matchedData } from 'express-validator';
import { User } from '../models/User';
import { State } from '../models/State';
import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';
const bcrypt = require('bcrypt');

dotenv.config();

export const signin = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.json({error: errors.mapped()});
    }

    const data = matchedData(req);
    const user = await User.findOne({ where: { email: data.email } });

    if(!user) {
        res.json({error: 'E-mail e/ou senha errados'});
        return;
    }
  
    const match = await bcrypt.compare(data.password, user.passwordHash);
    
    if(!match) {
        res.json({error: 'E-mail e/ou senha errados!'});
        return;
    }

    const token = JWT.sign(
        {id: user.id, email: user.email},
        process.env.JWT_SECRET_KEY as string, 
        {expiresIn: '2h'}
    );

    res.json({token});

}

export const signup = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.json({error: errors.mapped()});
    }

    const data = matchedData(req);
    const user = await User.findOne({
        where: {
            email: data.email
        }
    });

    if(user) {
        res.json({ error: { email: {msg: 'E-mail já existe!'} }});
        return;
    }

    const stateItem = await State.findByPk(data.state);

    if(!stateItem) {
        res.json({ error: { state: {msg: 'Estado não existe!'} }});
        return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    let newUser = await User.create({ 
        name: data.name,
        email: data.email,
        state: data.state,
        passwordHash
     });

    const token = JWT.sign(
        {id: newUser.id, email: data.email},
        process.env.JWT_SECRET_KEY as string, 
        {expiresIn: '2h'}
    );

    res.json({token});
}
