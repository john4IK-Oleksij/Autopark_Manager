from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Company
from schemas import CompanyCreate, CompanyResponse

router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


@router.get("", response_model=list[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    statement = select(Company).order_by(Company.name)
    return db.execute(statement).scalars().all()


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
    responses={404: {"description": "Company not found"}},
)
def get_company(company_id: int, db: Session = Depends(get_db)):
    statement = select(Company).where(Company.id == company_id)
    company = db.execute(statement).scalar_one_or_none()
    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Перевізника не знайдено",
        )
    return company


@router.post("",response_model=CompanyResponse,
    status_code=201,
    responses={409: {"description": "Company name already exists"}},
)
def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
):
    company = Company(name=company_data.name, phone=company_data.phone)
    db.add(company)
    try:
        db.commit()
        db.refresh(company)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Перевізник із такою назвою уже існує",
        )
    return company


@router.put(
    "/{company_id}",
    response_model=CompanyResponse,
    responses={
        404: {"description": "Company not found"},
        409: {"description": "Company name already exists"},
    },
)
def update_company(
    company_id: int,
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Перевізника не знайдено")

    company.name = company_data.name
    company.phone = company_data.phone
    try:
        db.commit()
        db.refresh(company)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Перевізник із такою назвою уже існує",
        )
    return company


@router.delete(
    "/{company_id}",
    status_code=204,
    responses={
        404: {"description": "Company not found"},
        409: {"description": "Company has related records"},
    },
)
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Перевізника не знайдено")

    try:
        db.execute(delete(Company).where(Company.id == company_id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Перевізника неможливо видалити: є пов'язані записи",
        )
    return Response(status_code=204)
