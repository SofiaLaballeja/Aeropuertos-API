import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { createClient } from "redis";
import { airportDTO } from "./dto/createAirport.dto";
import { updateAirportDTO } from "./dto/updateAirport.dto";


@Injectable()
export class AirportsService {
    private readonly logger = new Logger(AirportsService.name);
    private redisClient;
    private redisConnected = false;

    constructor(
        @InjectModel('Airport') private readonly airportModel: Model<any>
    ) {
        this.redisClient = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });

        this.redisClient.on('error', (err) => {
            this.logger.error('Error de conexión Redis:', err.message);
            this.redisConnected = false;
        });

        this.redisClient.on('connect', () => {
            this.logger.log('Conexión Redis establecida');
            this.redisConnected = true;
        });

        this.redisClient.connect().catch((err) => {
            this.logger.error('No se pudo conectar a Redis, las funciones de geolocalización y popularidad no estarán disponibles:', err.message);
            this.redisConnected = false;
        });
    }

    async createAirport(data: airportDTO) {
        const newAirport = new this.airportModel(data);
        const saved = await newAirport.save();

        if (this.redisConnected) {
            try {
                await this.redisClient.geoAdd('airports-geo', {
                    longitude: saved.lng,
                    latitude: saved.lat,
                    member: saved.iata_faa || saved.icao
                });
            } catch (err) {
                this.logger.error('Error al agregar aeropuerto a Redis GEO:', err.message);
            }
        }

        return saved;
    }

    async updateAirport(code: string, data: updateAirportDTO) {
        const { iata_faa, icao, ...updateData } = data;

        const airportUpdate = await this.airportModel.findOneAndUpdate(
            {
                $or: [
                    { iata_faa: code.toUpperCase() },
                    { icao: code.toUpperCase() }
                ]
            },
            { $set: updateData },
            { new: true }
        ).exec();

        if (!airportUpdate) {
            this.logger.warn(`No se encontró el aeropuerto con código ${code} para actualizar.`);
        }

        if (airportUpdate && this.redisConnected) {
            try {
                const oldMember = code.toUpperCase();
                const newMember = airportUpdate.iata_faa || airportUpdate.icao;
                await this.redisClient.geoRemove('airports-geo', oldMember);
                await this.redisClient.geoAdd('airports-geo', {
                    longitude: airportUpdate.lng,
                    latitude: airportUpdate.lat,
                    member: newMember
                });
            } catch (err) {
                this.logger.error('Error al actualizar Redis GEO:', err.message);
            }
        }

        return airportUpdate;
    }

    async findAllAirports(search?: string, city?: string) {
        const query: any = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }

        return this.airportModel.find(query).exec();
    }

    async findOne(code: string) {

        const airport = await this.airportModel.findOne({
            $or: [{ iata_faa: code.toUpperCase() },
            { icao: code.toUpperCase() }
            ]
        }).exec();

        this.logger.log(`Buscando código ${code}: ${airport ? 'Encontrado' : 'No encontrado'}`)


        if (airport && this.redisConnected) {
            try {
                await this.redisClient.zIncrBy('airport_popularity', 1, code.toUpperCase());
                await this.redisClient.expire('airport_popularity', 86400);
            } catch (err) {
                this.logger.error('Error al actualizar popularidad en Redis:', err.message);
            }
        }

        return airport;
    }

    async getPopular() {
        if (!this.redisConnected) {
            this.logger.warn('Redis no está conectado, no se puede obtener popularidad');
            return [];
        }

        try {
            const popularity = await this.redisClient.zRangeWithScores('airport_popularity', 0, 9, {
                REV: true
            });

            const airportsWithDetails = await Promise.all(
                popularity.map(async (item) => {
                    const airport = await this.airportModel.findOne({
                        $or: [
                            { iata_faa: item.value },
                            { icao: item.value }
                        ]
                    }).exec();

                    return {
                        code: item.value,
                        score: item.score,
                        name: airport?.name || item.value,
                        city: airport?.city || '-',
                        iata_faa: airport?.iata_faa || '-',
                        icao: airport?.icao || '-',
                        lat: airport?.lat,
                        lng: airport?.lng
                    };
                })
            );

            return airportsWithDetails;
        } catch (err) {
            this.logger.error('Error al obtener popularidad de Redis:', err.message);
            return [];
        }
    }


    async findNearby(lat: number, lng: number, radius: number) {
        if (!this.redisConnected) {
            this.logger.warn('Redis no está conectado, no se puede buscar aeropuertos cercanos');
            return [];
        }

        try {
            const results = await this.redisClient.geoSearch(
                'airports-geo',
                { longitude: lng, latitude: lat },
                { radius: radius, unit: 'km' }
            );

            return this.airportModel.find({
                $or: [
                    { iata_faa: { $in: results } },
                    { icao: { $in: results } }
                ]
            }).exec();
        } catch (err) {
            this.logger.error('Error al buscar aeropuertos cercanos en Redis:', err.message);
            return [];
        }
    }

    async deleteAirport(code: string) {
        const deleteAirport = code.toUpperCase();

        const airport = await this.airportModel.findOneAndDelete({
            $or: [
                { iata_faa: deleteAirport },
                { icao: deleteAirport }
            ]
        }).exec();

        if (airport && this.redisConnected) {
            try {
                const member = airport.iata_faa || airport.icao;
                await this.redisClient.zRem('airports-geo', member);
                await this.redisClient.zRem('airport_popularity', deleteAirport);
            } catch (err) {
                this.logger.error('Error al eliminar aeropuerto de Redis:', err.message);
            }
        }
        return { deleted: true, code: deleteAirport }
    }


}