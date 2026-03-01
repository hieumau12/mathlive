import {MetricConversionModel} from "./model/metric-conversion.model";

export const MetricConversionsData: MetricConversionModel[] = [
    {
        "code": "convInCm",
        "order": "01",
        "symbol": "in→cm",
        "desc": "inch (in) → centimeter (cm)",
        "factor": "2.54",
        "category": "English Metric conversion"
    },
    {
        "code": "convCmIn",
        "order": "02",
        "symbol": "cm→in",
        "desc": "centimeters to inches",
        "factor": "1/2.54",
        "category": "English Metric conversion"
    },
    {
        "code": "convFtM",
        "order": "03",
        "symbol": "ft→m",
        "desc": "foot (ft) → meter (m)",
        "factor": "0.3048",
        "category": "English Metric conversion"
    },
    {
        "code": "convMFt",
        "order": "04",
        "symbol": "m→ft",
        "desc": "meters to feet",
        "factor": "1/0.3048",
        "category": "English Metric conversion"
    },
    {
        "code": "convYdM",
        "order": "05",
        "symbol": "yd→m",
        "desc": "yard (yd) → meter (m)",
        "factor": "0.9144",
        "category": "English Metric conversion"
    },
    {
        "code": "convMYd",
        "order": "06",
        "symbol": "m→yd",
        "desc": "meters to yards",
        "factor": "1/0.9144",
        "category": "English Metric conversion"
    },
    {
        "code": "convMileKm",
        "order": "07",
        "symbol": "mile→km",
        "desc": "mile (mi) → kilometer (km)",
        "factor": "1.609344",
        "category": "English Metric conversion"
    },
    {
        "code": "convKmMile",
        "order": "08",
        "symbol": "km→mile",
        "desc": "kilometers to miles",
        "factor": "1/1.609344",
        "category": "English Metric conversion"
    },
    {
        "code": "convNMileM",
        "order": "09",
        "symbol": "n mile→m",
        "factor": "1852",
        "category": "English Metric conversion"
    },
    {
        "code": "convMNMile",
        "order": "10",
        "symbol": "m→n mile",
        "factor": "1/1852",
        "category": "English Metric conversion"
    },
    {
        "code": "convAcreM",
        "order": "11",
        "symbol": "acre→m²",
        "desc": "acre (based on U.S. survey foot)→ square meter (m²)",
        "factor": "4046.856",
        "category": "English Metric conversion"
    },
    {
        "code": "convMAcre",
        "order": "12",
        "symbol": "m²→acre",
        "desc": "square meters to acres",
        "factor": "1/4046.856",
        "category": "English Metric conversion"
    },
    {
        "code": "convGal(US)L",
        "order": "13",
        "symbol": "gal(US)→L",
        "desc": "gallon (U.S.) (gal) → liter (L)",
        "factor": "3.785412",
        "category": "English Metric conversion"
    },
    {
        "code": "convLGal(US)",
        "order": "14",
        "symbol": "L→gal(US)",
        "desc": "liters to US gallons",
        "factor": "1/3.785412",
        "category": "English Metric conversion"
    },
    {
        "code": "convGal(UK)L",
        "order": "15",
        "symbol": "gal(UK)→L",
        "desc": "gallon [Canadian and U.K. (Imperial)] (gal) → liter (L) ",
        "factor": "4.54609",
        "category": "English Metric conversion"
    },
    {
        "code": "convLGal(UK)",
        "order": "16",
        "symbol": "L→gal(UK)",
        "desc": "Liters to UK gallons",
        "factor": "1/4.54609",
        "category": "English Metric conversion"
    },
    {
        "code": "convPcKm",
        "order": "17",
        "symbol": "pc→km",
        "desc": "parsec (pc) → meter (m)",
        "factor": "3.085678E13"
    },
    {
        "code": "convKmPc",
        "order": "18",
        "symbol": "km→pc",
        "factor": "1/3.085678E13"
    },
    {
        "code": "convKmHMS",
        "order": "19",
        "symbol": "km/h→m/s",
        "desc": "kilometer per hour (km / h) → meter per second (m / s)",
        "factor": "5/18",
        "category": "Speed and length conversion"
    },
    {
        "code": "convMsKmh",
        "order": "20",
        "symbol": "m/s→km/h",
        "factor": "18/5",
        "desc": "meters/second to kilometers/hour",
        "category": "Speed and length conversion"
    },
    {
        "code": "convOzG",
        "order": "21",
        "symbol": "oz→g",
        "desc": "ounce (avoirdupois) (oz) → gram (g)",
        "factor": "28.34952",
        "category": "English Metric conversion"
    },
    {
        "code": "convGOz",
        "order": "22",
        "symbol": "g→oz",
        "desc": "grams to ounces",
        "factor": "1/28.34952",
        "category": "English Metric conversion"
    },
    {
        "code": "convLbKg",
        "order": "23",
        "symbol": "lb→kg",
        "desc": "pound (troy or apothecary) (lb) → kilogram (kg)",
        "factor": "0.4535924",
        "category": "English Metric conversion"
    },
    {
        "code": "convKgLb",
        "order": "24",
        "symbol": "kg→lb",
        "desc": "kilograms to pounds",
        "factor": "1/0.4535924",
        "category": "English Metric conversion"
    },
    {
        "code": "convAtmPa",
        "order": "25",
        "symbol": "atm→Pa",
        "desc": "atmosphere, standard (atm) → pascal (Pa)",
        "factor": "101325",
        "category": "Pressure conversion"
    },
    {
        "code": "convPaAtm",
        "order": "26",
        "symbol": "Pa→atm",
        "factor": "1/101325",
        "desc": "Pascals to atmospheres",
        "category": "Pressure conversion"
    },
    {
        "code": "convMmHgPa",
        "order": "27",
        "symbol": "mmHg→Pa",
        "desc": "millimeter of mercury, conventional (mmHg) → pascal (Pa)",
        "factor": "133.3224",
        "category": "Pressure conversion"
    },
    {
        "code": "convPaMmHg",
        "order": "28",
        "symbol": "Pa→mmHg",
        "factor": "1/133.3224",
        "desc": "Pascals to millimeters of mercury",
        "category": "Pressure conversion"
    },
    {
        "code": "convHpKW",
        "order": "29",
        "symbol": "hp→kW",
        "desc": "horsepower (550 ft · lbf / s) (hp) → kilowatt (kW)",
        "factor": "745699872/1000000000",
        "category": "Power and energy conversion"
    },
    {
        "code": "convKWHp",
        "order": "30",
        "symbol": "kW→hp",
        "factor": "1000000000/745699872",
        "desc": "kilowatt (kW) → horsepower (550 ft · lbf / s) (hp)",
        "category": "Power and energy conversion"
    },
    {
        "code": "convKgfCmPa",
        "order": "31",
        "symbol": "kgf/cm²→Pa",
        "desc": "kilogram-force per square centimeter(kgf/cm2)) → pascal (Pa)",
        "factor": "196133/2"
    },
    {
        "code": "convPaKgfCm",
        "order": "32",
        "symbol": "Pa→kgf/cm²",
        "factor": "2/196133"
    },
    {
        "code": "convKgfMJ",
        "order": "33",
        "symbol": "kgf•m→J",
        "factor": "9.80665"
    },
    {
        "code": "convJKgfM",
        "order": "34",
        "symbol": "J→kgf•m",
        "factor": "1/9.80665"
    },
    {
        "code": "convLbfInKPa",
        "order": "35",
        "symbol": "lbf/in²→kPa",
        "desc": "pound-force per square inch (psi) (lbf/in2) → pascal (Pa)",
        "factor": "6.894757"
    },
    {
        "code": "convKPaLbfIn",
        "order": "36",
        "symbol": "kPa→lbf/in²",
        "factor": "1/6.894757"
    },
    {
        "order": "37",
        "symbol": "°F→°C",
        "desc": "degree Fahrenheit (temperature) (ºF) ................... degree Celsius (ºC)",
        "factor": "({term}-32)/1.8",
        "category": "Temperature conversion",
        "code": "F_to_C"
    },
    {
        "order": "38",
        "symbol": "°C→°F",
        "factor": "{term}*1.8+32",
        "desc": "Celsius to Farenheit",
        "category": "Temperature conversion",
        "code": "C_to_F"
    },
    {
        "code": "convJCal",
        "order": "39",
        "symbol": "J→cal",
        "factor": "5000/20929",
        "desc": "joule (J) → calorieIT (calIT)",
        "category": "Power and energy conversion"
    },
    {
        "code": "convCalJ",
        "order": "40",
        "symbol": "cal→J",
        "desc": "calorieIT (calIT) → joule (J)",
        "factor": "4.1858",
        "category": "Power and energy conversion"
    }
]
