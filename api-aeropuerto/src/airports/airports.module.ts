import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Airport, AirportSchema } from "src/schemas/airport.schema";
import { AirportsService } from "./airports.service";
import { SeedService } from "src/data/seed.service";


@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Airport', schema: AirportSchema }]),
    ],
    providers: [AirportsService, SeedService],
    exports: [MongooseModule]
})
export class AirportsModule { }