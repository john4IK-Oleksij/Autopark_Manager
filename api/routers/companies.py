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
    statement = select(Company)
    return db.execute(statement).scalars().all()


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    statement = select(Company).where(Company.id == company_id)
    company = db.execute(statement).scalar_one_or_none()
    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )
    return company


@router.post("",response_model=CompanyResponse,
    status_code=201,
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
            detail="Company with this name already exists",
        )
    return company


@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    company.name = company_data.name
    company.phone = company_data.phone
    try:
        db.commit()
        db.refresh(company)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Company with this name already exists",
        )
    return company


@router.delete("/{company_id}", status_code=204)
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    try:
        db.execute(delete(Company).where(Company.id == company_id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Company cannot be deleted while it has related records",
        )
    return Response(status_code=204)
