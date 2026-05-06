import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AirportsService } from './airports/airports.service'
import { MongooseModule } from '@nestjs/mongoose';
import { AirportsModule } from './airports/airports.module';
import { AirportsController } from './airports/airports.controller';

@Module({
  imports: [MongooseModule.forRoot('mongodb://mongodb:27017/airport_db'),
    AirportsModule
  ],
  controllers: [AppController, AirportsController],
  providers: [AppService, AirportsService],
})
export class AppModule { }
