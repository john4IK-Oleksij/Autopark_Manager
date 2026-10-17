from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


CompanyName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=2, max_length=120),
]
PhoneNumber = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=20),
]
PlateNumber = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=15),
]
BusModel = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=80),
]
DriverName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=120),
]
DriverPhone = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=20),
]
LicenseNumber = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=20),
]
RouteTitle = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=120),
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


class BusCreate(BaseModel):
    plate_number: PlateNumber
    model: BusModel
    seats: int = Field(gt=0)
    company_id: int = Field(gt=0)

    

class DriverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    phone: str
    license_number: str
    company_id: int


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
    number: int = Field(gt=0)
    title: RouteTitle
    distance_km: int = Field(gt=0)
    company_id: int = Field(gt=0)

    
class DriverRouteCreate(BaseModel):
    driver_id: int = Field(gt=0)
    route_id: int = Field(gt=0)


class DriverRouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    driver_id: int
    route_id: int



