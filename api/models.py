from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    buses: Mapped[list[Bus]] = relationship(back_populates="company")
    routes: Mapped[list[Route]] = relationship(back_populates="company")
    drivers: Mapped[list[Driver]] = relationship(back_populates="company")


class Bus(Base):
    __tablename__ = "buses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    plate_number: Mapped[str] = mapped_column(
        String(15),
        unique=True,
        nullable=False,
    )
    model: Mapped[str] = mapped_column(String(80), nullable=False)
    seats: Mapped[int] = mapped_column(nullable=False)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
    )
    company: Mapped[Company] = relationship(back_populates="buses")

    @property
    def company_name(self) -> str:
        return self.company.name


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    number: Mapped[int] = mapped_column(unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    distance_km: Mapped[int] = mapped_column(nullable=False)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
    )
    company: Mapped[Company] = relationship(back_populates="routes")
    driver_routes: Mapped[list[DriverRoute]] = relationship(
        back_populates="route",
    )


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    license_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
    )
    company: Mapped[Company] = relationship(back_populates="drivers")

    @property
    def company_name(self) -> str:
        return self.company.name
    driver_routes: Mapped[list[DriverRoute]] = relationship(
        back_populates="driver",
    )


class DriverRoute(Base):
    __tablename__ = "driver_routes"

    driver_id: Mapped[int] = mapped_column(
        ForeignKey("drivers.id", ondelete="CASCADE"),
        primary_key=True,
    )
    route_id: Mapped[int] = mapped_column(
        ForeignKey("routes.id", ondelete="RESTRICT"),
        primary_key=True,
    )
    driver: Mapped[Driver] = relationship(back_populates="driver_routes")
    route: Mapped[Route] = relationship(back_populates="driver_routes")
