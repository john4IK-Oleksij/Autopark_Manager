from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

# Назви мають містити літеру, телефон — лише цифри та + ( ) -, посвідчення — цифру.
LETTER_PATTERN = r"\p{L}"
DIGIT_PATTERN = r"\d"
PHONE_PATTERN = r"^\+?[0-9 ()\-]+$"

CompanyName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=2, max_length=120, pattern=LETTER_PATTERN),
]
PhoneNumber = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=7, max_length=20, pattern=PHONE_PATTERN),
]
PlateNumber = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=4, max_length=15),
]
BusModel = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=2, max_length=80),
]
DriverName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=3, max_length=120),
]
DriverPhone = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=7, max_length=20, pattern=PHONE_PATTERN),
]
LicenseNumber = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=5, max_length=20, pattern=DIGIT_PATTERN),
]
RouteTitle = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=3, max_length=120, pattern=LETTER_PATTERN),
]


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    phone: str


class CompanyCreate(BaseModel):
    name: CompanyName
    phone: PhoneNumber


class BusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    plate_number: str
    model: str
    seats: int
    company_id: int
    company_name: str


class BusCreate(BaseModel):
    plate_number: PlateNumber
    model: BusModel
    seats: int = Field(ge=10, le=120)
    company_id: int = Field(gt=0)

    

class DriverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    phone: str
    license_number: str
    company_id: int
    company_name: str


class DriverPageResponse(BaseModel):
    items: list[DriverResponse]
    total: int
    limit: int
    offset: int


class DriverCreate(BaseModel):
    full_name: DriverName
    phone: DriverPhone
    license_number: LicenseNumber
    company_id: int = Field(gt=0)

    
class RouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    number: int
    title: str
    distance_km: int
    company_id: int


class RouteCreate(BaseModel):
    number: int = Field(ge=1, le=2_147_483_647)
    title: RouteTitle
    distance_km: int = Field(ge=1, le=5000)
    company_id: int = Field(gt=0)

    
class DriverRouteCreate(BaseModel):
    driver_id: int = Field(gt=0)
    route_id: int = Field(gt=0)


class DriverRouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    driver_id: int
    route_id: int


