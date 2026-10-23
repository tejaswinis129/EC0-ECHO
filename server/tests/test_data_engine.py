import pytest
import io
import pandas as pd
from server.app.services.data_service import data_service

def test_sample_datasets_loaded():
    datasets = data_service.list_datasets()
    assert len(datasets) >= 2
    ids = [d.dataset_id for d in datasets]
    assert "sample-metro-verde" in ids
    assert "sample-coastal-basin" in ids

def test_metro_verde_summary():
    summary = data_service.get_summary("sample-metro-verde")
    assert summary is not None
    assert summary.total_population > 0
    assert summary.neighbourhood_count == 8
    assert summary.avg_surface_temp_c > 30.0
    assert summary.total_available_roof_m2 > 0

def test_csv_validation_valid():
    sample_csv = """neighbourhood_id,neighbourhood_name,population,area_sqkm,surface_temp_c,impervious_surface_pct,tree_canopy_pct,park_access_pct,annual_rainfall_mm,extreme_rainfall_runoff_m3,drainage_capacity_m3,water_demand_m3_day,water_supply_m3_day,social_vulnerability_index,available_roof_area_m2,available_public_land_m2,available_road_corridor_m2
N-01,Test District,50000,3.5,35.0,60.0,20.0,50.0,900,100000,90000,10000,11000,0.5,50000,20000,10000
"""
    report, df = data_service.validate_csv(sample_csv)
    assert report.is_valid is True
    assert report.total_rows == 1
    assert df is not None
    assert len(df) == 1

def test_csv_validation_missing_columns():
    invalid_csv = """neighbourhood_id,neighbourhood_name,population
N-01,Test District,50000
"""
    report, df = data_service.validate_csv(invalid_csv)
    assert report.is_valid is False
    assert len(report.missing_required_columns) > 0
    assert df is None

def test_csv_validation_duplicates():
    dup_csv = """neighbourhood_id,neighbourhood_name,population,area_sqkm,surface_temp_c,impervious_surface_pct,tree_canopy_pct,park_access_pct,annual_rainfall_mm,extreme_rainfall_runoff_m3,drainage_capacity_m3,water_demand_m3_day,water_supply_m3_day,social_vulnerability_index,available_roof_area_m2,available_public_land_m2,available_road_corridor_m2
N-01,Alpha,50000,3.5,35.0,60.0,20.0,50.0,900,100000,90000,10000,11000,0.5,50000,20000,10000
N-01,Beta,60000,4.0,34.0,55.0,25.0,55.0,900,110000,95000,11000,12000,0.4,45000,25000,12000
"""
    report, df = data_service.validate_csv(dup_csv)
    assert report.is_valid is False
    assert any("Duplicate" in issue.message for issue in report.issues)
