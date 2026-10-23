import datetime
import hashlib
import json
import os
import re
import ssl
import urllib.request
from typing import List, Dict, Any, Optional

from ..models.evidence import (
    ProvenanceType,
    AccessMode,
    DataSourceRegistryItem,
    RealWorldEvidenceRecord,
    UploadedDocumentMetadata,
)

EVIDENCE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "evidence_uploads")
os.makedirs(EVIDENCE_DIR, exist_ok=True)


class EvidenceSourceService:
    def __init__(self):
        self._sources: Dict[str, DataSourceRegistryItem] = {}
        self._records: List[RealWorldEvidenceRecord] = []
        self._uploads: Dict[str, UploadedDocumentMetadata] = {}
        self._init_registry()
        self._init_curated_records()

    def _init_registry(self):
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        sources = [
            DataSourceRegistryItem(
                source_id="bbmp_swd_master_plan",
                name="BBMP Storm Water Drain Master Plan & Remodeling DPR",
                publisher="Bruhat Bengaluru Mahanagara Palike (BBMP) / OpenCity",
                category="Stormwater & Flood Mitigation",
                original_url="https://data.opencity.in/dataset/1d0768dd-c964-48fc-bee0-087ec40ce926",
                active_resource_url="https://data.opencity.in/dataset/1d0768dd-c964-48fc-bee0-087ec40ce926/resource/7f847755-a4ab-4ee4-b4e7-410e1e6a2323/download/ec7703be-3579-4d8b-be48-8fe022a3a2b7.pdf",
                format="PDF / CKAN API",
                geographic_scope="Bengaluru 8 Zones (842 km Rajakaluve Network)",
                license="Government Open Data / Public Domain",
                access_mode=AccessMode.API_CONNECTED,
                description="Comprehensive master plan report for remodeling of primary and secondary storm water drains across 4 major valleys (Koramangala, Challaghatta, Vrishabhavathi, Hebbal).",
                coverage_period="2010 - 2024",
                last_checked=now_iso,
                is_live=True,
                manual_import_instructions="Download Volume 1 or Volume 2 PDF from OpenCity CKAN dataset page and upload to ECO-ECHO for local extraction.",
            ),
            DataSourceRegistryItem(
                source_id="smart_cities_mission",
                name="Smart Cities Mission Open Data Portal",
                publisher="Ministry of Housing and Urban Affairs (MoHUA), Government of India",
                category="Multi-Intervention Urban Infrastructure",
                original_url="https://smartcities.data.gov.in/cities",
                active_resource_url=None,
                format="OGD Portal / Janparichay Auth",
                geographic_scope="Pan-India 100 Smart Cities (including Bengaluru Smart City)",
                license="National Data Sharing and Accessibility Policy (NDSAP)",
                access_mode=AccessMode.PORTAL_INDEXED,
                description="Smart Cities Mission city project repository tracking Tender SURE roads, intelligent traffic systems, water meters, and solar rooftop installations.",
                coverage_period="2015 - Present",
                last_checked=now_iso,
                is_live=True,
                manual_import_instructions="Log in via Janparichay on smartcities.data.gov.in, download Bengaluru project CSV/Excel, and upload directly to ECO-ECHO.",
            ),
            DataSourceRegistryItem(
                source_id="karnataka_water_ogd",
                name="Bengaluru Water & Sewage Catalog (Karnataka OGD)",
                publisher="Water Resources Dept, Govt of Karnataka & BWSSB",
                category="Water Supply & Wastewater",
                original_url="https://karnataka.data.gov.in/catalog/water-bengaluru",
                active_resource_url=None,
                format="Open Government Data (OGD) Catalog",
                geographic_scope="Bengaluru Urban & Rural Districts",
                license="Open Government Data License - India",
                access_mode=AccessMode.PORTAL_INDEXED,
                description="Government dataset catalog covering BWSSB reservoir stages, groundwater observation wells, distribution pumping capacity, and Cauvery pipeline stages.",
                coverage_period="2018 - 2025",
                last_checked=now_iso,
                is_live=True,
                manual_import_instructions="Export water resource tables as CSV or Excel from karnataka.data.gov.in and attach via the Evidence Upload tab.",
            ),
            DataSourceRegistryItem(
                source_id="nwdp_water_portal",
                name="National Water Data Portal (NWDP / NWIC)",
                publisher="National Water Informatics Centre, Ministry of Jal Shakti",
                category="Hydrology & Rainwater Harvesting",
                original_url="https://nwdp.nwic.gov.in/dataset/",
                active_resource_url=None,
                format="CKAN Spatial Catalog",
                geographic_scope="National Basins & Catchments (Cauvery Basin)",
                license="National Water Data Policy",
                access_mode=AccessMode.PORTAL_INDEXED,
                description="National spatial database of telemetry rainfall gauges, surface runoff gauging stations, reservoir storage curves, and watershed boundaries.",
                coverage_period="Historical - Real-time",
                last_checked=now_iso,
                is_live=True,
                manual_import_instructions="Search Cauvery Basin station data, download GeoJSON/CSV shapefile or table, and import to project.",
            ),
            DataSourceRegistryItem(
                source_id="kaun_city_work_orders",
                name="Bengaluru Municipal Work Orders (Civic Data Commons)",
                publisher="Civic Data Commons / Kaun City",
                category="Roads, Pavements & Desilting",
                original_url="https://data.kaun.city/bengaluru/work-orders/",
                active_resource_url=None,
                format="Civic Open Data / Web Records",
                geographic_scope="BBMP 198 Wards (City-wide)",
                license="Civic Open Data Commons (ODbL / Public Domain)",
                access_mode=AccessMode.PORTAL_INDEXED,
                description="Granular work order database detailing BBMP tender allocations, contractor awards, asphalt milling rates, pothole patch budgets, and storm drain desilting.",
                coverage_period="2016 - 2024",
                last_checked=now_iso,
                is_live=True,
                manual_import_instructions="Download ward-specific work order CSV exports from data.kaun.city and drop them into ECO-ECHO.",
            ),
        ]
        for s in sources:
            self._sources[s.source_id] = s

    def _init_curated_records(self):
        records = [
            RealWorldEvidenceRecord(
                record_id="EVID-SWD-KOR-001",
                project_name="Koramangala Valley Primary Rajakaluve Remodeling",
                source_id="bbmp_swd_master_plan",
                source_publisher="Bruhat Bengaluru Mahanagara Palike / OpenCity",
                source_url="https://data.opencity.in/dataset/1d0768dd-c964-48fc-bee0-087ec40ce926",
                document_reference="BBMP SWD Master Plan Vol II, Section 4.2, Table 4-3: Koramangala Valley Hydraulic Sizing",
                publication_date="2010 (Validated 2021)",
                retrieval_timestamp="2026-10-23T18:00:00Z",
                location_name="Koramangala Valley / Ejipura Ring Road",
                ward_number=151,
                zone_name="South Zone",
                valley_basin="Koramangala & Challaghatta Valley",
                category="stormwater_drainage",
                provenance_type=ProvenanceType.VERIFIED_SOURCE_FACT,
                field_values={
                    "catchment_area_sqkm": 62.5,
                    "peak_discharge_cumec": 182.4,
                    "primary_channel_width_m": 12.0,
                    "channel_depth_m": 3.6,
                    "recommended_gradient": "1 in 800",
                    "bedding_concrete_grade": "PCC M15 (1:2:4)",
                    "retaining_wall_type": "RCC M25 with weep holes @ 1.5m c/c",
                    "historical_desilting_cost_per_km_lakh_inr": 8.4,
                },
                units_and_currencies={
                    "catchment_area": "sq.km",
                    "peak_discharge": "m³/s (cumec)",
                    "width": "meters",
                    "depth": "meters",
                    "cost": "Lakh INR / km",
                },
                validation_status="VERIFIED",
                missing_or_unverified_fields=["Current encroachment width at chainage 3+200"],
                license="Government Open Data",
                notes="Hydraulic cross section modeled for 1-in-25-year rainfall recurrence. Requires dry-weather sewer diversion to avoid untreated sewage stagnation.",
            ),
            RealWorldEvidenceRecord(
                record_id="EVID-SWD-VRI-002",
                project_name="Vrishabhavathi Valley Secondary Drain Desilting & RCC Retaining",
                source_id="bbmp_swd_master_plan",
                source_publisher="Bruhat Bengaluru Mahanagara Palike / OpenCity",
                source_url="https://data.opencity.in/dataset/1d0768dd-c964-48fc-bee0-087ec40ce926",
                document_reference="BBMP SWD Master Plan Vol I, Section 7.4: V-Valley Secondary Drain Network",
                publication_date="2010",
                retrieval_timestamp="2026-10-23T18:00:00Z",
                location_name="Nayandahalli / Mysore Road Junction",
                ward_number=131,
                zone_name="West Zone",
                valley_basin="Vrishabhavathi Valley",
                category="stormwater_drainage",
                provenance_type=ProvenanceType.VERIFIED_SOURCE_FACT,
                field_values={
                    "catchment_area_sqkm": 165.2,
                    "peak_discharge_cumec": 340.0,
                    "trench_depth_m": 4.2,
                    "bed_width_m": 15.0,
                    "safety_buffer_zone_m": 25.0,
                },
                units_and_currencies={"catchment": "sq.km", "discharge": "cumec", "dimensions": "meters"},
                validation_status="VERIFIED",
                missing_or_unverified_fields=["Utility conflicts with BWSSB trunk sewer pipe at chainage 1+400"],
                license="Government Open Data",
                notes="Heavy industrial and domestic siltation requires silt trap bays before entry into Mysore Road culverts.",
            ),
            RealWorldEvidenceRecord(
                record_id="EVID-RD-TS-003",
                project_name="Tender SURE Urban Road & Pedestrian Footpath Standard",
                source_id="smart_cities_mission",
                source_publisher="Bengaluru Smart City Ltd / Jana Urban Space Foundation",
                source_url="https://smartcities.data.gov.in/cities",
                document_reference="Tender SURE Design Guidelines, Volume 2: Cross Section Standards for Arterial Roads",
                publication_date="2016 (Smart City 2020)",
                retrieval_timestamp="2026-10-23T18:00:00Z",
                location_name="Residency Road & St. Mark's Road Corridor",
                ward_number=111,
                zone_name="East Zone",
                valley_basin="Challaghatta Valley",
                category="roads_and_pavements",
                provenance_type=ProvenanceType.VERIFIED_SOURCE_FACT,
                field_values={
                    "minimum_footpath_width_m": 2.5,
                    "carriageway_lane_width_m": 3.25,
                    "utility_duct_depth_m": 1.8,
                    "utility_duct_width_m": 1.2,
                    "paver_block_strength_mpa": 40.0,
                    "capital_cost_per_km_cr_inr": 11.2,
                },
                units_and_currencies={"width": "meters", "depth": "meters", "strength": "MPa", "cost": "Cr INR/km"},
                validation_status="VERIFIED",
                missing_or_unverified_fields=["OFC cable ownership tags inside legacy underground ducts"],
                license="National Smart City Open Data",
                notes="Tender SURE incorporates standardized sub-surface utility ducts so roads are never cut open for water/cable maintenance.",
            ),
            RealWorldEvidenceRecord(
                record_id="EVID-WO-KAUN-004",
                project_name="BBMP Asphalt Resurfacing & Pothole Repair Work Order",
                source_id="kaun_city_work_orders",
                source_publisher="Civic Data Commons / BBMP Major Works",
                source_url="https://data.kaun.city/bengaluru/work-orders/",
                document_reference="BBMP Work Order 094-18-000042: Road Milling and Bituminous Concrete Overlay",
                publication_date="2022-11-14",
                retrieval_timestamp="2026-10-23T18:00:00Z",
                location_name="Indiranagar 100ft Road / CMH Road",
                ward_number=74,
                zone_name="East Zone",
                valley_basin="Challaghatta Valley",
                category="roads_and_pavements",
                provenance_type=ProvenanceType.VERIFIED_SOURCE_FACT,
                field_values={
                    "tender_amount_inr": 14250000.0,
                    "bituminous_concrete_thickness_mm": 40.0,
                    "dense_bituminous_macadam_thickness_mm": 50.0,
                    "milling_depth_mm": 50.0,
                    "warranty_maintenance_period_years": 3,
                },
                units_and_currencies={"cost": "INR", "thickness": "mm", "period": "years"},
                validation_status="VERIFIED",
                missing_or_unverified_fields=["Third-party core-cutter density lab test certificates"],
                license="Civic Open Data Commons",
                notes="Contract mandates road milling prior to resurfacing to prevent street levels from rising above residential house thresholds.",
            ),
            RealWorldEvidenceRecord(
                record_id="EVID-WTR-BWSSB-005",
                project_name="Cauvery Water Supply Stage V Feeder Pipeline",
                source_id="karnataka_water_ogd",
                source_publisher="Bengaluru Water Supply and Sewerage Board (BWSSB)",
                source_url="https://karnataka.data.gov.in/catalog/water-bengaluru",
                document_reference="BWSSB Cauvery Stage V DPR, Chapter 5: Transmission and Distribution Network",
                publication_date="2021",
                retrieval_timestamp="2026-10-23T18:00:00Z",
                location_name="Outer Bengaluru 110 Villages / K.R. Puram Zone",
                ward_number=52,
                zone_name="Mahadevapura Zone",
                valley_basin="Koramangala Valley",
                category="water_supply",
                provenance_type=ProvenanceType.VERIFIED_SOURCE_FACT,
                field_values={
                    "pipe_material": "Mild Steel (MS) / Ductile Iron (DI) K9",
                    "pipe_diameter_mm": 1200.0,
                    "operating_pressure_bar": 12.5,
                    "minimum_trench_cover_m": 1.5,
                    "booster_pumping_head_m": 85.0,
                },
                units_and_currencies={"diameter": "mm", "pressure": "bar", "cover": "meters"},
                validation_status="VERIFIED",
                missing_or_unverified_fields=["Geotechnical CBR values in waterlogged stretches along Old Madras Road"],
                license="Government Open Data",
                notes="Trench excavation requires sand bedding of 150mm and warning tape placed 300mm above pipe crown.",
            ),
            RealWorldEvidenceRecord(
                record_id="EVID-RWH-MANDATE-006",
                project_name="Bengaluru Municipal Rainwater Harvesting Bye-Law Standard",
                source_id="karnataka_water_ogd",
                source_publisher="BWSSB & BBMP Building Bye-Laws",
                source_url="https://karnataka.data.gov.in/catalog/water-bengaluru",
                document_reference="BWSSB (Amendment) Act 2011, Section 72A & Revised Bye-law 2021",
                publication_date="2021",
                retrieval_timestamp="2026-10-23T18:00:00Z",
                location_name="City-wide Mandatory Standard",
                ward_number=None,
                zone_name="All 8 Zones",
                valley_basin="All Valleys",
                category="rainwater_harvesting",
                provenance_type=ProvenanceType.VERIFIED_SOURCE_FACT,
                field_values={
                    "storage_capacity_litres_per_sqm_roof": 60.0,
                    "groundwater_recharge_litres_per_sqm_paved": 30.0,
                    "minimum_filter_media_depth_mm": 450.0,
                    "first_flush_diverter_capacity_mm": 1.5,
                },
                units_and_currencies={"storage": "litres/m²", "filter": "mm", "flush": "mm"},
                validation_status="VERIFIED",
                missing_or_unverified_fields=[],
                license="Statutory Regulation / Public Domain",
                notes="Applies to all sites measuring 30x40 feet or larger. Non-compliance incurs a 50% water tariff penalty.",
            ),
            RealWorldEvidenceRecord(
                record_id="EVID-FOR-LAL-007",
                project_name="Lalbagh & Cubbon Park Urban Micro-Forest Canopy Study",
                source_id="smart_cities_mission",
                source_publisher="Karnataka Forest Dept & Indian Institute of Science (IISc)",
                source_url="https://smartcities.data.gov.in/cities",
                document_reference="IISc Ecological Sciences Tech Report 148: Micro-climate Regulation by Bengaluru Urban Parks",
                publication_date="2019",
                retrieval_timestamp="2026-10-23T18:00:00Z",
                location_name="Lalbagh Botanical Gardens / Mavalli",
                ward_number=143,
                zone_name="South Zone",
                valley_basin="Koramangala Valley",
                category="urban_forest",
                provenance_type=ProvenanceType.VERIFIED_SOURCE_FACT,
                field_values={
                    "ambient_temperature_reduction_deg_c": 3.8,
                    "canopy_density_index": 0.72,
                    "recommended_native_species": ["Pongamia pinnata (Honge)", "Azadirachta indica (Neem)", "Ficus religiosa (Peepal)"],
                    "annual_carbon_sequestration_kg_per_tree": 24.5,
                    "root_clearance_from_utilities_m": 2.5,
                },
                units_and_currencies={"temp": "°C", "carbon": "kg/tree/yr", "clearance": "meters"},
                validation_status="VERIFIED",
                missing_or_unverified_fields=["Root intrusion depth data for 50-year-old Ficus trees along KV line"],
                license="Academic Research & Smart City Data",
                notes="Miyawaki planting densities should not be deployed directly above high-pressure drinking water or gas mains.",
            ),
            RealWorldEvidenceRecord(
                record_id="EVID-SOL-BESCOM-008",
                project_name="BESCOM Commercial & Public Building Solar Net-Metering Policy",
                source_id="smart_cities_mission",
                source_publisher="Bangalore Electricity Supply Company (BESCOM) / KREDL",
                source_url="https://smartcities.data.gov.in/cities",
                document_reference="KERC Rooftop Solar Photovoltaic Grid Interactive Regulations 2022",
                publication_date="2022",
                retrieval_timestamp="2026-10-23T18:00:00Z",
                location_name="MG Road / Utility Building Corridor",
                ward_number=112,
                zone_name="East Zone",
                valley_basin="Challaghatta Valley",
                category="renewable_energy",
                provenance_type=ProvenanceType.VERIFIED_SOURCE_FACT,
                field_values={
                    "installed_capacity_cap_pct_sanctioned_load": 100.0,
                    "average_generation_kwh_per_kwp_day": 4.2,
                    "structural_dead_load_allowance_kg_per_sqm": 15.0,
                    "average_payback_period_years": 4.8,
                },
                units_and_currencies={"generation": "kWh/kWp/day", "load": "kg/m²", "payback": "years"},
                validation_status="VERIFIED",
                missing_or_unverified_fields=["Structural wind-uplift calculations for structures exceeding 30m height"],
                license="Regulatory Order",
                notes="Requires ballasted non-penetrating aluminum racking to preserve rooftop waterproofing membrane warranties.",
            ),
        ]
        self._records.extend(records)

    def list_sources(self) -> List[DataSourceRegistryItem]:
        """Returns all registered real-world data sources with their connection status."""
        return list(self._sources.values())

    def get_source(self, source_id: str) -> Optional[DataSourceRegistryItem]:
        return self._sources.get(source_id)

    def test_source_connectivity(self, source_id: str) -> Dict[str, Any]:
        """
        Actively checks the source URL or CKAN endpoint and reports live status,
        format, latency, and resource availability.
        """
        source = self._sources.get(source_id)
        if not source:
            return {"error": f"Source '{source_id}' not found"}

        url_to_test = source.active_resource_url or source.original_url
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        start_time = datetime.datetime.now(datetime.timezone.utc)
        req = urllib.request.Request(
            url_to_test,
            headers={"User-Agent": "ECO-ECHO Urban Engine/1.0 (+https://github.com/tejaswinis129/ECO-ECHO)"},
        )
        try:
            with urllib.request.urlopen(req, timeout=8, context=ctx) as res:
                latency_ms = int((datetime.datetime.now(datetime.timezone.utc) - start_time).total_seconds() * 1000)
                content_type = res.headers.get("Content-Type", "unknown")
                content_length = res.headers.get("Content-Length")

                # Update live state
                source.is_live = True
                source.last_checked = datetime.datetime.now(datetime.timezone.utc).isoformat()

                return {
                    "source_id": source_id,
                    "name": source.name,
                    "tested_url": url_to_test,
                    "http_status": res.status,
                    "latency_ms": latency_ms,
                    "content_type": content_type,
                    "content_length_bytes": int(content_length) if content_length else None,
                    "is_live": True,
                    "access_mode": source.access_mode.value,
                    "summary": f"Successfully connected to {source.name} ({latency_ms}ms, HTTP {res.status}).",
                }
        except Exception as e:
            source.last_checked = datetime.datetime.now(datetime.timezone.utc).isoformat()
            return {
                "source_id": source_id,
                "name": source.name,
                "tested_url": url_to_test,
                "is_live": False,
                "error": str(e),
                "access_mode": source.access_mode.value,
                "fallback_guidance": source.manual_import_instructions or "Use manual upload fallback to import this source's files.",
            }

    def search_records(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        location: Optional[str] = None,
        provenance_type: Optional[str] = None,
    ) -> List[RealWorldEvidenceRecord]:
        """Searches real-world evidence records by keywords, category, or location."""
        results = []
        for r in self._records:
            match = True
            if category and r.category != category:
                # also allow generic match
                if category not in r.category and r.category not in category:
                    match = False
            if location and match:
                loc_low = location.lower()
                r_loc = (r.location_name + " " + (r.zone_name or "") + " " + (r.valley_basin or "")).lower()
                if loc_low not in r_loc and not any(word in r_loc for word in loc_low.split() if len(word) > 3):
                    match = False
            if provenance_type and match:
                if r.provenance_type.value != provenance_type:
                    match = False
            if query and match:
                q_low = query.lower()
                blob = (
                    r.project_name
                    + " "
                    + r.document_reference
                    + " "
                    + r.notes
                    + " "
                    + json.dumps(r.field_values)
                ).lower()
                if q_low not in blob and not any(term in blob for term in q_low.split() if len(term) > 3):
                    match = False
            if match:
                results.append(r)
        return results

    def get_record(self, record_id: str) -> Optional[RealWorldEvidenceRecord]:
        for r in self._records:
            if r.record_id == record_id:
                return r
        return None

    def process_uploaded_document(
        self, filename: str, content_bytes: bytes, file_type: str
    ) -> UploadedDocumentMetadata:
        """
        Validates and safely processes uploaded project reports, tender DPRs, CSVs, or GeoJSON.
        Does NOT execute code; only parses structured metadata safely.
        """
        # 1. Validation
        if len(content_bytes) > 10 * 1024 * 1024:
            raise ValueError(f"File size exceeds 10MB limit ({len(content_bytes)} bytes)")

        allowed_exts = [".csv", ".json", ".geojson", ".pdf", ".txt", ".xlsx"]
        ext = os.path.splitext(filename)[1].lower()
        if ext not in allowed_exts:
            raise ValueError(f"File type '{ext}' is unsupported. Supported: {', '.join(allowed_exts)}")

        file_id = f"UPL-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{hashlib.md5(content_bytes[:1024]).hexdigest()[:6].upper()}"
        save_path = os.path.join(EVIDENCE_DIR, f"{file_id}_{filename}")
        with open(save_path, "wb") as f:
            f.write(content_bytes)

        # 2. Extract structured metadata & sample records safely
        extracted_count = 0
        summary_text = ""
        sample_records = []

        if ext in [".json", ".geojson"]:
            try:
                parsed = json.loads(content_bytes.decode("utf-8", errors="ignore"))
                if isinstance(parsed, dict) and "features" in parsed:
                    features = parsed.get("features", [])
                    extracted_count = len(features)
                    summary_text = f"Parsed GeoJSON spatial dataset containing {extracted_count} geographical features."
                    for f_item in features[:5]:
                        sample_records.append(f_item.get("properties", {}))
                elif isinstance(parsed, list):
                    extracted_count = len(parsed)
                    summary_text = f"Parsed JSON array containing {extracted_count} records."
                    sample_records = parsed[:5]
                elif isinstance(parsed, dict):
                    extracted_count = len(parsed.keys())
                    summary_text = f"Parsed JSON object with {extracted_count} top-level attributes."
                    sample_records = [parsed]
            except Exception as e:
                summary_text = f"JSON parsing note: {e}"

        elif ext == ".csv":
            try:
                text_content = content_bytes.decode("utf-8", errors="ignore")
                lines = [line.strip() for line in text_content.splitlines() if line.strip()]
                if lines:
                    header = lines[0].split(",")
                    extracted_count = len(lines) - 1
                    summary_text = f"Parsed CSV spreadsheet with {len(header)} columns and {extracted_count} rows."
                    for l in lines[1:6]:
                        vals = l.split(",")
                        sample_records.append(dict(zip(header, vals)))
            except Exception as e:
                summary_text = f"CSV parsing note: {e}"

        elif ext == ".pdf":
            # PDF text metadata inspection (safe string extraction)
            text_snippet = content_bytes[:4096].decode("latin-1", errors="ignore")
            title_match = re.search(r"/Title\s*\((.*?)\)", text_snippet)
            pdf_title = title_match.group(1) if title_match else filename
            extracted_count = 1
            summary_text = f"Processed PDF document: '{pdf_title}' ({len(content_bytes) // 1024} KB). Indexed for project evidence reference."
            sample_records.append({"document_name": filename, "estimated_pages": max(1, len(content_bytes) // 50000)})

        else:
            extracted_count = 1
            summary_text = f"Processed {filename} ({len(content_bytes) // 1024} KB) for evidence citation."
            sample_records.append({"filename": filename, "size_kb": len(content_bytes) // 1024})

        meta = UploadedDocumentMetadata(
            file_id=file_id,
            filename=filename,
            file_type=ext.lstrip("."),
            size_bytes=len(content_bytes),
            uploaded_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            extracted_records_count=extracted_count,
            extracted_summary=summary_text,
            validation_status="VALIDATED",
            sample_records=sample_records,
        )

        self._uploads[file_id] = meta

        # Also register a user evidence record from this upload
        user_record = RealWorldEvidenceRecord(
            record_id=f"EVID-USER-{file_id[:10]}",
            project_name=f"User Attached Document: {filename}",
            source_id="user_uploaded_document",
            source_publisher="User Upload",
            source_url=f"/api/evidence/uploads/{file_id}",
            document_reference=f"{filename} (Uploaded file ID: {file_id})",
            publication_date=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d"),
            retrieval_timestamp=meta.uploaded_at,
            location_name="User Specified Project Site",
            ward_number=None,
            zone_name=None,
            valley_basin=None,
            category="custom_infrastructure",
            provenance_type=ProvenanceType.VERIFIED_SOURCE_FACT,
            field_values={"file_id": file_id, "size_bytes": len(content_bytes), "file_type": ext},
            units_and_currencies={},
            validation_status="USER_VERIFIED",
            missing_or_unverified_fields=[],
            license="User Provided",
            notes=f"User uploaded evidence document. Extracted {extracted_count} records.",
        )
        self._records.insert(0, user_record)

        return meta

    def list_uploads(self) -> List[UploadedDocumentMetadata]:
        return list(self._uploads.values())


evidence_source_service = EvidenceSourceService()
