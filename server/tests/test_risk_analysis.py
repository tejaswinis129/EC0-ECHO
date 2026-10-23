import pytest
from server.app.services.risk_service import risk_service
from server.app.models.risk import RiskWeightConfig

def test_risk_calculation_metro_verde():
    res = risk_service.calculate_risk("sample-metro-verde")
    assert res is not None
    assert res.city_composite_risk > 0.0
    assert len(res.neighbourhood_scores) == 8
    
    # Check that scores are bounded between 0 and 100
    for s in res.neighbourhood_scores:
        assert 0.0 <= s.heat_risk_score <= 100.0
        assert 0.0 <= s.flood_risk_score <= 100.0
        assert 0.0 <= s.water_stress_score <= 100.0
        assert 0.0 <= s.green_gap_score <= 100.0
        assert 0.0 <= s.composite_risk_score <= 100.0
        assert s.primary_risk_driver != ""

def test_risk_weights_adjustment():
    # Weight only heat
    heat_heavy = RiskWeightConfig(heat_weight=1.0, flood_weight=0.0, water_stress_weight=0.0, green_gap_weight=0.0, equity_weight=0.0)
    res_heat = risk_service.calculate_risk("sample-metro-verde", heat_heavy)
    
    # Weight only flood
    flood_heavy = RiskWeightConfig(heat_weight=0.0, flood_weight=1.0, water_stress_weight=0.0, green_gap_weight=0.0, equity_weight=0.0)
    res_flood = risk_service.calculate_risk("sample-metro-verde", flood_heavy)

    # In Metro Verde, NB-02 (Industrial Harbor) has high heat, whereas East Riverside NB-04 has high flood ratio
    assert res_heat.city_composite_risk != res_flood.city_composite_risk
    assert len(res_heat.formulas_documentation) >= 4
