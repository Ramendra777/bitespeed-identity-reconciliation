"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.POSTGRES_CONFIG = void 0;
exports.POSTGRES_CONFIG = {
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'bitespeed',
    password: process.env.PG_PASSWORD || 'postgres',
    port: parseInt(process.env.PG_PORT || '5432'),
};
exports.PORT = parseInt(process.env.PORT || '3000');
