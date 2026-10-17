from pydantic import BaseModel, ConfigDict, Field


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class BusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    plate_number: str
    model: str
    seats: int
    company_id: int


class BusCreate(BaseModel):
    plate_number: str = Field(min_length=1, max_length=15)
    model: str = Field(min_length=1, max_length=80)
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
    full_name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=1, max_length=20)
    license_number: str = Field(min_length=1, max_length=20)
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
    title: str = Field(min_length=1, max_length=120)
    distance_km: int = Field(gt=0)
    company_id: int = Field(gt=0)

    
class DriverRouteCreate(BaseModel):
    driver_id: int = Field(gt=0)
    route_id: int = Field(gt=0)


class DriverRouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    driver_id: int
    route_id: int




