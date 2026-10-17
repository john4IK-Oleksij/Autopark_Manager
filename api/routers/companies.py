from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
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
    name = company_data.name.strip()
    if not name:
        raise HTTPException(
            status_code=422,
            detail="Company name cannot be empty",
        )
    company = Company(name=name)
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
