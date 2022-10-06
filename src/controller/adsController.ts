import {Request, Response} from 'express';
import { User } from '../models/User';
import { Ad } from '../models/Ad';
import {v4 as uuid} from 'uuid';
import sharp from 'sharp';
import { unlink } from 'fs/promises';
import { Category } from '../models/Category';  
import { State } from '../models/State';
import  { Op } from 'sequelize';

export const getCategories = async (req: Request, res: Response) => {
    const cats = await Category.findAll();

    let categories:any = [];

    for (let i in cats) {
        categories.push({
            id: cats[i].id,
            name: cats[i].name,
            slug: cats[i].slug,
            img: `${process.env.BASE}/assets/images/${cats[i].slug}.png`
        });
    }


    res.json({categories});
}

export const add = async (req: Request, res: Response) => {

    const { id } = res.locals.token;
    const user = await User.findByPk(id);

    let {title, price, priceneg, desc, cat} = req.body;

    if(!title || !cat) {
        res.json({error: 'Título e/ou categoria não foram preenchidos'});
        return;
    }

    const category = await Category.findByPk(cat);
    if(!category) {
        res.json({error: 'Categoria inexistente'});
    }    

    if(price) {
        price = price
        .replace('.', '')
        .replace(',', '.')
        .replace('R$ ', '');
        price = parseFloat(price);
    } else {
        price = 0;
    }

    const newAd = Ad.build({
        status: true,
        idUser: user?.id,
        state: user?.state,
        dateCreated: new Date(),
        title,
        category: cat,
        price,
        priceNegotiable: (priceneg == 'true') ? true : false,
        description: desc,
        views: 0
    });


    let images: Object[] = [];

    if(req.files) {
        const files = req.files as { [fieldname: string]: any };
        for(let i in files) {
            const file = files[i];
            const filename = `${uuid()}.jpg`;
            const main = +i === 0 ? false : true;

            await sharp(file.path)
            .resize(500, 500, {
                fit: 'cover'
            })
            .jpeg({
                quality: 100
            })
            .toFile(`./public/media/${filename}`);

            await unlink(file.path);

            images.push({filename, main});
        }

        if(images.length) {
            newAd.images = JSON.stringify(images);
        }
    }

    await newAd.save();
    res.json({id: newAd.id});
}

export const getList = async (req: Request, res: Response) => {
    let { sort = 'asc', offset = 0, limit = 8, q, cat, state } = req.body;
    let total = 0;
    let filters:any = {status: true};   

    
    if(q) {
        filters.title = {[Op.iRegexp]: q};
    }

    if(cat) {
        const c = await Category.findOne({where: {slug: cat}, raw: true});
        if(c) {
            filters.category = c.slug;
        }
    }

    if(state) {
        const s = await State.findOne({where: {name: state.toUpperCase()}, raw: true});
        if(s) {
            filters.state = s.id;
        }
    }

    const adsTotal = await Ad.findAll({where: filters});
    total = adsTotal.length;


    const adsData = await Ad.findAll({
        where: filters,
        raw: true,
        order: [['dateCreated', (sort == 'desc' ? 'DESC' : 'ASC')]],
        offset,
        limit
    });

    let ads: any = [];

    if(adsData) {
        for (let i in adsData) {

            let image;
            
            let defaultImg: any = adsData[i].images;
            if(defaultImg) {
                defaultImg = defaultImg.find((e: any) => e.main);
            }
            
            if(defaultImg) {
                image = `${process.env.BASE}/media/${defaultImg.filename}`;
            } else {
                image = `${process.env.BASE}/media/default.jpg`;
            }
            
            ads.push({
                id: adsData[i].id,
                title: adsData[i].title,
                price: adsData[i].price,
                priceNegotiable: adsData[i].priceNegotiable,
                image
            })
        }
    }

    res.json({ads, total});
 
}

export const getItem = async (req: Request, res: Response) => {
    let {id, other = null} = req.query;
    

    if(!id) {
        res.json({error: 'Sem produto'});
        return;
    }

    const ad = await Ad.findByPk(+id);

    if(!ad) {
        res.json({error: 'Produto inexistente'});
        return;
    }

    ad.views++;
    await ad.save();

    let images: any = [];

    for (let i in ad.images) {
        images.push(`${process.env.BASE}/media/${ad.images[i].filename}`);
    }

    let category = await Category.findOne({where: {slug: ad.category}});
    let userInfo = await User.findByPk(ad.idUser);
    
    let others:any = [];

    if(other) {
        const otherData = await Ad.findAll({ where: { status: true, idUser: ad.idUser } });

        for(let i in otherData) {
            if(otherData[i].id != ad.id) {

                let image = `${process.env.BASE}/media/default.jpg`;
                
                let defaultImg:any = otherData[i].images?.find((e: any) => e.default);

                if(defaultImg) {
                    image = `${process.env.BASE}/media/${defaultImg.filename}`;
                }

                others.push({ 
                    id: otherData[i].id,
                    title: otherData[i].title,
                    price: otherData[i].price,
                    priceNegotiable: otherData[i].priceNegotiable,
                    image
                });
            }
        }
    }

    res.json({
        id: ad.id,
        title: ad.title,
        price: ad.price,
        priceNegotiable: ad.priceNegotiable,
        description: ad.description,
        dateCreated: ad.dateCreated,
        views: ad.views,
        images,
        category,
        userInfo: {
            name: userInfo!.name,
            email: userInfo!.email
        },
        others
    })
}

export const editAction = async (req: Request, res: Response) => {
    const { id } = req.params;
    const token = res.locals.token.id;

    let { title, status, price, priceneg, desc, cat, images } = req.body;

    const ad = await Ad.findByPk(id);

    if(!ad) {
        res.json({error: 'Anúncio inexistente'});
        return;
    }

    const user = await User.findOne({where: {id: token}});

    if(user?.id !== ad.idUser) {
        res.json({error: 'Este anúncio não é seu'})
        return;
    }

    let updates: any = {};

     if(title) {
        updates.title = title;
     }

     
    if(price) {
        price = price
        .replace('.', '')
        .replace(',', '.')
        .replace('R$ ', '');
        price = parseFloat(price);
        updates.price = price;
    } 

    if(priceneg) {
        updates.priceNegotiable = priceneg;
    }

    if(status) {
        updates.status = status;
    }

    if(desc) {
        updates.description = desc;
    }

    if(cat) {
        const category = await Category.findOne({where: {slug: cat}});

        if(!category) {
            res.json({error: 'Categoria inexistente'});
            return;
        }

        updates.category = category.slug;
    }

    if(images) {
        updates.images = images;
    }

    if(updates) {
        await Ad.update(updates, {where: {id}});
    }

    let newImages: Object[] = [];
    

    if(req.files) {

        let newImages: any;

        if(ad.images) {
            newImages = ad.images;
        } else {
            newImages = [];
        }
        
        const files = req.files as { [fieldname: string]: any };

        for(let i in files) {
            const file = files[i];
            const filename = `${uuid()}.jpg`;
            const main = +i === 0 ? false : true;

            await sharp(file.path)
            .resize(500, 500, {
                fit: 'cover'
            })
            .jpeg({
                quality: 100
            })
            .toFile(`./public/media/${filename}`);

            await unlink(file.path);

            newImages.push({filename, main})
        }

        ad.images = JSON.stringify(newImages);
        await ad.save();
    }


    res.json({error: ''});
}