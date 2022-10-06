import express from 'express';
import path from 'path';
import cors from 'cors';
import mainRoutes from './routes/index';

const server = express();

server.use(cors());
server.use(express.json());
server.use(express.static(path.join(__dirname, '../public')));
server.use(express.urlencoded({extended: true}));

server.use(mainRoutes);

server.listen(5003);