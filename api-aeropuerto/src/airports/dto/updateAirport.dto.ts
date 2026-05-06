import { PartialType } from "@nestjs/mapped-types";
import { airportDTO } from "./createAirport.dto";

export class updateAirportDTO extends PartialType(airportDTO) {

}

