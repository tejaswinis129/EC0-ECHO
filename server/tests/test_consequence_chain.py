import pytest
from server.app.services.consequence_engine import consequence_engine
from server.app.models.consequence_chain import ConsequenceCategory

def test_consequence_chain_urban_forest():
    chain = consequence_engine.generate_chain(
        intervention_id="int-urban-forest",
        units_deployed=500.0,
        neighbourhood_id="NB-02",
        neighbourhood_name="Industrial Harbor",
        strategy="balanced"
    )
    assert chain.intervention_id == "int-urban-forest"
    assert len(chain.nodes) >= 6
    assert len(chain.edges) >= 5

    categories = [n.category for n in chain.nodes]
    assert ConsequenceCategory.ROOT in categories
    assert ConsequenceCategory.DIRECT in categories
    assert ConsequenceCategory.ENVIRONMENTAL in categories
    assert ConsequenceCategory.WATER_RESOURCE in categories
    assert ConsequenceCategory.FINANCIAL in categories
    assert ConsequenceCategory.SOCIAL_EQUITY in categories
    assert ConsequenceCategory.MITIGATION in categories

    # Tree planting consumes water -> should have negative water direction
    water_node = next(n for n in chain.nodes if n.category == ConsequenceCategory.WATER_RESOURCE)
    assert water_node.direction.value == "negative"
    assert water_node.suggested_mitigation is not None

def test_consequence_chain_rainwater_cistern():
    chain = consequence_engine.generate_chain(
        intervention_id="int-rainwater-harvesting",
        units_deployed=200.0,
        active_scenario="drought"
    )
    # Cistern harvests water -> water node direction should be positive!
    water_node = next(n for n in chain.nodes if n.category == ConsequenceCategory.WATER_RESOURCE)
    assert water_node.direction.value == "positive"

    # Scenario node should reflect drought
    scen_node = next(n for n in chain.nodes if n.category == ConsequenceCategory.SCENARIO_RISK)
    assert "drought" in scen_node.detailed_explanation.lower()
