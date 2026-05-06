import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { createClient } from "redis";
import * as fs from 'fs';
import * as path from 'path';



@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger(SeedService.name);
    private redisClient;

    constructor(
        @InjectModel('Airport') private readonly airportModel: Model<any>,
    ) {
        this.redisClient = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' })

    }

    async onModuleInit() {
        await this.redisClient.connect();
        await this.seedData();

    }

    async seedData() {
        // Verificar si hay datos en mongo

        const mongoCount = await this.airportModel.countDocuments();
        const redisCount = await this.redisClient.zCard('airports-geo')

        if (mongoCount > 0 && redisCount > 0) {
            this.logger.log('Los datos ya existen en la base de datos y redis. Saltando carga...')
            return;
        }

        this.logger.log('Iniciando carga de datos...');

        // Leer archivo JSON
        const dataPath = path.join(__dirname, '..', 'data', 'data_trasport.json');
        const airports = JSON.parse(fs.readFileSync(dataPath, 'utf8'));


        for (const airport of airports) {
            // Guardar en mongo
            const newAirport = new this.airportModel(airport);
            await newAirport.save();

            // Guardar en Redis (GEOADD)

            const member = airport.iata_faa ?? airport.icao;

            const validLng = airport.lng != null && airport.lng >= -180 && airport.lng <= 180;
            const validLat = airport.lat != null && airport.lat > -85.05 && airport.lat < 85.05;

            if (validLng && validLat && member) {
                await this.redisClient.geoAdd('airports-geo', {
                    longitude: airport.lng,
                    latitude: airport.lat,
                    member: member
                })
            }

        }
        this.logger.log(`¡Carga completada! ${airports.length} aeropuertos cargados.`)

    }

    async seedRedisFromMongo() {
        // 1. Buscamos todos los aeropuertos que acabas de importar en Mongo
        const airports = await this.airportModel.find().exec();

        this.logger.log(`Sincronizando ${airports.length} aeropuertos con Redis GEO...`);

        for (const airport of airports) {
            const member = airport.iata_faa ?? airport.icao;

            const validLng = airport.lng != null && airport.lng >= -180 && airport.lng <= 180;
            const validLat = airport.lat != null && airport.lat > -85.05 && airport.lat < 85.05;

            if (validLng && validLat && member) {
                await this.redisClient.geoAdd('airports-geo', {
                    longitude: airport.lng,
                    latitude: airport.lat,
                    member: member
                });
            }

            this.logger.log('¡Redis GEO sincronizado correctamente!');
        }
    }


}